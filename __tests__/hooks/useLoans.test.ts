import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { mockSupabaseQuery, mockFrom, mockAuth } from '../setup'

import { useLoans } from '@/lib/hooks/useLoans'

describe('useLoans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    })
  })

  it('should load loans and separate given/received', async () => {
    const loans = [
      { id: 'l1', direction: 'given', contact_id: null, contact_name: 'Carlos', principal: 5000, monthly_payment: 1000, total_months: 5, paid_months: 2, start_date: '2026-01-01', is_completed: false, notes: null, created_at: '2026-01-01', contact: null },
      { id: 'l2', direction: 'received', contact_id: null, contact_name: 'Ana', principal: 3000, monthly_payment: 500, total_months: 6, paid_months: 0, start_date: '2026-02-01', is_completed: false, notes: null, created_at: '2026-02-01', contact: null },
    ]
    mockSupabaseQuery(loans)

    const { result } = renderHook(() => useLoans())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.givenLoans).toHaveLength(1)
    expect(result.current.receivedLoans).toHaveLength(1)
  })

  it('should calculate pending amounts correctly', async () => {
    const loans = [
      { id: 'l1', direction: 'given', contact_id: null, contact_name: 'Carlos', principal: 5000, monthly_payment: 1000, total_months: 5, paid_months: 2, start_date: '2026-01-01', is_completed: false, notes: null, created_at: '2026-01-01', contact: null },
    ]
    mockSupabaseQuery(loans)

    const { result } = renderHook(() => useLoans())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // principal(5000) - monthly_payment(1000) * paid_months(2) = 3000
    expect(result.current.totalGivenPending).toBe(3000)
    expect(result.current.totalReceivedPending).toBe(0)
  })

  it('should not count completed loans in pending total', async () => {
    const loans = [
      { id: 'l1', direction: 'given', contact_id: null, contact_name: 'Carlos', principal: 5000, monthly_payment: 1000, total_months: 5, paid_months: 5, start_date: '2026-01-01', is_completed: true, notes: null, created_at: '2026-01-01', contact: null },
    ]
    mockSupabaseQuery(loans)

    const { result } = renderHook(() => useLoans())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.totalGivenPending).toBe(0)
  })

  it('should delete a loan', async () => {
    const loans = [
      { id: 'l1', direction: 'given', contact_id: null, contact_name: 'Carlos', principal: 5000, monthly_payment: 1000, total_months: 5, paid_months: 2, start_date: '2026-01-01', is_completed: false, notes: null, created_at: '2026-01-01', contact: null },
    ]
    mockSupabaseQuery(loans)

    const { result } = renderHook(() => useLoans())
    await waitFor(() => expect(result.current.loans).toHaveLength(1))

    mockFrom.mockImplementation(() => {
      const chain: Record<string, unknown> = {}
      chain.delete = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockResolvedValue({ error: null })
      return chain
    })

    await act(async () => {
      await result.current.deleteLoan('l1')
    })

    expect(result.current.loans).toHaveLength(0)
  })

  it('should generate payment schedule when adding a loan', async () => {
    mockSupabaseQuery([])
    const { result } = renderHook(() => useLoans())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const newLoan = {
      id: 'l-new', direction: 'given' as const, contact_id: null, contact_name: 'Pedro',
      principal: 6000, monthly_payment: 1000, total_months: 6, paid_months: 0,
      start_date: '2026-03-01', is_completed: false, notes: null, created_at: '2026-03-10',
      contact: null,
    }

    let paymentsInserted: unknown[] = []
    let callIdx = 0
    mockFrom.mockImplementation(() => {
      callIdx++
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.insert = vi.fn((data: unknown) => {
        if (Array.isArray(data)) paymentsInserted = data
        return chain
      })
      chain.single = vi.fn().mockResolvedValue({ data: newLoan, error: null })
      // For payment insert, just resolve
      chain.then = vi.fn((resolve: (v: unknown) => void) => resolve({ error: null }))
      return new Proxy(chain, {
        get(target, prop) {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve({ error: null })
          return target[prop as string]
        },
      })
    })

    await act(async () => {
      await result.current.addLoan({
        direction: 'given', contact_name: 'Pedro', principal: 6000,
        monthly_payment: 1000, total_months: 6, start_date: '2026-03-01',
      })
    })

    expect(paymentsInserted).toHaveLength(6)
    expect((paymentsInserted[0] as Record<string, unknown>).month_number).toBe(1)
    expect((paymentsInserted[5] as Record<string, unknown>).month_number).toBe(6)
  })
})
