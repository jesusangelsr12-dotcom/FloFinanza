/**
 * Billing cycle utilities for credit cards.
 *
 * A billing period for cut_day=15 runs from the 16th of the previous month
 * through the 15th of the current month. Transactions on or before the cut day
 * belong to that month's period; transactions after the cut day belong to the next.
 */

export interface BillingPeriod {
  start: string  // YYYY-MM-DD
  end: string    // YYYY-MM-DD
  label: string  // "16 Feb – 15 Mar"
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function clampDay(year: number, month: number, day: number): Date {
  const maxDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, maxDay))
}

function formatPeriodLabel(start: Date, end: Date): string {
  return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`
}

/**
 * Get the billing period that a given reference date falls into.
 * If referenceDate is on or before cut_day → period ends on cut_day of that month.
 * If referenceDate is after cut_day → period ends on cut_day of next month.
 */
export function getBillingPeriod(cutDay: number, referenceDate: Date = new Date()): BillingPeriod {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const day = referenceDate.getDate()

  let endDate: Date
  let startDate: Date

  if (day <= cutDay) {
    // We're in the period that ends this month on cut_day
    endDate = clampDay(year, month, cutDay)
    // Period started on cut_day+1 of previous month
    // Use Date arithmetic to correctly handle month boundaries
    const prevDate = new Date(year, month, 0) // last day of previous month
    const prevMonth = prevDate.getMonth()
    const prevYear = prevDate.getFullYear()
    const prevMaxDay = prevDate.getDate()
    const startDay = Math.min(cutDay + 1, prevMaxDay + 1)
    // If cutDay+1 exceeds prev month days, start on 1st of current month
    if (startDay > prevMaxDay) {
      startDate = new Date(year, month, 1)
    } else {
      startDate = new Date(prevYear, prevMonth, startDay)
    }
  } else {
    // We're past the cut_day, so we're in the period that ends next month
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    endDate = clampDay(nextYear, nextMonth, cutDay)
    startDate = clampDay(year, month, cutDay + 1)
  }

  return {
    start: toDateStr(startDate),
    end: toDateStr(endDate),
    label: formatPeriodLabel(startDate, endDate),
  }
}

/**
 * Get the next billing period after the given one.
 */
export function getNextPeriod(cutDay: number, currentStart: string): BillingPeriod {
  const start = new Date(currentStart + 'T12:00:00')
  // Move forward ~35 days to land solidly in the next period
  const ref = new Date(start.getTime() + 35 * 86400000)
  return getBillingPeriod(cutDay, ref)
}

/**
 * Get the previous billing period before the given one.
 */
export function getPrevPeriod(cutDay: number, currentStart: string): BillingPeriod {
  const start = new Date(currentStart + 'T12:00:00')
  // Move backward 1 day from current start to land in previous period
  const ref = new Date(start.getTime() - 86400000)
  return getBillingPeriod(cutDay, ref)
}
