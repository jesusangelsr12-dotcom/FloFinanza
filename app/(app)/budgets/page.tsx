'use client'

import { useState } from 'react'
import BudgetCard from '@/components/budgets/BudgetCard'
import Modal from '@/components/ui/Modal'
import { formatMXN } from '@/lib/utils/currency'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useSalary } from '@/lib/hooks/useSalary'
import { frequencyLabel, daysUntil } from '@/lib/utils/dates'

const GRADIENT_PRESETS = [
  { from: '#3B82F6', to: '#2563EB' },
  { from: '#00C07F', to: '#059669' },
  { from: '#FF4060', to: '#E11D48' },
  { from: '#8B5CF6', to: '#7C3AED' },
  { from: '#F59E0B', to: '#D97706' },
  { from: '#06B6D4', to: '#0891B2' },
]

export default function BudgetsPage() {
  const { budgets, loading, addBudget, distributeSalary } = useBudgets()
  const { settings, updateSalary } = useSalary()
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newIcon, setNewIcon] = useState('📦')
  const [newType, setNewType] = useState<'expense' | 'income'>('expense')
  const [selectedGradient, setSelectedGradient] = useState(0)
  const [distributing, setDistributing] = useState(false)
  const [distributed, setDistributed] = useState(false)

  const totalAccumulated = budgets.reduce((sum, b) => sum + Math.max(0, b.amount + b.accumulated), 0)

  const freqLabel = settings
    ? frequencyLabel(settings.salary_frequency, settings.salary_custom_days || undefined)
    : 'Quincenal'

  const nextDateStr = settings?.salary_next_date
  const daysLeft = nextDateStr ? daysUntil(nextDateStr) : null
  const salaryReady = daysLeft !== null && daysLeft <= 0 && !!settings?.salary
  const rechargeText = daysLeft !== null && daysLeft >= 0
    ? `${freqLabel} · proxima recarga en ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`
    : freqLabel

  const handleDistributeSalary = async () => {
    if (!settings?.salary) return
    setDistributing(true)
    await distributeSalary(settings.salary)

    // Advance salary_next_date to next period
    if (settings.salary_next_date) {
      const next = new Date(settings.salary_next_date)
      const freq = settings.salary_frequency
      if (freq === 'weekly') next.setDate(next.getDate() + 7)
      else if (freq === 'biweekly') next.setDate(next.getDate() + 14)
      else if (freq === 'monthly') next.setMonth(next.getMonth() + 1)
      else if (freq === 'custom' && settings.salary_custom_days) next.setDate(next.getDate() + settings.salary_custom_days)
      else next.setDate(next.getDate() + 14) // fallback

      await updateSalary({ salary_next_date: next.toISOString().split('T')[0] })
    }

    setDistributing(false)
    setDistributed(true)
    setTimeout(() => setDistributed(false), 3000)
  }

  const icons = ['📦', '✈️', '🏠', '🍔', '💊', '🎮', '👗', '📱', '🚗', '💳', '🎓', '💰']

  const periodLabel = settings?.salary_frequency === 'monthly'
    ? 'mes'
    : settings?.salary_frequency === 'weekly'
    ? 'semana'
    : 'quincena'

  const handleCreate = async () => {
    if (!newName.trim() || !newAmount) return
    const gradient = GRADIENT_PRESETS[selectedGradient]
    await addBudget({
      name: newName.trim(),
      icon: newIcon,
      color: null,
      gradient_from: gradient.from,
      gradient_to: gradient.to,
      amount: Number(newAmount),
      type: newType,
      period_days: settings?.salary_frequency === 'monthly' ? 30
        : settings?.salary_frequency === 'weekly' ? 7
        : settings?.salary_custom_days || 14,
    })
    setShowNewModal(false)
    setNewName('')
    setNewAmount('')
    setNewIcon('📦')
    setNewType('expense')
    setSelectedGradient(0)
  }

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="pt-4 pb-1">
        <div className="text-xs text-ink-3 font-medium mb-0.5">Total ahorrado</div>
        <div className="font-display text-[32px] font-black text-ink tracking-[-1px]">
          {formatMXN(totalAccumulated)}
        </div>
        <div className="text-xs text-ink-3 mt-1.5">{rechargeText}</div>
      </div>

      {/* Salary distribution banner */}
      {salaryReady && !distributed && budgets.length > 0 && (
        <div className="bg-accent-green-bg border border-[#B6F0D8] rounded-[20px] p-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-accent-green/10 flex items-center justify-center text-xl flex-shrink-0">
              💰
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[13px] font-bold text-ink">Tu salario llegó</div>
              <div className="text-[11px] text-ink-3 mt-0.5">
                {formatMXN(settings?.salary || 0)} · Distribuir a {budgets.length} cajita{budgets.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={handleDistributeSalary}
              disabled={distributing}
              className="px-4 py-2.5 rounded-pill bg-accent-green text-white font-display text-xs font-bold flex-shrink-0"
            >
              {distributing ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              ) : 'Distribuir'}
            </button>
          </div>
        </div>
      )}

      {distributed && (
        <div className="bg-accent-green-bg border border-[#B6F0D8] rounded-[20px] p-4 mt-4 text-center">
          <div className="font-display text-sm font-bold text-accent-green">
            Salario distribuido a tus cajitas
          </div>
        </div>
      )}

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
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-[20px] bg-accent-purple-bg flex items-center justify-center mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <p className="font-display text-base font-bold text-ink mb-1">Sin cajitas</p>
          <p className="text-sm text-ink-3 text-center mb-4">Crea tu primera cajita para empezar a organizar tus gastos.</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-3 rounded-pill bg-ink text-white font-display text-sm font-bold"
          >
            Crear cajita
          </button>
        </div>
      ) : (
        budgets.map((budget) => {
          const gradient = budget.gradient_from && budget.gradient_to
            ? { from: budget.gradient_from, to: budget.gradient_to }
            : GRADIENT_PRESETS[0]
          return (
            <BudgetCard
              key={budget.id}
              name={budget.name}
              icon={budget.icon || '📦'}
              type={budget.type || 'expense'}
              accumulated={budget.accumulated}
              committed={budget.committed || 0}
              budgetAmount={budget.amount}
              amountPerPeriod={budget.amount}
              periodLabel={periodLabel}
              gradientFrom={gradient.from}
              gradientTo={gradient.to}
            />
          )
        })
      )}

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
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Tipo</label>
            <div className="flex bg-bg rounded-pill p-1 gap-0.5">
              <button
                onClick={() => setNewType('expense')}
                className={`flex-1 text-center py-2.5 rounded-pill font-display text-sm font-bold transition-all ${
                  newType === 'expense'
                    ? 'bg-accent-red text-white'
                    : 'text-ink-3'
                }`}
              >
                Gasto
              </button>
              <button
                onClick={() => setNewType('income')}
                className={`flex-1 text-center py-2.5 rounded-pill font-display text-sm font-bold transition-all ${
                  newType === 'income'
                    ? 'bg-accent-green text-white'
                    : 'text-ink-3'
                }`}
              >
                Ingreso
              </button>
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
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">
              {newType === 'income' ? 'Meta de ingreso por periodo' : 'Límite de gasto por periodo'}
            </label>
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

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Color</label>
            <div className="flex gap-2">
              {GRADIENT_PRESETS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedGradient(i)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    selectedGradient === i ? 'ring-2 ring-offset-2 ring-ink' : ''
                  }`}
                  style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!newName.trim() || !newAmount}
            className="w-full py-4 rounded-pill bg-ink text-white font-display text-base font-extrabold shadow-fab hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40"
          >
            Crear cajita
          </button>
        </div>
      </Modal>
    </div>
  )
}
