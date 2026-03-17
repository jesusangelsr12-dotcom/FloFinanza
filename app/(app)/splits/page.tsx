'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Check, Trash2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useSplits } from '@/lib/hooks/useSplits'
import { useContacts } from '@/lib/hooks/useContacts'
import { useTransactions } from '@/lib/context/TransactionsContext'
import { formatMXN } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

type Tab = 'pending' | 'paid'

export default function SplitsPage() {
  const { splits, loading, addSplit, markAsPaid, deleteSplit, totalOwed, totalPaid } = useSplits()
  const { contacts, addContact } = useContacts()
  const { transactions } = useTransactions()
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const [selectedTransaction, setSelectedTransaction] = useState('')
  const [selectedContact, setSelectedContact] = useState('')
  const [splitAmount, setSplitAmount] = useState('')

  const [newContactName, setNewContactName] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  const pendingSplits = splits.filter((s) => !s.is_paid)
  const paidSplits = splits.filter((s) => s.is_paid)

  const handleAddSplit = async () => {
    if (!selectedTransaction || !selectedContact || !splitAmount) return
    await addSplit(selectedTransaction, selectedContact, Number(splitAmount))
    setSelectedTransaction('')
    setSelectedContact('')
    setSplitAmount('')
    setShowAddModal(false)
  }

  const handleAddContact = async () => {
    if (!newContactName.trim()) return
    await addContact(newContactName.trim(), newContactPhone.trim() || undefined)
    setNewContactName('')
    setNewContactPhone('')
    setShowContactModal(false)
  }

  // Group pending splits by contact
  const groupedByContact = pendingSplits.reduce<Record<string, { name: string; total: number; splits: typeof pendingSplits }>>((acc, s) => {
    const contactId = s.contact_id
    const contactName = s.contact?.name || 'Sin nombre'
    if (!acc[contactId]) {
      acc[contactId] = { name: contactName, total: 0, splits: [] }
    }
    acc[contactId].total += s.amount
    acc[contactId].splits.push(s)
    return acc
  }, {})

  const displaySplits = activeTab === 'pending' ? pendingSplits : paidSplits

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-5">
        <Link href="/" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold text-ink">Me deben</h1>
        <div className="flex-1" />
        <button
          onClick={() => setShowContactModal(true)}
          className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center"
        >
          <UserPlus size={16} className="text-ink-2" />
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shadow-card"
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card variant="sm">
          <p className="text-xs text-ink-3 font-display font-bold mb-1">Por cobrar</p>
          <p className="font-display text-xl font-extrabold text-accent-red">{formatMXN(totalOwed)}</p>
        </Card>
        <Card variant="sm">
          <p className="text-xs text-ink-3 font-display font-bold mb-1">Cobrado</p>
          <p className="font-display text-xl font-extrabold text-accent-green">{formatMXN(totalPaid)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['pending', 'paid'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-pill font-display text-xs font-bold transition-colors ${
              activeTab === tab
                ? 'bg-ink text-white'
                : 'bg-bg border border-border text-ink-2'
            }`}
          >
            {tab === 'pending' ? `Pendientes (${pendingSplits.length})` : `Pagados (${paidSplits.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : displaySplits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-[20px] bg-accent-teal-bg flex items-center justify-center mb-4">
            <span className="text-2xl">🤝</span>
          </div>
          <p className="font-display text-base font-bold text-ink mb-1">
            {activeTab === 'pending' ? 'Sin cobros pendientes' : 'Sin pagos registrados'}
          </p>
          <p className="text-sm text-ink-3 text-center">
            {activeTab === 'pending'
              ? 'Agrega un gasto compartido con el boton +'
              : 'Los cobros completados apareceran aqui'}
          </p>
        </div>
      ) : activeTab === 'pending' ? (
        <div className="space-y-4">
          {Object.entries(groupedByContact).map(([contactId, group]) => (
            <Card key={contactId} variant="flat">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent-teal-bg flex items-center justify-center">
                  <span className="font-display text-sm font-bold text-accent-teal">
                    {group.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold text-ink">{group.name}</p>
                  <p className="text-xs text-ink-3">{group.splits.length} gasto{group.splits.length > 1 ? 's' : ''}</p>
                </div>
                <p className="font-display text-base font-extrabold text-accent-red">{formatMXN(group.total)}</p>
              </div>
              <div className="space-y-2">
                {group.splits.map((split) => (
                  <div key={split.id} className="flex items-center gap-3 py-2 border-t border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{split.transaction?.description || 'Gasto compartido'}</p>
                      <p className="text-xs text-ink-3">{split.transaction?.date ? formatDate(split.transaction.date) : ''}</p>
                    </div>
                    <p className="font-display text-sm font-bold text-ink">{formatMXN(split.amount)}</p>
                    <button
                      onClick={() => markAsPaid(split.id)}
                      className="w-8 h-8 rounded-full bg-accent-green-bg flex items-center justify-center"
                    >
                      <Check size={14} className="text-accent-green" />
                    </button>
                    <button
                      onClick={() => deleteSplit(split.id)}
                      className="w-8 h-8 rounded-full bg-accent-red-bg flex items-center justify-center"
                    >
                      <Trash2 size={14} className="text-accent-red" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {paidSplits.map((split) => (
            <Card key={split.id} variant="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-green-bg flex items-center justify-center">
                  <Check size={16} className="text-accent-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-ink">{split.contact?.name}</p>
                  <p className="text-xs text-ink-3 truncate">{split.transaction?.description || 'Gasto compartido'}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-accent-green">{formatMXN(split.amount)}</p>
                  <p className="text-[11px] text-ink-3">{split.paid_at ? formatDate(split.paid_at) : ''}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Split Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Dividir gasto">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-display text-xs font-bold text-ink-2">Transaccion</label>
            <select
              value={selectedTransaction}
              onChange={(e) => {
                setSelectedTransaction(e.target.value)
                const tx = transactions.find((t) => t.id === e.target.value)
                if (tx) setSplitAmount(String(Math.round(tx.amount / 2)))
              }}
              className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none"
            >
              <option value="">Selecciona un gasto</option>
              {transactions
                .filter((t) => t.type === 'expense')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.description || 'Sin descripcion'} — {formatMXN(t.amount)}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-display text-xs font-bold text-ink-2">Quien te debe?</label>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none"
            >
              <option value="">Selecciona contacto</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Monto que te debe"
            type="number"
            placeholder="0"
            value={splitAmount}
            onChange={(e) => setSplitAmount(e.target.value)}
          />

          <Button onClick={handleAddSplit} className="w-full" disabled={!selectedTransaction || !selectedContact || !splitAmount}>
            Agregar cobro
          </Button>
        </div>
      </Modal>

      {/* Add Contact Modal */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="Nuevo contacto">
        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Nombre del contacto"
            value={newContactName}
            onChange={(e) => setNewContactName(e.target.value)}
          />
          <Input
            label="Telefono (opcional)"
            placeholder="55 1234 5678"
            value={newContactPhone}
            onChange={(e) => setNewContactPhone(e.target.value)}
          />
          <Button onClick={handleAddContact} className="w-full" disabled={!newContactName.trim()}>
            Guardar contacto
          </Button>
        </div>
      </Modal>
    </div>
  )
}
