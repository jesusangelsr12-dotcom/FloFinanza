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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [catsRes, groupsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('category_groups').select('*').eq('user_id', user.id).order('name'),
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

  const deleteCategory = async (id: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id)
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const deleteGroup = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('category_groups').delete().eq('id', id)
    if (!error) {
      setGroups((prev) => prev.filter((g) => g.id !== id))
      // Categories in this group get group_id set to null (DB ON DELETE SET NULL)
      setCategories((prev) => prev.map((c) => c.group_id === id ? { ...c, group_id: null } : c))
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  return { categories, groups, loading, addCategory, addGroup, deleteCategory, deleteGroup, refresh: fetchAll }
}
