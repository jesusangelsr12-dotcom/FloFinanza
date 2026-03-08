'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import CategoryPicker from './CategoryPicker'

interface AddTransactionSheetProps {
  isOpen: boolean
  onClose: () => void
}

const paymentMethods = [
  { id: 'cash', label: 'Efectivo' },
  { id: 'debit', label: 'Débito' },
]

export default function AddTransactionSheet({ isOpen, onClose }: AddTransactionSheetProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState('cash')
  const [isShared, setIsShared] = useState(false)

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    if (cleaned.length <= 10) {
      setAmount(cleaned)
    }
  }

  const formattedAmount = amount
    ? Number(amount).toLocaleString('es-MX')
    : '0'

  const handleSubmit = () => {
    // TODO: Save to Supabase
    onClose()
    setAmount('')
    setDescription('')
    setSelectedCategory(null)
    setIsShared(false)
  }

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
                  <div className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink flex justify-between items-center cursor-pointer hover:border-accent-blue transition">
                    <span>{selectedMethod === 'cash' ? 'Efectivo' : 'Débito'}</span>
                    <span className="text-ink-3">›</span>
                  </div>
                </div>
                <div>
                  <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Cajita</label>
                  <div className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink flex justify-between items-center cursor-pointer hover:border-accent-blue transition">
                    <span className="text-ink-3">Ninguna</span>
                    <span className="text-ink-3">›</span>
                  </div>
                </div>
              </div>

              {/* Shared expense toggle */}
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

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!amount || amount === '0'}
                className="w-full py-4 rounded-pill bg-ink text-white font-display text-base font-extrabold shadow-fab hover:shadow-card-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {type === 'expense' ? 'Guardar gasto' : 'Guardar ingreso'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
