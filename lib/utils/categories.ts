export interface CategoryMeta {
  icon: string
  bg: string
  name: string
  color: string
}

/** Default expense categories (used when user has none in DB) */
export const DEFAULT_EXPENSE_CATEGORIES: (CategoryMeta & { id: string })[] = [
  { id: 'groceries', icon: '🛒', bg: '#FFF0F3', name: 'Despensa', color: 'var(--amber)' },
  { id: 'food', icon: '🍕', bg: '#FFF3EE', name: 'Comida', color: 'var(--red)' },
  { id: 'transport', icon: '⛽', bg: '#ECFEFF', name: 'Transporte', color: 'var(--blue)' },
  { id: 'health', icon: '💊', bg: '#F3EEFF', name: 'Salud', color: 'var(--purple)' },
  { id: 'entertainment', icon: '🎮', bg: '#EEF4FF', name: 'Ocio', color: 'var(--teal)' },
  { id: 'home', icon: '🏠', bg: '#E8F8EE', name: 'Hogar', color: 'var(--green)' },
  { id: 'clothing', icon: '👗', bg: '#FFF0F3', name: 'Ropa', color: 'var(--rose)' },
]

/** Default income categories (used when user has none in DB) */
export const DEFAULT_INCOME_CATEGORIES: (CategoryMeta & { id: string })[] = [
  { id: 'salary', icon: '💼', bg: '#E8F8EE', name: 'Salario', color: 'var(--green)' },
  { id: 'freelance', icon: '💻', bg: '#EEF4FF', name: 'Freelance', color: 'var(--blue)' },
  { id: 'investment', icon: '📈', bg: '#F3EEFF', name: 'Inversión', color: 'var(--purple)' },
  { id: 'gift', icon: '🎁', bg: '#FFF3EE', name: 'Regalo', color: 'var(--amber)' },
  { id: 'refund', icon: '↩️', bg: '#ECFEFF', name: 'Reembolso', color: 'var(--teal)' },
]

/** All defaults keyed by ID for quick lookup */
export const CATEGORY_META: Record<string, CategoryMeta> = Object.fromEntries(
  [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].map((c) => [c.id, c])
)

export const DEFAULT_META: CategoryMeta = { icon: '💰', bg: '#F4F4F6', name: '', color: 'var(--ink3)' }

/**
 * Resolve category display metadata from an ID.
 * Checks hardcoded defaults first, then DB categories, then falls back to default.
 */
export function resolveCategoryMeta(
  categoryId: string | null,
  dbCategories: Array<{ id: string; name: string; icon: string | null; color: string | null }>
): { meta: CategoryMeta; name: string } {
  if (!categoryId) return { meta: DEFAULT_META, name: '' }

  const hardcoded = CATEGORY_META[categoryId]
  if (hardcoded) return { meta: hardcoded, name: hardcoded.name }

  const dbCat = dbCategories.find((c) => c.id === categoryId)
  if (dbCat) {
    return {
      meta: { icon: dbCat.icon || '📁', bg: dbCat.color || '#F4F4F6', name: dbCat.name, color: dbCat.color || 'var(--ink3)' },
      name: dbCat.name,
    }
  }

  return { meta: DEFAULT_META, name: categoryId }
}
