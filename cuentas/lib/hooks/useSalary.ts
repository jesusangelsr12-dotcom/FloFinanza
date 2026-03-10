'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SalarySettings {
  salary: number | null
  salary_frequency: string
  salary_custom_days: number | null
  salary_next_date: string | null
}

export function useSalary() {
  const [settings, setSettings] = useState<SalarySettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    const supabase = createClient()

    // Ensure auth session is loaded before querying (RLS depends on auth.uid())
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('salary, salary_frequency, salary_custom_days, salary_next_date')
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setSettings(data)
    }
    setLoading(false)
  }

  const updateSalary = async (updates: Partial<SalarySettings>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, ...updates, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('useSalary updateSalary error:', error.message, error)
      return false
    }

    setSettings((prev) => prev
      ? { ...prev, ...updates }
      : { salary: null, salary_frequency: 'biweekly', salary_custom_days: null, salary_next_date: null, ...updates }
    )
    return true
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return { settings, loading, updateSalary }
}
