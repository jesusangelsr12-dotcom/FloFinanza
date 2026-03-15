'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, CalendarDays } from 'lucide-react'
import CategoryPicker from './CategoryPicker'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useCards } from '@/lib/hooks/useCards'

interface AddTransactionSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddTransactionSheet({ isOpen, onClose }: AddTransactionSheetProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [selectedMethod, setSelectedMethod] = useState('cash')
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isShared, setIsShared] = useState(false)
  const [isCommitted, setIsCommitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { addTransaction } = useTransactions()
  const { budgets, addMovement, addCommitment } = useBudgets()
  const { cards } = useCards()

  const amountNum = Number(amount) || 0

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    if (cleaned.length <= 10) {
      setAmount(cleaned)
    }
  }

  const formattedAmount = amount
    ? Number(amount).toLocaleString('es-MX')
    : '0'

  const resetForm = () => {
    setAmount('')
    setDescription('')
    setSelectedCategory(null)
    setSelectedCardId('')
    setSelectedMethod('cash')
    setSelectedDate(new Date().toISOString().split('T')[0])
    setSelectedBudgetId('')
    setIsShared(false)
    setIsCommitted(false)
  }

  const handleSubmit = async () => {
    if (!amount || amount === '0' || saving) return
    setSaving(true)
    setError(null)

    try {
      await addTransaction({
        type,
        amount: amountNum,
        description: description || null,
        date: selectedDate,
        category_id: selectedCategory || null,
        budget_id: selectedBudgetId || null,
        card_id: selectedCardId || null,
      })

      // Update the budget's accumulated or committed amount if a cajita was selected
      if (selectedBudgetId) {
        if (isCommitted && type === 'expense') {
          await addCommitment(selectedBudgetId, amountNum, description || undefined)
        } else {
          const movementAmount = type === 'expense' ? -amountNum : amountNum
          await addMovement(selectedBudgetId, movementAmount, description || undefined)
        }
      }

      resetForm()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la transacción')
    } finally {
      setSaving(false)
    }
  }

  // Build payment method options: cash, debit, + credit cards
  const methodOptions = [
    { id: 'cash', label: 'Efectivo', cardId: '' },
    { id: 'debit', label: 'Débito', cardId: '' },
    ...cards.map((c) => ({
      id: `card-${c.id}`,
      label: `${c.name}${c.last_four ? ` *${c.last_four}` : ''}`,
      cardId: c.id,
    })),
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[32px] shadow-card-lg max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="px-5 pb-8">
              {/* Handle */}
              <div className="w-9 h-1 bg-border-2 rounded-full mx-auto my-3" />

              {/* Close button */}
              <div className="flex justify-end mb-2">
                <button onClick={onClose} className="p-1 text-ink-3 hover:text-ink">
                  <X size={20} />
                </button>
              </div>

              {/* Type toggle */}
              <div className="flex bg-bg rounded-pill p-1 gap-0.5 mb-6">
                <button
                  onClick={() => setType('expense')}
                  className={`flex-1 text-center py-2.5 rounded-pill font-display text-sm font-bold transition-all ${
                    type === 'expense'
                      ? 'bg-accent-red text-white'
                      : 'text-ink-3'
                  }`}
                >
                  Gasto
                </button>
                <button
                  onClick={() => setType('income')}
                  className={`flex-1 text-center py-2.5 rounded-pill font-display text-sm font-bold transition-all ${
                    type === 'income'
                      ? 'bg-accent-green text-white'
                      : 'text-ink-3'
                  }`}
                >
                  Ingreso
                </button>
              </div>

              {/* Amount */}
              <div className="text-center mb-7">
                <span className="font-display text-[28px] font-black text-ink-3 align-top mt-2 inline-block">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formattedAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="font-display text-[52px] font-black text-ink tracking-[-2px] bg-transparent border-none outline-none text-center w-48 inline-block"
                  placeholder="0"
                />
                <span className="inline-block w-[3px] h-12 bg-accent-blue rounded-sm align-middle ml-0.5 animate-blink" />
              </div>

              {/* Description */}
              <div className="mb-3.5">
                <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={type === 'expense' ? '¿En qué gastaste?' : '¿De dónde viene?'}
                  className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
                />
              </div>

              {/* Date picker */}
              <div className="mb-3.5">
                <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Fecha</label>
                <div className="flex gap-2">
                  {(() => {
                    const today = new Date().toISOString().split('T')[0]
                    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedDate(today)}
                          className={`px-3.5 py-2 rounded-pill font-display text-xs font-bold transition-all ${
                            selectedDate === today
                              ? 'bg-ink text-white'
                              : 'bg-bg text-ink-3 border border-border-2'
                          }`}
                        >
                          Hoy
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDate(yesterday)}
                          className={`px-3.5 py-2 rounded-pill font-display text-xs font-bold transition-all ${
                            selectedDate === yesterday
                              ? 'bg-ink text-white'
                              : 'bg-bg text-ink-3 border border-border-2'
                          }`}
                        >
                          Ayer
                        </button>
                        <div className="relative flex-1">
                          <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={`w-full py-2 pl-8 pr-2 rounded-pill font-display text-xs font-bold outline-none transition-all ${
                              selectedDate !== today && selectedDate !== yesterday
                                ? 'bg-ink text-white'
                                : 'bg-bg text-ink-3 border border-border-2'
                            }`}
                          />
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Categoría</label>
                <CategoryPicker
                  type={type}
                  selectedId={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>

              {/* Method + Budget selectors */}
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                <div>
                  <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Tarjeta / Método</label>
                  <div className="relative">
                    <select
                      value={selectedCardId ? `card-${selectedCardId}` : selectedMethod}
                      onChange={(e) => {
                        const val = e.target.value
                        const option = methodOptions.find((m) => m.id === val)
                        if (option?.cardId) {
                          setSelectedCardId(option.cardId)
                          setSelectedMethod('')
                        } else {
                          setSelectedCardId('')
                          setSelectedMethod(val)
                        }
                      }}
                      className="w-full p-3.5 pr-8 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none appearance-none focus:border-accent-blue transition"
                    >
                      {methodOptions.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Cajita</label>
                  <div className="relative">
                    <select
                      value={selectedBudgetId}
                      onChange={(e) => setSelectedBudgetId(e.target.value)}
                      className="w-full p-3.5 pr-8 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none appearance-none focus:border-accent-blue transition"
                    >
                      <option value="">Ninguna</option>
                      {budgets.map((b) => (
                        <option key={b.id} value={b.id}>{b.icon || '📦'} {b.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Toggles for expense type */}
              {type === 'expense' && (
                <div className="space-y-2 mb-5">
                  {/* Committed/future expense toggle */}
                  {selectedBudgetId && (
                    <div className="flex items-center justify-between bg-bg rounded-sm p-3.5">
                      <div>
                        <div className="font-display text-xs font-bold text-ink-2 mb-0.5">¿Gasto programado?</div>
                        <div className="text-xs text-ink-3">Aún no lo pagas, pero lo vas a pagar</div>
                      </div>
                      <button
                        onClick={() => setIsCommitted(!isCommitted)}
                        className={`w-11 h-[26px] rounded-full relative transition-colors ${
                          isCommitted ? 'bg-accent-purple' : 'bg-border-2'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-[3px] shadow transition-transform ${
                          isCommitted ? 'right-[3px]' : 'left-[3px]'
                        }`} />
                      </button>
                    </div>
                  )}

                  {/* Shared expense toggle */}
                  <div className="flex items-center justify-between bg-bg rounded-sm p-3.5">
                    <div>
                      <div className="font-display text-xs font-bold text-ink-2 mb-0.5">¿Gasto compartido?</div>
                      <div className="text-xs text-ink-3">Dividir con otras personas</div>
                    </div>
                    <button
                      onClick={() => setIsShared(!isShared)}
                      className={`w-11 h-[26px] rounded-full relative transition-colors ${
                        isShared ? 'bg-ink' : 'bg-border-2'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-[3px] shadow transition-transform ${
                        isShared ? 'right-[3px]' : 'left-[3px]'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-3 p-3 rounded-sm bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!amount || amount === '0' || saving}
                className="w-full py-4 rounded-pill bg-ink text-white font-display text-base font-extrabold shadow-fab hover:shadow-card-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving
                  ? 'Guardando...'
                  : type === 'expense'
                  ? 'Guardar gasto'
                  : 'Guardar ingreso'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
