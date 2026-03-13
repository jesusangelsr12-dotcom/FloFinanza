'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Budget {
  id: string
  name: string
  icon: string | null
  color: string | null
  gradient_from: string | null
  gradient_to: string | null
  amount: number
  accumulated: number
  period_days: number
  is_active: boolean
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBudgets = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('is_active', true)
      .order('created_at')

    if (!error && data) {
      setBudgets(data)
    }
    setLoading(false)
  }

  const addBudget = async (budget: Omit<Budget, 'id' | 'accumulated' | 'is_active'>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...budget, user_id: user.id, accumulated: 0, is_active: true })
      .select()
      .single()

    if (!error && data) {
      setBudgets((prev) => [...prev, data])
    }
  }

  const addMovement = async (budgetId: string, amount: number, note?: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('budget_movements').insert({
      budget_id: budgetId,
      user_id: user.id,
      amount,
      note,
    })

    // Update accumulated
    const budget = budgets.find((b) => b.id === budgetId)
    if (budget) {
      const newAccumulated = budget.accumulated + amount
      await supabase
        .from('budgets')
        .update({ accumulated: newAccumulated, updated_at: new Date().toISOString() })
        .eq('id', budgetId)

      setBudgets((prev) =>
        prev.map((b) => b.id === budgetId ? { ...b, accumulated: newAccumulated } : b)
      )
    }
  }

  const deleteBudget = async (id: string) => {
    const supabase = createClient()
    await supabase.from('budgets').update({ is_active: false }).eq('id', id)
    setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  return { budgets, loading, addBudget, addMovement, deleteBudget, refresh: fetchBudgets }
}
