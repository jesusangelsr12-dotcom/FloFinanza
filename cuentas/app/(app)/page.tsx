'use client'

import { Bell, Settings } from 'lucide-react'
import TransactionItem from '@/components/transactions/TransactionItem'
import Link from 'next/link'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useCards } from '@/lib/hooks/useCards'
import { useMSI } from '@/lib/hooks/useMSI'
import { formatMXN } from '@/lib/utils/currency'
import { getGreeting, getMonthName } from '@/lib/utils/dates'

const categoryMeta: Record<string, { icon: string; bg: string }> = {
  groceries: { icon: '🛒', bg: '#FFF0F3' },
  food: { icon: '🍕', bg: '#FFF3EE' },
  transport: { icon: '⛽', bg: '#ECFEFF' },
  health: { icon: '💊', bg: '#F3EEFF' },
  entertainment: { icon: '🎮', bg: '#EEF4FF' },
  home: { icon: '🏠', bg: '#E8F8EE' },
  clothing: { icon: '👗', bg: '#FFF0F3' },
  salary: { icon: '💼', bg: '#E8F8EE' },
  freelance: { icon: '💻', bg: '#EEF4FF' },
  investment: { icon: '📈', bg: '#F3EEFF' },
  gift: { icon: '🎁', bg: '#FFF3EE' },
  refund: { icon: '↩️', bg: '#ECFEFF' },
}
const defaultMeta = { icon: '💰', bg: '#F4F4F6' }

export default function HomePage() {
  const { transactions } = useTransactions()
  const { budgets } = useBudgets()
  const { cards } = useCards()
  const { activePlans, totalMonthlyMSI } = useMSI()

  const now = new Date()
  const monthLabel = getMonthName(now)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthTx = transactions.filter((t) => new Date(t.date) >= startOfMonth)
  const totalIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const recentTx = transactions.slice(0, 5)

  const quickAccess = [
    { icon: '💳', name: 'Tarjetas', sub: `${cards.length} activa${cards.length !== 1 ? 's' : ''}`, href: '/cards', bg: '#EEF4FF' },
    { icon: '📦', name: 'Cajitas', sub: `${budgets.length} fondo${budgets.length !== 1 ? 's' : ''} activo${budgets.length !== 1 ? 's' : ''}`, href: '/budgets', bg: '#F3EEFF' },
    { icon: '🤝', name: 'Te deben', sub: 'Gastos compartidos', href: '/splits', bg: '#ECFEFF' },
    { icon: '📊', name: 'MSI activos', sub: `${activePlans.length} plan${activePlans.length !== 1 ? 'es' : ''} · ${formatMXN(totalMonthlyMSI)}/mes`, href: '/msi', bg: '#FFF3EE' },
  ]

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center font-display text-base font-black text-white">
            J
          </div>
          <div>
            <div className="text-xs text-ink-3 font-medium">{getGreeting()},</div>
            <div className="font-display text-lg font-extrabold text-ink">Jesús</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
            <Settings size={18} className="text-ink" />
          </Link>
          <button className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center relative">
            <Bell size={18} className="text-ink" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-red border-2 border-white" />
          </button>
        </div>
      </div>

      {/* Hero Balance Card */}
      <div className="bg-ink rounded-[28px] p-6 pb-6 relative overflow-hidden mb-4">
        <div className="absolute -top-[50px] -right-[30px] w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-20 -left-5 w-[180px] h-[180px] rounded-full bg-white/[0.025] pointer-events-none" />

        <div className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-1.5">
          Balance este mes
        </div>
        <div className="font-display text-[52px] font-black text-white tracking-[-2.5px] leading-none mb-1">
          {formatMXN(balance)}
        </div>
        <div className="text-[13px] text-white/40 mb-5 capitalize">
          {monthLabel}
        </div>
        <div className="h-px bg-white/[0.08] mb-4" />
        <div className="flex">
          <div className="flex-1 border-r border-white/[0.08] pr-4 mr-4">
            <div className="text-[11px] text-white/40 mb-1.5">Ingresos</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
              <span className="font-display text-[17px] font-extrabold text-[#4ADE80]">{formatMXN(totalIncome)}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-white/40 mb-1.5">Gastos</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FB7185]" />
              <span className="font-display text-[17px] font-extrabold text-[#FB7185]">{formatMXN(totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-1">
        {quickAccess.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="bg-white border border-border rounded-[18px] p-4 hover:-translate-y-0.5 hover:shadow-card transition-all"
          >
            <div
              className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-lg mb-2.5"
              style={{ background: item.bg }}
            >
              {item.icon}
            </div>
            <div className="font-display text-[13px] font-bold text-ink mb-0.5">{item.name}</div>
            <div className="text-[11px] text-ink-3">{item.sub}</div>
          </Link>
        ))}
      </div>

      {/* Transactions */}
      <div className="flex items-center justify-between my-5">
        <span className="font-display text-[15px] font-extrabold text-ink">Últimos movimientos</span>
        <Link href="/transactions" className="font-display text-[13px] font-bold text-accent-blue">Ver todos</Link>
      </div>
      {recentTx.length === 0 ? (
        <div className="bg-white border border-border rounded-card p-8 text-center">
          <p className="text-sm text-ink-3">Aun no hay movimientos. Presiona + para agregar.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-card overflow-hidden">
          {recentTx.map((tx, i) => {
            const meta = categoryMeta[tx.category_id || ''] || defaultMeta
            return (
              <div key={tx.id} className={i < recentTx.length - 1 ? 'border-b border-border' : ''}>
                <TransactionItem
                  icon={meta.icon}
                  iconBg={meta.bg}
                  name={tx.description || (tx.type === 'income' ? 'Ingreso' : 'Gasto')}
                  meta={tx.category_id || ''}
                  amount={tx.amount}
                  type={tx.type}
                  date={tx.date}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
