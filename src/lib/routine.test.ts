import { describe, it, expect } from 'vitest'
import {
  getRoutineForWeekday,
  getRoutineForDate,
  getSplitDisplayName,
  getMuscleGroupDisplayName,
} from './routine'

describe('routine.ts - Training split mappings by weekday', () => {
  it('maps each weekday to the exact split specified in CONTEXT.md', () => {
    // Sunday: rest
    const sun = getRoutineForWeekday(0)
    expect(sun.splitKey).toBe('rest')
    expect(sun.isRest).toBe(true)
    expect(sun.muscleGroups).toEqual([])

    // Monday: back_biceps
    const mon = getRoutineForWeekday(1)
    expect(mon.splitKey).toBe('back_biceps')
    expect(mon.splitName).toBe('Back + Biceps')
    expect(mon.isRest).toBe(false)
    expect(mon.muscleGroups).toEqual(['back', 'biceps'])

    // Tuesday: chest_triceps
    const tue = getRoutineForWeekday(2)
    expect(tue.splitKey).toBe('chest_triceps')
    expect(tue.splitName).toBe('Chest + Triceps')
    expect(tue.muscleGroups).toEqual(['chest', 'triceps'])

    // Wednesday: legs_shoulders
    const wed = getRoutineForWeekday(3)
    expect(wed.splitKey).toBe('legs_shoulders')
    expect(wed.splitName).toBe('Legs + Shoulders')
    expect(wed.muscleGroups).toEqual(['legs', 'shoulders'])

    // Thursday: back_biceps
    const thu = getRoutineForWeekday(4)
    expect(thu.splitKey).toBe('back_biceps')
    expect(thu.muscleGroups).toEqual(['back', 'biceps'])

    // Friday: chest_triceps
    const fri = getRoutineForWeekday(5)
    expect(fri.splitKey).toBe('chest_triceps')
    expect(fri.muscleGroups).toEqual(['chest', 'triceps'])

    // Saturday: legs_shoulders
    const sat = getRoutineForWeekday(6)
    expect(sat.splitKey).toBe('legs_shoulders')
    expect(sat.muscleGroups).toEqual(['legs', 'shoulders'])
  })

  it('determines the routine for calendar dates without timezone drift', () => {
    // 2026-10-18 was Sunday
    expect(getRoutineForDate('2026-10-18').splitKey).toBe('rest')

    // 2026-10-19 was Monday
    expect(getRoutineForDate('2026-10-19').splitKey).toBe('back_biceps')

    // 2026-10-20 was Tuesday
    expect(getRoutineForDate('2026-10-20').splitKey).toBe('chest_triceps')

    // 2026-10-21 was Wednesday
    expect(getRoutineForDate('2026-10-21').splitKey).toBe('legs_shoulders')

    // 2026-10-22 was Thursday
    expect(getRoutineForDate('2026-10-22').splitKey).toBe('back_biceps')

    // 2026-10-23 was Friday
    expect(getRoutineForDate('2026-10-23').splitKey).toBe('chest_triceps')

    // 2026-10-24 was Saturday
    expect(getRoutineForDate('2026-10-24').splitKey).toBe('legs_shoulders')
  })

  it('provides readable display names for splits and muscle groups', () => {
    expect(getSplitDisplayName('back_biceps')).toBe('Back + Biceps')
    expect(getSplitDisplayName('custom')).toBe('Custom Workout')
    expect(getMuscleGroupDisplayName('chest')).toBe('Chest')
    expect(getMuscleGroupDisplayName('triceps')).toBe('Triceps')
  })
})
