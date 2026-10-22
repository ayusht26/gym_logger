import { describe, it, expect } from 'vitest'
import {
  getTodayIST,
  weekdayIST,
  formatDateDisplay,
  formatDateLong,
  formatRelativeDays,
} from './time'

describe('time.ts - IST Date and Routine calculations', () => {
  it('correctly calculates IST date across midnight boundary (00:30 IST case)', () => {
    // 2026-10-22T19:00:00.000Z in UTC
    // 19:00 + 5:30 = 00:30 on 2026-10-23 in IST
    const instant0030 = new Date('2026-10-22T19:00:00.000Z')
    expect(getTodayIST(instant0030)).toBe('2026-10-23')
  })

  it('correctly calculates IST date late at night (23:30 IST case)', () => {
    // 2026-10-22T18:00:00.000Z in UTC
    // 18:00 + 5:30 = 23:30 on 2026-10-22 in IST
    const instant2330 = new Date('2026-10-22T18:00:00.000Z')
    expect(getTodayIST(instant2330)).toBe('2026-10-22')
  })

  it('correctly handles exact boundary minutes: 23:59 IST vs 00:01 IST', () => {
    // 23:59 IST on Oct 22 is 18:29 UTC
    const instant2359 = new Date('2026-10-22T18:29:00.000Z')
    expect(getTodayIST(instant2359)).toBe('2026-10-22')

    // 00:01 IST on Oct 23 is 18:31 UTC
    const instant0001 = new Date('2026-10-22T18:31:00.000Z')
    expect(getTodayIST(instant0001)).toBe('2026-10-23')
  })

  it('derives accurate weekdays from YYYY-MM-DD strings via weekdayIST', () => {
    expect(weekdayIST('2026-10-18')).toBe(0) // Sunday
    expect(weekdayIST('2026-10-19')).toBe(1) // Monday
    expect(weekdayIST('2026-10-20')).toBe(2) // Tuesday
    expect(weekdayIST('2026-10-21')).toBe(3) // Wednesday
    expect(weekdayIST('2026-10-22')).toBe(4) // Thursday
    expect(weekdayIST('2026-10-23')).toBe(5) // Friday
    expect(weekdayIST('2026-10-24')).toBe(6) // Saturday
  })

  it('formats display dates correctly', () => {
    expect(formatDateDisplay('2026-10-22')).toBe('Thu, 22 Oct')
    expect(formatDateLong('2026-10-22')).toBe('Thursday, 22 October 2026')
  })

  it('formats relative calendar days accurately', () => {
    const today = '2026-10-22'
    expect(formatRelativeDays('2026-10-22', today)).toBe('Today')
    expect(formatRelativeDays('2026-10-21', today)).toBe('Yesterday')
    expect(formatRelativeDays('2026-10-19', today)).toBe('3 days ago')
    expect(formatRelativeDays('2026-10-15', today)).toBe('7 days ago')
  })
})
