import { describe, it, expect } from 'vitest'
import { DEFAULT_EXERCISES } from './catalog'
import {
  filterExercises,
  getRoutineExercisesForDate,
  formatLastPerformance,
  calculateCardioDistance,
} from './today'

describe('today.ts - Routine exercise selection by weekday and gym', () => {
  it('correctly maps Monday (Back + Biceps) exercises for Home gym', () => {
    // 2026-10-19 is Monday
    const { routine, exercises } = getRoutineExercisesForDate(
      DEFAULT_EXERCISES,
      '2026-10-19',
      'home'
    )

    expect(routine.splitKey).toBe('back_biceps')
    expect(routine.muscleGroups).toEqual(['back', 'biceps'])

    // All returned exercises must be back or biceps in home gym
    expect(exercises.length).toBeGreaterThan(0)
    expect(exercises.every((ex) => ex.gym === 'home')).toBe(true)
    expect(
      exercises.every((ex) => ex.muscle_group === 'back' || ex.muscle_group === 'biceps')
    ).toBe(true)

    // Check specific known home exercises exist
    const slugs = exercises.map((e) => e.slug)
    expect(slugs).toContain('iso-lat-pulldown')
    expect(slugs).toContain('lat-pulldown')
    expect(slugs).toContain('back-row-machine')
    expect(slugs).toContain('t-bar-row')
    expect(slugs).toContain('hammer-curl')
    expect(slugs).toContain('preacher-curl-cable')
  })

  it('correctly maps Tuesday (Chest + Triceps) exercises for College gym', () => {
    // 2026-10-20 is Tuesday
    const { routine, exercises } = getRoutineExercisesForDate(
      DEFAULT_EXERCISES,
      '2026-10-20',
      'college'
    )

    expect(routine.splitKey).toBe('chest_triceps')
    expect(exercises.length).toBeGreaterThan(0)
    expect(exercises.every((ex) => ex.gym === 'college')).toBe(true)
    expect(
      exercises.every((ex) => ex.muscle_group === 'chest' || ex.muscle_group === 'triceps')
    ).toBe(true)

    const slugs = exercises.map((e) => e.slug)
    expect(slugs).toContain('flat-chest-press')
    expect(slugs).toContain('tricep-pushdown')
  })

  it('correctly maps Wednesday (Legs + Shoulders) exercises for Home gym including leg-curl', () => {
    // 2026-10-21 is Wednesday
    const { routine, exercises } = getRoutineExercisesForDate(
      DEFAULT_EXERCISES,
      '2026-10-21',
      'home'
    )

    expect(routine.splitKey).toBe('legs_shoulders')
    expect(routine.muscleGroups).toEqual(['legs', 'shoulders'])
    expect(exercises.length).toBeGreaterThan(0)

    const slugs = exercises.map((e) => e.slug)
    expect(slugs).toContain('leg-curl')
    expect(slugs).toContain('leg-extension')
    expect(slugs).toContain('leg-press')
    expect(slugs).toContain('shoulder-press-machine')

    const legCurl = exercises.find((e) => e.slug === 'leg-curl')
    expect(legCurl?.image_path).toBe('/machines/home/leg-extension-curl.webp')
  })

  it('correctly handles Sunday (Rest Day) by default and supports "Train anyway" override', () => {
    // 2026-10-18 is Sunday
    const sundayDefault = getRoutineExercisesForDate(
      DEFAULT_EXERCISES,
      '2026-10-18',
      'home'
    )
    expect(sundayDefault.routine.isRest).toBe(true)
    expect(sundayDefault.exercises).toHaveLength(0)

    // With manual override (e.g. user taps "Train anyway" and chooses Chest)
    const sundayOverride = getRoutineExercisesForDate(
      DEFAULT_EXERCISES,
      '2026-10-18',
      'home',
      ['chest']
    )
    expect(sundayOverride.exercises.length).toBeGreaterThan(0)
    expect(sundayOverride.exercises.every((ex) => ex.muscle_group === 'chest')).toBe(true)
  })

  it('filters exercises by search query across name and machine model', () => {
    const searchTBar = filterExercises(DEFAULT_EXERCISES, {
      gym: 'home',
      search: 't-bar',
    })
    expect(searchTBar).toHaveLength(1)
    expect(searchTBar[0].slug).toBe('t-bar-row')

    const searchMachineModel = filterExercises(DEFAULT_EXERCISES, {
      gym: 'home',
      search: 'E921',
    })
    expect(searchMachineModel).toHaveLength(1)
    expect(searchMachineModel[0].slug).toBe('back-row-machine')
  })

  it('formats last performance summaries cleanly', () => {
    expect(formatLastPerformance(null)).toBe('No sets yet')
    expect(
      formatLastPerformance({
        set_count: 3,
        weight: 45,
        weight_unit: 'kg',
        reps: 12,
        days_ago: 3,
      })
    ).toBe('Last: 3 sets · 45 kg × 12 · 3 days ago')

    expect(
      formatLastPerformance({
        set_count: 1,
        weight: 10,
        weight_unit: 'plates',
        reps: 8,
        days_ago: 1,
      })
    ).toBe('Last: 1 set · 10 plates × 8 · yesterday')
  })

  it('calculates cardio distance accurately', () => {
    expect(calculateCardioDistance(30, 6)).toBe(3)
    expect(calculateCardioDistance(45, 8)).toBe(6)
    expect(calculateCardioDistance(20, 6.5)).toBe(2.17)
  })
})
