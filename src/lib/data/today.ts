import { createClient } from '@/lib/supabase/server'
import { getTodayIST, formatRelativeDays } from '@/lib/time'
import {
  DEFAULT_EXERCISES,
  type CatalogExercise,
  type GymType,
  type EquipmentType,
  type WeightUnit,
} from '@/lib/catalog'
import type { MuscleGroup } from '@/lib/routine'
import type { Database } from '@/types/database'

type ExerciseRow = Database['public']['Tables']['exercises']['Row']
type SessionRow = Database['public']['Tables']['sessions']['Row']
type SetRow = Database['public']['Tables']['sets']['Row']
type CardioRow = Database['public']['Tables']['cardio_logs']['Row']

export interface TodayExerciseItem extends CatalogExercise {
  id: string
  loggedToday: boolean
  todaySetCount: number
  lastPerformanceSummary: string
}

export interface TodayPageData {
  todayStr: string
  activeGym: GymType
  session: SessionRow | null
  otherGymSession: GymType | null
  exercises: TodayExerciseItem[]
  cardioLogs: CardioRow[]
  summary: {
    setsCount: number
    volumeKg: number
    durationMin: number
    prsCount: number
  }
  userAuthenticated: boolean
}

export async function getTodayData(gym: GymType): Promise<TodayPageData> {
  const todayStr = getTodayIST()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Unauthenticated or dev preview: render fallback catalog
    const fallbackExercises = DEFAULT_EXERCISES.filter((e) => e.gym === gym).map(
      (ex, idx) => ({
        ...ex,
        id: `preview-${ex.slug}-${idx}`,
        loggedToday: false,
        todaySetCount: 0,
        lastPerformanceSummary: 'No sets yet',
      })
    )

    return {
      todayStr,
      activeGym: gym,
      session: null,
      otherGymSession: null,
      exercises: fallbackExercises,
      cardioLogs: [],
      summary: {
        setsCount: 0,
        volumeKg: 0,
        durationMin: 0,
        prsCount: 0,
      },
      userAuthenticated: false,
    }
  }

  // 1. Fetch today's session
  const { data: sessionData } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_date', todayStr)
    .maybeSingle()

  const session = sessionData as SessionRow | null
  const otherGymSession =
    session && (session.gym as GymType) !== gym ? (session.gym as GymType) : null

  // 2. Fetch exercises for this gym
  const { data: exercisesData } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .eq('gym', gym)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })

  const rawExercises = (exercisesData as ExerciseRow[] | null) ?? []

  // If user has not seeded exercises yet, use default catalog
  const exerciseList: CatalogExercise[] =
    rawExercises.length > 0
      ? rawExercises.map((r) => ({
          gym: r.gym as GymType,
          slug: r.slug,
          name: r.name,
          muscle_group: r.muscle_group as MuscleGroup,
          equipment: r.equipment as EquipmentType,
          machine_model: r.machine_model,
          default_input: (r.default_input as WeightUnit) || 'kg',
          kg_per_plate: r.kg_per_plate ? Number(r.kg_per_plate) : null,
          bar_kg: r.bar_kg ? Number(r.bar_kg) : null,
          image_path: r.image_path,
          source_url: r.source_url,
          canonical_slug: r.canonical_slug,
          sort_order: r.sort_order,
        }))
      : DEFAULT_EXERCISES.filter((e) => e.gym === gym)

  // 3. Fetch today's sets if a session exists
  let todaySets: SetRow[] = []
  let cardioLogs: CardioRow[] = []

  if (session) {
    const { data: setsData } = await supabase
      .from('sets')
      .select('*')
      .eq('session_id', session.id)

    todaySets = (setsData as SetRow[] | null) ?? []

    const { data: cardioData } = await supabase
      .from('cardio_logs')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })

    cardioLogs = (cardioData as CardioRow[] | null) ?? []
  }

  // 4. Fetch last performances for exercises (from previous sessions)
  const exerciseIds = rawExercises.map((e) => e.id)
  const latestSetsByExercise: Record<string, { count: number; weight: number; unit: string; reps: number; date: string }> = {}

  if (exerciseIds.length > 0) {
    // Query recent sets
    const { data: pastSetsData } = await supabase
      .from('sets')
      .select('exercise_id, weight, weight_unit, reps, created_at, session_id')
      .in('exercise_id', exerciseIds)
      .order('created_at', { ascending: false })
      .limit(100)

    if (pastSetsData) {
      for (const set of pastSetsData) {
        if (!latestSetsByExercise[set.exercise_id]) {
          latestSetsByExercise[set.exercise_id] = {
            count: 1,
            weight: Number(set.weight),
            unit: set.weight_unit,
            reps: set.reps,
            date: set.created_at.slice(0, 10),
          }
        }
      }
    }
  }

  // Combine exercises with today status and last performance
  const exercises: TodayExerciseItem[] = exerciseList.map((ex, idx) => {
    const dbRow = rawExercises.find((r) => r.slug === ex.slug)
    const exerciseId = dbRow?.id ?? `exercise-${ex.slug}-${idx}`
    const todaySetsForEx = todaySets.filter((s) => s.exercise_id === exerciseId)
    const pastPerf = dbRow ? latestSetsByExercise[dbRow.id] : undefined

    let lastPerformanceSummary = 'No sets yet'
    if (pastPerf) {
      const daysAgoText = formatRelativeDays(pastPerf.date, todayStr).toLowerCase()
      lastPerformanceSummary = `Last: ${pastPerf.weight} ${pastPerf.unit} × ${pastPerf.reps} · ${daysAgoText}`
    }

    return {
      ...ex,
      id: exerciseId,
      loggedToday: todaySetsForEx.length > 0,
      todaySetCount: todaySetsForEx.length,
      lastPerformanceSummary,
    }
  })

  // Calculate session summary stats
  const setsCount = todaySets.length
  let volumeKg = 0
  for (const s of todaySets) {
    if (!s.is_warmup) {
      volumeKg += Number(s.weight) * s.reps
    }
  }

  let durationMin = 0
  if (session?.started_at) {
    const end = session.ended_at ? new Date(session.ended_at) : new Date()
    const start = new Date(session.started_at)
    durationMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / (60 * 1000)))
  }

  return {
    todayStr,
    activeGym: gym,
    session,
    otherGymSession,
    exercises,
    cardioLogs,
    summary: {
      setsCount,
      volumeKg: Math.round(volumeKg * 10) / 10,
      durationMin,
      prsCount: 0, // PR engine connects in Phase 3
    },
    userAuthenticated: true,
  }
}
