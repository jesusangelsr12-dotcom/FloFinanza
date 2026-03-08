'use client'

import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="px-5 no-scrollbar">
      <div className="pt-4 pb-5">
        <h1 className="font-display text-[22px] font-extrabold text-ink">Resumen</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-[20px] bg-accent-amber-bg flex items-center justify-center mb-4">
          <BarChart3 size={28} className="text-accent-amber" />
        </div>
        <p className="font-display text-base font-bold text-ink mb-1">Próximamente</p>
        <p className="text-sm text-ink-3 text-center">Aquí verás gráficas de tus gastos e ingresos por mes y año.</p>
      </div>
    </div>
  )
}
