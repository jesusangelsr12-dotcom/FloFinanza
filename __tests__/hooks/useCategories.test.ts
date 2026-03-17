import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { mockFrom, mockAuth } from '../setup'

import { useCategories } from '@/lib/hooks/useCategories'

function mockParallelFetch(categories: unknown[], groups: unknown[]) {
  let callCount = 0
  mockFrom.mockImplementation(() => {
    callCount++
    const data = callCount % 2 === 1 ? categories : groups
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockReturnValue(chain)
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: data[0] || null, error: null })
    chain.then = vi.fn((resolve: (v: unknown) => void) => resolve({ data, error: null }))
    return new Proxy(chain, {
      get(target, prop) {
        if (prop === 'then') return (resolve: (v: unknown) => void) => resolve({ data, error: null })
        return target[prop as string]
      },
    })
  })
}

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    })
  })

  it('should load categories and groups', async () => {
    const cats = [
      { id: 'c1', name: 'Comida', type: 'expense', icon: '🍕', color: null, group_id: null },
      { id: 'c2', name: 'Nómina', type: 'income', icon: '💰', color: null, group_id: null },
    ]
    const grps = [
      { id: 'g1', name: 'Hogar', type: 'expense', icon: '🏠', color: null },
    ]
    mockParallelFetch(cats, grps)

    const { result } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.categories).toHaveLength(2)
    expect(result.current.groups).toHaveLength(1)
  })

  it('should add a category and update local state', async () => {
    mockParallelFetch([], [])

    const { result } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Setup for addCategory
    const newCat = { id: 'c-new', name: 'Uber', type: 'expense', icon: '🚗', color: null, group_id: null }
    let insertCalled = false
    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.insert = vi.fn(() => { insertCalled = true; return chain })
      chain.single = vi.fn().mockResolvedValue({ data: newCat, error: null })
      return chain
    })

    await act(async () => {
      await result.current.addCategory({
        name: 'Uber', type: 'expense', icon: '🚗', color: null, group_id: null,
      })
    })

    expect(insertCalled).toBe(true)
    expect(result.current.categories).toContainEqual(newCat)
  })

  it('should delete a category', async () => {
    const cats = [
      { id: 'c1', name: 'Comida', type: 'expense', icon: '🍕', color: null, group_id: null },
      { id: 'c2', name: 'Nómina', type: 'income', icon: '💰', color: null, group_id: null },
    ]
    mockParallelFetch(cats, [])

    const { result } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2)
    })

    // Setup for delete (chained .eq().eq() for id + user_id)
    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.delete = vi.fn().mockReturnValue(chain)
      const eqFn = vi.fn().mockImplementation(() => {
        const result = { eq: eqFn, then: (resolve: (v: unknown) => void) => resolve({ error: null }) }
        return result
      })
      chain.eq = eqFn
      return chain
    })

    await act(async () => {
      await result.current.deleteCategory('c1')
    })

    expect(result.current.categories).toHaveLength(1)
    expect(result.current.categories[0].id).toBe('c2')
  })

  it('should delete a group and nullify categories group_id', async () => {
    const cats = [
      { id: 'c1', name: 'Luz', type: 'expense', icon: '💡', color: null, group_id: 'g1' },
      { id: 'c2', name: 'Agua', type: 'expense', icon: '💧', color: null, group_id: 'g1' },
    ]
    const grps = [
      { id: 'g1', name: 'Hogar', type: 'expense', icon: '🏠', color: null },
    ]
    mockParallelFetch(cats, grps)

    const { result } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1)
    })

    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.delete = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockResolvedValue({ error: null })
      return chain
    })

    await act(async () => {
      await result.current.deleteGroup('g1')
    })

    expect(result.current.groups).toHaveLength(0)
    // Categories should have group_id set to null
    expect(result.current.categories.every((c) => c.group_id === null)).toBe(true)
  })

  it('should not add category if user not authenticated', async () => {
    mockParallelFetch([], [])

    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockAuth.getUser.mockResolvedValue({ data: { user: null } })

    await act(async () => {
      await result.current.addCategory({
        name: 'Test', type: 'expense', icon: '🧪', color: null, group_id: null,
      })
    })

    expect(result.current.categories).toHaveLength(0)
  })
})
