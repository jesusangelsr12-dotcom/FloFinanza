'use client'

import { useState } from 'react'
import BottomNav from '@/components/layout/BottomNav'
import AddTransactionSheet from '@/components/transactions/AddTransactionSheet'
import { BudgetsProvider } from '@/lib/context/BudgetsContext'
import { TransactionsProvider } from '@/lib/context/TransactionsContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <BudgetsProvider>
    <TransactionsProvider>
      <div className="min-h-screen bg-bg">
        <main className="max-w-lg mx-auto pb-[100px]">
          {children}
        </main>
        <BottomNav onFabPress={() => setIsSheetOpen(true)} />
        <AddTransactionSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
        />
      </div>
    </TransactionsProvider>
    </BudgetsProvider>
  )
}
