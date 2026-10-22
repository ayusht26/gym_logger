'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Deletes an entire session and all associated sets and cardio logs.
 */
export async function deleteSessionAction(sessionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // 1. Delete associated sets
  await supabase
    .from('sets')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', user.id)

  // 2. Delete associated cardio logs
  await supabase
    .from('cardio_logs')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', user.id)

  // 3. Delete session
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/history')
  revalidatePath('/progress')
  revalidatePath('/')
  return { success: true }
}

/**
 * Updates a set row from the session history detail view.
 */
export async function updateHistorySetAction(input: {
  setId: string
  sessionId: string
  weight: number
  reps: number
  isWarmup: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('sets')
    .update({
      weight: input.weight,
      reps: input.reps,
      is_warmup: input.isWarmup,
    })
    .eq('id', input.setId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/history/${input.sessionId}`)
  revalidatePath('/history')
  revalidatePath('/progress')
  return { success: true }
}

/**
 * Deletes a set from a historical session and re-sequences remaining sets.
 */
export async function deleteHistorySetAction(setId: string, sessionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Get exercise_id of target set first
  const { data: targetSet } = await supabase
    .from('sets')
    .select('exercise_id')
    .eq('id', setId)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('sets')
    .delete()
    .eq('id', setId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Re-sequence remaining sets for this exercise in this session
  if (targetSet?.exercise_id) {
    const { data: remaining } = await supabase
      .from('sets')
      .select('id, set_number')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .eq('exercise_id', targetSet.exercise_id)
      .order('set_number', { ascending: true })

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].set_number !== i + 1) {
          await supabase
            .from('sets')
            .update({ set_number: i + 1 })
            .eq('id', remaining[i].id)
        }
      }
    }
  }

  revalidatePath(`/history/${sessionId}`)
  revalidatePath('/history')
  revalidatePath('/progress')
  return { success: true }
}
