'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CardPayment {
  id: string
  card_id: string
  period_start: string
  period_end: string
  amount_paid: number
  is_paid: boolean
  paid_at: string | null
}

interface Transaction {
  id: string
  type: 'expense' | 'income'
  amount: number
  description: string | null
  date: string
  category_id: string | null
  budget_id: string | null
  card_id: string | null
  created_at: string
}

export function useCardPayments() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payment, setPayment] = useState<CardPayment | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCardTransactions = async (cardId: string, periodStart: string, periodEnd: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('card_id', cardId)
      .gte('date', periodStart)
      .lte('date', periodEnd)
      .order('date', { ascending: false })

    if (!error && data) {
      setTransactions(data)
    }
    setLoading(false)
    return data || []
  }

  const fetchPayment = async (cardId: string, periodStart: string, periodEnd: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('card_payments')
      .select('*')
      .eq('card_id', cardId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle()

    setPayment(data || null)
    return data || null
  }

  const upsertPayment = async (cardId: string, periodStart: string, periodEnd: string, amountPaid: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Check if payment record exists
    const existing = await fetchPayment(cardId, periodStart, periodEnd)

    if (existing) {
      const { data, error } = await supabase
        .from('card_payments')
        .update({
          amount_paid: amountPaid,
          is_paid: amountPaid > 0,
          paid_at: amountPaid > 0 ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (!error && data) setPayment(data)
      return data
    } else {
      const { data, error } = await supabase
        .from('card_payments')
        .insert({
          user_id: user.id,
          card_id: cardId,
          period_start: periodStart,
          period_end: periodEnd,
          amount_paid: amountPaid,
          is_paid: amountPaid > 0,
          paid_at: amountPaid > 0 ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (!error && data) setPayment(data)
      return data
    }
  }

  const removeTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  return { transactions, payment, loading, fetchCardTransactions, fetchPayment, upsertPayment, removeTransaction }
}
