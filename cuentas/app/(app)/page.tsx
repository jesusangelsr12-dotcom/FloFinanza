'use client'

import { Bell } from 'lucide-react'
import TransactionItem from '@/components/transactions/TransactionItem'
import Link from 'next/link'

// Mock data — will be replaced by Supabase queries
const mockTransactions = [
  { icon: '🛒', iconBg: '#FFF0F3', name: 'Super Walmart', meta: 'Despensa · BBVA Azul', amount: 1240, type: 'expense' as const, date: new Date().toISOString() },
  { icon: '💼', iconBg: '#E8F8EE', name: 'Nómina', meta: 'Salario quincenal', amount: 16000, type: 'income' as const, date: new Date(Date.now() - 86400000).toISOString() },
  { icon: '⛽', iconBg: '#ECFEFF', name: 'Gasolinera', meta: 'Transporte · Efectivo', amount: 650, type: 'expense' as const, date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { icon: '🍕', iconBg: '#FFF3EE', name: "Domino's Pizza", meta: 'Comida · con Rodrigo, Ana', amount: 480, type: 'expense' as const, date: new Date(Date.now() - 86400000 * 3).toISOString() },
]

const quickAccess = [
  { icon: '💳', name: 'Tarjetas', sub: '2 activas · $4,200', href: '/cards', bg: '#EEF4FF' },
  { icon: '📦', name: 'Cajitas', sub: '5 fondos activos', href: '/budgets', bg: '#F3EEFF' },
  { icon: '🤝', name: 'Te deben', sub: '3 personas · $1,800', href: '/splits', bg: '#ECFEFF' },
  { icon: '📊', name: 'MSI activos', sub: '4 planes · $680/mes', href: '/msi', bg: '#FFF3EE' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function HomePage() {
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
        <button className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center relative">
          <Bell size={18} className="text-ink" />
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-red border-2 border-white" />
        </button>
      </div>

      {/* Hero Balance Card */}
      <div className="bg-ink rounded-[28px] p-6 pb-6 relative overflow-hidden mb-4">
        {/* Decorative circles */}
        <div className="absolute -top-[50px] -right-[30px] w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-20 -left-5 w-[180px] h-[180px] rounded-full bg-white/[0.025] pointer-events-none" />

        <div className="text-xs font-semibold text-white/45 uppercase tracking-wider mb-1.5">
          Balance este mes
        </div>
        <div className="font-display text-[52px] font-black text-white tracking-[-2.5px] leading-none mb-1">
          $18,430
        </div>
        <div className="text-[13px] text-white/40 mb-5">
          Marzo 2026 · Quincenal
        </div>
        <div className="h-px bg-white/[0.08] mb-4" />
        <div className="flex">
          <div className="flex-1 border-r border-white/[0.08] pr-4 mr-4">
            <div className="text-[11px] text-white/40 mb-1.5">Ingresos</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
              <span className="font-display text-[17px] font-extrabold text-[#4ADE80]">$32,000</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-white/40 mb-1.5">Gastos</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FB7185]" />
              <span className="font-display text-[17px] font-extrabold text-[#FB7185]">$13,570</span>
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
        <span className="font-display text-[13px] font-bold text-accent-blue cursor-pointer">Ver todos</span>
      </div>
      <div className="bg-white border border-border rounded-card overflow-hidden">
        {mockTransactions.map((tx, i) => (
          <div key={i} className={i < mockTransactions.length - 1 ? 'border-b border-border' : ''}>
            <TransactionItem {...tx} />
          </div>
        ))}
      </div>
    </div>
  )
}
