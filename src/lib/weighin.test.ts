import { describe, it, expect } from 'vitest'
import {
  getPeriodKey,
  getPeriodInfo,
  isWeighInDue,
  getDaysInMonth,
} from './weighin'

describe('weighin: getPeriodKey', () => {
  it('correctly classifies Day 1 as Period A', () => {
    expect(getPeriodKey('2026-10-01')).toBe('2026-10-A')
  })

  it('correctly classifies Day 15 as Period A (split boundary)', () => {
    expect(getPeriodKey('2026-10-15')).toBe('2026-10-A')
  })

  it('correctly classifies Day 16 as Period B (split boundary)', () => {
    expect(getPeriodKey('2026-10-16')).toBe('2026-10-B')
  })

  it('correctly classifies month end (e.g. 31 Oct) as Period B', () => {
    expect(getPeriodKey('2026-10-31')).toBe('2026-10-B')
  })

  it('correctly handles leap February (29 Feb 2024)', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29)
    expect(getPeriodKey('2024-02-01')).toBe('2024-02-A')
    expect(getPeriodKey('2024-02-15')).toBe('2024-02-A')
    expect(getPeriodKey('2024-02-16')).toBe('2024-02-B')
    expect(getPeriodKey('2024-02-29')).toBe('2024-02-B')
  })

  it('correctly handles non-leap February (28 Feb 2025)', () => {
    expect(getDaysInMonth(2025, 2)).toBe(28)
    expect(getPeriodKey('2025-02-28')).toBe('2025-02-B')
  })
})

describe('weighin: getPeriodInfo', () => {
  it('computes period bounds for 2026-10-A', () => {
    const info = getPeriodInfo('2026-10-A')
    expect(info.startDate).toBe('2026-10-01')
    expect(info.endDate).toBe('2026-10-15')
    expect(info.half).toBe('A')
  })

  it('computes period bounds for 2026-10-B (31 days)', () => {
    const info = getPeriodInfo('2026-10-B')
    expect(info.startDate).toBe('2026-10-16')
    expect(info.endDate).toBe('2026-10-31')
    expect(info.half).toBe('B')
  })

  it('computes period bounds for leap February 2024-02-B', () => {
    const info = getPeriodInfo('2024-02-B')
    expect(info.startDate).toBe('2024-02-16')
    expect(info.endDate).toBe('2024-02-29')
  })
})

describe('weighin: isWeighInDue', () => {
  it('is due when no weights are logged in current period', () => {
    const today = '2026-10-22' // Period B
    const loggedDates = ['2026-10-05'] // Only Period A
    expect(isWeighInDue(today, loggedDates)).toBe(true)
  })

  it('is NOT due when a weight is logged within the same period', () => {
    const today = '2026-10-22' // Period B
    const loggedDates = ['2026-10-02', '2026-10-18'] // 18 is in Period B
    expect(isWeighInDue(today, loggedDates)).toBe(false)
  })

  it('is due when loggedDates is empty', () => {
    expect(isWeighInDue('2026-10-01', [])).toBe(true)
  })

  it('is due on Day 16 when Day 15 was logged (transition to new period)', () => {
    expect(isWeighInDue('2026-10-16', ['2026-10-15'])).toBe(true)
  })
})
