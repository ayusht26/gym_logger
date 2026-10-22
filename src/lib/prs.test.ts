import { describe, it, expect } from 'vitest'
import {
  calculateEpley1RM,
  calculateSetVolume,
  evaluateSetPr,
  type LoggedSetData,
} from './prs'

describe('prs: calculateEpley1RM', () => {
  it('returns weight when reps === 1', () => {
    expect(calculateEpley1RM(100, 1)).toBe(100)
  })

  it('calculates 1RM accurately for reps > 1', () => {
    // 100 * (1 + 10 / 30) = 133.33... -> 133.3
    expect(calculateEpley1RM(100, 10)).toBe(133.3)
    // 80 * (1 + 5 / 30) = 93.33... -> 93.3
    expect(calculateEpley1RM(80, 5)).toBe(93.3)
  })

  it('returns 0 for non-positive values', () => {
    expect(calculateEpley1RM(0, 5)).toBe(0)
    expect(calculateEpley1RM(100, 0)).toBe(0)
  })
})

describe('prs: calculateSetVolume', () => {
  it('calculates volume in kg', () => {
    const vol = calculateSetVolume({ weight: 50, weightUnit: 'kg', reps: 10 })
    expect(vol).toBe(500)
  })

  it('calculates volume in plates when convertible to kg', () => {
    const vol = calculateSetVolume(
      { weight: 4, weightUnit: 'plates', reps: 8 },
      { equipment: 'cable', kgPerPlate: 5 }
    )
    // 4 * 5 = 20kg -> 20 * 8 = 160
    expect(vol).toBe(160)
  })
})

describe('prs: evaluateSetPr', () => {
  const meta = { equipment: 'machine', kgPerPlate: 5 }

  const baselineSessionSets: LoggedSetData[] = [
    {
      sessionId: 'session-1',
      exerciseId: 'lat-pulldown',
      setNumber: 1,
      weight: 50,
      weightUnit: 'kg',
      reps: 10,
      isWarmup: false,
    },
    {
      sessionId: 'session-1',
      exerciseId: 'lat-pulldown',
      setNumber: 2,
      weight: 55,
      weightUnit: 'kg',
      reps: 8,
      isWarmup: false,
    },
  ]

  it('awards NO PRs on the first-ever session (baseline rule)', () => {
    const set: LoggedSetData = {
      sessionId: 'session-1',
      exerciseId: 'lat-pulldown',
      setNumber: 1,
      weight: 100,
      weightUnit: 'kg',
      reps: 10,
      isWarmup: false,
    }

    const result = evaluateSetPr(set, [], false, meta)
    expect(result.isPr).toBe(false)
    expect(result.prLabels).toHaveLength(0)
  })

  it('never awards PRs to warm-up sets', () => {
    const warmupSet: LoggedSetData = {
      sessionId: 'session-2',
      exerciseId: 'lat-pulldown',
      setNumber: 1,
      weight: 80, // heavier than baseline, but warmup!
      weightUnit: 'kg',
      reps: 12,
      isWarmup: true,
    }

    const result = evaluateSetPr(warmupSet, baselineSessionSets, true, meta)
    expect(result.isPr).toBe(false)
    expect(result.isHeaviestWeight).toBe(false)
  })

  it('does NOT award a PR on ties (strict inequality rule)', () => {
    // Prior best weight was 55kg (from set 2 in baseline)
    const tieSet: LoggedSetData = {
      sessionId: 'session-2',
      exerciseId: 'lat-pulldown',
      setNumber: 1,
      weight: 55, // Tie!
      weightUnit: 'kg',
      reps: 8, // Tie!
      isWarmup: false,
    }

    const result = evaluateSetPr(tieSet, baselineSessionSets, true, meta)
    expect(result.isHeaviestWeight).toBe(false)
    expect(result.isOneRepMax).toBe(false)
    expect(result.isBestVolume).toBe(false)
    expect(result.isMostReps).toBe(false)
    expect(result.isPr).toBe(false)
  })

  it('awards PRs when strictly beating prior records', () => {
    // Baseline bests:
    // Heaviest weight: 55kg
    // 1RM: 55 * (1 + 8/30) = 69.7kg
    // Best Volume: 50 * 10 = 500 (set 1) vs 55 * 8 = 440 (set 2) -> 500
    // Most Reps: 10 reps

    const recordBreaker: LoggedSetData = {
      sessionId: 'session-2',
      exerciseId: 'lat-pulldown',
      setNumber: 1,
      weight: 60, // > 55kg!
      weightUnit: 'kg',
      reps: 10, // 60 * (1 + 10/30) = 80kg > 69.7kg! Volume: 600 > 500!
      isWarmup: false,
    }

    const result = evaluateSetPr(recordBreaker, baselineSessionSets, true, meta)
    expect(result.isPr).toBe(true)
    expect(result.isHeaviestWeight).toBe(true)
    expect(result.isOneRepMax).toBe(true)
    expect(result.isBestVolume).toBe(true)
    // Most reps was 10, record breaker is 10 (tie -> false)
    expect(result.isMostReps).toBe(false)
    expect(result.prLabels).toContain('Weight PR')
    expect(result.prLabels).toContain('1RM PR')
    expect(result.prLabels).toContain('Volume PR')
  })

  it('awards Most Reps PR when beating highest reps', () => {
    const highRepSet: LoggedSetData = {
      sessionId: 'session-2',
      exerciseId: 'lat-pulldown',
      setNumber: 1,
      weight: 40,
      weightUnit: 'kg',
      reps: 15, // > 10 reps!
      isWarmup: false,
    }

    const result = evaluateSetPr(highRepSet, baselineSessionSets, true, meta)
    expect(result.isMostReps).toBe(true)
    expect(result.prLabels).toContain('Reps PR')
  })
})
