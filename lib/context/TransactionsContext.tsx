'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Transaction {
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

interface TransactionsContextValue {
  transactions: Transaction[]
  loading: boolean
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<Transaction>
  deleteTransaction: (id: string) => Promise<Transaction | null>
  refresh: () => Promise<void>
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null)

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    const monthStart = startOfMonth.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .order('date', { ascending: false })

    if (!error && data) {
      setTransactions(data)
    }
    setLoading(false)
  }, [])

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

  const deleteTransaction = async (id: string) => {
    const supabase = createClient()
    const tx = transactions.find((t) => t.id === id)
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    return tx ?? null
  }

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return (
    <TransactionsContext.Provider value={{
      transactions, loading, addTransaction, deleteTransaction, refresh: fetchTransactions,
    }}>
      {children}
    </TransactionsContext.Provider>
  )
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext)
  if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider')
  return ctx
}
