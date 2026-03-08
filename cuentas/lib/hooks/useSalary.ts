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
    const { data, error } = await supabase
      .from('user_settings')
      .select('salary, salary_frequency, salary_custom_days, salary_next_date')
      .single()

    if (!error && data) {
      setSettings(data)
    }
    setLoading(false)
  }

  const updateSalary = async (updates: Partial<SalarySettings>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() })

    if (!error) {
      setSettings((prev) => prev ? { ...prev, ...updates } : null)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return { settings, loading, updateSalary }
}
