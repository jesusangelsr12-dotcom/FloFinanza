'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getBillingPeriod } from '@/lib/utils/billing'

export interface CreditCard {
  id: string
  name: string
  bank: string | null
  last_four: string | null
  color: string | null
  credit_limit: number | null
  cut_day: number
  payment_day: number
  is_active: boolean
  created_at: string
}

export function useCards() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCards = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('is_active', true)
      .order('created_at')

    if (!error && data) {
      setCards(data)
    }
    setLoading(false)
  }

  const addCard = async (card: {
    name: string
    bank?: string
    last_four?: string
    color?: string
    credit_limit?: number
    cut_day: number
    payment_day: number
  }) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('credit_cards')
      .insert({
        user_id: user.id,
        name: card.name,
        bank: card.bank || null,
        last_four: card.last_four || null,
        color: card.color || '#3B82F6',
        credit_limit: card.credit_limit || null,
        cut_day: card.cut_day,
        payment_day: card.payment_day,
      })
      .select()
      .single()

    if (!error && data) {
      setCards((prev) => [...prev, data])
    }
    return data
  }

  const updateCard = async (id: string, updates: Partial<CreditCard>) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('credit_cards')
      .update(updates)
      .eq('id', id)

    if (!error) {
      setCards((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c))
    }
  }

  const deleteCard = async (id: string) => {
    const supabase = createClient()
    await supabase.from('credit_cards').update({ is_active: false }).eq('id', id)
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  const getCardSpending = async (cardId: string) => {
    const supabase = createClient()
    const card = cards.find((c) => c.id === cardId)
    const cutDay = card?.cut_day ?? 1
    const period = getBillingPeriod(cutDay)

    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('card_id', cardId)
      .eq('type', 'expense')
      .gte('date', period.start)
      .lte('date', period.end)

    return data?.reduce((sum, t) => sum + t.amount, 0) || 0
  }

  useEffect(() => {
    fetchCards()
  }, [])

  return { cards, loading, addCard, updateCard, deleteCard, getCardSpending, refresh: fetchCards }
}
