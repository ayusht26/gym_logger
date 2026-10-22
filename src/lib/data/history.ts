import { createClient } from '@/lib/supabase/server'
import { formatDateDisplay, formatDateLong } from '@/lib/time'
import { getSplitDisplayName } from '@/lib/routine'
import type { Database } from '@/types/database'

type SessionRow = Database['public']['Tables']['sessions']['Row']
type SetRow = Database['public']['Tables']['sets']['Row']
type CardioRow = Database['public']['Tables']['cardio_logs']['Row']
type ExerciseRow = Database['public']['Tables']['exercises']['Row']

export interface SessionHistoryItem {
  id: string
  sessionDate: string
  formattedDate: string
  gym: 'home' | 'college'
  splitKey: string
  splitName: string
  startedAt: string
  endedAt: string | null
  durationMin: number
  totalSets: number
  totalVolumeKg: number
  exercisesCount: number
}

export interface MonthHistoryGroup {
  monthKey: string // YYYY-MM
  monthLabel: string // e.g. "October 2026"
  sessions: SessionHistoryItem[]
}

export interface HistoryPageData {
  monthGroups: MonthHistoryGroup[]
  totalSessions: number
  totalVolumeAllTime: number
  userAuthenticated: boolean
}

export async function getHistoryPageData(): Promise<HistoryPageData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      monthGroups: [],
      totalSessions: 0,
      totalVolumeAllTime: 0,
      userAuthenticated: false,
    }
  }

  // 1. Fetch sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })

  if (!sessions || sessions.length === 0) {
    return {
      monthGroups: [],
      totalSessions: 0,
      totalVolumeAllTime: 0,
      userAuthenticated: true,
    }
  }

  const sessionIds = sessions.map((s) => s.id)

  // 2. Fetch all sets for these sessions
  const { data: allSets } = await supabase
    .from('sets')
    .select('id, session_id, exercise_id, weight, reps, is_warmup')
    .in('session_id', sessionIds)

  // Map sets by session_id
  const setsBySession = new Map<string, typeof allSets>()
  for (const s of allSets || []) {
    const arr = setsBySession.get(s.session_id) || []
    arr.push(s)
    setsBySession.set(s.session_id, arr)
  }

  let totalVolumeAllTime = 0
  const historyItems: SessionHistoryItem[] = sessions.map((s) => {
    const sessionSets = setsBySession.get(s.id) || []
    let volumeKg = 0
    const exerciseIds = new Set<string>()

    for (const set of sessionSets) {
      exerciseIds.add(set.exercise_id)
      if (!set.is_warmup) {
        volumeKg += Number(set.weight) * set.reps
      }
    }

    totalVolumeAllTime += volumeKg

    let durationMin = 0
    if (s.started_at) {
      const end = s.ended_at ? new Date(s.ended_at) : new Date()
      const start = new Date(s.started_at)
      durationMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / (60 * 1000)))
    }

    return {
      id: s.id,
      sessionDate: s.session_date,
      formattedDate: formatDateDisplay(s.session_date),
      gym: s.gym as 'home' | 'college',
      splitKey: s.planned_split,
      splitName: getSplitDisplayName(s.planned_split),
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationMin,
      totalSets: sessionSets.length,
      totalVolumeKg: Math.round(volumeKg),
      exercisesCount: exerciseIds.size,
    }
  })

  // Group by month
  const monthMap = new Map<string, SessionHistoryItem[]>()
  for (const item of historyItems) {
    const monthKey = item.sessionDate.slice(0, 7) // YYYY-MM
    const arr = monthMap.get(monthKey) || []
    arr.push(item)
    monthMap.set(monthKey, arr)
  }

  const monthGroups: MonthHistoryGroup[] = Array.from(monthMap.entries()).map(
    ([monthKey, sessArr]) => {
      const date = new Date(`${monthKey}-01T12:00:00Z`)
      const monthLabel = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date)
      return {
        monthKey,
        monthLabel,
        sessions: sessArr,
      }
    }
  )

  return {
    monthGroups,
    totalSessions: sessions.length,
    totalVolumeAllTime: Math.round(totalVolumeAllTime),
    userAuthenticated: true,
  }
}

export interface SessionExerciseGroup {
  exercise: ExerciseRow
  sets: SetRow[]
  volumeKg: number
}

export interface SessionDetailData {
  session: SessionRow
  formattedDate: string
  formattedDateLong: string
  splitName: string
  durationMin: number
  totalVolumeKg: number
  totalSetsCount: number
  exerciseGroups: SessionExerciseGroup[]
  cardioLogs: CardioRow[]
  userAuthenticated: boolean
}

export async function getSessionDetailData(
  sessionId: string
): Promise<SessionDetailData | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Fetch session
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return null

  // Fetch sets with exercises and cardio logs concurrently (async-parallel)
  const [setsRes, cardioRes] = await Promise.all([
    supabase
      .from('sets')
      .select('*, exercises!inner(*)')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('set_number', { ascending: true }),
    supabase
      .from('cardio_logs')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  const sets = setsRes.data
  const cardioLogs = cardioRes.data

  // Group sets by exercise
  const exerciseMap = new Map<string, { exercise: ExerciseRow; sets: SetRow[]; volumeKg: number }>()

  let totalVolumeKg = 0
  for (const s of sets || []) {
    const ex = s.exercises as unknown as ExerciseRow
    const existing = exerciseMap.get(ex.id) || { exercise: ex, sets: [], volumeKg: 0 }
    existing.sets.push(s)
    if (!s.is_warmup) {
      const vol = Number(s.weight) * s.reps
      existing.volumeKg += vol
      totalVolumeKg += vol
    }
    exerciseMap.set(ex.id, existing)
  }

  let durationMin = 0
  if (session.started_at) {
    const end = session.ended_at ? new Date(session.ended_at) : new Date()
    const start = new Date(session.started_at)
    durationMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / (60 * 1000)))
  }

  return {
    session,
    formattedDate: formatDateDisplay(session.session_date),
    formattedDateLong: formatDateLong(session.session_date),
    splitName: getSplitDisplayName(session.planned_split),
    durationMin,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalSetsCount: sets?.length || 0,
    exerciseGroups: Array.from(exerciseMap.values()),
    cardioLogs: cardioLogs || [],
    userAuthenticated: true,
  }
}
