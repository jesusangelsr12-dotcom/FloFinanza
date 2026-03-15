import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { mockSupabaseQuery, mockFrom, mockAuth } from '../setup'

import { useBudgets } from '@/lib/hooks/useBudgets'

describe('useBudgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    })
  })

  it('should load active budgets', async () => {
    const budgets = [
      { id: 'b1', name: 'Comida', icon: '🍕', color: null, gradient_from: null, gradient_to: null, amount: 3000, accumulated: 1200, committed: 0, type: 'expense' as const, period_days: 14, is_active: true },
      { id: 'b2', name: 'Transporte', icon: '🚗', color: null, gradient_from: null, gradient_to: null, amount: 1000, accumulated: 500, period_days: 14, is_active: true },
    ]
    mockSupabaseQuery(budgets)

    const { result } = renderHook(() => useBudgets())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.budgets).toHaveLength(2)
    expect(result.current.budgets[0].name).toBe('Comida')
  })

  it('should add a budget with is_active=true', async () => {
    mockSupabaseQuery([])

    const { result } = renderHook(() => useBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const newBudget = {
      id: 'b-new', name: 'Ocio', icon: '🎮', color: null,
      gradient_from: null, gradient_to: null, amount: 2000,
      accumulated: 0, period_days: 14, is_active: true,
    }

    let insertedData: Record<string, unknown> = {}
    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.insert = vi.fn((data: Record<string, unknown>) => { insertedData = data; return chain })
      chain.single = vi.fn().mockResolvedValue({ data: newBudget, error: null })
      return chain
    })

    await act(async () => {
      await result.current.addBudget({
        name: 'Ocio', icon: '🎮', color: null,
        gradient_from: null, gradient_to: null, amount: 2000, type: 'expense' as const, period_days: 14,
      })
    })

    // Verify is_active is explicitly set
    expect(insertedData).toHaveProperty('is_active', true)
    expect(insertedData).toHaveProperty('accumulated', 0)
    expect(result.current.budgets).toHaveLength(1)
    expect(result.current.budgets[0].name).toBe('Ocio')
  })

  it('should soft-delete a budget (set is_active=false)', async () => {
    const budgets = [
      { id: 'b1', name: 'Comida', icon: '🍕', color: null, gradient_from: null, gradient_to: null, amount: 3000, accumulated: 1200, committed: 0, type: 'expense' as const, period_days: 14, is_active: true },
    ]
    mockSupabaseQuery(budgets)

    const { result } = renderHook(() => useBudgets())
    await waitFor(() => expect(result.current.budgets).toHaveLength(1))

    let updatedWith: Record<string, unknown> = {}
    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.update = vi.fn((data: Record<string, unknown>) => { updatedWith = data; return chain })
      chain.eq = vi.fn().mockResolvedValue({ error: null })
      return chain
    })

    await act(async () => {
      await result.current.deleteBudget('b1')
    })

    expect(updatedWith).toEqual({ is_active: false })
    expect(result.current.budgets).toHaveLength(0)
  })

  it('should add movement and update accumulated', async () => {
    const budgets = [
      { id: 'b1', name: 'Comida', icon: '🍕', color: null, gradient_from: null, gradient_to: null, amount: 3000, accumulated: 1000, committed: 0, type: 'expense' as const, period_days: 14, is_active: true },
    ]
    mockSupabaseQuery(budgets)

    const { result } = renderHook(() => useBudgets())
    await waitFor(() => expect(result.current.budgets).toHaveLength(1))

    // Mock for insert + update
    const calls: string[] = []
    mockFrom.mockImplementation((table: string) => {
      calls.push(table)
      const chain: Record<string, unknown> = {}
      chain.insert = vi.fn().mockResolvedValue({ error: null })
      chain.update = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockResolvedValue({ error: null })
      return chain
    })

    await act(async () => {
      await result.current.addMovement('b1', 500, 'Despensa')
    })

    expect(calls).toContain('budget_movements')
    expect(calls).toContain('budgets')
    expect(result.current.budgets[0].accumulated).toBe(1500)
  })

  it('should not add budget if user is not authenticated', async () => {
    mockSupabaseQuery([])
    const { result } = renderHook(() => useBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockAuth.getUser.mockResolvedValue({ data: { user: null } })

    await act(async () => {
      await result.current.addBudget({
        name: 'Test', icon: '🧪', color: null,
        gradient_from: null, gradient_to: null, amount: 100, type: 'expense' as const, period_days: 7,
      })
    })

    expect(result.current.budgets).toHaveLength(0)
  })
})
