'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Pencil } from 'lucide-react'
import { useCards } from '@/lib/hooks/useCards'
import { useCardPayments } from '@/lib/hooks/useCardPayments'
import { useTransactions } from '@/lib/context/TransactionsContext'
import { useBudgets } from '@/lib/context/BudgetsContext'
import { useCategories } from '@/lib/hooks/useCategories'
import { getBillingPeriod, getNextPeriod, getPrevPeriod, type BillingPeriod } from '@/lib/utils/billing'
import { formatMXN } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { resolveCategoryMeta } from '@/lib/utils/categories'
import TransactionItem from '@/components/transactions/TransactionItem'

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { cards } = useCards()
  const { deleteTransaction } = useTransactions()
  const { addMovement } = useBudgets()
  const { categories: dbCategories } = useCategories()
  const { transactions, payment, loading, fetchCardTransactions, fetchPayment, upsertPayment, removeTransaction } = useCardPayments()

  const card = cards.find((c) => c.id === id)

  const [period, setPeriod] = useState<BillingPeriod | null>(null)
  const [showPayForm, setShowPayForm] = useState(false)
  const [payAmount, setPayAmount] = useState('')

  // Initialize period when card is available
  useEffect(() => {
    if (card && !period) {
      setPeriod(getBillingPeriod(card.cut_day))
    }
  }, [card, period])

  // Fetch transactions and payment when period changes
  const loadPeriodData = useCallback(async () => {
    if (!id || !period) return
    await Promise.all([
      fetchCardTransactions(id, period.start, period.end),
      fetchPayment(id, period.start, period.end),
    ])
  }, [id, period])

  useEffect(() => {
    loadPeriodData()
  }, [loadPeriodData])

  const totalSpent = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const handlePrevPeriod = () => {
    if (!card || !period) return
    setPeriod(getPrevPeriod(card.cut_day, period.start))
  }

  const handleNextPeriod = () => {
    if (!card || !period) return
    setPeriod(getNextPeriod(card.cut_day, period.start))
  }

  const handlePayment = async () => {
    if (!id || !period || !payAmount) return
    await upsertPayment(id, period.start, period.end, Number(payAmount))
    setShowPayForm(false)
    setPayAmount('')
  }

  const handleDelete = async (tx: typeof transactions[0]) => {
    const deleted = await deleteTransaction(tx.id)
    removeTransaction(tx.id)
    if (deleted?.budget_id) {
      const reverseAmount = deleted.type === 'expense' ? deleted.amount : -deleted.amount
      await addMovement(deleted.budget_id, reverseAmount, `Eliminado: ${deleted.description || ''}`)
    }
  }

  // Group transactions by date
  const grouped: Record<string, typeof transactions> = {}
  for (const tx of transactions) {
    if (!grouped[tx.date]) grouped[tx.date] = []
    grouped[tx.date].push(tx)
  }
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (!card) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-3">
        <Link href="/cards" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-extrabold text-ink">{card.name}</h1>
          <p className="text-xs text-ink-3">{card.bank || 'Tarjeta'}{card.last_four ? ` · *${card.last_four}` : ''}</p>
        </div>
      </div>

      {/* Period navigator */}
      {period && (
        <div className="flex items-center justify-between bg-white border border-border rounded-card px-4 py-3 mb-4">
          <button onClick={handlePrevPeriod} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center">
            <ChevronLeft size={16} className="text-ink" />
          </button>
          <div className="text-center">
            <p className="font-display text-sm font-extrabold text-ink">{period.label}</p>
            <p className="text-[10px] text-ink-3 mt-0.5">Periodo de corte</p>
          </div>
          <button onClick={handleNextPeriod} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center">
            <ChevronRight size={16} className="text-ink" />
          </button>
        </div>
      )}

      {/* Period summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-border rounded-card p-3.5">
          <p className="text-[10px] text-ink-3 font-display font-bold mb-0.5">Gastado en periodo</p>
          <p className="font-display text-xl font-black text-ink">{formatMXN(totalSpent)}</p>
        </div>
        {card.credit_limit && (
          <div className="bg-white border border-border rounded-card p-3.5">
            <p className="text-[10px] text-ink-3 font-display font-bold mb-0.5">Limite</p>
            <p className="font-display text-xl font-black text-ink">{formatMXN(card.credit_limit)}</p>
          </div>
        )}
      </div>

      {/* Payment status */}
      {period && (
        <div className="bg-white border border-border rounded-card p-4 mb-4">
          {payment?.is_paid && !showPayForm ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent-green-bg flex items-center justify-center">
                  <Check size={16} className="text-accent-green" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-accent-green">Pagado</p>
                  <p className="text-[11px] text-ink-3">{formatMXN(payment.amount_paid)}{payment.paid_at ? ` · ${formatDate(payment.paid_at.split('T')[0])}` : ''}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowPayForm(true); setPayAmount(String(payment.amount_paid)) }}
                className="w-8 h-8 rounded-full bg-bg flex items-center justify-center"
              >
                <Pencil size={14} className="text-ink-3" />
              </button>
            </div>
          ) : showPayForm ? (
            <div>
              <p className="font-display text-xs font-bold text-ink-2 mb-2">Monto pagado</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 font-display font-bold text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={String(Math.round(totalSpent))}
                    className="w-full p-3 pl-7 rounded-sm border border-border-2 bg-bg font-display text-sm font-bold text-ink outline-none focus:border-accent-blue transition"
                  />
                </div>
                <button
                  onClick={handlePayment}
                  disabled={!payAmount}
                  className="px-5 py-3 rounded-pill bg-accent-green text-white font-display text-sm font-bold disabled:opacity-40"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowPayForm(false)}
                  className="px-3 py-3 rounded-pill bg-bg text-ink-3 font-display text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setShowPayForm(true); setPayAmount(String(Math.round(totalSpent))) }}
              className="w-full py-3 rounded-pill bg-ink text-white font-display text-sm font-extrabold"
            >
              Registrar pago del periodo
            </button>
          )}
        </div>
      )}

      {/* Transactions list */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-[15px] font-extrabold text-ink">Movimientos</span>
        <span className="text-xs text-ink-3">{transactions.length} movimiento{transactions.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white border border-border rounded-card p-8 text-center">
          <p className="text-sm text-ink-3">Sin movimientos en este periodo.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <p className="font-display text-xs font-bold text-ink-3 mb-2 uppercase">{formatDate(dateKey)}</p>
              <div className="bg-white border border-border rounded-card overflow-hidden">
                {grouped[dateKey].map((tx, i) => {
                  const { meta, name: categoryName } = resolveCategoryMeta(tx.category_id, dbCategories)
                  return (
                    <div key={tx.id} className={i < grouped[dateKey].length - 1 ? 'border-b border-border' : ''}>
                      <TransactionItem
                        icon={meta.icon}
                        iconBg={meta.bg}
                        name={tx.description || (tx.type === 'income' ? 'Ingreso' : 'Gasto')}
                        meta={categoryName}
                        amount={tx.amount}
                        type={tx.type}
                        date={tx.date}
                        onDelete={() => handleDelete(tx)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
