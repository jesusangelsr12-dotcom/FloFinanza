'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(20)

    if (!error && data) {
      setTransactions(data)
    }
    setLoading(false)
  }

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay sesión activa')

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...tx, user_id: user.id })
      .select()
      .single()

    if (error) throw new Error(error.message)

    setTransactions((prev) => [data, ...prev])
    return data
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return { transactions, loading, addTransaction, refresh: fetchTransactions }
}
