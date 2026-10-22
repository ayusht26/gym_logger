export const TIMEZONE_IST = 'Asia/Kolkata'

const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE_IST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Returns the current calendar date in Indian Standard Time (Asia/Kolkata) as YYYY-MM-DD.
 * If a Date instance is provided, converts that instant to its IST calendar date.
 */
export function getTodayIST(instant: Date = new Date()): string {
  // en-CA produces YYYY-MM-DD
  return istDateFormatter.format(instant)
}

/**
 * Derives the weekday (0 = Sunday, 1 = Monday, ... 6 = Saturday)
 * from a YYYY-MM-DD string anchored at 12:00 UTC so timezone shifts never alter it.
 */
export function weekdayIST(dateStr: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date string format for weekdayIST: "${dateStr}". Expected YYYY-MM-DD.`)
  }
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay()
}

/**
 * Formats a YYYY-MM-DD date string for UI display (e.g. "Mon, 22 Oct").
 */
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00Z`)
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date)
  const day = date.getUTCDate()
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(date)
  return `${weekday}, ${day} ${month}`
}

/**
 * Formats a YYYY-MM-DD date string in full long format (e.g. "Monday, 22 October 2026").
 */
export function formatDateLong(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00Z`)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/**
 * Returns human relative distance in calendar days between dateStr and todayStr in IST.
 * e.g. "Today", "Yesterday", "3 days ago".
 */
export function formatRelativeDays(dateStr: string, referenceToday?: string): string {
  const today = referenceToday ?? getTodayIST()
  if (dateStr === today) return 'Today'

  const t1 = new Date(`${dateStr}T12:00:00Z`).getTime()
  const t2 = new Date(`${today}T12:00:00Z`).getTime()
  const diffDays = Math.round((t2 - t1) / (24 * 60 * 60 * 1000))

  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 1) return `${diffDays} days ago`
  if (diffDays === -1) return 'Tomorrow'
  if (diffDays < -1) return `in ${Math.abs(diffDays)} days`

  return 'Today'
}
