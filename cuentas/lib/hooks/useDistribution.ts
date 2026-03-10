'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DistributionRule {
  id: string
  budget_id: string
  allocation_type: 'percent' | 'fixed'
  allocation_value: number
  priority: number
  is_active: boolean
  created_at: string
  budget?: {
    id: string
    name: string
    icon: string | null
    color: string | null
    gradient_from: string | null
    gradient_to: string | null
    amount: number
  }
}

export interface DistributionPreview {
  budget_id: string
  budget_name: string
  budget_icon: string | null
  budget_color: string | null
  allocation_type: 'percent' | 'fixed'
  allocation_value: number
  calculated_amount: number
}

export function useDistribution() {
  const [rules, setRules] = useState<DistributionRule[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRules = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('income_distribution_rules')
      .select(`*, budget:budgets(id, name, icon, color, gradient_from, gradient_to, amount)`)
      .eq('is_active', true)
      .order('priority')

    if (!error && data) {
      setRules(data as DistributionRule[])
    }
    setLoading(false)
  }

  const addRule = async (budgetId: string, type: 'percent' | 'fixed', value: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('income_distribution_rules')
      .insert({
        user_id: user.id,
        budget_id: budgetId,
        allocation_type: type,
        allocation_value: value,
        priority: rules.length,
      })
      .select(`*, budget:budgets(id, name, icon, color, gradient_from, gradient_to, amount)`)
      .single()

    if (!error && data) {
      setRules((prev) => [...prev, data as DistributionRule])
    }
    return data
  }

  const updateRule = async (id: string, updates: { allocation_type?: 'percent' | 'fixed'; allocation_value?: number }) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('income_distribution_rules')
      .update(updates)
      .eq('id', id)

    if (!error) {
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r))
    }
  }

  const deleteRule = async (id: string) => {
    const supabase = createClient()
    await supabase.from('income_distribution_rules').delete().eq('id', id)
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const getPreview = (amount: number): { items: DistributionPreview[]; unassigned: number } => {
    let remaining = amount
    const items: DistributionPreview[] = []

    // Process fixed amounts first (higher priority), then percentages
    const fixedRules = rules.filter((r) => r.allocation_type === 'fixed')
    const percentRules = rules.filter((r) => r.allocation_type === 'percent')

    for (const rule of fixedRules) {
      const allocated = Math.min(rule.allocation_value, remaining)
      items.push({
        budget_id: rule.budget_id,
        budget_name: rule.budget?.name || 'Cajita',
        budget_icon: rule.budget?.icon || null,
        budget_color: rule.budget?.color || null,
        allocation_type: 'fixed',
        allocation_value: rule.allocation_value,
        calculated_amount: allocated,
      })
      remaining -= allocated
    }

    const totalPercent = percentRules.reduce((sum, r) => sum + r.allocation_value, 0)
    const baseForPercent = remaining

    for (const rule of percentRules) {
      const allocated = Math.round((rule.allocation_value / 100) * baseForPercent)
      const capped = Math.min(allocated, remaining)
      items.push({
        budget_id: rule.budget_id,
        budget_name: rule.budget?.name || 'Cajita',
        budget_icon: rule.budget?.icon || null,
        budget_color: rule.budget?.color || null,
        allocation_type: 'percent',
        allocation_value: rule.allocation_value,
        calculated_amount: capped,
      })
      remaining -= capped
    }

    return { items, unassigned: Math.max(remaining, 0) }
  }

  const distributeIncome = async (amount: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { items } = getPreview(amount)
    const results = []

    for (const item of items) {
      if (item.calculated_amount <= 0) continue

      // Create budget movement
      const { error: movError } = await supabase
        .from('budget_movements')
        .insert({
          budget_id: item.budget_id,
          user_id: user.id,
          amount: item.calculated_amount,
          note: `Distribucion automatica de ingreso ($${amount.toLocaleString()})`,
        })

      if (movError) continue

      // Update budget accumulated
      const { error: budgetError } = await supabase.rpc('increment_budget_accumulated', {
        budget_id_param: item.budget_id,
        amount_param: item.calculated_amount,
      })

      // Fallback: manual update if RPC doesn't exist
      if (budgetError) {
        const { data: budget } = await supabase
          .from('budgets')
          .select('accumulated')
          .eq('id', item.budget_id)
          .single()

        if (budget) {
          await supabase
            .from('budgets')
            .update({ accumulated: budget.accumulated + item.calculated_amount })
            .eq('id', item.budget_id)
        }
      }

      results.push(item)
    }

    return results
  }

  // Validation helpers
  const totalPercent = rules
    .filter((r) => r.allocation_type === 'percent')
    .reduce((sum, r) => sum + r.allocation_value, 0)

  const canAddPercentRule = (value: number) => totalPercent + value <= 100
  const hasRules = rules.length > 0

  useEffect(() => {
    fetchRules()
  }, [])

  return {
    rules, loading, hasRules,
    addRule, updateRule, deleteRule,
    getPreview, distributeIncome,
    totalPercent, canAddPercentRule,
    refresh: fetchRules,
  }
}
