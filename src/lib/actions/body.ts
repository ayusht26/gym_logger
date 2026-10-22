'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayIST } from '@/lib/time'

export interface AddWeightInput {
  measuredOn?: string // Defaults to todayIST()
  weightKg: number
  note?: string | null
}

export interface EditWeightInput {
  id: string
  weightKg: number
  note?: string | null
}

/**
 * Adds or updates a body weight entry for a specific calendar date (unique per user + measured_on).
 */
export async function addWeightAction(input: AddWeightInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  if (input.weightKg <= 0 || isNaN(input.weightKg)) {
    return { success: false, error: 'Weight must be greater than 0 kg' }
  }

  const measuredOn = input.measuredOn || getTodayIST()

  // Upsert on unique(user_id, measured_on)
  const { data, error } = await supabase
    .from('body_weights')
    .upsert(
      {
        user_id: user.id,
        measured_on: measuredOn,
        weight_kg: Math.round(input.weightKg * 10) / 10,
        note: input.note?.trim() || null,
      },
      { onConflict: 'user_id,measured_on' }
    )
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/body')
  revalidatePath('/')
  return { success: true, weight: data }
}

/**
 * Edits an existing body weight entry by ID.
 */
export async function editWeightAction(input: EditWeightInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  if (input.weightKg <= 0 || isNaN(input.weightKg)) {
    return { success: false, error: 'Weight must be greater than 0 kg' }
  }

  const { data, error } = await supabase
    .from('body_weights')
    .update({
      weight_kg: Math.round(input.weightKg * 10) / 10,
      note: input.note?.trim() || null,
    })
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/body')
  revalidatePath('/')
  return { success: true, weight: data }
}

/**
 * Deletes a body weight entry by ID.
 */
export async function deleteWeightAction(weightId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('body_weights')
    .delete()
    .eq('id', weightId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/body')
  revalidatePath('/')
  return { success: true }
}
