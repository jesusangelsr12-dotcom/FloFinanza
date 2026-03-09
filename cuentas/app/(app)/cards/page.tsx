'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, Trash2, Calendar, Scissors } from 'lucide-react'
import Link from 'next/link'
import { useCards, type CreditCard as CardType } from '@/lib/hooks/useCards'
import { formatMXN } from '@/lib/utils/currency'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

const CARD_COLORS = ['#3B82F6', '#8B5CF6', '#00C07F', '#FF4060', '#F59E0B', '#06B6D4']

export default function CardsPage() {
  const { cards, loading, addCard, deleteCard, getCardSpending } = useCards()
  const [showAddModal, setShowAddModal] = useState(false)
  const [cardSpending, setCardSpending] = useState<Record<string, number>>({})

  // Form state
  const [name, setName] = useState('')
  const [bank, setBank] = useState('')
  const [lastFour, setLastFour] = useState('')
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0])
  const [creditLimit, setCreditLimit] = useState('')
  const [cutDay, setCutDay] = useState('')
  const [paymentDay, setPaymentDay] = useState('')

  useEffect(() => {
    const loadSpending = async () => {
      const spending: Record<string, number> = {}
      for (const card of cards) {
        spending[card.id] = await getCardSpending(card.id)
      }
      setCardSpending(spending)
    }
    if (cards.length > 0) loadSpending()
  }, [cards])

  const handleAddCard = async () => {
    if (!name.trim() || !cutDay || !paymentDay) return
    await addCard({
      name: name.trim(),
      bank: bank.trim() || undefined,
      last_four: lastFour.trim() || undefined,
      color: selectedColor,
      credit_limit: creditLimit ? Number(creditLimit) : undefined,
      cut_day: Number(cutDay),
      payment_day: Number(paymentDay),
    })
    setName('')
    setBank('')
    setLastFour('')
    setSelectedColor(CARD_COLORS[0])
    setCreditLimit('')
    setCutDay('')
    setPaymentDay('')
    setShowAddModal(false)
  }

  const getDaysUntilCut = (cutDay: number) => {
    const now = new Date()
    const currentDay = now.getDate()
    if (cutDay > currentDay) return cutDay - currentDay
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return daysInMonth - currentDay + cutDay
  }

  const getDaysUntilPayment = (paymentDay: number) => {
    const now = new Date()
    const currentDay = now.getDate()
    if (paymentDay > currentDay) return paymentDay - currentDay
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return daysInMonth - currentDay + paymentDay
  }

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-5">
        <h1 className="font-display text-[22px] font-extrabold text-ink">Mis Tarjetas</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="font-display text-[13px] font-bold text-accent-blue flex items-center gap-1"
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-[20px] bg-accent-blue-bg flex items-center justify-center mb-4">
            <CreditCard size={28} className="text-accent-blue" />
          </div>
          <p className="font-display text-base font-bold text-ink mb-1">Sin tarjetas</p>
          <p className="text-sm text-ink-3 text-center mb-4">Agrega tu primera tarjeta de credito para llevar control de tus gastos.</p>
          <Button onClick={() => setShowAddModal(true)} size="sm">Agregar tarjeta</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card visuals */}
          {cards.map((card) => {
            const spending = cardSpending[card.id] || 0
            const limit = card.credit_limit || 0
            const usagePercent = limit > 0 ? Math.min((spending / limit) * 100, 100) : 0
            const daysTocut = getDaysUntilCut(card.cut_day)
            const daysToPay = getDaysUntilPayment(card.payment_day)

            return (
              <div key={card.id}>
                {/* Visual credit card */}
                <div
                  className="rounded-[20px] p-5 pb-4 relative overflow-hidden mb-2"
                  style={{ background: card.color || '#3B82F6' }}
                >
                  <div className="absolute -top-[40px] -right-[20px] w-[160px] h-[160px] rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -bottom-[30px] -left-[10px] w-[120px] h-[120px] rounded-full bg-white/5 pointer-events-none" />

                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-white/60 text-xs font-display font-bold">{card.bank || 'Tarjeta'}</p>
                      <p className="text-white font-display text-base font-extrabold">{card.name}</p>
                    </div>
                    <CreditCard size={24} className="text-white/40" />
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/50 text-[10px] mb-0.5">Terminacion</p>
                      <p className="text-white font-display text-lg font-extrabold tracking-widest">
                        **** {card.last_four || '0000'}
                      </p>
                    </div>
                    {limit > 0 && (
                      <div className="text-right">
                        <p className="text-white/50 text-[10px] mb-0.5">Limite</p>
                        <p className="text-white font-display text-sm font-bold">{formatMXN(limit)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card details */}
                <Card variant="sm">
                  {/* Spending bar */}
                  {limit > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-ink-3">Gastado este mes</span>
                        <span className="font-display font-bold text-ink">{formatMXN(spending)} / {formatMXN(limit)}</span>
                      </div>
                      <div className="h-2 bg-bg rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${usagePercent}%`,
                            background: usagePercent > 80 ? '#FF4060' : usagePercent > 50 ? '#F59E0B' : '#00C07F',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Cut & payment dates */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-bg rounded-sm p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Scissors size={12} className="text-ink-3" />
                        <span className="text-[10px] text-ink-3 font-display font-bold">Corte</span>
                      </div>
                      <p className="font-display text-sm font-extrabold text-ink">Dia {card.cut_day}</p>
                      <p className="text-[10px] text-ink-3">en {daysTocut} dias</p>
                    </div>
                    <div className="flex-1 bg-bg rounded-sm p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar size={12} className="text-ink-3" />
                        <span className="text-[10px] text-ink-3 font-display font-bold">Pago</span>
                      </div>
                      <p className="font-display text-sm font-extrabold text-ink">Dia {card.payment_day}</p>
                      <p className="text-[10px] text-ink-3">en {daysToPay} dias</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <Link href="/msi" className="font-display text-xs font-bold text-accent-purple">
                      Ver MSI
                    </Link>
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="text-xs text-ink-3 flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Card Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nueva tarjeta">
        <div className="space-y-4">
          <Input
            label="Nombre de la tarjeta"
            placeholder="ej: BBVA Azul"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Banco"
            placeholder="ej: BBVA, Banorte, Nu"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          />
          <Input
            label="Ultimos 4 digitos"
            placeholder="1234"
            maxLength={4}
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-xs font-bold text-ink-2">Color</label>
            <div className="flex gap-2">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${selectedColor === c ? 'ring-2 ring-offset-2 ring-ink' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <Input
            label="Limite de credito (opcional)"
            type="number"
            placeholder="50000"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Dia de corte"
              type="number"
              placeholder="15"
              value={cutDay}
              onChange={(e) => setCutDay(e.target.value)}
            />
            <Input
              label="Dia de pago"
              type="number"
              placeholder="5"
              value={paymentDay}
              onChange={(e) => setPaymentDay(e.target.value)}
            />
          </div>

          <Button
            onClick={handleAddCard}
            className="w-full"
            disabled={!name.trim() || !cutDay || !paymentDay}
          >
            Agregar tarjeta
          </Button>
        </div>
      </Modal>
    </div>
  )
}
