'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, ChevronDown } from 'lucide-react'
import CategoryPicker from './CategoryPicker'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useCards } from '@/lib/hooks/useCards'
import { useDistribution } from '@/lib/hooks/useDistribution'
import { formatMXN } from '@/lib/utils/currency'

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
  const [isShared, setIsShared] = useState(false)
  const [distributeEnabled, setDistributeEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

  const { addTransaction } = useTransactions()
  const { budgets } = useBudgets()
  const { cards } = useCards()
  const { hasRules, getPreview, distributeIncome } = useDistribution()

  const amountNum = Number(amount) || 0
  const preview = distributeEnabled && amountNum > 0 ? getPreview(amountNum) : null

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
    setSelectedBudgetId('')
    setIsShared(false)
    setDistributeEnabled(false)
  }

  const handleSubmit = async () => {
    if (!amount || amount === '0' || saving) return
    setSaving(true)

    try {
      // Save transaction to Supabase
      await addTransaction({
        type,
        amount: amountNum,
        description: description || null,
        date: new Date().toISOString().split('T')[0],
        category_id: selectedCategory || null,
        budget_id: selectedBudgetId || null,
        card_id: selectedCardId || null,
      })

      // Distribute income to cajitas if enabled
      if (type === 'income' && distributeEnabled && amountNum > 0) {
        await distributeIncome(amountNum)
      }

      resetForm()
      onClose()
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

  const selectedMethodLabel = methodOptions.find((m) =>
    selectedCardId ? m.cardId === selectedCardId : m.id === selectedMethod
  )?.label || 'Efectivo'

  const selectedBudgetLabel = budgets.find((b) => b.id === selectedBudgetId)?.name || 'Ninguna'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-card-lg max-h-[90vh] overflow-y-auto no-scrollbar"
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

              {/* Shared expense toggle */}
              {type === 'expense' && (
                <div className="flex items-center justify-between bg-bg rounded-sm p-3.5 mb-5">
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
              )}

              {/* Income Distribution Toggle */}
              {type === 'income' && hasRules && (
                <div className="mb-5">
                  <div className="flex items-center justify-between bg-accent-blue-bg rounded-sm p-3.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      <Zap size={16} className="text-accent-blue" />
                      <div>
                        <div className="font-display text-xs font-bold text-accent-blue">Distribuir a cajitas</div>
                        <div className="text-[11px] text-accent-blue/70">Reparte automaticamente tu ingreso</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDistributeEnabled(!distributeEnabled)}
                      className={`w-11 h-[26px] rounded-full relative transition-colors ${
                        distributeEnabled ? 'bg-accent-blue' : 'bg-border-2'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-[3px] shadow transition-transform ${
                        distributeEnabled ? 'right-[3px]' : 'left-[3px]'
                      }`} />
                    </button>
                  </div>

                  {/* Distribution preview */}
                  {preview && preview.items.length > 0 && (
                    <div className="bg-white border border-border rounded-card p-4">
                      <p className="font-display text-xs font-bold text-ink-2 mb-3">Vista previa de distribucion</p>
                      <div className="space-y-2">
                        {preview.items.map((item) => (
                          <div key={item.budget_id} className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                              style={{
                                background: item.budget_color ? `${item.budget_color}20` : '#EEF4FF',
                              }}
                            >
                              {item.budget_icon || '📦'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display text-xs font-bold text-ink truncate">{item.budget_name}</p>
                              <p className="text-[11px] text-ink-3">
                                {item.allocation_type === 'percent'
                                  ? `${item.allocation_value}%`
                                  : formatMXN(item.allocation_value)}
                              </p>
                            </div>
                            <p className="font-display text-sm font-extrabold text-accent-green">
                              {formatMXN(item.calculated_amount)}
                            </p>
                          </div>
                        ))}
                        {preview.unassigned > 0 && (
                          <div className="flex items-center gap-2.5 pt-2 border-t border-border">
                            <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-xs">💰</div>
                            <div className="flex-1">
                              <p className="font-display text-xs font-bold text-ink-3">Sin asignar</p>
                            </div>
                            <p className="font-display text-sm font-bold text-ink-3">{formatMXN(preview.unassigned)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!amount || amount === '0' || saving}
                className={`w-full py-4 rounded-pill font-display text-base font-extrabold shadow-fab hover:shadow-card-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  type === 'income' && distributeEnabled
                    ? 'bg-accent-green text-white'
                    : 'bg-ink text-white'
                }`}
              >
                {saving
                  ? 'Guardando...'
                  : type === 'expense'
                  ? 'Guardar gasto'
                  : distributeEnabled
                  ? 'Guardar y distribuir'
                  : 'Guardar ingreso'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
