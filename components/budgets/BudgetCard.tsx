'use client'

import { formatMXN } from '@/lib/utils/currency'

interface BudgetCardProps {
  name: string
  icon: string
  accumulated: number
  budgetAmount: number
  periodLabel: string
  amountPerPeriod: number
  gradientFrom: string
  gradientTo: string
  onClick?: () => void
}

export default function BudgetCard({
  name,
  icon,
  accumulated,
  budgetAmount,
  periodLabel,
  amountPerPeriod,
  gradientFrom,
  gradientTo,
  onClick,
}: BudgetCardProps) {
  const percentage = Math.round((accumulated / budgetAmount) * 100)
  const isOverBudget = accumulated > budgetAmount
  const displayPercentage = Math.min(percentage, 100)

  if (isOverBudget) {
    const overAmount = accumulated - budgetAmount
    return (
      <div
        onClick={onClick}
        className="rounded-[24px] p-5 mb-3 bg-accent-red-bg border-2 border-[#FFD6DE] cursor-pointer hover:-translate-y-0.5 transition-transform"
      >
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-[46px] h-[46px] rounded-sm bg-accent-red-bg flex items-center justify-center text-[22px]">
              {icon}
            </div>
            <div>
              <div className="font-display text-[13px] font-bold text-ink-2">{name}</div>
              <div className="text-[11px] text-accent-red font-semibold mt-0.5">⚠️ Presupuesto excedido</div>
            </div>
          </div>
          <div className="bg-accent-red-bg text-accent-red font-display text-[11px] font-bold px-2.5 py-1 rounded-pill">
            {percentage}%
          </div>
        </div>
        <div className="font-display text-[26px] font-black text-accent-red tracking-[-1px] mb-3.5">
          −{formatMXN(overAmount)}
        </div>
        <div className="h-1.5 rounded-full bg-[#FFD6DE] overflow-hidden">
          <div className="h-1.5 rounded-full bg-accent-red" style={{ width: '100%' }} />
        </div>
        <div className="flex justify-between mt-2.5">
          <span className="text-[11px] text-ink-3">Límite: {formatMXN(budgetAmount)}</span>
          <span className="font-display text-[11px] font-bold text-accent-red">
            −{formatMXN(overAmount)} sobre límite
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="rounded-[24px] p-5 mb-3 relative overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform"
      style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
    >
      {/* Decorative circle */}
      <div className="absolute -top-[30px] -right-[30px] w-[130px] h-[130px] rounded-full bg-white/[0.18] pointer-events-none" />

      <div className="flex items-start justify-between mb-3.5">
        <div className="w-[46px] h-[46px] rounded-sm bg-white/25 flex items-center justify-center text-[22px]">
          {icon}
        </div>
        <div className="bg-white/25 text-white font-display text-[11px] font-bold px-2.5 py-1 rounded-pill">
          {displayPercentage}%
        </div>
      </div>

      <div className="font-display text-[13px] font-bold text-white/75 mb-0.5">{name}</div>
      <div className="font-display text-[26px] font-black text-white tracking-[-1px] mb-3.5">
        {formatMXN(accumulated)}
      </div>

      <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-white/85 transition-all duration-500"
          style={{ width: `${displayPercentage}%` }}
        />
      </div>

      <div className="flex justify-between mt-2.5">
        <span className="text-[11px] text-white/55">
          {accumulated >= budgetAmount ? 'Meta' : 'Presupuesto'}: {formatMXN(budgetAmount)}
        </span>
        <span className="font-display text-[11px] font-bold text-white/85">
          {formatMXN(amountPerPeriod)} / {periodLabel}
        </span>
      </div>
    </div>
  )
}
