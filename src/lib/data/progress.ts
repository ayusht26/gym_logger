import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/time'
import { DEFAULT_EXERCISES, type GymType } from '@/lib/catalog'
import type { Database } from '@/types/database'

type SetRow = Database['public']['Tables']['sets']['Row']

export type ProgressMetric =
  | 'heaviest_weight'
  | 'one_rep_max'
  | 'best_volume'
  | 'most_reps'

export type ProgressRange = '1M' | '3M' | '6M' | '1Y' | 'ALL'

export interface ExerciseOption {
  id: string
  name: string
  slug: string
  canonical_slug: string
  gym: GymType
  muscle_group: string
  machine_model: string | null
}

export interface ProgressDataPoint {
  date: string // YYYY-MM-DD
  formattedDate: string
  value: number
  unit: string
  isPr: boolean
}

export interface RecordsBoard {
  heaviestWeight: { value: number; date: string | null; formattedDate: string }
  oneRepMax: { value: number; date: string | null; formattedDate: string }
  bestVolume: { value: number; date: string | null; formattedDate: string }
  mostReps: { value: number; date: string | null; formattedDate: string }
}

export interface WeeklyCardioPoint {
  weekLabel: string // e.g. "Week 42" or "12-18 Oct"
  totalMinutes: number
  avgSpeed: number
}

export interface CardioEntryItem {
  id: string
  date: string
  machine: string
  durationMin: number
  speedKmh: number
  inclinePct: number
  distanceKm: number
}

export interface ProgressPageData {
  todayStr: string
  exercises: ExerciseOption[]
  allSets: (SetRow & { session_date: string; gym: string })[]
  cardioWeekly: WeeklyCardioPoint[]
  cardioRecent: CardioEntryItem[]
  userAuthenticated: boolean
}

export async function getProgressPageData(): Promise<ProgressPageData> {
  const todayStr = getTodayIST()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Fallback options from catalog
    const fallbackOptions: ExerciseOption[] = DEFAULT_EXERCISES.map((e) => ({
      id: e.slug,
      name: e.name,
      slug: e.slug,
      canonical_slug: e.canonical_slug,
      gym: e.gym,
      muscle_group: e.muscle_group,
      machine_model: e.machine_model,
    }))

    return {
      todayStr,
      exercises: fallbackOptions,
      allSets: [],
      cardioWeekly: [],
      cardioRecent: [],
      userAuthenticated: false,
    }
  }

  // Fetch exercises, sets with sessions, and cardio logs concurrently (async-parallel)
  const [exercisesRes, setsRes, cardioRes] = await Promise.all([
    supabase
      .from('exercises')
      .select('id, name, slug, canonical_slug, gym, muscle_group, machine_model')
      .eq('user_id', user.id)
      .order('name', { ascending: true }),
    supabase
      .from('sets')
      .select('*, sessions!inner(session_date, gym)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('cardio_logs')
      .select('*, sessions!inner(session_date)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  let exercises: ExerciseOption[] = (exercisesRes.data || []).map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    canonical_slug: e.canonical_slug,
    gym: e.gym as GymType,
    muscle_group: e.muscle_group,
    machine_model: e.machine_model,
  }))

  if (exercises.length === 0) {
    exercises = DEFAULT_EXERCISES.map((e) => ({
      id: e.slug,
      name: e.name,
      slug: e.slug,
      canonical_slug: e.canonical_slug,
      gym: e.gym,
      muscle_group: e.muscle_group,
      machine_model: e.machine_model,
    }))
  }

  const allSets = (setsRes.data || []).map((s) => ({
    ...s,
    session_date: (s.sessions as unknown as { session_date: string }).session_date,
    gym: (s.sessions as unknown as { gym: string }).gym,
  }))

  const cardioEntries: CardioEntryItem[] = (cardioRes.data || []).map((c) => {
    const sessionDate = (c.sessions as unknown as { session_date: string }).session_date
    const dist = Math.round((c.duration_min * c.speed_kmh / 60) * 100) / 100
    return {
      id: c.id,
      date: sessionDate,
      machine: c.machine,
      durationMin: c.duration_min,
      speedKmh: c.speed_kmh,
      inclinePct: c.incline_pct,
      distanceKm: dist,
    }
  })

  // Group cardio by calendar week (last 8 weeks)
  const weeklyMap = new Map<string, { totalMin: number; totalSpeedWeight: number }>()

  for (const c of cardioEntries) {
    // Generate simple week key YYYY-WW
    const d = new Date(`${c.date}T12:00:00Z`)
    const month = d.getUTCMonth() + 1
    const day = d.getUTCDate()
    const weekKey = `${d.getUTCFullYear()}-${month < 10 ? '0' : ''}${month} D${Math.ceil(day / 7)}`

    const existing = weeklyMap.get(weekKey) || { totalMin: 0, totalSpeedWeight: 0 }
    existing.totalMin += c.durationMin
    existing.totalSpeedWeight += c.speedKmh * c.durationMin
    weeklyMap.set(weekKey, existing)
  }

  const cardioWeekly: WeeklyCardioPoint[] = Array.from(weeklyMap.entries())
    .map(([weekLabel, stats]) => ({
      weekLabel,
      totalMinutes: Math.round(stats.totalMin),
      avgSpeed: stats.totalMin > 0 ? Math.round((stats.totalSpeedWeight / stats.totalMin) * 10) / 10 : 0,
    }))
    .slice(-8)

  return {
    todayStr,
    exercises,
    allSets,
    cardioWeekly,
    cardioRecent: cardioEntries.slice(0, 15),
    userAuthenticated: true,
  }
}
