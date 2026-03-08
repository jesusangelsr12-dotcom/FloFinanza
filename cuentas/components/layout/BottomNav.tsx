'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Package, CreditCard, BarChart3 } from 'lucide-react'

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/budgets', icon: Package, label: 'Cajitas' },
  { href: '#fab', icon: null, label: 'Agregar' }, // placeholder for FAB
  { href: '/cards', icon: CreditCard, label: 'Tarjetas' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
]

interface BottomNavProps {
  onFabPress: () => void
}

export default function BottomNav({ onFabPress }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-border">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 pb-6 pt-0 h-[90px]">
        {tabs.map((tab) => {
          if (tab.href === '#fab') {
            return (
              <div key="fab" className="flex flex-col items-center gap-1 -mt-7">
                <button
                  onClick={onFabPress}
                  className="w-[58px] h-[58px] rounded-full bg-ink flex items-center justify-center shadow-fab hover:scale-105 active:scale-95 transition-transform"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <span className="font-display text-[10px] font-bold text-ink-3">Agregar</span>
              </div>
            )
          }

          const Icon = tab.icon!
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors ${
                isActive ? 'bg-transparent' : ''
              }`}
            >
              <Icon
                size={22}
                className={isActive ? 'text-ink' : 'text-ink-3'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`font-display text-[10px] font-bold ${
                isActive ? 'text-ink' : 'text-ink-3'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-ink" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
