/**
 * Twice-monthly weigh-in domain logic.
 * 
 * Rules (CONTEXT.md §8.4):
 * - Period A = day 1–15 (IST)
 * - Period B = day 16–end of month (IST)
 * - periodKey = YYYY-MM-A | YYYY-MM-B
 * - Weigh-in is due whenever there is no body_weights entry in the current period.
 * - Prompt card appears on Today whenever due (not just on 1st/16th) until logged or period rolls over.
 * - Constants live here so split points (1-15, 16-end) are easily configured.
 */

import { getTodayIST } from './time'

export const PERIOD_SPLIT_DAY = 15 // Day 1-15 is Period A; 16-end is Period B

export type PeriodHalf = 'A' | 'B'

export interface PeriodInfo {
  periodKey: string // e.g. "2026-10-B"
  year: number
  month: number
  half: PeriodHalf
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

/**
 * Parses YYYY-MM-DD into numeric year, month (1-indexed), and day.
 */
export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-')
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  }
}

/**
 * Returns the number of days in a given year and month (1-indexed).
 * Correctly accounts for leap years.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * Derives the period key ("YYYY-MM-A" or "YYYY-MM-B") for any IST date string.
 */
export function getPeriodKey(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr)
  const half: PeriodHalf = day <= PERIOD_SPLIT_DAY ? 'A' : 'B'
  const mm = month < 10 ? `0${month}` : `${month}`
  return `${year}-${mm}-${half}`
}

/**
 * Returns full PeriodInfo metadata including start and end date bounds for a period key.
 */
export function getPeriodInfo(periodKey: string): PeriodInfo {
  const parts = periodKey.split('-')
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const half = (parts[2] || 'A') as PeriodHalf

  const mm = month < 10 ? `0${month}` : `${month}`
  const daysInMonth = getDaysInMonth(year, month)

  const startDate = half === 'A' ? `${year}-${mm}-01` : `${year}-${mm}-${PERIOD_SPLIT_DAY + 1}`
  const endDate =
    half === 'A'
      ? `${year}-${mm}-${PERIOD_SPLIT_DAY < 10 ? '0' : ''}${PERIOD_SPLIT_DAY}`
      : `${year}-${mm}-${daysInMonth < 10 ? '0' : ''}${daysInMonth}`

  return {
    periodKey,
    year,
    month,
    half,
    startDate,
    endDate,
  }
}

/**
 * Determines whether a weigh-in is currently due.
 * 
 * @param currentDateStr Current IST date (defaults to todayIST()).
 * @param loggedDates Array of dates (YYYY-MM-DD) on which body weights have been logged.
 */
export function isWeighInDue(
  currentDateStr: string = getTodayIST(),
  loggedDates: string[] = []
): boolean {
  const currentPeriod = getPeriodKey(currentDateStr)
  const hasWeighedIn = loggedDates.some((date) => getPeriodKey(date) === currentPeriod)
  return !hasWeighedIn
}
