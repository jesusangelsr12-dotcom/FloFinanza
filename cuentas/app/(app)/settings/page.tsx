'use client'

import { useState } from 'react'
import { ArrowLeft, DollarSign, Tag, ChevronRight, PieChart, Plus, Trash2, Percent, Hash } from 'lucide-react'
import Link from 'next/link'
import { useDistribution } from '@/lib/hooks/useDistribution'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { formatMXN } from '@/lib/utils/currency'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const frequencies = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'custom', label: 'Personalizado' },
]

export default function SettingsPage() {
  const [salary, setSalary] = useState('16000')
  const [frequency, setFrequency] = useState('biweekly')
  const [customDays, setCustomDays] = useState('14')
  const [saved, setSaved] = useState(false)

  // Distribution
  const { rules, addRule, deleteRule, totalPercent, canAddPercentRule } = useDistribution()
  const { budgets } = useBudgets()
  const [showDistModal, setShowDistModal] = useState(false)
  const [distBudgetId, setDistBudgetId] = useState('')
  const [distType, setDistType] = useState<'percent' | 'fixed'>('percent')
  const [distValue, setDistValue] = useState('')

  const handleSave = () => {
    // TODO: Save to Supabase
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddRule = async () => {
    if (!distBudgetId || !distValue) return
    const val = Number(distValue)
    if (val <= 0) return
    if (distType === 'percent' && !canAddPercentRule(val)) return
    await addRule(distBudgetId, distType, val)
    setDistBudgetId('')
    setDistValue('')
    setShowDistModal(false)
  }

  // Budgets not yet assigned a rule
  const availableBudgets = budgets.filter(
    (b) => !rules.some((r) => r.budget_id === b.id)
  )

  // Preview distribution with current salary
  const salaryNum = Number(salary) || 0
  const totalFixed = rules.filter((r) => r.allocation_type === 'fixed').reduce((s, r) => s + r.allocation_value, 0)
  const totalPercentAmount = Math.round((totalPercent / 100) * Math.max(salaryNum - totalFixed, 0))
  const totalDistributed = totalFixed + totalPercentAmount
  const distributionPercent = salaryNum > 0 ? Math.min((totalDistributed / salaryNum) * 100, 100) : 0

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-5">
        <Link href="/" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold text-ink">Configuración</h1>
      </div>

      {/* Salary Section */}
      <div className="bg-white border border-border rounded-card p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-green-bg flex items-center justify-center">
            <DollarSign size={20} className="text-accent-green" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-ink">Salario</h2>
            <p className="text-xs text-ink-3">Configura tu ingreso recurrente</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Monto por periodo</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 font-display font-bold">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={salary}
                onChange={(e) => setSalary(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full p-3.5 pl-8 rounded-sm border border-border-2 bg-bg font-display text-lg font-bold text-ink outline-none focus:border-accent-blue focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Frecuencia</label>
            <div className="grid grid-cols-2 gap-2">
              {frequencies.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className={`py-2.5 px-4 rounded-pill font-display text-[13px] font-bold border transition-all ${
                    frequency === f.value
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-ink-3 border-border hover:border-ink-3'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {frequency === 'custom' && (
            <div>
              <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Cada cuántos días</label>
              <input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                min="1"
                max="365"
                className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
              />
            </div>
          )}
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white border border-border rounded-card p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-purple-bg flex items-center justify-center">
            <Tag size={20} className="text-accent-purple" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-ink">Categorías</h2>
            <p className="text-xs text-ink-3">Gastos e ingresos</p>
          </div>
          <ChevronRight size={18} className="text-ink-3" />
        </div>

        <div className="space-y-2">
          {[
            { group: 'Hogar', items: ['Luz', 'Gas', 'Agua', 'Internet'], icon: '🏠' },
            { group: 'Comida', items: ['Despensa', 'Restaurantes', 'Café'], icon: '🍕' },
            { group: 'Transporte', items: ['Gasolina', 'Uber', 'Estacionamiento'], icon: '🚗' },
          ].map((g) => (
            <div key={g.group} className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{g.icon}</span>
                <div>
                  <div className="font-display text-[13px] font-bold text-ink">{g.group}</div>
                  <div className="text-[11px] text-ink-3">{g.items.join(', ')}</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-ink-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Income Distribution Section */}
      <div className="bg-white border border-border rounded-card p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-blue-bg flex items-center justify-center">
            <PieChart size={20} className="text-accent-blue" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-ink">Distribucion de ingresos</h2>
            <p className="text-xs text-ink-3">Reparte automaticamente a tus cajitas</p>
          </div>
          {availableBudgets.length > 0 && (
            <button
              onClick={() => setShowDistModal(true)}
              className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center"
            >
              <Plus size={14} className="text-white" />
            </button>
          )}
        </div>

        {/* Distribution bar */}
        {salaryNum > 0 && rules.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-ink-3">Distribuyendo</span>
              <span className="font-display font-bold text-ink">
                {formatMXN(totalDistributed)} de {formatMXN(salaryNum)}
              </span>
            </div>
            <div className="h-2.5 bg-bg rounded-full overflow-hidden flex">
              {rules.map((rule) => {
                let ruleAmount: number
                if (rule.allocation_type === 'fixed') {
                  ruleAmount = rule.allocation_value
                } else {
                  ruleAmount = Math.round((rule.allocation_value / 100) * Math.max(salaryNum - totalFixed, 0))
                }
                const pct = salaryNum > 0 ? (ruleAmount / salaryNum) * 100 : 0
                return (
                  <div
                    key={rule.id}
                    className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${pct}%`,
                      background: rule.budget?.color || rule.budget?.gradient_from || '#3B82F6',
                    }}
                  />
                )
              })}
            </div>
            {salaryNum > totalDistributed && (
              <p className="text-[11px] text-ink-3 mt-1">
                {formatMXN(salaryNum - totalDistributed)} sin asignar ({Math.round(100 - distributionPercent)}%)
              </p>
            )}
          </div>
        )}

        {/* Rules list */}
        {rules.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-ink-3 mb-3">
              Configura como se reparte tu ingreso automaticamente entre tus cajitas.
            </p>
            {availableBudgets.length > 0 && (
              <Button size="sm" onClick={() => setShowDistModal(true)}>Agregar regla</Button>
            )}
            {availableBudgets.length === 0 && budgets.length === 0 && (
              <p className="text-xs text-ink-3">Primero crea cajitas en la seccion de Cajitas.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => {
              let ruleAmount: number
              if (rule.allocation_type === 'fixed') {
                ruleAmount = rule.allocation_value
              } else {
                ruleAmount = Math.round((rule.allocation_value / 100) * Math.max(salaryNum - totalFixed, 0))
              }
              return (
                <div key={rule.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                    style={{
                      background: rule.budget?.color
                        ? `${rule.budget.color}20`
                        : rule.budget?.gradient_from
                        ? `${rule.budget.gradient_from}20`
                        : '#EEF4FF',
                    }}
                  >
                    {rule.budget?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[13px] font-bold text-ink truncate">
                      {rule.budget?.name || 'Cajita'}
                    </p>
                    <p className="text-[11px] text-ink-3">
                      {rule.allocation_type === 'percent'
                        ? `${rule.allocation_value}%`
                        : formatMXN(rule.allocation_value)
                      }
                      {salaryNum > 0 && ` → ${formatMXN(ruleAmount)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="w-8 h-8 rounded-full bg-bg flex items-center justify-center"
                  >
                    <Trash2 size={14} className="text-ink-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-pill font-display text-base font-extrabold transition-all mb-8 ${
          saved
            ? 'bg-accent-green text-white'
            : 'bg-ink text-white shadow-fab hover:shadow-card-lg hover:-translate-y-0.5 active:translate-y-0'
        }`}
      >
        {saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>

      {/* Add Distribution Rule Modal */}
      <Modal isOpen={showDistModal} onClose={() => setShowDistModal(false)} title="Nueva regla de distribucion">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-xs font-bold text-ink-2">Cajita</label>
            <select
              value={distBudgetId}
              onChange={(e) => setDistBudgetId(e.target.value)}
              className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none"
            >
              <option value="">Selecciona cajita</option>
              {availableBudgets.map((b) => (
                <option key={b.id} value={b.id}>{b.icon || '📦'} {b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-xs font-bold text-ink-2">Tipo de asignacion</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setDistType('percent'); setDistValue('') }}
                className={`flex items-center justify-center gap-2 py-3 rounded-sm font-display text-xs font-bold transition-colors ${
                  distType === 'percent'
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg border border-border text-ink-2'
                }`}
              >
                <Percent size={14} /> Porcentaje
              </button>
              <button
                onClick={() => { setDistType('fixed'); setDistValue('') }}
                className={`flex items-center justify-center gap-2 py-3 rounded-sm font-display text-xs font-bold transition-colors ${
                  distType === 'fixed'
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg border border-border text-ink-2'
                }`}
              >
                <Hash size={14} /> Monto fijo
              </button>
            </div>
          </div>

          <Input
            label={distType === 'percent' ? 'Porcentaje (%)' : 'Monto fijo ($)'}
            type="number"
            placeholder={distType === 'percent' ? 'ej: 30' : 'ej: 3000'}
            value={distValue}
            onChange={(e) => setDistValue(e.target.value)}
          />

          {distType === 'percent' && (
            <div className="bg-accent-blue-bg rounded-sm p-3">
              <p className="text-xs text-accent-blue">
                {totalPercent}% asignado{Number(distValue) > 0 ? ` + ${distValue}% = ${totalPercent + Number(distValue)}%` : ''}.
                {' '}Maximo 100%.
              </p>
            </div>
          )}

          {distType === 'fixed' && salaryNum > 0 && Number(distValue) > 0 && (
            <div className="bg-accent-green-bg rounded-sm p-3">
              <p className="text-xs text-accent-green">
                {formatMXN(Number(distValue))} de {formatMXN(salaryNum)} ({Math.round((Number(distValue) / salaryNum) * 100)}%)
              </p>
            </div>
          )}

          <Button
            onClick={handleAddRule}
            className="w-full"
            disabled={
              !distBudgetId || !distValue || Number(distValue) <= 0 ||
              (distType === 'percent' && !canAddPercentRule(Number(distValue)))
            }
          >
            Agregar regla
          </Button>
        </div>
      </Modal>
    </div>
  )
}
