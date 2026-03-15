'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { insertTransaction } from '@/lib/utils/transactions'

export interface InstallmentPlan {
  id: string
  card_id: string
  transaction_id: string | null
  description: string
  total_amount: number
  monthly_amount: number
  total_months: number
  paid_months: number
  start_date: string
  is_completed: boolean
  created_at: string
  card?: { id: string; name: string; color: string | null; last_four: string | null }
}

export interface InstallmentPayment {
  id: string
  plan_id: string
  month_number: number
  amount: number
  due_date: string
  is_paid: boolean
  paid_at: string | null
}

export function useMSI() {
  const [plans, setPlans] = useState<InstallmentPlan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('installment_plans')
      .select(`*, card:credit_cards(id, name, color, last_four)`)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPlans(data as InstallmentPlan[])
    }
    setLoading(false)
  }

  const addPlan = async (plan: {
    card_id: string
    description: string
    total_amount: number
    total_months: number
    start_date: string
  }) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const monthlyAmount = Math.ceil(plan.total_amount / plan.total_months)

    const { data, error } = await supabase
      .from('installment_plans')
      .insert({
        user_id: user.id,
        card_id: plan.card_id,
        description: plan.description,
        total_amount: plan.total_amount,
        monthly_amount: monthlyAmount,
        total_months: plan.total_months,
        start_date: plan.start_date,
      })
      .select(`*, card:credit_cards(id, name, color, last_four)`)
      .single()

    if (!error && data) {
      // Generate payment schedule
      const payments = []
      const startDate = new Date(plan.start_date)
      for (let i = 1; i <= plan.total_months; i++) {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + i)
        payments.push({
          plan_id: data.id,
          user_id: user.id,
          month_number: i,
          amount: monthlyAmount,
          due_date: dueDate.toISOString().split('T')[0],
        })
      }
      await supabase.from('installment_payments').insert(payments)
      setPlans((prev) => [data as InstallmentPlan, ...prev])
    }
    return data
  }

  const markPayment = async (planId: string, monthNumber: number) => {
    const supabase = createClient()
    await supabase
      .from('installment_payments')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('plan_id', planId)
      .eq('month_number', monthNumber)

    const plan = plans.find((p) => p.id === planId)
    if (plan) {
      const newPaidMonths = plan.paid_months + 1
      const isCompleted = newPaidMonths >= plan.total_months
      await supabase
        .from('installment_plans')
        .update({ paid_months: newPaidMonths, is_completed: isCompleted })
        .eq('id', planId)

      // Create expense transaction for the MSI payment
      const today = new Date().toISOString().split('T')[0]
      const cardLabel = plan.card
        ? ` · ${plan.card.name}${plan.card.last_four ? ` ••${plan.card.last_four}` : ''}`
        : ''
      await insertTransaction({
        type: 'expense',
        amount: plan.monthly_amount,
        description: `MSI: ${plan.description} (${newPaidMonths}/${plan.total_months})${cardLabel}`,
        date: today,
        card_id: plan.card_id,
      })

      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId ? { ...p, paid_months: newPaidMonths, is_completed: isCompleted } : p
        )
      )
    }
  }

  const getPayments = async (planId: string): Promise<InstallmentPayment[]> => {
    const supabase = createClient()
    const { data } = await supabase
      .from('installment_payments')
      .select('*')
      .eq('plan_id', planId)
      .order('month_number')

    return (data as InstallmentPayment[]) || []
  }

  const deletePlan = async (id: string) => {
    const supabase = createClient()
    await supabase.from('installment_plans').delete().eq('id', id)
    setPlans((prev) => prev.filter((p) => p.id !== id))
  }

  const activePlans = plans.filter((p) => !p.is_completed)
  const completedPlans = plans.filter((p) => p.is_completed)
  const totalMonthlyMSI = activePlans.reduce((sum, p) => sum + p.monthly_amount, 0)

  useEffect(() => {
    fetchPlans()
  }, [])

  return {
    plans, activePlans, completedPlans, loading,
    addPlan, markPayment, getPayments, deletePlan,
    totalMonthlyMSI, refresh: fetchPlans,
  }
}
