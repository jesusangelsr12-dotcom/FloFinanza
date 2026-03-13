'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const passwordChecks = [
    { label: 'Al menos 6 caracteres', met: password.length >= 6 },
    { label: 'Contiene un número', met: /\d/.test(password) },
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(
        error.message === 'User already registered'
          ? 'Ya existe una cuenta con este correo'
          : error.message
      )
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full">
      {/* Hero / Brand */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-accent-blue to-accent-purple mx-auto mb-5 flex items-center justify-center shadow-fab"
        >
          <span className="text-3xl">🚀</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="font-display text-[32px] font-black text-white tracking-tight"
        >
          Crear cuenta
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-sm text-white/50 mt-1 font-body"
        >
          Empieza a organizar tus finanzas hoy
        </motion.p>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="bg-white rounded-card p-6 shadow-card-lg"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Nombre</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full p-3.5 pl-10 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Correo electrónico</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full p-3.5 pl-10 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crea una contraseña"
                required
                minLength={6}
                className="w-full p-3.5 pl-10 pr-11 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength hints */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 space-y-1"
              >
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-1.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      check.met ? 'bg-accent-green' : 'bg-border-2'
                    }`}>
                      {check.met && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`font-body text-[11px] transition-colors ${
                      check.met ? 'text-accent-green' : 'text-ink-3'
                    }`}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent-red-bg border border-accent-red/20 rounded-xl px-4 py-3"
            >
              <p className="font-body text-[12px] text-accent-red font-medium">{error}</p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-pill bg-ink text-white font-display text-[15px] font-extrabold shadow-fab hover:shadow-card-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando cuenta...
              </span>
            ) : (
              <>
                Crear mi cuenta
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Footer link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-white/40 mt-6 font-body"
      >
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-display font-bold text-accent-green hover:text-accent-green/80 transition">
          Inicia sesión
        </Link>
      </motion.p>
    </div>
  )
}
