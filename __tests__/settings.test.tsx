import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className, onClick, ...props }: Record<string, unknown>) => (
      <div className={className as string} onClick={onClick as () => void}>{children as React.ReactNode}</div>
    ),
  },
}))

// Mock hooks
const mockUpdateSalary = vi.fn().mockResolvedValue({ ok: true })
const mockAddCategory = vi.fn()
const mockAddGroup = vi.fn()
const mockDeleteCategory = vi.fn()
const mockDeleteGroup = vi.fn()
const mockDeleteBudget = vi.fn()
const mockDeleteCard = vi.fn()

vi.mock('@/lib/hooks/useSalary', () => ({
  useSalary: () => ({
    settings: { salary: 16000, salary_frequency: 'biweekly', salary_custom_days: null, salary_next_date: '2026-03-15' },
    loading: false,
    updateSalary: mockUpdateSalary,
  }),
}))

vi.mock('@/lib/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      { id: 'c1', name: 'Comida', type: 'expense', icon: '🍕', color: null, group_id: 'g1' },
      { id: 'c2', name: 'Nómina', type: 'income', icon: '💰', color: null, group_id: null },
    ],
    groups: [
      { id: 'g1', name: 'Hogar', type: 'expense', icon: '🏠', color: null },
    ],
    loading: false,
    addCategory: mockAddCategory,
    addGroup: mockAddGroup,
    deleteCategory: mockDeleteCategory,
    deleteGroup: mockDeleteGroup,
  }),
}))

vi.mock('@/lib/hooks/useBudgets', () => ({
  useBudgets: () => ({
    budgets: [
      { id: 'b1', name: 'Despensa', icon: '🛒', color: null, amount: 3000, accumulated: 1200, period_days: 14, is_active: true },
    ],
    loading: false,
    deleteBudget: mockDeleteBudget,
  }),
}))

vi.mock('@/lib/hooks/useCards', () => ({
  useCards: () => ({
    cards: [
      { id: 'card1', name: 'Nu', bank: 'Nu', last_four: '1234', color: '#820AD1', cut_day: 15, payment_day: 5, is_active: true },
    ],
    loading: false,
    deleteCard: mockDeleteCard,
  }),
}))

import SettingsPage from '@/app/(app)/settings/page'

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all sections', async () => {
    render(<SettingsPage />)

    expect(screen.getByText('Configuración')).toBeInTheDocument()
    expect(screen.getByText('Salario')).toBeInTheDocument()
    expect(screen.getByText('Categorías')).toBeInTheDocument()
    expect(screen.getByText('Cajitas')).toBeInTheDocument()
    expect(screen.getByText('Tarjetas')).toBeInTheDocument()
  })

  it('should load salary values from settings', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      const salaryInput = screen.getByDisplayValue('16000')
      expect(salaryInput).toBeInTheDocument()
    })
  })

  it('should load next payment date from settings', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      const dateInput = screen.getByDisplayValue('2026-03-15')
      expect(dateInput).toBeInTheDocument()
    })
  })

  it('should display real categories from hook', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Comida')).toBeInTheDocument()
    expect(screen.getByText('Nómina')).toBeInTheDocument()
    expect(screen.getByText('Hogar')).toBeInTheDocument()
  })

  it('should display budgets from hook', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Despensa')).toBeInTheDocument()
  })

  it('should display cards from hook', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Nu')).toBeInTheDocument()
  })

  it('should show frequency buttons and biweekly selected', () => {
    render(<SettingsPage />)

    const biweeklyBtn = screen.getByText('Quincenal')
    expect(biweeklyBtn).toBeInTheDocument()
    // Should have active styles (bg-ink)
    expect(biweeklyBtn.className).toContain('bg-ink')
  })

  it('should call updateSalary on save', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('16000')).toBeInTheDocument()
    })

    const saveBtn = screen.getByText('Guardar salario')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateSalary).toHaveBeenCalledWith({
        salary: 16000,
        salary_frequency: 'biweekly',
        salary_custom_days: null,
        salary_next_date: '2026-03-15',
      })
    })
  })

  it('should show "Guardado" after successful save', async () => {
    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('16000')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Guardar salario'))

    await waitFor(() => {
      expect(screen.getByText('✓ Guardado')).toBeInTheDocument()
    })
  })

  it('should have links to budgets and cards pages', () => {
    render(<SettingsPage />)

    const verTodasLinks = screen.getAllByText('Ver todas')
    expect(verTodasLinks).toHaveLength(2)

    // Check hrefs
    const links = screen.getAllByRole('link')
    const budgetLink = links.find((l) => l.getAttribute('href') === '/budgets')
    const cardLink = links.find((l) => l.getAttribute('href') === '/cards')
    expect(budgetLink).toBeTruthy()
    expect(cardLink).toBeTruthy()
  })

  it('should show category and group count', () => {
    render(<SettingsPage />)

    expect(screen.getByText('2 categorías · 1 grupo')).toBeInTheDocument()
  })

  it('should show add category and add group buttons', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Categoría')).toBeInTheDocument()
    expect(screen.getByText('Grupo')).toBeInTheDocument()
  })

  it('should show date field with helper text', () => {
    render(<SettingsPage />)

    expect(screen.getByText('A partir de esta fecha se calcula cada cuándo recibes tu salario')).toBeInTheDocument()
  })

  it('should show error message when save fails', async () => {
    mockUpdateSalary.mockResolvedValueOnce({ ok: false, error: 'No se pudo guardar. Verifica tu conexión o inicia sesión de nuevo.' })

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('16000')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Guardar salario'))

    await waitFor(() => {
      expect(screen.getByText('No se pudo guardar. Verifica tu conexión o inicia sesión de nuevo.')).toBeInTheDocument()
    })
  })

  it('should show loading state while saving', async () => {
    let resolveUpdate: (value: { ok: boolean }) => void
    mockUpdateSalary.mockImplementationOnce(() => new Promise((resolve) => { resolveUpdate = resolve }))

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('16000')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Guardar salario'))

    await waitFor(() => {
      expect(screen.getByText('Guardando...')).toBeInTheDocument()
    })

    resolveUpdate!({ ok: true })

    await waitFor(() => {
      expect(screen.getByText('✓ Guardado')).toBeInTheDocument()
    })
  })
})
