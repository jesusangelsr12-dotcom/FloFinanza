'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { insertTransaction } from '@/lib/utils/transactions'

export interface Split {
  id: string
  transaction_id: string
  contact_id: string
  amount: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
  contact?: { id: string; name: string; phone: string | null }
  transaction?: { id: string; description: string | null; date: string; amount: number }
}

export function useSplits() {
  const [splits, setSplits] = useState<Split[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSplits = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transaction_splits')
      .select(`
        *,
        contact:contacts(id, name, phone),
        transaction:transactions(id, description, date, amount)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSplits(data as Split[])
    }
    setLoading(false)
  }

  const addSplit = async (transactionId: string, contactId: string, amount: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('transaction_splits')
      .insert({
        transaction_id: transactionId,
        contact_id: contactId,
        amount,
        user_id: user.id,
      })
      .select(`
        *,
        contact:contacts(id, name, phone),
        transaction:transactions(id, description, date, amount)
      `)
      .single()

    if (!error && data) {
      setSplits((prev) => [data as Split, ...prev])
    }
    return data
  }

  const markAsPaid = async (splitId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('transaction_splits')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', splitId)

    if (!error) {
      const split = splits.find((s) => s.id === splitId)
      if (split) {
        // Create income transaction: someone paid you back
        const contactName = split.contact?.name || 'Contacto'
        const today = new Date().toISOString().split('T')[0]
        await insertTransaction({
          type: 'income',
          amount: split.amount,
          description: `${contactName} te pagó (gasto compartido)`,
          date: today,
        })
      }

      setSplits((prev) =>
        prev.map((s) =>
          s.id === splitId ? { ...s, is_paid: true, paid_at: new Date().toISOString() } : s
        )
      )
    }
  }

  const deleteSplit = async (id: string) => {
    const supabase = createClient()
    await supabase.from('transaction_splits').delete().eq('id', id)
    setSplits((prev) => prev.filter((s) => s.id !== id))
  }

  const totalOwed = splits
    .filter((s) => !s.is_paid)
    .reduce((sum, s) => sum + s.amount, 0)

  const totalPaid = splits
    .filter((s) => s.is_paid)
    .reduce((sum, s) => sum + s.amount, 0)

  useEffect(() => {
    fetchSplits()
  }, [])

  return { splits, loading, addSplit, markAsPaid, deleteSplit, totalOwed, totalPaid, refresh: fetchSplits }
}
