'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, DollarSign, Tag, Package, CreditCard, Plus, Trash2, X, Calendar, HelpCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useSalary } from '@/lib/hooks/useSalary'
import { useCategories } from '@/lib/hooks/useCategories'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useCards } from '@/lib/hooks/useCards'
import Modal from '@/components/ui/Modal'

const frequencies = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'custom', label: 'Personalizado' },
]

const CATEGORY_ICONS = ['🏠', '🍕', '🚗', '💊', '🎮', '👗', '📱', '💳', '🎓', '💰', '🛒', '✈️', '🎵', '📺', '🐶', '💡']

export default function SettingsPage() {
  const { settings, loading: salaryLoading, updateSalary } = useSalary()
  const { categories, groups, loading: catsLoading, addCategory, addGroup, deleteCategory, deleteGroup } = useCategories()
  const { budgets, loading: budgetsLoading, deleteBudget } = useBudgets()
  const { cards, loading: cardsLoading, deleteCard } = useCards()

  const [salary, setSalary] = useState('')
  const [frequency, setFrequency] = useState('biweekly')
  const [customDays, setCustomDays] = useState('14')
  const [nextDate, setNextDate] = useState('')
  const [salarySaved, setSalarySaved] = useState(false)

  // Category modal state
  const [showCatModal, setShowCatModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense')
  const [newCatIcon, setNewCatIcon] = useState('🏠')
  const [newCatGroupId, setNewCatGroupId] = useState<string>('')

  // Group modal state
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupType, setNewGroupType] = useState<'expense' | 'income'>('expense')
  const [newGroupIcon, setNewGroupIcon] = useState('🏠')

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; name: string } | null>(null)

  // Help modal
  const [showHelp, setShowHelp] = useState(false)

  // Load persisted salary settings
  useEffect(() => {
    if (settings) {
      if (settings.salary != null) setSalary(String(settings.salary))
      if (settings.salary_frequency) setFrequency(settings.salary_frequency)
      if (settings.salary_custom_days != null) setCustomDays(String(settings.salary_custom_days))
      if (settings.salary_next_date) setNextDate(settings.salary_next_date)
    }
  }, [settings])

  const handleSaveSalary = async () => {
    const ok = await updateSalary({
      salary: Number(salary) || null,
      salary_frequency: frequency,
      salary_custom_days: frequency === 'custom' ? Number(customDays) || null : null,
      salary_next_date: nextDate || null,
    })
    setSalarySaved(!!ok)
    if (ok) setTimeout(() => setSalarySaved(false), 2000)
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    await addCategory({
      name: newCatName.trim(),
      type: newCatType,
      icon: newCatIcon,
      color: null,
      group_id: newCatGroupId || null,
    })
    setShowCatModal(false)
    setNewCatName('')
    setNewCatIcon('🏠')
    setNewCatGroupId('')
  }

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return
    await addGroup({
      name: newGroupName.trim(),
      type: newGroupType,
      icon: newGroupIcon,
      color: null,
    })
    setShowGroupModal(false)
    setNewGroupName('')
    setNewGroupIcon('🏠')
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'category') await deleteCategory(confirmDelete.id)
    else if (confirmDelete.type === 'group') await deleteGroup(confirmDelete.id)
    else if (confirmDelete.type === 'budget') await deleteBudget(confirmDelete.id)
    else if (confirmDelete.type === 'card') await deleteCard(confirmDelete.id)
    setConfirmDelete(null)
  }

  // Group categories by group
  const expenseGroups = groups.filter((g) => g.type === 'expense')
  const incomeGroups = groups.filter((g) => g.type === 'income')
  const ungroupedExpense = categories.filter((c) => c.type === 'expense' && !c.group_id)
  const ungroupedIncome = categories.filter((c) => c.type === 'income' && !c.group_id)

  return (
    <div className="px-5 pb-32 no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-5">
        <Link href="/" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold text-ink flex-1">Configuración</h1>
        <button
          onClick={() => setShowHelp(true)}
          className="w-10 h-10 rounded-full bg-accent-blue-bg border border-border flex items-center justify-center"
        >
          <HelpCircle size={20} className="text-accent-blue" />
        </button>
      </div>

      {/* ==================== SALARY ==================== */}
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

        {salaryLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : (
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
                placeholder="0"
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

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Próximo día de pago
              </span>
            </label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
            />
            <p className="text-[11px] text-ink-3 mt-1">A partir de esta fecha se calcula cada cuándo recibes tu salario</p>
          </div>

          <button
            onClick={handleSaveSalary}
            className={`w-full py-3.5 rounded-pill font-display text-sm font-extrabold transition-all ${
              salarySaved
                ? 'bg-accent-green text-white'
                : 'bg-ink text-white shadow-fab hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {salarySaved ? '✓ Guardado' : 'Guardar salario'}
          </button>
        </div>
        )}
      </div>

      {/* ==================== CATEGORIES ==================== */}
      <div className="bg-white border border-border rounded-card p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-purple-bg flex items-center justify-center">
            <Tag size={20} className="text-accent-purple" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-ink">Categorías</h2>
            <p className="text-xs text-ink-3">{categories.length} categoría{categories.length !== 1 ? 's' : ''} · {groups.length} grupo{groups.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {catsLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Expense categories */}
            <div className="mb-3">
              <div className="font-display text-[11px] font-bold text-accent-red uppercase tracking-wide mb-2">Gastos</div>
              {expenseGroups.map((group) => {
                const groupCats = categories.filter((c) => c.group_id === group.id)
                return (
                  <div key={group.id} className="mb-2">
                    <div className="flex items-center justify-between py-2 px-2 bg-bg rounded-lg mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{group.icon || '📂'}</span>
                        <span className="font-display text-[13px] font-bold text-ink">{group.name}</span>
                        <span className="text-[11px] text-ink-3">({groupCats.length})</span>
                      </div>
                      <button
                        onClick={() => setConfirmDelete({ type: 'group', id: group.id, name: group.name })}
                        className="p-1.5 text-ink-3 hover:text-accent-red transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {groupCats.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between py-2 pl-8 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat.icon || '•'}</span>
                          <span className="font-body text-[13px] text-ink">{cat.name}</span>
                        </div>
                        <button
                          onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}
                          className="p-1.5 text-ink-3 hover:text-accent-red transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
              {ungroupedExpense.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-2 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.icon || '•'}</span>
                    <span className="font-body text-[13px] text-ink">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}
                    className="p-1.5 text-ink-3 hover:text-accent-red transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {expenseGroups.length === 0 && ungroupedExpense.length === 0 && (
                <p className="text-xs text-ink-3 py-2">Sin categorías de gasto</p>
              )}
            </div>

            {/* Income categories */}
            <div className="mb-3">
              <div className="font-display text-[11px] font-bold text-accent-green uppercase tracking-wide mb-2">Ingresos</div>
              {incomeGroups.map((group) => {
                const groupCats = categories.filter((c) => c.group_id === group.id)
                return (
                  <div key={group.id} className="mb-2">
                    <div className="flex items-center justify-between py-2 px-2 bg-bg rounded-lg mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{group.icon || '📂'}</span>
                        <span className="font-display text-[13px] font-bold text-ink">{group.name}</span>
                        <span className="text-[11px] text-ink-3">({groupCats.length})</span>
                      </div>
                      <button
                        onClick={() => setConfirmDelete({ type: 'group', id: group.id, name: group.name })}
                        className="p-1.5 text-ink-3 hover:text-accent-red transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {groupCats.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between py-2 pl-8 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat.icon || '•'}</span>
                          <span className="font-body text-[13px] text-ink">{cat.name}</span>
                        </div>
                        <button
                          onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}
                          className="p-1.5 text-ink-3 hover:text-accent-red transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
              {ungroupedIncome.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-2 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.icon || '•'}</span>
                    <span className="font-body text-[13px] text-ink">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}
                    className="p-1.5 text-ink-3 hover:text-accent-red transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {incomeGroups.length === 0 && ungroupedIncome.length === 0 && (
                <p className="text-xs text-ink-3 py-2">Sin categorías de ingreso</p>
              )}
            </div>
          </>
        )}

        {/* Add buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowCatModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-pill border border-border font-display text-[12px] font-bold text-ink-2 hover:border-ink-3 transition"
          >
            <Plus size={14} /> Categoría
          </button>
          <button
            onClick={() => setShowGroupModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-pill border border-border font-display text-[12px] font-bold text-ink-2 hover:border-ink-3 transition"
          >
            <Plus size={14} /> Grupo
          </button>
        </div>
      </div>

      {/* ==================== CAJITAS ==================== */}
      <div className="bg-white border border-border rounded-card p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-blue-bg flex items-center justify-center">
            <Package size={20} className="text-accent-blue" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-ink">Cajitas</h2>
            <p className="text-xs text-ink-3">{budgets.length} cajita{budgets.length !== 1 ? 's' : ''} activa{budgets.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/budgets" className="font-display text-[12px] font-bold text-accent-blue">
            Ver todas
          </Link>
        </div>

        {budgetsLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <p className="text-xs text-ink-3 py-2">Sin cajitas. Ve a Cajitas para crear una.</p>
        ) : (
          <div className="space-y-1">
            {budgets.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2.5 px-2 border-b border-border last:border-b-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{b.icon || '📦'}</span>
                  <div>
                    <div className="font-display text-[13px] font-bold text-ink">{b.name}</div>
                    <div className="text-[11px] text-ink-3">${b.amount.toLocaleString('es-MX')} / periodo</div>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDelete({ type: 'budget', id: b.id, name: b.name })}
                  className="p-1.5 text-ink-3 hover:text-accent-red transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================== TARJETAS ==================== */}
      <div className="bg-white border border-border rounded-card p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-red-bg flex items-center justify-center">
            <CreditCard size={20} className="text-accent-red" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-ink">Tarjetas</h2>
            <p className="text-xs text-ink-3">{cards.length} tarjeta{cards.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/cards" className="font-display text-[12px] font-bold text-accent-blue">
            Ver todas
          </Link>
        </div>

        {cardsLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <p className="text-xs text-ink-3 py-2">Sin tarjetas. Ve a Tarjetas para agregar una.</p>
        ) : (
          <div className="space-y-1">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5 px-2 border-b border-border last:border-b-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-5 rounded-[4px]"
                    style={{ background: c.color || '#3B82F6' }}
                  />
                  <div>
                    <div className="font-display text-[13px] font-bold text-ink">{c.name}</div>
                    <div className="text-[11px] text-ink-3">
                      {c.bank || ''}{c.last_four ? ` •••• ${c.last_four}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDelete({ type: 'card', id: c.id, name: c.name })}
                  className="p-1.5 text-ink-3 hover:text-accent-red transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================== ADD CATEGORY MODAL ==================== */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Nueva categoría">
        <div className="space-y-4">
          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Tipo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNewCatType('expense')}
                className={`flex-1 py-2.5 rounded-pill font-display text-[13px] font-bold border transition-all ${
                  newCatType === 'expense' ? 'bg-accent-red text-white border-accent-red' : 'text-ink-3 border-border'
                }`}
              >
                Gasto
              </button>
              <button
                onClick={() => setNewCatType('income')}
                className={`flex-1 py-2.5 rounded-pill font-display text-[13px] font-bold border transition-all ${
                  newCatType === 'income' ? 'bg-accent-green text-white border-accent-green' : 'text-ink-3 border-border'
                }`}
              >
                Ingreso
              </button>
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Icono</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((ico) => (
                <button
                  key={ico}
                  onClick={() => setNewCatIcon(ico)}
                  className={`w-10 h-10 rounded-xl border text-lg flex items-center justify-center transition-all ${
                    newCatIcon === ico ? 'border-accent-blue bg-accent-blue-bg' : 'border-border bg-white'
                  }`}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Nombre</label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ej: Comida, Transporte, Nómina..."
              className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
            />
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Grupo (opcional)</label>
            <select
              value={newCatGroupId}
              onChange={(e) => setNewCatGroupId(e.target.value)}
              className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none appearance-none focus:border-accent-blue transition"
            >
              <option value="">Sin grupo</option>
              {groups.filter((g) => g.type === newCatType).map((g) => (
                <option key={g.id} value={g.id}>{g.icon || '📂'} {g.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddCategory}
            disabled={!newCatName.trim()}
            className="w-full py-4 rounded-pill bg-ink text-white font-display text-base font-extrabold shadow-fab hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40"
          >
            Crear categoría
          </button>
        </div>
      </Modal>

      {/* ==================== ADD GROUP MODAL ==================== */}
      <Modal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} title="Nuevo grupo">
        <div className="space-y-4">
          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Tipo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNewGroupType('expense')}
                className={`flex-1 py-2.5 rounded-pill font-display text-[13px] font-bold border transition-all ${
                  newGroupType === 'expense' ? 'bg-accent-red text-white border-accent-red' : 'text-ink-3 border-border'
                }`}
              >
                Gasto
              </button>
              <button
                onClick={() => setNewGroupType('income')}
                className={`flex-1 py-2.5 rounded-pill font-display text-[13px] font-bold border transition-all ${
                  newGroupType === 'income' ? 'bg-accent-green text-white border-accent-green' : 'text-ink-3 border-border'
                }`}
              >
                Ingreso
              </button>
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Icono</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((ico) => (
                <button
                  key={ico}
                  onClick={() => setNewGroupIcon(ico)}
                  className={`w-10 h-10 rounded-xl border text-lg flex items-center justify-center transition-all ${
                    newGroupIcon === ico ? 'border-accent-blue bg-accent-blue-bg' : 'border-border bg-white'
                  }`}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-display text-xs font-bold text-ink-2 mb-1.5 block">Nombre del grupo</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ej: Hogar, Comida, Transporte..."
              className="w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink outline-none focus:border-accent-blue focus:bg-white transition"
            />
          </div>

          <button
            onClick={handleAddGroup}
            disabled={!newGroupName.trim()}
            className="w-full py-4 rounded-pill bg-ink text-white font-display text-base font-extrabold shadow-fab hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40"
          >
            Crear grupo
          </button>
        </div>
      </Modal>

      {/* ==================== CONFIRM DELETE MODAL ==================== */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar"
      >
        <div className="text-center">
          <p className="font-body text-sm text-ink mb-5">
            ¿Seguro que quieres eliminar <strong>{confirmDelete?.name}</strong>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="flex-1 py-3.5 rounded-pill border border-border font-display text-sm font-bold text-ink-2"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-3.5 rounded-pill bg-accent-red text-white font-display text-sm font-bold"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* ==================== HELP / ONBOARDING MODAL ==================== */}
      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Cómo empezar">
        <div className="space-y-5">
          {[
            {
              step: 1,
              title: 'Configura tu salario',
              desc: 'Pon cuánto ganas por periodo (quincenal, mensual, etc.) y la fecha de tu próximo pago. Así la app calcula cuándo llega tu dinero.',
              icon: '💰',
            },
            {
              step: 2,
              title: 'Crea tus categorías',
              desc: 'Agrega categorías de gasto (Comida, Transporte, Servicios) e ingreso (Nómina, Freelance). Puedes agruparlas en grupos como "Hogar" o "Entretenimiento".',
              icon: '🏷️',
            },
            {
              step: 3,
              title: 'Crea tus cajitas',
              desc: 'Las cajitas son sobres de presupuesto. Asigna un monto a cada una (ej: $3,000 para Comida). Ve a Cajitas desde el menú inferior.',
              icon: '📦',
            },
            {
              step: 4,
              title: 'Agrega tus tarjetas',
              desc: 'Registra tus tarjetas de crédito con banco, últimos 4 dígitos, día de corte y día de pago. Ve a Tarjetas desde el menú inferior.',
              icon: '💳',
            },
            {
              step: 5,
              title: 'Registra transacciones',
              desc: 'Usa el botón + del centro para registrar cada gasto o ingreso. Asígnale categoría, cajita y/o tarjeta.',
              icon: '✏️',
            },
            {
              step: 6,
              title: 'Revisa tus analytics',
              desc: 'En la pestaña de Analytics verás gráficas de tus gastos vs ingresos, distribución por categoría y tendencias.',
              icon: '📊',
            },
            {
              step: 7,
              title: 'Extras: MSI, Préstamos y Gastos compartidos',
              desc: 'Desde el dashboard accede a Meses Sin Intereses, Préstamos (dados y recibidos) y Gastos compartidos con amigos.',
              icon: '🧩',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center">
                <span className="text-lg">{item.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink text-white font-display text-[11px] font-bold">{item.step}</span>
                  <span className="font-display text-[13px] font-bold text-ink">{item.title}</span>
                </div>
                <p className="font-body text-[12px] text-ink-3 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}

          <div className="bg-accent-blue-bg border border-accent-blue/20 rounded-xl p-4 mt-4">
            <p className="font-display text-[13px] font-bold text-accent-blue mb-1">Tip</p>
            <p className="font-body text-[12px] text-ink-2 leading-relaxed">
              Empieza configurando salario y categorías aquí en Configuración. Después ve a Cajitas y Tarjetas para completar tu setup. Una vez listo, solo registra tus gastos día a día.
            </p>
          </div>

          <button
            onClick={() => setShowHelp(false)}
            className="w-full py-4 rounded-pill bg-ink text-white font-display text-base font-extrabold shadow-fab hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Entendido
          </button>
        </div>
      </Modal>
    </div>
  )
}
