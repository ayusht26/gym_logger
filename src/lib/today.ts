import type { CatalogExercise, GymType } from './catalog'
import { getRoutineForDate, type MuscleGroup, type RoutineDay } from './routine'

export interface ExerciseFilterOptions {
  gym: GymType
  muscleGroups?: MuscleGroup[]
  search?: string
  includeAllOnRest?: boolean
}

export interface LastPerformance {
  set_count: number
  weight: number
  weight_unit: string
  reps: number
  date_str?: string
  days_ago?: number
}

/**
 * Filters a list of exercises by gym, optional muscle groups, and search query.
 */
export function filterExercises(
  exercises: CatalogExercise[],
  options: ExerciseFilterOptions
): CatalogExercise[] {
  const { gym, muscleGroups, search } = options
  const q = search?.trim().toLowerCase()

  return exercises
    .filter((ex) => ex.gym === gym)
    .filter((ex) => {
      if (!muscleGroups || muscleGroups.length === 0) return true
      return muscleGroups.includes(ex.muscle_group)
    })
    .filter((ex) => {
      if (!q) return true
      const nameMatch = ex.name.toLowerCase().includes(q)
      const machineMatch = ex.machine_model ? ex.machine_model.toLowerCase().includes(q) : false
      const muscleMatch = ex.muscle_group.toLowerCase().includes(q)
      return nameMatch || machineMatch || muscleMatch
    })
    .sort((a, b) => a.sort_order - b.sort_order)
}

/**
 * Returns the planned routine and matching exercises for a specific IST date and gym.
 */
export function getRoutineExercisesForDate(
  exercises: CatalogExercise[],
  dateStr: string,
  gym: GymType,
  overrideMuscleGroups?: MuscleGroup[]
): {
  routine: RoutineDay
  exercises: CatalogExercise[]
} {
  const routine = getRoutineForDate(dateStr)
  const targetGroups = overrideMuscleGroups ?? routine.muscleGroups

  if (routine.isRest && (!overrideMuscleGroups || overrideMuscleGroups.length === 0)) {
    return {
      routine,
      exercises: [],
    }
  }

  const filtered = filterExercises(exercises, {
    gym,
    muscleGroups: targetGroups,
  })

  return {
    routine,
    exercises: filtered,
  }
}

/**
 * Formats the "Last: 3 sets · 45 kg × 12 · 3 days ago" summary badge.
 */
export function formatLastPerformance(perf?: LastPerformance | null): string {
  if (!perf || perf.set_count === 0) {
    return 'No sets yet'
  }

  const setsText = `${perf.set_count} ${perf.set_count === 1 ? 'set' : 'sets'}`
  const weightText = `${perf.weight} ${perf.weight_unit} × ${perf.reps}`
  
  let timeAgo = ''
  if (perf.days_ago !== undefined) {
    if (perf.days_ago === 0) timeAgo = 'today'
    else if (perf.days_ago === 1) timeAgo = 'yesterday'
    else timeAgo = `${perf.days_ago} days ago`
  }

  return timeAgo
    ? `Last: ${setsText} · ${weightText} · ${timeAgo}`
    : `Last: ${setsText} · ${weightText}`
}

/**
 * Computes derived distance in kilometers from duration in minutes and speed in km/h.
 */
export function calculateCardioDistance(durationMin: number, speedKmh: number): number {
  if (durationMin <= 0 || speedKmh <= 0) return 0
  return Math.round((durationMin * speedKmh / 60) * 100) / 100
}
