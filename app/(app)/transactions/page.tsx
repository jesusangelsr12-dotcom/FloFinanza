'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import TransactionItem from '@/components/transactions/TransactionItem'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useCategories } from '@/lib/hooks/useCategories'
import { formatDate } from '@/lib/utils/dates'
import { resolveCategoryMeta } from '@/lib/utils/categories'

export default function TransactionsPage() {
  const { transactions, loading, deleteTransaction } = useTransactions()
  const { addMovement } = useBudgets()
  const { categories: dbCategories } = useCategories()

  const handleDelete = async (tx: typeof transactions[0]) => {
    const deleted = await deleteTransaction(tx.id)
    // Reverse the budget movement if this transaction was linked to a cajita
    if (deleted?.budget_id) {
      const reverseAmount = deleted.type === 'expense' ? deleted.amount : -deleted.amount
      await addMovement(deleted.budget_id, reverseAmount, `Eliminado: ${deleted.description || ''}`)
    }
  }

  // Group transactions by date
  const grouped: Record<string, typeof transactions> = {}
  for (const tx of transactions) {
    const key = tx.date
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(tx)
  }
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="px-5 no-scrollbar">
      <div className="flex items-center gap-3 pt-4 pb-5">
        <Link href="/" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold text-ink">Todos los movimientos</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-[20px] bg-bg flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <p className="font-display text-base font-bold text-ink mb-1">Sin movimientos</p>
          <p className="text-sm text-ink-3 text-center">Presiona + para agregar tu primer gasto o ingreso.</p>
        </div>
      ) : (
        <div className="space-y-4">
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
