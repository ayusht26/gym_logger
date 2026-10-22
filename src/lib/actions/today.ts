'use server'

import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/time'
import { getRoutineForDate } from '@/lib/routine'
import { setGymPreference, type GymType } from './gym'
import { revalidatePath } from 'next/cache'

export interface ActionResponse {
  success: boolean
  error?: string
}

/**
 * Creates today's session if one does not exist yet for this user.
 * DB constraint: unique(user_id, session_date) enforces one session per day.
 */
export async function ensureTodaySession(gym: GymType) {
  const supabase = await createClient()
  const todayStr = getTodayIST()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Check if session already exists
  const { data: existing } = await supabase
    .from('sessions')
    .select('id, gym')
    .eq('user_id', user.id)
    .eq('session_date', todayStr)
    .maybeSingle()

  if (existing) {
    return existing
  }

  const routine = getRoutineForDate(todayStr)

  const { data: created, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      session_date: todayStr,
      gym,
      planned_split: routine.splitKey,
    })
    .select('id, gym')
    .single()

  if (error) {
    // If concurrent insert created it, fetch it
    const { data: fallback } = await supabase
      .from('sessions')
      .select('id, gym')
      .eq('user_id', user.id)
      .eq('session_date', todayStr)
      .single()

    if (fallback) return fallback
    throw error
  }

  return created
}

/**
 * Logs a cardio entry for today's session.
 */
export async function logCardioAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'You must be signed in to log cardio.' }

    const gym = (formData.get('gym')?.toString() as GymType) || 'home'
    const machine = formData.get('machine')?.toString().trim() || 'Treadmill'
    const durationMin = parseFloat(formData.get('duration_min')?.toString() || '0')
    const speedKmh = parseFloat(formData.get('speed_kmh')?.toString() || '0')
    const inclinePct = parseFloat(formData.get('incline_pct')?.toString() || '0')

    if (durationMin <= 0) {
      return { success: false, error: 'Duration must be greater than 0 minutes.' }
    }
    if (speedKmh < 0) {
      return { success: false, error: 'Speed cannot be negative.' }
    }
    if (inclinePct < 0) {
      return { success: false, error: 'Incline cannot be negative.' }
    }

    const session = await ensureTodaySession(gym)

    const { error } = await supabase.from('cardio_logs').insert({
      user_id: user.id,
      session_id: session.id,
      machine,
      duration_min: durationMin,
      speed_kmh: speedKmh,
      incline_pct: inclinePct,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return { success: false, error: message }
  }
}

/**
 * Deletes a cardio log entry.
 */
export async function deleteCardioAction(cardioId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
      .from('cardio_logs')
      .delete()
      .eq('id', cardioId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred'
    return { success: false, error: message }
  }
}

/**
 * Switches today's session gym (e.g. from Home to College).
 * Updates `sessions.gym` and sets the user's active gym cookie.
 */
export async function switchSessionGymAction(targetGym: GymType): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const todayStr = getTodayIST()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
      .from('sessions')
      .update({ gym: targetGym })
      .eq('user_id', user.id)
      .eq('session_date', todayStr)

    if (error) return { success: false, error: error.message }

    await setGymPreference(targetGym)
    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred'
    return { success: false, error: message }
  }
}

/**
 * Marks today's session finished with an ended_at timestamp.
 */
export async function finishWorkoutAction(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const todayStr = getTodayIST()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('session_date', todayStr)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred'
    return { success: false, error: message }
  }
}
