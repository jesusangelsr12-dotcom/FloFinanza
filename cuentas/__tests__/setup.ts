import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock Supabase client
const mockFrom = vi.fn()
const mockAuth = {
  getUser: vi.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id' } },
  }),
}

const mockSupabase = {
  from: mockFrom,
  auth: mockAuth,
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

// Helper to configure mock chain for supabase queries
export function mockSupabaseQuery(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const chainFn = () => chain

  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.upsert = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.gte = vi.fn().mockReturnValue(chain)
  chain.lte = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data, error })

  // Make terminal methods resolve
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve({ data, error }))

  // Allow chain to be awaited directly
  const proxy = new Proxy(chain, {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve: (val: unknown) => void) => resolve({ data, error })
      }
      return target[prop as string]
    },
  })

  mockFrom.mockReturnValue(proxy)
  return { chain: proxy, mockFrom, mockAuth }
}

export { mockSupabase, mockFrom, mockAuth }
