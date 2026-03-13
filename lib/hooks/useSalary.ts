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

  const updateSalary = async (updates: Partial<SalarySettings>): Promise<{ ok: boolean; error?: string }> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, error: 'No hay sesión activa. Inicia sesión de nuevo.' }
    }

    // Check if row exists to decide between UPDATE and INSERT
    // (avoids RLS issues with upsert when WITH CHECK is implicit)
    const { data: existing, error: selectError } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (selectError) {
      return { ok: false, error: `Error al verificar datos: ${selectError.message} (${selectError.code})` }
    }

    let error
    if (existing) {
      ;({ error } = await supabase
        .from('user_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id))
    } else {
      ;({ error } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() }))
    }

    if (error) {
      return { ok: false, error: `${error.message} (${error.code})` }
    }

    setSettings((prev) => prev
      ? { ...prev, ...updates }
      : { salary: null, salary_frequency: 'biweekly', salary_custom_days: null, salary_next_date: null, ...updates }
    )
    return { ok: true }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return { settings, loading, updateSalary }
}
