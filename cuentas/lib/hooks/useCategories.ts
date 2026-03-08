'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  type: 'expense' | 'income'
  icon: string | null
  color: string | null
  group_id: string | null
}

interface CategoryGroup {
  id: string
  name: string
  type: 'expense' | 'income'
  icon: string | null
  color: string | null
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [groups, setGroups] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    const supabase = createClient()
    const [catsRes, groupsRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('category_groups').select('*').order('name'),
    ])

    if (catsRes.data) setCategories(catsRes.data)
    if (groupsRes.data) setGroups(groupsRes.data)
    setLoading(false)
  }

  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...cat, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setCategories((prev) => [...prev, data])
    }
  }

  const addGroup = async (group: Omit<CategoryGroup, 'id'>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('category_groups')
      .insert({ ...group, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setGroups((prev) => [...prev, data])
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  return { categories, groups, loading, addCategory, addGroup, refresh: fetchAll }
}
