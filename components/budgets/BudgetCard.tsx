'use client'

import { formatMXN } from '@/lib/utils/currency'

interface BudgetCardProps {
  name: string
  icon: string
  type: 'expense' | 'income'
  accumulated: number
  committed: number
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
  type,
  accumulated,
  committed,
  budgetAmount,
  periodLabel,
  amountPerPeriod,
  gradientFrom,
  gradientTo,
  onClick,
}: BudgetCardProps) {
  // accumulated = actual balance in the cajita
  // Negative means overdrawn (spent more than what's in it)
  const isOverdrawn = accumulated < 0
  const isGoalExceeded = type === 'income' && accumulated > budgetAmount

  // Progress: how full the cajita is relative to its budget
  const fillPercentage = budgetAmount > 0
    ? Math.min(Math.round((Math.max(0, accumulated) / budgetAmount) * 100), 100)
    : 0

  // Overdrawn card (red alert) — only when balance goes negative
  if (isOverdrawn) {
    const deficit = Math.abs(accumulated)
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
              <div className="text-[11px] text-accent-red font-semibold mt-0.5">⚠️ Sin saldo</div>
            </div>
          </div>
        </div>
        <div className="font-display text-[26px] font-black text-accent-red tracking-[-1px] mb-3.5">
          −{formatMXN(deficit)}
        </div>
        <div className="h-1.5 rounded-full bg-[#FFD6DE] overflow-hidden">
          <div className="h-1.5 rounded-full bg-accent-red" style={{ width: '100%' }} />
        </div>
        <div className="flex justify-between mt-2.5">
          <span className="text-[11px] text-ink-3">Presupuesto: {formatMXN(budgetAmount)}</span>
          <span className="font-display text-[11px] font-bold text-accent-red">
            Te pasaste {formatMXN(deficit)}
          </span>
        </div>
        {committed > 0 && (
          <div className="mt-2 pt-2 border-t border-[#FFD6DE]">
            <span className="text-[11px] text-ink-3">Comprometido: {formatMXN(committed)}</span>
          </div>
        )}
      </div>
    )
  }

  // Income goal exceeded (green celebration)
  if (isGoalExceeded) {
    const extra = accumulated - budgetAmount
    return (
      <div
        onClick={onClick}
        className="rounded-[24px] p-5 mb-3 bg-accent-green-bg border-2 border-[#B6F0D8] cursor-pointer hover:-translate-y-0.5 transition-transform"
      >
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-[46px] h-[46px] rounded-sm bg-accent-green-bg flex items-center justify-center text-[22px]">
              {icon}
            </div>
            <div>
              <div className="font-display text-[13px] font-bold text-ink-2">{name}</div>
              <div className="text-[11px] text-accent-green font-semibold mt-0.5">🎉 Meta superada</div>
            </div>
          </div>
          <div className="bg-accent-green-bg text-accent-green font-display text-[11px] font-bold px-2.5 py-1 rounded-pill">
            {Math.round((accumulated / budgetAmount) * 100)}%
          </div>
        </div>
        <div className="font-display text-[26px] font-black text-accent-green tracking-[-1px] mb-3.5">
          {formatMXN(accumulated)}
        </div>
        <div className="h-1.5 rounded-full bg-[#B6F0D8] overflow-hidden">
          <div className="h-1.5 rounded-full bg-accent-green" style={{ width: '100%' }} />
        </div>
        <div className="flex justify-between mt-2.5">
          <span className="text-[11px] text-ink-3">Meta: {formatMXN(budgetAmount)}</span>
          <span className="font-display text-[11px] font-bold text-accent-green">
            +{formatMXN(extra)} sobre meta
          </span>
        </div>
      </div>
    )
  }

  // Normal card — show balance in the cajita
  const available = accumulated - committed

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
          {fillPercentage}%
        </div>
      </div>

      <div className="font-display text-[13px] font-bold text-white/75 mb-0.5">{name}</div>
      <div className="font-display text-[26px] font-black text-white tracking-[-1px] mb-3.5">
        {formatMXN(accumulated)}
      </div>

      <div className="h-1.5 rounded-full bg-white/25 overflow-hidden relative">
        {committed > 0 && type === 'expense' && (
          <div
            className="absolute h-1.5 rounded-full bg-white/40"
            style={{ width: `${Math.min(fillPercentage, 100)}%` }}
          />
        )}
        <div
          className="h-1.5 rounded-full bg-white/85 transition-all duration-500 relative"
          style={{ width: `${fillPercentage}%` }}
        />
      </div>

      <div className="flex justify-between mt-2.5">
        <span className="text-[11px] text-white/55">
          {type === 'income' ? 'Meta' : 'Presupuesto'}: {formatMXN(budgetAmount)}
        </span>
        <span className="font-display text-[11px] font-bold text-white/85">
          {formatMXN(amountPerPeriod)} / {periodLabel}
        </span>
      </div>

      {committed > 0 && type === 'expense' && (
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-white/55">Comprometido: {formatMXN(committed)}</span>
          <span className="text-[11px] text-white/55">
            Disponible: {formatMXN(Math.max(0, available))}
          </span>
        </div>
      )}
    </div>
  )
}
