'use client'

import { useState } from 'react'
import { ArrowLeft, DollarSign, Calendar, Tag, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const frequencies = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'custom', label: 'Personalizado' },
]

export default function SettingsPage() {
  const [salary, setSalary] = useState('16000')
  const [frequency, setFrequency] = useState('biweekly')
  const [customDays, setCustomDays] = useState('14')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // TODO: Save to Supabase
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-5 no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-5">
        <Link href="/" className="w-10 h-10 rounded-full bg-bg border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-ink" />
        </Link>
        <h1 className="font-display text-[22px] font-extrabold text-ink">Configuración</h1>
      </div>

      {/* Salary Section */}
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
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white border border-border rounded-card p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-purple-bg flex items-center justify-center">
            <Tag size={20} className="text-accent-purple" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-base font-bold text-ink">Categorías</h2>
            <p className="text-xs text-ink-3">Gastos e ingresos</p>
          </div>
          <ChevronRight size={18} className="text-ink-3" />
        </div>

        <div className="space-y-2">
          {[
            { group: 'Hogar', items: ['Luz', 'Gas', 'Agua', 'Internet'], icon: '🏠' },
            { group: 'Comida', items: ['Despensa', 'Restaurantes', 'Café'], icon: '🍕' },
            { group: 'Transporte', items: ['Gasolina', 'Uber', 'Estacionamiento'], icon: '🚗' },
          ].map((g) => (
            <div key={g.group} className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{g.icon}</span>
                <div>
                  <div className="font-display text-[13px] font-bold text-ink">{g.group}</div>
                  <div className="text-[11px] text-ink-3">{g.items.join(', ')}</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-ink-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-pill font-display text-base font-extrabold transition-all ${
          saved
            ? 'bg-accent-green text-white'
            : 'bg-ink text-white shadow-fab hover:shadow-card-lg hover:-translate-y-0.5 active:translate-y-0'
        }`}
      >
        {saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>
    </div>
  )
}
