import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { mockSupabaseQuery, mockFrom, mockAuth } from '../setup'

import { useTransactions } from '@/lib/hooks/useTransactions'

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    })
  })

  it('should load transactions sorted by date descending', async () => {
    const txs = [
      { id: 't1', type: 'expense', amount: 500, description: 'Uber', date: '2026-03-10', category_id: null, budget_id: null, card_id: null, created_at: '2026-03-10' },
      { id: 't2', type: 'income', amount: 16000, description: 'Nómina', date: '2026-03-01', category_id: null, budget_id: null, card_id: null, created_at: '2026-03-01' },
    ]
    mockSupabaseQuery(txs)

    const { result } = renderHook(() => useTransactions())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.transactions).toHaveLength(2)
    expect(result.current.transactions[0].amount).toBe(500)
  })

  it('should add a transaction and prepend to list', async () => {
    mockSupabaseQuery([])
    const { result } = renderHook(() => useTransactions())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const newTx = {
      id: 't-new', type: 'expense', amount: 250, description: 'Gasolina',
      date: '2026-03-10', category_id: null, budget_id: null, card_id: null,
      created_at: '2026-03-10',
    }

    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.insert = vi.fn().mockReturnValue(chain)
      chain.single = vi.fn().mockResolvedValue({ data: newTx, error: null })
      return chain
    })

    await act(async () => {
      const data = await result.current.addTransaction({
        type: 'expense', amount: 250, description: 'Gasolina',
        date: '2026-03-10', category_id: null, budget_id: null, card_id: null,
      })
      expect(data).toBeTruthy()
    })

    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0].id).toBe('t-new')
  })

  it('should throw error if user not authenticated', async () => {
    mockSupabaseQuery([])
    const { result } = renderHook(() => useTransactions())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockAuth.getUser.mockResolvedValue({ data: { user: null } })

    await act(async () => {
      await expect(result.current.addTransaction({
        type: 'expense', amount: 100, description: 'Test',
        date: '2026-03-10', category_id: null, budget_id: null, card_id: null,
      })).rejects.toThrow('No hay sesión activa')
    })
  })
})
