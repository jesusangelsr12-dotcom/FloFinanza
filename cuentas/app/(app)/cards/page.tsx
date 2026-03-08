'use client'

import { CreditCard, Plus } from 'lucide-react'

export default function CardsPage() {
  return (
    <div className="px-5 no-scrollbar">
      <div className="flex items-center justify-between pt-4 pb-5">
        <h1 className="font-display text-[22px] font-extrabold text-ink">Mis Tarjetas</h1>
        <button className="font-display text-[13px] font-bold text-accent-blue flex items-center gap-1">
          <Plus size={14} /> Agregar
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-[20px] bg-accent-blue-bg flex items-center justify-center mb-4">
          <CreditCard size={28} className="text-accent-blue" />
        </div>
        <p className="font-display text-base font-bold text-ink mb-1">Próximamente</p>
        <p className="text-sm text-ink-3 text-center">Aquí podrás gestionar tus tarjetas de crédito, fechas de corte y pagos.</p>
      </div>
    </div>
  )
}
