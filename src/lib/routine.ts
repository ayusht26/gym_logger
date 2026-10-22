import { weekdayIST } from './time'

export type MuscleGroup = 'back' | 'biceps' | 'chest' | 'triceps' | 'legs' | 'shoulders'
export type PlannedSplit = 'back_biceps' | 'chest_triceps' | 'legs_shoulders' | 'rest' | 'custom'

export interface RoutineDay {
  weekday: number // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  weekdayName: string
  splitKey: PlannedSplit
  splitName: string
  muscleGroups: MuscleGroup[]
  isRest: boolean
}

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'back',
  'biceps',
  'chest',
  'triceps',
  'legs',
  'shoulders',
]

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  back: 'Back',
  biceps: 'Biceps',
  chest: 'Chest',
  triceps: 'Triceps',
  legs: 'Legs',
  shoulders: 'Shoulders',
}

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const WEEKDAY_ROUTINES: Record<number, { splitKey: PlannedSplit; splitName: string; muscleGroups: MuscleGroup[] }> = {
  0: { splitKey: 'rest', splitName: 'Rest Day', muscleGroups: [] },
  1: { splitKey: 'back_biceps', splitName: 'Back + Biceps', muscleGroups: ['back', 'biceps'] },
  2: { splitKey: 'chest_triceps', splitName: 'Chest + Triceps', muscleGroups: ['chest', 'triceps'] },
  3: { splitKey: 'legs_shoulders', splitName: 'Legs + Shoulders', muscleGroups: ['legs', 'shoulders'] },
  4: { splitKey: 'back_biceps', splitName: 'Back + Biceps', muscleGroups: ['back', 'biceps'] },
  5: { splitKey: 'chest_triceps', splitName: 'Chest + Triceps', muscleGroups: ['chest', 'triceps'] },
  6: { splitKey: 'legs_shoulders', splitName: 'Legs + Shoulders', muscleGroups: ['legs', 'shoulders'] },
}

export function getRoutineForWeekday(dayIndex: number): RoutineDay {
  const normDay = ((dayIndex % 7) + 7) % 7
  const routine = WEEKDAY_ROUTINES[normDay]
  return {
    weekday: normDay,
    weekdayName: WEEKDAY_NAMES[normDay],
    splitKey: routine.splitKey,
    splitName: routine.splitName,
    muscleGroups: routine.muscleGroups,
    isRest: routine.splitKey === 'rest',
  }
}

/**
 * Returns the planned routine for any given IST date string (YYYY-MM-DD).
 */
export function getRoutineForDate(dateStr: string): RoutineDay {
  const dayIndex = weekdayIST(dateStr)
  return getRoutineForWeekday(dayIndex)
}

export function getSplitDisplayName(splitKey: string): string {
  switch (splitKey) {
    case 'back_biceps':
      return 'Back + Biceps'
    case 'chest_triceps':
      return 'Chest + Triceps'
    case 'legs_shoulders':
      return 'Legs + Shoulders'
    case 'rest':
      return 'Rest Day'
    case 'custom':
      return 'Custom Workout'
    default:
      return splitKey
  }
}

export function getMuscleGroupDisplayName(group: MuscleGroup): string {
  return MUSCLE_GROUP_LABELS[group] ?? group
}
