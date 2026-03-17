'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, ArrowUpRight, ArrowDownLeft, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useLoans, type LoanPayment } from '@/lib/hooks/useLoans'
import { useBudgets } from '@/lib/context/BudgetsContext'
import { useContacts } from '@/lib/hooks/useContacts'
import { formatMXN } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

type Tab = 'given' | 'received'

export default function LoansPage() {
  const {
    givenLoans, receivedLoans, loading, addLoan, markPayment,
    getPayments, deleteLoan, totalGivenPending, totalReceivedPending,
  } = useLoans()
  const { budgets, addMovement } = useBudgets()
  const { contacts } = useContacts()
  const [activeTab, setActiveTab] = useState<Tab>('given')
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null)
  const [payments, setPayments] = useState<Record<string, LoanPayment[]>>({})
  const [payingPayment, setPayingPayment] = useState<{
    loanId: string; monthNumber: number; amount: number; contactName: string
  } | null>(null)
  const [selectedBudgetForPayment, setSelectedBudgetForPayment] = useState('')

  // Form state
  const [direction, setDirection] = useState<'given' | 'received'>('given')
  const [contactName, setContactName] = useState('')
  const [selectedContact, setSelectedContact] = useState('')
  const [principal, setPrincipal] = useState('')
  const [totalMonths, setTotalMonths] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [selectedBudgetForLoan, setSelectedBudgetForLoan] = useState('')

  const displayLoans = activeTab === 'given' ? givenLoans : receivedLoans

  const monthlyPayment = principal && totalMonths
    ? Math.ceil(Number(principal) / Number(totalMonths))
    : 0

  const handleAddLoan = async () => {
    if (!contactName.trim() || !principal || !totalMonths) return
    const budgetForLoan = budgets.find((b) => b.id === selectedBudgetForLoan)
    await addLoan({
      direction,
      contact_id: selectedContact || undefined,
      contact_name: contactName.trim(),
      principal: Number(principal),
      monthly_payment: monthlyPayment,
      total_months: Number(totalMonths),
      start_date: startDate,
      notes: notes.trim() || undefined,
      budget_id: selectedBudgetForLoan || undefined,
      budget_name: budgetForLoan ? `${budgetForLoan.icon || '📦'} ${budgetForLoan.name}` : undefined,
    })

    // Deduct/add amount from/to selected cajita
    if (selectedBudgetForLoan) {
      const amount = Number(principal)
      if (direction === 'given') {
        // I lent money → subtract from my cajita
        await addMovement(selectedBudgetForLoan, -amount, `Préstamo a ${contactName.trim()}`)
      } else {
        // I received a loan → add to my cajita
        await addMovement(selectedBudgetForLoan, amount, `Préstamo de ${contactName.trim()}`)
      }
    }

    setContactName('')
    setSelectedContact('')
    setPrincipal('')
    setTotalMonths('')
    setNotes('')
    setSelectedBudgetForLoan('')
    setShowAddModal(false)
  }

  const togglePayments = async (loanId: string) => {
    if (expandedLoan === loanId) {
      setExpandedLoan(null)
      return
    }
    setExpandedLoan(loanId)
    if (!payments[loanId]) {
      const data = await getPayments(loanId)
      setPayments((prev) => ({ ...prev, [loanId]: data }))
    }
  }

  const handleStartPayment = (loanId: string, monthNumber: number, amount: number, contactName: string) => {
    setPayingPayment({ loanId, monthNumber, amount, contactName })
    setSelectedBudgetForPayment('')
  }

  const handleConfirmPayment = async () => {
    if (!payingPayment) return
    const { loanId, monthNumber, amount, contactName } = payingPayment

    const budgetForPayment = budgets.find((b) => b.id === selectedBudgetForPayment)
    const budgetNameForPayment = budgetForPayment ? `${budgetForPayment.icon || '📦'} ${budgetForPayment.name}` : undefined
    await markPayment(loanId, monthNumber, selectedBudgetForPayment || undefined, budgetNameForPayment)

    // Add money to the selected cajita
    if (selectedBudgetForPayment) {
      await addMovement(
        selectedBudgetForPayment,
        amount,
        `Pago préstamo: ${contactName} mes ${monthNumber}`
      )
    }

    // Refresh payments for this loan
    const data = await getPayments(loanId)
    setPayments((prev) => ({ ...prev, [loanId]: data }))
    setPayingPayment(null)
  }

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-5">
        <Link href="/" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold text-ink">Prestamos</h1>
        <div className="flex-1" />
        <button
          onClick={() => { setDirection(activeTab); setShowAddModal(true) }}
          className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shadow-card"
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card variant="sm">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={14} className="text-accent-green" />
            <p className="text-xs text-ink-3 font-display font-bold">Me deben</p>
          </div>
          <p className="font-display text-xl font-extrabold text-accent-green">{formatMXN(totalGivenPending)}</p>
        </Card>
        <Card variant="sm">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={14} className="text-accent-red" />
            <p className="text-xs text-ink-3 font-display font-bold">Debo</p>
          </div>
          <p className="font-display text-xl font-extrabold text-accent-red">{formatMXN(totalReceivedPending)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['given', 'received'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-pill font-display text-xs font-bold transition-colors ${
              activeTab === tab
                ? 'bg-ink text-white'
                : 'bg-bg border border-border text-ink-2'
            }`}
          >
            {tab === 'given' ? `Preste (${givenLoans.length})` : `Me prestaron (${receivedLoans.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : displayLoans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-[20px] bg-accent-green-bg flex items-center justify-center mb-4">
            <span className="text-2xl">🤲</span>
          </div>
          <p className="font-display text-base font-bold text-ink mb-1">Sin prestamos</p>
          <p className="text-sm text-ink-3 text-center">
            {activeTab === 'given'
              ? 'Registra cuando le prestes dinero a alguien'
              : 'Registra cuando te presten dinero'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayLoans.map((loan) => {
            const remaining = loan.principal - loan.monthly_payment * loan.paid_months
            const progress = loan.total_months > 0 ? (loan.paid_months / loan.total_months) * 100 : 0
            const isExpanded = expandedLoan === loan.id

            return (
              <Card key={loan.id} variant="sm">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    loan.direction === 'given' ? 'bg-accent-green-bg' : 'bg-accent-red-bg'
                  }`}>
                    <span className="font-display text-base font-bold" style={{
                      color: loan.direction === 'given' ? '#00C07F' : '#FF4060'
                    }}>
                      {(loan.contact?.name || loan.contact_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-ink">
                      {loan.contact?.name || loan.contact_name}
                    </p>
                    <p className="text-xs text-ink-3">
                      {loan.paid_months}/{loan.total_months} pagos &middot; {formatMXN(loan.monthly_payment)}/mes
                    </p>
                  </div>
                  <div className="text-right">
                    {loan.is_completed ? (
                      <Badge color="green">Liquidado</Badge>
                    ) : (
                      <p className={`font-display text-[15px] font-extrabold ${
                        loan.direction === 'given' ? 'text-accent-green' : 'text-accent-red'
                      }`}>
                        {formatMXN(remaining)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 mb-1">
                  <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        loan.direction === 'given' ? 'bg-accent-green' : 'bg-accent-red'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Toggle payments */}
                <button
                  onClick={() => togglePayments(loan.id)}
                  className="flex items-center gap-1 mt-2 text-xs text-ink-3 font-display font-bold"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isExpanded ? 'Ocultar pagos' : 'Ver pagos'}
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-1.5">
                    {!payments[loan.id] ? (
                      <div className="flex items-center justify-center py-3">
                        <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                      </div>
                    ) : payments[loan.id].length === 0 ? (
                      <p className="text-xs text-ink-3 py-2 text-center">No se encontraron pagos</p>
                    ) : payments[loan.id].map((p) => {
                      const isPaying = payingPayment?.loanId === loan.id && payingPayment?.monthNumber === p.month_number
                      return (
                        <div key={p.id} className="border-t border-border">
                          <div className="flex items-center gap-3 py-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              p.is_paid ? 'bg-accent-green-bg' : 'bg-bg border border-border'
                            }`}>
                              {p.is_paid && <Check size={12} className="text-accent-green" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-ink">Pago {p.month_number}</p>
                              <p className="text-[11px] text-ink-3">{formatDate(p.due_date)}</p>
                            </div>
                            <p className="text-xs font-display font-bold text-ink">{formatMXN(p.amount)}</p>
                            {!p.is_paid && !isPaying && (
                              <button
                                onClick={() => handleStartPayment(
                                  loan.id, p.month_number, p.amount,
                                  loan.contact?.name || loan.contact_name || ''
                                )}
                                className="px-3 py-1 rounded-pill bg-accent-green text-white text-[11px] font-display font-bold"
                              >
                                Pagar
                              </button>
                            )}
                          </div>
                          {/* Cajita selector when paying */}
                          {isPaying && (
                            <div className="flex items-center gap-2 pb-2 pl-9">
                              <select
                                value={selectedBudgetForPayment}
                                onChange={(e) => setSelectedBudgetForPayment(e.target.value)}
                                className="flex-1 py-1.5 px-2 rounded-sm border border-border-2 bg-bg font-body text-xs text-ink outline-none"
                              >
                                <option value="">Sin cajita</option>
                                {budgets.map((b) => (
                                  <option key={b.id} value={b.id}>{b.icon || '📦'} {b.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={handleConfirmPayment}
                                className="w-7 h-7 rounded-full bg-accent-green flex items-center justify-center"
                              >
                                <Check size={14} className="text-white" />
                              </button>
                              <button
                                onClick={() => setPayingPayment(null)}
                                className="w-7 h-7 rounded-full bg-bg border border-border flex items-center justify-center"
                              >
                                <span className="text-ink-3 text-xs font-bold">✕</span>
                              </button>
                            </div>
                          )}
                          {/* Show which cajita received the money */}
                          {p.is_paid && p.budget && (
                            <div className="pb-1.5 pl-9">
                              <span className="text-[11px] text-ink-3">
                                → {p.budget.icon || '📦'} {p.budget.name}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Delete */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => deleteLoan(loan.id)}
                    className="text-xs text-ink-3 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Loan Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nuevo prestamo">
        <div className="space-y-4">
          {/* Direction toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setDirection('given')}
              className={`flex-1 py-2.5 rounded-sm font-display text-xs font-bold transition-colors ${
                direction === 'given' ? 'bg-accent-green text-white' : 'bg-bg text-ink-2 border border-border'
              }`}
            >
              Yo preste
            </button>
            <button
              onClick={() => setDirection('received')}
              className={`flex-1 py-2.5 rounded-sm font-display text-xs font-bold transition-colors ${
                direction === 'received' ? 'bg-accent-red text-white' : 'bg-bg text-ink-2 border border-border'
              }`}
            >
              Me prestaron
            </button>
          </div>

          {/* Contact selection */}
          {contacts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-xs font-bold text-ink-2">Contacto existente</label>
              <select
                value={selectedContact}
                onChange={(e) => {
                  setSelectedContact(e.target.value)
                  const c = contacts.find((ct) => ct.id === e.target.value)
                  if (c) setContactName(c.name)
                }}
                className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none"
              >
                <option value="">Nuevo contacto</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Nombre"
            placeholder="Nombre de la persona"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />

          <Input
            label="Monto total"
            placeholder="5,000"
            inputMode="numeric"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value.replace(/[^0-9]/g, ''))}
          />

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">¿En cuántos meses?</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 6, 9, 12, 18, 24].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTotalMonths(String(m))}
                  className={`px-3.5 py-2 rounded-pill font-display text-sm font-bold transition-all ${
                    totalMonths === String(m)
                      ? 'bg-ink text-white'
                      : 'bg-bg text-ink-3 border border-border-2'
                  }`}
                >
                  {m === 1 ? '1 mes' : `${m} meses`}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <input
                type="text"
                inputMode="numeric"
                value={totalMonths}
                onChange={(e) => setTotalMonths(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Otro número de meses"
                className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
              />
            </div>
          </div>

          {monthlyPayment > 0 && (
            <div className="bg-bg rounded-sm p-3 text-center">
              <p className="text-xs text-ink-3 mb-0.5">Pago mensual</p>
              <p className="font-display text-lg font-extrabold text-ink">{formatMXN(monthlyPayment)}</p>
            </div>
          )}

          <Input
            label="Fecha de inicio"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            label="Notas (opcional)"
            placeholder="Para que fue el prestamo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Cajita selector */}
          {budgets.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-xs font-bold text-ink-2">
                {direction === 'given' ? '¿De qué cajita sale?' : '¿A qué cajita va?'}
              </label>
              <select
                value={selectedBudgetForLoan}
                onChange={(e) => setSelectedBudgetForLoan(e.target.value)}
                className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
              >
                <option value="">Sin cajita</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>{b.icon || '📦'} {b.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={handleAddLoan}
            className="w-full"
            disabled={!contactName.trim() || !principal || !totalMonths}
          >
            Registrar prestamo
          </Button>
        </div>
      </Modal>
    </div>
  )
}
