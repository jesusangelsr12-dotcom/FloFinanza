'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
import { Trash2 } from 'lucide-react'
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
  onDelete?: () => void
}

const DELETE_THRESHOLD = -80

export default function TransactionItem({
  icon,
  iconBg,
  name,
  meta,
  amount,
  type,
  date,
  onDelete,
}: TransactionItemProps) {
  const [confirming, setConfirming] = useState(false)
  const x = useMotionValue(0)
  const controls = useAnimation()
  const deleteOpacity = useTransform(x, [-100, -40, 0], [1, 0.5, 0])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < DELETE_THRESHOLD) {
      setConfirming(true)
      controls.start({ x: -90, transition: { type: 'spring', stiffness: 400, damping: 30 } })
    } else {
      setConfirming(false)
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } })
    }
  }

  const handleConfirmDelete = () => {
    controls.start({ x: -400, opacity: 0, transition: { duration: 0.25 } }).then(() => {
      onDelete?.()
    })
  }

  const handleCancelSwipe = () => {
    setConfirming(false)
    controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } })
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete background */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4"
        style={{ opacity: deleteOpacity }}
      >
        {confirming ? (
          <button
            onClick={handleConfirmDelete}
            className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-accent-red text-white font-display text-xs font-bold"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent-red/10 flex items-center justify-center">
            <Trash2 size={16} className="text-accent-red" />
          </div>
        )}
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        style={{ x }}
        animate={controls}
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onTap={confirming ? handleCancelSwipe : undefined}
        className="relative bg-white flex items-center gap-3 px-4 py-3.5 cursor-pointer"
      >
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
      </motion.div>
    </div>
  )
}
