import { createClient } from '@/lib/supabase/server'
import { getTodayIST, formatRelativeDays } from '@/lib/time'
import { DEFAULT_EXERCISES, type GymType } from '@/lib/catalog'
import {
  evaluateSetPr,
  calculateSetVolume,
  type LoggedSetData,
  type SetPrResult,
} from '@/lib/prs'
import type { Database } from '@/types/database'

type ExerciseRow = Database['public']['Tables']['exercises']['Row']
type SessionRow = Database['public']['Tables']['sessions']['Row']
type SetRow = Database['public']['Tables']['sets']['Row']

export interface ExerciseDetail {
  id: string
  name: string
  slug: string
  equipment: string
  machine_model: string | null
  muscle_group: string
  default_input: 'kg' | 'plates'
  kg_per_plate: number | null
  bar_kg: number | null
  image_path: string | null
  gym: GymType
}

export interface EvaluatedSet extends SetRow {
  prResult: SetPrResult
  volume: number
}

export interface PreviousSessionData {
  sessionId: string
  sessionDate: string
  relativeDate: string
  sets: SetRow[]
}

export interface ExerciseLogData {
  exercise: ExerciseDetail
  todaySession: SessionRow | null
  todaySets: EvaluatedSet[]
  previousSession: PreviousSessionData | null
  hasHistoricalBaseline: boolean
  allTimeBests: {
    heaviestWeight: number
    oneRepMax: number
    bestVolume: number
    mostReps: number
  }
  totals: {
    completedSets: number
    totalReps: number
    totalVolumeKg: number
    prCount: number
  }
  userAuthenticated: boolean
}

export async function getExerciseLogData(exerciseId: string): Promise<ExerciseLogData | null> {
  const todayStr = getTodayIST()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let exerciseRow: ExerciseRow | null = null

  if (user) {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single()

    exerciseRow = data
  }

  // Fallback to DEFAULT_EXERCISES catalog if not found in DB
  if (!exerciseRow) {
    const fallback =
      DEFAULT_EXERCISES.find((e) => e.slug === exerciseId || `preview-${e.slug}` === exerciseId) ||
      DEFAULT_EXERCISES[0]

    if (!fallback) return null

    exerciseRow = {
      id: exerciseId,
      user_id: user?.id || 'anon',
      name: fallback.name,
      slug: fallback.slug,
      gym: fallback.gym,
      muscle_group: fallback.muscle_group,
      equipment: fallback.equipment,
      machine_model: fallback.machine_model || null,
      default_input: fallback.default_input,
      kg_per_plate: fallback.kg_per_plate,
      bar_kg: fallback.bar_kg,
      image_path: fallback.image_path || null,
      source_url: fallback.source_url || null,
      canonical_slug: fallback.slug,
      sort_order: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
    }
  }

  const exercise: ExerciseDetail = {
    id: exerciseRow.id,
    name: exerciseRow.name,
    slug: exerciseRow.slug,
    equipment: exerciseRow.equipment,
    machine_model: exerciseRow.machine_model,
    muscle_group: exerciseRow.muscle_group,
    default_input: (exerciseRow.default_input as 'kg' | 'plates') || 'kg',
    kg_per_plate: exerciseRow.kg_per_plate,
    bar_kg: exerciseRow.bar_kg,
    image_path: exerciseRow.image_path,
    gym: exerciseRow.gym as GymType,
  }

  const meta = {
    equipment: exercise.equipment,
    kgPerPlate: exercise.kg_per_plate,
    barKg: exercise.bar_kg,
  }

  if (!user) {
    return {
      exercise,
      todaySession: null,
      todaySets: [],
      previousSession: null,
      hasHistoricalBaseline: false,
      allTimeBests: { heaviestWeight: 0, oneRepMax: 0, bestVolume: 0, mostReps: 0 },
      totals: { completedSets: 0, totalReps: 0, totalVolumeKg: 0, prCount: 0 },
      userAuthenticated: false,
    }
  }

  // 1. Fetch today's session
  const { data: todaySession } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_date', todayStr)
    .maybeSingle()

  // 2. Fetch today's sets for this exercise
  let rawTodaySets: SetRow[] = []
  if (todaySession) {
    const { data: sets } = await supabase
      .from('sets')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', todaySession.id)
      .eq('exercise_id', exercise.id)
      .order('set_number', { ascending: true })

    if (sets) rawTodaySets = sets
  }

  // 3. Fetch prior sets for this exercise to evaluate PRs and find previous session
  const { data: allPriorSets } = await supabase
    .from('sets')
    .select('*, sessions!inner(session_date)')
    .eq('user_id', user.id)
    .eq('exercise_id', exercise.id)
    .lt('sessions.session_date', todayStr)
    .order('created_at', { ascending: true })

  const priorSetsList: LoggedSetData[] = (allPriorSets || []).map((s) => ({
    id: s.id,
    sessionId: s.session_id,
    exerciseId: s.exercise_id,
    setNumber: s.set_number,
    weight: s.weight,
    weightUnit: s.weight_unit as 'kg' | 'plates',
    reps: s.reps,
    isWarmup: s.is_warmup,
    createdAt: s.created_at,
  }))

  // Has at least one prior session with sets
  const hasHistoricalBaseline = priorSetsList.some((s) => !s.isWarmup)

  // Calculate all-time bests before today
  let heaviestWeight = 0
  let oneRepMax = 0
  let bestVolume = 0
  let mostReps = 0

  for (const p of priorSetsList) {
    if (p.isWarmup) continue
    const vol = calculateSetVolume(p, meta)
    const orm = p.reps === 1 ? p.weight : Math.round(p.weight * (1 + p.reps / 30) * 10) / 10
    if (p.weight > heaviestWeight) heaviestWeight = p.weight
    if (orm > oneRepMax) oneRepMax = orm
    if (vol > bestVolume) bestVolume = vol
    if (p.reps > mostReps) mostReps = p.reps
  }

  // 4. Find most recent previous session's sets
  let previousSession: PreviousSessionData | null = null
  if (allPriorSets && allPriorSets.length > 0) {
    // Group sets by session_date descending
    const dates = Array.from(
      new Set(allPriorSets.map((s) => (s.sessions as unknown as { session_date: string }).session_date))
    ).sort((a, b) => b.localeCompare(a))

    const lastDate = dates[0]
    if (lastDate) {
      const prevSets = allPriorSets.filter(
        (s) => (s.sessions as unknown as { session_date: string }).session_date === lastDate
      )
      previousSession = {
        sessionId: prevSets[0].session_id,
        sessionDate: lastDate,
        relativeDate: formatRelativeDays(lastDate),
        sets: prevSets,
      }
    }
  }

  // 5. Evaluate today's sets for PRs
  const todaySets: EvaluatedSet[] = []
  const workingSetsPriorToThisSet = [...priorSetsList]

  let prCount = 0
  let totalVolumeKg = 0
  let totalReps = 0
  let completedSets = 0

  for (const s of rawTodaySets) {
    const setData: LoggedSetData = {
      id: s.id,
      sessionId: s.session_id,
      exerciseId: s.exercise_id,
      setNumber: s.set_number,
      weight: s.weight,
      weightUnit: s.weight_unit as 'kg' | 'plates',
      reps: s.reps,
      isWarmup: s.is_warmup,
      createdAt: s.created_at,
    }

    const prResult = evaluateSetPr(
      setData,
      workingSetsPriorToThisSet,
      hasHistoricalBaseline,
      meta
    )

    if (prResult.isPr) {
      prCount++
    }

    const setVol = calculateSetVolume(setData, meta)

    if (!s.is_warmup) {
      workingSetsPriorToThisSet.push(setData)
      totalVolumeKg += setVol
      totalReps += s.reps
      completedSets++
    }

    todaySets.push({
      ...s,
      prResult,
      volume: setVol,
    })
  }

  return {
    exercise,
    todaySession: todaySession || null,
    todaySets,
    previousSession,
    hasHistoricalBaseline,
    allTimeBests: {
      heaviestWeight,
      oneRepMax,
      bestVolume,
      mostReps,
    },
    totals: {
      completedSets,
      totalReps,
      totalVolumeKg: Math.round(totalVolumeKg),
      prCount,
    },
    userAuthenticated: true,
  }
}
