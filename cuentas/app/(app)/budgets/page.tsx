'use client'

import { useState } from 'react'
import BudgetCard from '@/components/budgets/BudgetCard'
import Modal from '@/components/ui/Modal'
import { formatMXN } from '@/lib/utils/currency'

const mockBudgets = [
  {
    id: '1',
    name: 'Viaje / Vacaciones',
    icon: '✈️',
    accumulated: 3400,
    budgetAmount: 5000,
    amountPerPeriod: 2500,
    periodLabel: 'quincena',
    gradientFrom: '#3B82F6',
    gradientTo: '#2563EB',
  },
  {
    id: '2',
    name: 'Gastos del hogar',
    icon: '🏠',
    accumulated: 2250,
    budgetAmount: 5000,
    amountPerPeriod: 2500,
    periodLabel: 'quincena',
    gradientFrom: '#00C07F',
    gradientTo: '#059669',
  },
  {
    id: '3',
    name: 'Comida / Restaurantes',
    icon: '🍔',
    accumulated: 2590,
    budgetAmount: 2000,
    amountPerPeriod: 2000,
    periodLabel: 'quincena',
    gradientFrom: '#FF4060',
    gradientTo: '#E11D48',
  },
  {
    id: '4',
    name: 'Salud / Medicamentos',
    icon: '💊',
    accumulated: 1500,
    budgetAmount: 5000,
    amountPerPeriod: 2500,
    periodLabel: 'quincena',
    gradientFrom: '#8B5CF6',
    gradientTo: '#7C3AED',
  },
]

export default function BudgetsPage() {
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newIcon, setNewIcon] = useState('📦')

  const totalAccumulated = mockBudgets.reduce((sum, b) => {
    const effective = b.accumulated > b.budgetAmount ? b.budgetAmount - b.accumulated : b.accumulated
    return sum + Math.max(0, b.accumulated <= b.budgetAmount ? b.accumulated : 0)
  }, 0)

  const icons = ['📦', '✈️', '🏠', '🍔', '💊', '🎮', '👗', '📱', '🚗', '💳', '🎓', '💰']

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="pt-4 pb-1">
        <div className="text-xs text-ink-3 font-medium mb-0.5">Total ahorrado</div>
        <div className="font-display text-[32px] font-black text-ink tracking-[-1px]">
          {formatMXN(totalAccumulated)}
        </div>
        <div className="text-xs text-ink-3 mt-1.5">Quincenal · próxima recarga en 6 días</div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between my-5">
        <span className="font-display text-[15px] font-extrabold text-ink">Mis cajitas</span>
        <button
          onClick={() => setShowNewModal(true)}
          className="font-display text-[13px] font-bold text-accent-blue"
        >
          + Nueva
        </button>
      </div>

      {/* Budget Cards */}
      {mockBudgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          name={budget.name}
          icon={budget.icon}
          accumulated={budget.accumulated}
          budgetAmount={budget.budgetAmount}
          amountPerPeriod={budget.amountPerPeriod}
          periodLabel={budget.periodLabel}
          gradientFrom={budget.gradientFrom}
          gradientTo={budget.gradientTo}
        />
      ))}

      {/* New Budget Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva cajita"
      >
        <div className="space-y-4">
          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Icono</label>
            <div className="flex flex-wrap gap-2">
              {icons.map((ico) => (
                <button
                  key={ico}
                  onClick={() => setNewIcon(ico)}
                  className={`w-11 h-11 rounded-xl border text-xl flex items-center justify-center transition-all ${
                    newIcon === ico
                      ? 'border-accent-blue bg-accent-blue-bg'
                      : 'border-border bg-white'
                  }`}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Nombre</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Vacaciones, Renta, Comida..."
              className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
            />
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Monto por periodo</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 font-display font-bold">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="2,500"
                className="w-full p-3.5 pl-8 rounded-sm border border-border-2 bg-bg font-display text-lg font-bold text-ink outline-none focus:border-accent-blue focus:bg-white transition"
              />
            </div>
          </div>

          <button
            onClick={() => {
              // TODO: Save to Supabase
              setShowNewModal(false)
              setNewName('')
              setNewAmount('')
            }}
            disabled={!newName || !newAmount}
            className="w-full py-4 rounded-pill bg-ink text-white font-display text-base font-extrabold shadow-fab hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40"
          >
            Crear cajita
          </button>
        </div>
      </Modal>
    </div>
  )
}
