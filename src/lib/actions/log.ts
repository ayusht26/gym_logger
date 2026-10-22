'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/time'
import { getRoutineForDate } from '@/lib/routine'
import type { GymType } from '@/lib/catalog'

export interface SaveSetInput {
  id?: string
  exerciseId: string
  gym: GymType
  setNumber: number
  weight: number
  weightUnit: 'kg' | 'plates'
  reps: number
  isWarmup: boolean
}

/**
 * Saves a set (insert or update). Lazily creates today's session if it does not exist yet.
 */
export async function saveSetAction(input: SaveSetInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const todayStr = getTodayIST()

  // 1. Ensure today's session exists (lazy session creation per CONTEXT.md §8.6)
  let sessionId: string

  const { data: existingSession } = await supabase
    .from('sessions')
    .select('id, gym')
    .eq('user_id', user.id)
    .eq('session_date', todayStr)
    .maybeSingle()

  if (existingSession) {
    sessionId = existingSession.id
  } else {
    const routine = getRoutineForDate(todayStr)
    const { data: newSession, error: sessionErr } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        session_date: todayStr,
        gym: input.gym,
        planned_split: routine.splitKey,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (sessionErr || !newSession) {
      return { success: false, error: sessionErr?.message || 'Failed to create session' }
    }
    sessionId = newSession.id
  }

  // 2. Insert or update the set
  if (input.id && !input.id.startsWith('temp-')) {
    const { data: updatedSet, error: updateErr } = await supabase
      .from('sets')
      .update({
        weight: input.weight,
        weight_unit: input.weightUnit,
        reps: input.reps,
        is_warmup: input.isWarmup,
        set_number: input.setNumber,
      })
      .eq('id', input.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    revalidatePath('/')
    revalidatePath(`/log/${input.exerciseId}`)
    return { success: true, set: updatedSet, sessionId }
  } else {
    const { data: newSet, error: insertErr } = await supabase
      .from('sets')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        exercise_id: input.exerciseId,
        set_number: input.setNumber,
        weight: input.weight,
        weight_unit: input.weightUnit,
        reps: input.reps,
        is_warmup: input.isWarmup,
      })
      .select()
      .single()

    if (insertErr) {
      return { success: false, error: insertErr.message }
    }

    revalidatePath('/')
    revalidatePath(`/log/${input.exerciseId}`)
    return { success: true, set: newSet, sessionId }
  }
}

/**
 * Deletes a set and re-sequences remaining sets for that exercise in this session.
 */
export async function deleteSetAction(setId: string, exerciseId: string, sessionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // 1. Delete target set
  const { error: delErr } = await supabase
    .from('sets')
    .delete()
    .eq('id', setId)
    .eq('user_id', user.id)

  if (delErr) {
    return { success: false, error: delErr.message }
  }

  // 2. Fetch remaining sets and re-sequence set numbers sequentially
  const { data: remainingSets } = await supabase
    .from('sets')
    .select('id, set_number')
    .eq('user_id', user.id)
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)
    .order('set_number', { ascending: true })

  if (remainingSets && remainingSets.length > 0) {
    for (let i = 0; i < remainingSets.length; i++) {
      const targetSeq = i + 1
      if (remainingSets[i].set_number !== targetSeq) {
        await supabase
          .from('sets')
          .update({ set_number: targetSeq })
          .eq('id', remainingSets[i].id)
      }
    }
  }

  revalidatePath('/')
  revalidatePath(`/log/${exerciseId}`)
  return { success: true }
}

/**
 * Copies previous session sets for this exercise into today's session.
 */
export async function copyPreviousSetsAction(exerciseId: string, gym: GymType) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const todayStr = getTodayIST()

  // 1. Ensure today's session exists
  let sessionId: string
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('session_date', todayStr)
    .maybeSingle()

  if (existingSession) {
    sessionId = existingSession.id
  } else {
    const routine = getRoutineForDate(todayStr)
    const { data: newSession, error: sErr } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        session_date: todayStr,
        gym: gym,
        planned_split: routine.splitKey,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (sErr || !newSession) {
      return { success: false, error: sErr?.message || 'Failed to create session' }
    }
    sessionId = newSession.id
  }

  // 2. Find most recent prior session's sets for this exercise
  const { data: priorSets } = await supabase
    .from('sets')
    .select('*, sessions!inner(session_date)')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .lt('sessions.session_date', todayStr)
    .order('created_at', { ascending: false })

  if (!priorSets || priorSets.length === 0) {
    return { success: false, error: 'No previous sets found to copy' }
  }

  // Find latest session date among prior sets
  const latestDate = (priorSets[0].sessions as unknown as { session_date: string }).session_date
  const setsToCopy = priorSets
    .filter((s) => (s.sessions as unknown as { session_date: string }).session_date === latestDate)
    .sort((a, b) => a.set_number - b.set_number)

  // 3. Count already logged sets today for this exercise to offset sequence numbers
  const { count: currentSetCount } = await supabase
    .from('sets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)

  const offset = currentSetCount || 0

  const rowsToInsert = setsToCopy.map((s, idx) => ({
    user_id: user.id,
    session_id: sessionId,
    exercise_id: exerciseId,
    set_number: offset + idx + 1,
    weight: s.weight,
    weight_unit: s.weight_unit,
    reps: s.reps,
    is_warmup: s.is_warmup,
  }))

  const { error: insertErr } = await supabase.from('sets').insert(rowsToInsert)

  if (insertErr) {
    return { success: false, error: insertErr.message }
  }

  revalidatePath('/')
  revalidatePath(`/log/${exerciseId}`)
  return { success: true, count: rowsToInsert.length }
}

/**
 * Updates an exercise's default weight unit ('kg' vs 'plates')
 * Remembers the choice per exercise in exercises.default_input.
 */
export async function updateExerciseDefaultUnitAction(
  exerciseId: string,
  defaultInput: 'kg' | 'plates'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('exercises')
    .update({ default_input: defaultInput })
    .eq('id', exerciseId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/log/${exerciseId}`)
  return { success: true }
}
