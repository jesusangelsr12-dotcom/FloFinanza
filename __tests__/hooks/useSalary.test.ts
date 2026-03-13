import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { mockSupabaseQuery, mockAuth } from '../setup'

// Must import AFTER mocks are set up in setup.ts
import { useSalary } from '@/lib/hooks/useSalary'

describe('useSalary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    })
  })

  it('should start with loading=true and settings=null', () => {
    mockSupabaseQuery(null)
    const { result } = renderHook(() => useSalary())
    expect(result.current.loading).toBe(true)
    expect(result.current.settings).toBeNull()
  })

  it('should load settings from Supabase', async () => {
    const mockSettings = {
      salary: 16000,
      salary_frequency: 'biweekly',
      salary_custom_days: null,
      salary_next_date: '2026-03-15',
    }
    mockSupabaseQuery(mockSettings)

    const { result } = renderHook(() => useSalary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.settings).toEqual(mockSettings)
  })

  it('should handle no settings (new user)', async () => {
    mockSupabaseQuery(null, { code: 'PGRST116', message: 'not found' })

    const { result } = renderHook(() => useSalary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.settings).toBeNull()
  })

  it('should not fetch if user is not authenticated', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null } })
    mockSupabaseQuery(null)

    const { result } = renderHook(() => useSalary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.settings).toBeNull()
  })

  it('updateSalary should return ok on success', async () => {
    // First call: fetch (returns existing settings)
    mockSupabaseQuery({
      salary: 10000,
      salary_frequency: 'monthly',
      salary_custom_days: null,
      salary_next_date: null,
    })

    const { result } = renderHook(() => useSalary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Configure for upsert
    mockSupabaseQuery(null, null)

    let res: { ok: boolean; error?: string } | undefined
    await act(async () => {
      res = await result.current.updateSalary({ salary: 20000 })
    })

    expect(res?.ok).toBe(true)
  })

  it('updateSalary should return error if user not authenticated', async () => {
    mockSupabaseQuery(null)

    const { result } = renderHook(() => useSalary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    mockAuth.getUser.mockResolvedValue({ data: { user: null } })

    let res: { ok: boolean; error?: string } | undefined
    await act(async () => {
      res = await result.current.updateSalary({ salary: 20000 })
    })

    expect(res?.ok).toBe(false)
    expect(res?.error).toBeDefined()
  })

  it('updateSalary should update local state on success', async () => {
    mockSupabaseQuery({
      salary: 10000,
      salary_frequency: 'monthly',
      salary_custom_days: null,
      salary_next_date: null,
    })

    const { result } = renderHook(() => useSalary())

    await waitFor(() => {
      expect(result.current.settings?.salary).toBe(10000)
    })

    mockSupabaseQuery(null, null)

    await act(async () => {
      await result.current.updateSalary({
        salary: 25000,
        salary_frequency: 'biweekly',
        salary_next_date: '2026-04-01',
      })
    })

    expect(result.current.settings?.salary).toBe(25000)
    expect(result.current.settings?.salary_frequency).toBe('biweekly')
    expect(result.current.settings?.salary_next_date).toBe('2026-04-01')
  })

  it('updateSalary should create settings when prev is null', async () => {
    // Simulate new user — no existing settings
    mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'new-user' } } })
    mockSupabaseQuery(null, { code: 'PGRST116' })

    const { result } = renderHook(() => useSalary())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.settings).toBeNull()
    })

    // Configure for upsert success
    mockSupabaseQuery(null, null)

    await act(async () => {
      await result.current.updateSalary({ salary: 15000 })
    })

    // Should create a new settings object with defaults
    expect(result.current.settings).not.toBeNull()
    expect(result.current.settings?.salary).toBe(15000)
    expect(result.current.settings?.salary_frequency).toBe('biweekly')
  })
})
