'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-[20px] bg-ink mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">💰</span>
        </div>
        <h1 className="font-display text-3xl font-black text-ink tracking-tight">Cuentas</h1>
        <p className="text-sm text-ink-3 mt-1">Tus finanzas, simples y claras</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
          />
        </div>
        <div>
          <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
          />
        </div>

        {error && (
          <div className="bg-accent-red-bg text-accent-red text-xs font-display font-bold rounded-sm p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-pill bg-ink text-white font-display text-base font-extrabold shadow-fab hover:shadow-card-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mt-4"
        >
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-3 mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="font-display font-bold text-accent-blue">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
