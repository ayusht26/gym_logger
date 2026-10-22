import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/time'
import { isWeighInDue, getPeriodKey, getPeriodInfo, type PeriodInfo } from '@/lib/weighin'
import type { Database } from '@/types/database'

export type BodyWeightRow = Database['public']['Tables']['body_weights']['Row']

export interface BodyWeightPageData {
  todayStr: string
  weightsChronological: BodyWeightRow[] // For charts (asc)
  weightsRecent: BodyWeightRow[] // For list (desc)
  latestWeight: BodyWeightRow | null
  previousWeight: BodyWeightRow | null
  weightDeltaKg: number | null
  isDue: boolean
  currentPeriod: PeriodInfo
  userAuthenticated: boolean
}

export async function getBodyWeightData(): Promise<BodyWeightPageData> {
  const todayStr = getTodayIST()
  const currentPeriodKey = getPeriodKey(todayStr)
  const currentPeriod = getPeriodInfo(currentPeriodKey)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      todayStr,
      weightsChronological: [],
      weightsRecent: [],
      latestWeight: null,
      previousWeight: null,
      weightDeltaKg: null,
      isDue: true,
      currentPeriod,
      userAuthenticated: false,
    }
  }

  const { data: rows } = await supabase
    .from('body_weights')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_on', { ascending: true })

  const weightsChronological = rows || []
  const weightsRecent = [...weightsChronological].reverse()

  const loggedDates = weightsChronological.map((w) => w.measured_on)
  const isDue = isWeighInDue(todayStr, loggedDates)

  const latestWeight = weightsRecent[0] || null
  const previousWeight = weightsRecent[1] || null
  const weightDeltaKg =
    latestWeight && previousWeight
      ? Math.round((latestWeight.weight_kg - previousWeight.weight_kg) * 10) / 10
      : null

  return {
    todayStr,
    weightsChronological,
    weightsRecent,
    latestWeight,
    previousWeight,
    weightDeltaKg,
    isDue,
    currentPeriod,
    userAuthenticated: true,
  }
}
