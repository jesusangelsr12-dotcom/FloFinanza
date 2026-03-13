import { formatMXN } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'

interface TransactionItemProps {
  icon: string
  iconBg: string
  name: string
  meta: string
  amount: number
  type: 'expense' | 'income'
  date: string
}

export default function TransactionItem({
  icon,
  iconBg,
  name,
  meta,
  amount,
  type,
  date,
}: TransactionItemProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-bg">
      <div
        className="w-11 h-11 rounded-sm flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-sm font-bold text-ink truncate">{name}</div>
        <div className="text-xs text-ink-3 mt-0.5">{meta}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-display text-[15px] font-extrabold ${
          type === 'expense' ? 'text-accent-red' : 'text-accent-green'
        }`}>
          {type === 'expense' ? '−' : '+'}{formatMXN(Math.abs(amount))}
        </div>
        <div className="text-[11px] text-ink-3 mt-0.5">{formatDate(date)}</div>
      </div>
    </div>
  )
}
