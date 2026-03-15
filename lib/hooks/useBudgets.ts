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
  committed: number
  type: 'expense' | 'income'
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

  const addBudget = async (budget: Omit<Budget, 'id' | 'accumulated' | 'committed' | 'is_active'>): Promise<{ ok: boolean; error?: string }> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No has iniciado sesión' }

    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...budget, user_id: user.id, accumulated: 0, committed: 0, is_active: true })
      .select()
      .single()

    if (error) {
      return { ok: false, error: error.message }
    }

    if (data) {
      setBudgets((prev) => [...prev, data])
    }
    return { ok: true }
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

  const addCommitment = async (budgetId: string, amount: number, note?: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('budget_movements').insert({
      budget_id: budgetId,
      user_id: user.id,
      amount,
      note: note ? `[comprometido] ${note}` : '[comprometido]',
    })

    const budget = budgets.find((b) => b.id === budgetId)
    if (budget) {
      const newCommitted = budget.committed + Math.abs(amount)
      await supabase
        .from('budgets')
        .update({ committed: newCommitted, updated_at: new Date().toISOString() })
        .eq('id', budgetId)

      setBudgets((prev) =>
        prev.map((b) => b.id === budgetId ? { ...b, committed: newCommitted } : b)
      )
    }
  }

  const deleteBudget = async (id: string) => {
    const supabase = createClient()
    await supabase.from('budgets').update({ is_active: false }).eq('id', id)
    setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

  const resetBudget = async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('budgets')
      .update({ accumulated: 0, committed: 0, updated_at: new Date().toISOString() })
      .eq('id', id)

    setBudgets((prev) =>
      prev.map((b) => b.id === id ? { ...b, accumulated: 0, committed: 0 } : b)
    )
  }

  const distributeSalary = async (salaryAmount: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || budgets.length === 0) return

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0)
    const today = new Date().toISOString().split('T')[0]

    const movements: { budget_id: string; user_id: string; amount: number; note: string }[] = []
    const updates: { id: string; newAccumulated: number }[] = []

    for (const budget of budgets) {
      // Each cajita gets its proportional share of the salary
      const share = totalBudgeted > 0
        ? Math.round((budget.amount / totalBudgeted) * salaryAmount * 100) / 100
        : Math.round((salaryAmount / budgets.length) * 100) / 100

      movements.push({
        budget_id: budget.id,
        user_id: user.id,
        amount: share,
        note: `Salario ${today}`,
      })
      updates.push({ id: budget.id, newAccumulated: budget.accumulated + share })
    }

    // Insert all movements in batch
    await supabase.from('budget_movements').insert(movements)

    // Update each budget's accumulated
    for (const u of updates) {
      await supabase
        .from('budgets')
        .update({ accumulated: u.newAccumulated, updated_at: new Date().toISOString() })
        .eq('id', u.id)
    }

    // Update local state
    setBudgets((prev) =>
      prev.map((b) => {
        const update = updates.find((u) => u.id === b.id)
        return update ? { ...b, accumulated: update.newAccumulated } : b
      })
    )

    return { totalDistributed: salaryAmount, budgetCount: budgets.length }
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  return {
    budgets, loading, addBudget, addMovement, addCommitment,
    deleteBudget, resetBudget, distributeSalary, refresh: fetchBudgets,
  }
}
