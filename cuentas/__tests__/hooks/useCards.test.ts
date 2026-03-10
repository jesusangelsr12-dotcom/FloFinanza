import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { mockSupabaseQuery, mockFrom, mockAuth } from '../setup'

import { useCards } from '@/lib/hooks/useCards'

describe('useCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    })
  })

  it('should load active cards', async () => {
    const cards = [
      { id: 'card1', name: 'Nu', bank: 'Nu', last_four: '1234', color: '#820AD1', credit_limit: 50000, cut_day: 15, payment_day: 5, is_active: true, created_at: '2026-01-01' },
    ]
    mockSupabaseQuery(cards)

    const { result } = renderHook(() => useCards())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.cards).toHaveLength(1)
    expect(result.current.cards[0].name).toBe('Nu')
  })

  it('should add a card with default color', async () => {
    mockSupabaseQuery([])
    const { result } = renderHook(() => useCards())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const newCard = {
      id: 'card-new', name: 'BBVA', bank: 'BBVA', last_four: '5678',
      color: '#3B82F6', credit_limit: null, cut_day: 20, payment_day: 10,
      is_active: true, created_at: '2026-03-10',
    }

    let insertedColor: string | undefined
    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.insert = vi.fn((data: Record<string, unknown>) => { insertedColor = data.color as string; return chain })
      chain.single = vi.fn().mockResolvedValue({ data: newCard, error: null })
      return chain
    })

    await act(async () => {
      await result.current.addCard({ name: 'BBVA', bank: 'BBVA', last_four: '5678', cut_day: 20, payment_day: 10 })
    })

    expect(insertedColor).toBe('#3B82F6')
    expect(result.current.cards).toHaveLength(1)
  })

  it('should soft-delete a card', async () => {
    const cards = [
      { id: 'card1', name: 'Nu', bank: 'Nu', last_four: '1234', color: '#820AD1', credit_limit: 50000, cut_day: 15, payment_day: 5, is_active: true, created_at: '2026-01-01' },
    ]
    mockSupabaseQuery(cards)

    const { result } = renderHook(() => useCards())
    await waitFor(() => expect(result.current.cards).toHaveLength(1))

    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.update = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockResolvedValue({ error: null })
      return chain
    })

    await act(async () => {
      await result.current.deleteCard('card1')
    })

    expect(result.current.cards).toHaveLength(0)
  })

  it('should update card properties', async () => {
    const cards = [
      { id: 'card1', name: 'Nu', bank: 'Nu', last_four: '1234', color: '#820AD1', credit_limit: 50000, cut_day: 15, payment_day: 5, is_active: true, created_at: '2026-01-01' },
    ]
    mockSupabaseQuery(cards)

    const { result } = renderHook(() => useCards())
    await waitFor(() => expect(result.current.cards).toHaveLength(1))

    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.update = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockResolvedValue({ error: null })
      return chain
    })

    await act(async () => {
      await result.current.updateCard('card1', { credit_limit: 60000 })
    })

    expect(result.current.cards[0].credit_limit).toBe(60000)
  })

  it('addCard should return null if user not authenticated', async () => {
    mockSupabaseQuery([])
    const { result } = renderHook(() => useCards())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockAuth.getUser.mockResolvedValue({ data: { user: null } })

    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.addCard({ name: 'Test', cut_day: 1, payment_day: 15 })
    })

    expect(returnValue).toBeNull()
    expect(result.current.cards).toHaveLength(0)
  })
})
