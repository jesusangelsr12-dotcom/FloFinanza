'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoansPage() {
  return (
    <div className="px-5 no-scrollbar">
      <div className="flex items-center gap-3 pt-4 pb-5">
        <Link href="/" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold text-ink">Préstamos</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-[20px] bg-accent-green-bg flex items-center justify-center mb-4">
          <span className="text-2xl">🤲</span>
        </div>
        <p className="font-display text-base font-bold text-ink mb-1">Próximamente</p>
        <p className="text-sm text-ink-3 text-center">Aquí podrás ver préstamos que hiciste y que te hicieron, con pagos mensuales.</p>
      </div>
    </div>
  )
}
