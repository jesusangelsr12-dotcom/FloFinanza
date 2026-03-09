'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useMSI, type InstallmentPayment } from '@/lib/hooks/useMSI'
import { useCards } from '@/lib/hooks/useCards'
import { formatMXN } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

type Tab = 'active' | 'completed'

export default function MSIPage() {
  const {
    activePlans, completedPlans, loading,
    addPlan, markPayment, getPayments, deletePlan, totalMonthlyMSI,
  } = useMSI()
  const { cards } = useCards()
  const [activeTab, setActiveTab] = useState<Tab>('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [payments, setPayments] = useState<Record<string, InstallmentPayment[]>>({})

  // Form state
  const [selectedCard, setSelectedCard] = useState('')
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [totalMonths, setTotalMonths] = useState('')
  const [showCustomMonths, setShowCustomMonths] = useState(false)
  const [customMonths, setCustomMonths] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  const displayPlans = activeTab === 'active' ? activePlans : completedPlans
  const monthlyAmount = totalAmount && totalMonths
    ? Math.ceil(Number(totalAmount) / Number(totalMonths))
    : 0

  const handleAddPlan = async () => {
    if (!selectedCard || !description.trim() || !totalAmount || !totalMonths) return
    await addPlan({
      card_id: selectedCard,
      description: description.trim(),
      total_amount: Number(totalAmount),
      total_months: Number(totalMonths),
      start_date: startDate,
    })
    setSelectedCard('')
    setDescription('')
    setTotalAmount('')
    setTotalMonths('')
    setShowAddModal(false)
  }

  const togglePayments = async (planId: string) => {
    if (expandedPlan === planId) {
      setExpandedPlan(null)
      return
    }
    setExpandedPlan(planId)
    if (!payments[planId]) {
      const data = await getPayments(planId)
      setPayments((prev) => ({ ...prev, [planId]: data }))
    }
  }

  const handleMarkPayment = async (planId: string, monthNumber: number) => {
    await markPayment(planId, monthNumber)
    const data = await getPayments(planId)
    setPayments((prev) => ({ ...prev, [planId]: data }))
  }

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-5">
        <Link href="/cards" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold text-ink">Meses sin intereses</h1>
        <div className="flex-1" />
        <button
          onClick={() => setShowAddModal(true)}
          className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shadow-card"
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Summary */}
      <Card variant="sm" className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-3 font-display font-bold mb-0.5">Total mensual MSI</p>
            <p className="font-display text-2xl font-extrabold text-accent-purple">{formatMXN(totalMonthlyMSI)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-3 font-display font-bold mb-0.5">Planes activos</p>
            <p className="font-display text-2xl font-extrabold text-ink">{activePlans.length}</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['active', 'completed'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-pill font-display text-xs font-bold transition-colors ${
              activeTab === tab
                ? 'bg-ink text-white'
                : 'bg-bg border border-border text-ink-2'
            }`}
          >
            {tab === 'active' ? `Activos (${activePlans.length})` : `Liquidados (${completedPlans.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : displayPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-[20px] bg-accent-purple-bg flex items-center justify-center mb-4">
            <span className="text-2xl">📱</span>
          </div>
          <p className="font-display text-base font-bold text-ink mb-1">
            {activeTab === 'active' ? 'Sin planes MSI' : 'Sin planes liquidados'}
          </p>
          <p className="text-sm text-ink-3 text-center">
            {activeTab === 'active'
              ? 'Agrega una compra a meses sin intereses'
              : 'Los planes terminados apareceran aqui'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayPlans.map((plan) => {
            const remaining = plan.total_amount - plan.monthly_amount * plan.paid_months
            const progress = plan.total_months > 0 ? (plan.paid_months / plan.total_months) * 100 : 0
            const isExpanded = expandedPlan === plan.id

            return (
              <Card key={plan.id} variant="sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: plan.card?.color ? `${plan.card.color}20` : '#F3EEFF' }}
                  >
                    <span className="font-display text-xs font-bold" style={{ color: plan.card?.color || '#8B5CF6' }}>
                      {plan.card?.last_four ? `*${plan.card.last_four}` : 'MSI'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-ink truncate">{plan.description}</p>
                    <p className="text-xs text-ink-3">
                      {plan.card?.name} &middot; {plan.paid_months}/{plan.total_months} meses &middot; {formatMXN(plan.monthly_amount)}/mes
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {plan.is_completed ? (
                      <Badge color="green">Liquidado</Badge>
                    ) : (
                      <p className="font-display text-[15px] font-extrabold text-accent-purple">{formatMXN(remaining)}</p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 mb-1">
                  <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-purple transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Toggle payments */}
                <button
                  onClick={() => togglePayments(plan.id)}
                  className="flex items-center gap-1 mt-2 text-xs text-ink-3 font-display font-bold"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isExpanded ? 'Ocultar pagos' : 'Ver pagos'}
                </button>

                {isExpanded && payments[plan.id] && (
                  <div className="mt-3 space-y-1.5">
                    {payments[plan.id].map((p) => (
                      <div key={p.id} className="flex items-center gap-3 py-1.5 border-t border-border">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          p.is_paid ? 'bg-accent-green-bg' : 'bg-bg border border-border'
                        }`}>
                          {p.is_paid && <Check size={12} className="text-accent-green" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-ink">Mes {p.month_number}</p>
                          <p className="text-[11px] text-ink-3">{formatDate(p.due_date)}</p>
                        </div>
                        <p className="text-xs font-display font-bold text-ink">{formatMXN(p.amount)}</p>
                        {!p.is_paid && (
                          <button
                            onClick={() => handleMarkPayment(plan.id, p.month_number)}
                            className="px-3 py-1 rounded-pill bg-accent-purple text-white text-[11px] font-display font-bold"
                          >
                            Pagar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Delete */}
                {!plan.is_completed && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="text-xs text-ink-3 flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Plan Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nuevo plan MSI">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-xs font-bold text-ink-2">Tarjeta</label>
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none"
            >
              <option value="">Selecciona tarjeta</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.last_four ? `(*${c.last_four})` : ''}</option>
              ))}
            </select>
          </div>

          <Input
            label="Descripcion"
            placeholder="ej: MacBook Air M3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            label="Monto total"
            type="number"
            placeholder="25000"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-xs font-bold text-ink-2">Numero de meses</label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 6, 9, 12, 18, 24, 36, 48].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setTotalMonths(String(m))
                    setShowCustomMonths(false)
                    setCustomMonths('')
                  }}
                  className={`py-2 rounded-sm font-display text-xs font-bold transition-colors ${
                    totalMonths === String(m) && !showCustomMonths
                      ? 'bg-accent-purple text-white'
                      : 'bg-bg border border-border text-ink-2'
                  }`}
                >
                  {m}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCustomMonths(true)
                  setTotalMonths('')
                  setCustomMonths('')
                }}
                className={`col-span-4 py-2 rounded-sm font-display text-xs font-bold transition-colors ${
                  showCustomMonths
                    ? 'bg-accent-purple text-white'
                    : 'bg-bg border border-border text-ink-2'
                }`}
              >
                Otro (personalizado)
              </button>
            </div>
            {showCustomMonths && (
              <Input
                label=""
                type="number"
                placeholder="Escribe el numero de meses (1-120)"
                value={customMonths}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  const num = Math.min(Number(val), 120)
                  const clean = val ? String(num) : ''
                  setCustomMonths(clean)
                  setTotalMonths(clean)
                }}
              />
            )}
          </div>

          {monthlyAmount > 0 && (
            <div className="bg-accent-purple-bg rounded-sm p-3 text-center">
              <p className="text-xs text-accent-purple mb-0.5">Pago mensual</p>
              <p className="font-display text-lg font-extrabold text-accent-purple">{formatMXN(monthlyAmount)}</p>
            </div>
          )}

          <Input
            label="Fecha de inicio"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Button
            onClick={handleAddPlan}
            className="w-full"
            disabled={!selectedCard || !description.trim() || !totalAmount || !totalMonths}
          >
            Crear plan MSI
          </Button>
        </div>
      </Modal>
    </div>
  )
}
