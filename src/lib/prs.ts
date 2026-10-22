/**
 * Pure functions for PR (Personal Record) calculation and Estimated 1RM (Epley formula).
 * 
 * Rules (CONTEXT.md §8.2, §8.3):
 * - Estimated 1RM: Epley formula: 1RM = weight * (1 + reps / 30).
 * - Warm-up sets (is_warmup = true) are excluded from all PR/volume/1RM calculations.
 * - 4 metrics:
 *   1. Heaviest Weight: max weight on any working set.
 *   2. One Rep Max: max estimated 1RM on any working set.
 *   3. Best Volume: max single-set (weight * reps) on any working set.
 *   4. Most Reps: most reps in a single working set.
 * - Strict inequality: A set is a PR if it is strictly greater than all prior working sets. Ties are NOT PRs.
 * - Baseline session rule: The first-ever session of an exercise establishes a baseline and shows NO PR badge.
 */

import { convertWeightToKg } from './units'

export interface LoggedSetData {
  id?: string
  sessionId: string
  exerciseId: string
  setNumber: number
  weight: number
  weightUnit: 'kg' | 'plates'
  reps: number
  isWarmup: boolean
  createdAt?: string
}

export interface ExerciseEquipmentMeta {
  equipment?: string | null
  kgPerPlate?: number | null
  barKg?: number | null
}

export interface PrMetricSummary {
  heaviestWeight: number
  oneRepMax: number
  bestVolume: number
  mostReps: number
}

export interface SetPrResult {
  isHeaviestWeight: boolean
  isOneRepMax: boolean
  isBestVolume: boolean
  isMostReps: boolean
  isPr: boolean
  prLabels: string[]
}

/**
 * Calculates estimated 1RM using Epley's formula: weight * (1 + reps / 30).
 * If reps === 1, returns weight.
 * If reps <= 0 or weight <= 0, returns 0.
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  const epley = weight * (1 + reps / 30)
  return Math.round(epley * 10) / 10
}

/**
 * Normalizes a set's weight to kg for comparison if possible.
 * If not convertible (null kg_per_plate), keeps the plate number.
 */
export function getComparableWeight(
  set: Pick<LoggedSetData, 'weight' | 'weightUnit'>,
  meta?: ExerciseEquipmentMeta
): number {
  if (set.weightUnit === 'kg') {
    return set.weight
  }
  const conv = convertWeightToKg({
    weight: set.weight,
    weightUnit: set.weightUnit,
    equipment: meta?.equipment,
    kgPerPlate: meta?.kgPerPlate,
    barKg: meta?.barKg,
  })
  return conv.weightKg !== null ? conv.weightKg : set.weight
}

/**
 * Computes single-set volume: comparable weight * reps.
 */
export function calculateSetVolume(
  set: Pick<LoggedSetData, 'weight' | 'weightUnit' | 'reps'>,
  meta?: ExerciseEquipmentMeta
): number {
  const compWeight = getComparableWeight(set, meta)
  return Math.round(compWeight * set.reps * 10) / 10
}

/**
 * Extracts PR metrics for a working set.
 */
export function getSetPrMetrics(
  set: LoggedSetData,
  meta?: ExerciseEquipmentMeta
): PrMetricSummary | null {
  if (set.isWarmup || set.weight <= 0 || set.reps <= 0) {
    return null
  }
  const weight = getComparableWeight(set, meta)
  return {
    heaviestWeight: weight,
    oneRepMax: calculateEpley1RM(weight, set.reps),
    bestVolume: Math.round(weight * set.reps * 10) / 10,
    mostReps: set.reps,
  }
}

/**
 * Evaluates whether a set is a PR relative to historical sets.
 * 
 * @param currentSet The set being evaluated.
 * @param priorWorkingSets Working sets logged in prior sessions (and earlier in current session).
 * @param hasHistoricalBaseline True if the exercise has at least one prior session.
 *                               If false (first-ever session), returns NO PR per CONTEXT.md §8.3.
 */
export function evaluateSetPr(
  currentSet: LoggedSetData,
  priorWorkingSets: LoggedSetData[],
  hasHistoricalBaseline: boolean,
  meta?: ExerciseEquipmentMeta
): SetPrResult {
  const emptyResult: SetPrResult = {
    isHeaviestWeight: false,
    isOneRepMax: false,
    isBestVolume: false,
    isMostReps: false,
    isPr: false,
    prLabels: [],
  }

  // Warm-ups never get PRs
  if (currentSet.isWarmup || currentSet.weight <= 0 || currentSet.reps <= 0) {
    return emptyResult
  }

  // Baseline rule: first-ever session of an exercise sets a baseline and shows NO PR badge
  if (!hasHistoricalBaseline) {
    return emptyResult
  }

  const currentMetrics = getSetPrMetrics(currentSet, meta)
  if (!currentMetrics) return emptyResult

  // Calculate prior all-time bests strictly before this set
  let bestWeight = 0
  let best1RM = 0
  let bestVolume = 0
  let bestReps = 0

  for (const prior of priorWorkingSets) {
    if (prior.isWarmup) continue
    const m = getSetPrMetrics(prior, meta)
    if (!m) continue
    if (m.heaviestWeight > bestWeight) bestWeight = m.heaviestWeight
    if (m.oneRepMax > best1RM) best1RM = m.oneRepMax
    if (m.bestVolume > bestVolume) bestVolume = m.bestVolume
    if (m.mostReps > bestReps) bestReps = m.mostReps
  }

  // Strict inequality: strictly greater than all prior working sets (ties are NOT PRs)
  const isHeaviestWeight = currentMetrics.heaviestWeight > bestWeight
  const isOneRepMax = currentMetrics.oneRepMax > best1RM
  const isBestVolume = currentMetrics.bestVolume > bestVolume
  const isMostReps = currentMetrics.mostReps > bestReps

  const prLabels: string[] = []
  if (isHeaviestWeight) prLabels.push('Weight PR')
  if (isOneRepMax) prLabels.push('1RM PR')
  if (isBestVolume) prLabels.push('Volume PR')
  if (isMostReps) prLabels.push('Reps PR')

  const isPr = prLabels.length > 0

  return {
    isHeaviestWeight,
    isOneRepMax,
    isBestVolume,
    isMostReps,
    isPr,
    prLabels,
  }
}
