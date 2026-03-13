'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatMXN } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

interface Transaction {
  id: string
  type: 'expense' | 'income'
  amount: number
  description: string | null
  date: string
  category_id: string | null
}

interface Category {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

const CHART_COLORS = ['#FF4060', '#8B5CF6', '#3B82F6', '#F59E0B', '#06B6D4', '#00C07F', '#F43F5E', '#A0A0B0']

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTH_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const [txResult, catResult] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('categories').select('*'),
      ])
      if (txResult.data) setTransactions(txResult.data)
      if (catResult.data) setCategories(catResult.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filter transactions by selected month/year
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })
  }, [transactions, selectedMonth, selectedYear])

  const totalExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses

  // Donut chart data: expenses by category
  const expensesByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {}
    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.category_id)
        const name = cat?.name || 'Sin categoria'
        const color = cat?.color || '#A0A0B0'
        if (!map[name]) {
          map[name] = { name, value: 0, color }
        }
        map[name].value += t.amount
      })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [monthTransactions, categories])

  // Monthly bar data: last 6 months
  const monthlyBarData = useMemo(() => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      let m = selectedMonth - i
      let y = selectedYear
      if (m < 0) { m += 12; y -= 1 }
      const monthTx = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === m && d.getFullYear() === y
      })
      data.push({
        name: MONTH_NAMES[m],
        gastos: monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        ingresos: monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      })
    }
    return data
  }, [transactions, selectedMonth, selectedYear])

  const navigateMonth = (dir: number) => {
    let newMonth = selectedMonth + dir
    let newYear = selectedYear
    if (newMonth > 11) { newMonth = 0; newYear++ }
    if (newMonth < 0) { newMonth = 11; newYear-- }
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  // Top categories (top 5)
  const topCategories = expensesByCategory.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="pt-4 pb-5">
        <h1 className="font-display text-[22px] font-extrabold text-ink">Resumen</h1>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4 mb-5">
        <button onClick={() => navigateMonth(-1)} className="w-9 h-9 rounded-full bg-bg border border-border flex items-center justify-center">
          <ChevronLeft size={16} className="text-ink" />
        </button>
        <p className="font-display text-base font-bold text-ink min-w-[160px] text-center">
          {MONTH_FULL[selectedMonth]} {selectedYear}
        </p>
        <button onClick={() => navigateMonth(1)} className="w-9 h-9 rounded-full bg-bg border border-border flex items-center justify-center">
          <ChevronRight size={16} className="text-ink" />
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card variant="sm">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={12} className="text-accent-green" />
            <p className="text-[10px] text-ink-3 font-display font-bold">Ingresos</p>
          </div>
          <p className="font-display text-base font-extrabold text-accent-green">{formatMXN(totalIncome)}</p>
        </Card>
        <Card variant="sm">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown size={12} className="text-accent-red" />
            <p className="text-[10px] text-ink-3 font-display font-bold">Gastos</p>
          </div>
          <p className="font-display text-base font-extrabold text-accent-red">{formatMXN(totalExpenses)}</p>
        </Card>
        <Card variant="sm">
          <p className="text-[10px] text-ink-3 font-display font-bold mb-1">Balance</p>
          <p className={`font-display text-base font-extrabold ${balance >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {balance >= 0 ? '+' : ''}{formatMXN(balance)}
          </p>
        </Card>
      </div>

      {/* Donut Chart - Expenses by category */}
      <Card className="mb-5">
        <p className="font-display text-sm font-bold text-ink mb-4">Gastos por categoria</p>
        {expensesByCategory.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-8">Sin gastos este mes</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-[140px] h-[140px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    stroke="none"
                  >
                    {expensesByCategory.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {topCategories.map((cat, i) => {
                const pct = totalExpenses > 0 ? Math.round((cat.value / totalExpenses) * 100) : 0
                return (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                    <p className="text-xs text-ink flex-1 truncate">{cat.name}</p>
                    <p className="text-xs font-display font-bold text-ink-2">{pct}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Monthly Bar Chart */}
      <Card className="mb-5">
        <p className="font-display text-sm font-bold text-ink mb-4">Ultimos 6 meses</p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyBarData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EFEFEF" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#A0A0B0' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#A0A0B0' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatMXN(Number(value))}
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid #EFEFEF',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              />
              <Bar dataKey="ingresos" fill="#00C07F" radius={[6, 6, 0, 0]} />
              <Bar dataKey="gastos" fill="#FF4060" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-5 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-green" />
            <span className="text-xs text-ink-3">Ingresos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-red" />
            <span className="text-xs text-ink-3">Gastos</span>
          </div>
        </div>
      </Card>

      {/* Top expenses list */}
      <Card className="mb-5">
        <p className="font-display text-sm font-bold text-ink mb-3">Top gastos del mes</p>
        {monthTransactions
          .filter((t) => t.type === 'expense')
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
          .map((t) => {
            const cat = categories.find((c) => c.id === t.category_id)
            return (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: cat?.color ? `${cat.color}20` : '#FFF0F3' }}
                >
                  {cat?.icon || '💸'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-display font-bold truncate">{t.description || cat?.name || 'Gasto'}</p>
                  <p className="text-xs text-ink-3">{formatDate(t.date)}</p>
                </div>
                <p className="font-display text-sm font-extrabold text-accent-red">{formatMXN(t.amount)}</p>
              </div>
            )
          })}
        {monthTransactions.filter((t) => t.type === 'expense').length === 0 && (
          <p className="text-sm text-ink-3 text-center py-4">Sin gastos este mes</p>
        )}
      </Card>
    </div>
  )
}
