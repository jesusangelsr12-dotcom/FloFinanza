'use client'

import { motion, AnimatePresence } from 'framer-motion'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink relative overflow-hidden flex items-end sm:items-center justify-center">
      {/* Background glow decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent-green/10 blur-3xl" />
        <div className="absolute top-1/4 -left-16 w-48 h-48 rounded-full bg-accent-blue/10 blur-3xl" />
        <div className="absolute bottom-1/3 right-10 w-40 h-40 rounded-full bg-accent-purple/10 blur-3xl" />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[12%] left-[10%] text-2xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>
          💰
        </div>
        <div className="absolute top-[8%] right-[15%] text-xl opacity-15 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          💳
        </div>
        <div className="absolute top-[25%] right-[8%] text-lg opacity-10 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          📊
        </div>
        <div className="absolute bottom-[35%] left-[5%] text-xl opacity-10 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}>
          🏦
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md px-5 pb-8 pt-6 sm:pb-6"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
