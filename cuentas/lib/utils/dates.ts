export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getMonthName(date: Date): string {
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

export function frequencyLabel(freq: string, customDays?: number): string {
  switch (freq) {
    case 'weekly': return 'Semanal'
    case 'biweekly': return 'Quincenal'
    case 'monthly': return 'Mensual'
    case 'custom': return customDays ? `Cada ${customDays} días` : 'Personalizado'
    default: return freq
  }
}
