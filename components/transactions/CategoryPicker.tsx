'use client'

import { useCategories } from '@/lib/hooks/useCategories'

interface CategoryItem {
  id: string
  icon: string
  name: string
  color: string
}

const defaultExpenseCategories: CategoryItem[] = [
  { id: 'groceries', icon: '🛒', name: 'Despensa', color: 'var(--amber)' },
  { id: 'food', icon: '🍕', name: 'Comida', color: 'var(--red)' },
  { id: 'transport', icon: '⛽', name: 'Transporte', color: 'var(--blue)' },
  { id: 'health', icon: '💊', name: 'Salud', color: 'var(--purple)' },
  { id: 'entertainment', icon: '🎮', name: 'Ocio', color: 'var(--teal)' },
  { id: 'home', icon: '🏠', name: 'Hogar', color: 'var(--green)' },
  { id: 'clothing', icon: '👗', name: 'Ropa', color: 'var(--rose)' },
]

const defaultIncomeCategories: CategoryItem[] = [
  { id: 'salary', icon: '💼', name: 'Salario', color: 'var(--green)' },
  { id: 'freelance', icon: '💻', name: 'Freelance', color: 'var(--blue)' },
  { id: 'investment', icon: '📈', name: 'Inversión', color: 'var(--purple)' },
  { id: 'gift', icon: '🎁', name: 'Regalo', color: 'var(--amber)' },
  { id: 'refund', icon: '↩️', name: 'Reembolso', color: 'var(--teal)' },
]

interface CategoryPickerProps {
  type: 'expense' | 'income'
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function CategoryPicker({ type, selectedId, onSelect }: CategoryPickerProps) {
  const { categories: dbCategories } = useCategories()

  // DB categories for this type, mapped to picker format
  const userCategories: CategoryItem[] = dbCategories
    .filter((c) => c.type === type)
    .map((c) => ({
      id: c.id,
      icon: c.icon || '📁',
      name: c.name,
      color: c.color || 'var(--ink3)',
    }))

  // If user has DB categories for this type, show those; otherwise show defaults
  const defaults = type === 'expense' ? defaultExpenseCategories : defaultIncomeCategories
  const categories = userCategories.length > 0 ? userCategories : defaults

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
