'use client'

import { useMemo } from 'react'
import { useCategories } from '@/lib/hooks/useCategories'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/lib/utils/categories'

interface CategoryPickerProps {
  type: 'expense' | 'income'
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function CategoryPicker({ type, selectedId, onSelect }: CategoryPickerProps) {
  const { categories: dbCategories } = useCategories()

  const categories = useMemo(() => {
    const userCategories = dbCategories
      .filter((c) => c.type === type)
      .map((c) => ({
        id: c.id,
        icon: c.icon || '📁',
        name: c.name,
        color: c.color || 'var(--ink3)',
      }))

    if (userCategories.length > 0) return userCategories

    const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES
    return defaults.map((c) => ({ id: c.id, icon: c.icon, name: c.name, color: c.color }))
  }, [dbCategories, type])

  return (
    <div className="grid grid-cols-4 gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex flex-col items-center gap-1.5 py-2.5 px-1.5 rounded-sm border transition-all ${
            selectedId === cat.id
              ? 'border-current bg-bg'
              : 'border-border bg-white hover:border-border-2'
          }`}
          style={{ color: selectedId === cat.id ? cat.color : undefined }}
        >
          <span className="text-[22px]">{cat.icon}</span>
          <span className="font-display text-[9px] font-bold text-ink-2 text-center leading-tight">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  )
}
