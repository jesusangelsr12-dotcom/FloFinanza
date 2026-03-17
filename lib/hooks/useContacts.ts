'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Contact {
  id: string
  name: string
  phone: string | null
  created_at: string
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContacts = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (!error && data) {
      setContacts(data)
    }
    setLoading(false)
  }

  const addContact = async (name: string, phone?: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('contacts')
      .insert({ user_id: user.id, name, phone: phone || null })
      .select()
      .single()

    if (!error && data) {
      setContacts((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    return data
  }

  const deleteContact = async (id: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('contacts').delete().eq('id', id).eq('user_id', user.id)
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  return { contacts, loading, addContact, deleteContact, refresh: fetchContacts }
}
