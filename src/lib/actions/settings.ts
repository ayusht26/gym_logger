'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { setGymPreference } from '@/lib/actions/gym'
import type { GymType } from '@/lib/catalog'

export interface CreateExerciseInput {
  name: string
  gym: GymType
  muscleGroup: string
  equipment: string
  machineModel?: string | null
  defaultInput: 'kg' | 'plates'
  kgPerPlate?: number | null
  barKg?: number | null
}

export interface UpdateExerciseInput {
  id: string
  name: string
  machineModel?: string | null
  defaultInput: 'kg' | 'plates'
  kgPerPlate?: number | null
  barKg?: number | null
  isArchived?: boolean
}

/**
 * Creates a custom exercise in the user's catalog.
 */
export async function addCustomExerciseAction(input: CreateExerciseInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      canonical_slug: slug,
      gym: input.gym,
      muscle_group: input.muscleGroup,
      equipment: input.equipment,
      machine_model: input.machineModel?.trim() || null,
      default_input: input.defaultInput,
      kg_per_plate: input.kgPerPlate || null,
      bar_kg: input.barKg || null,
      sort_order: 100,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/')
  return { success: true, exercise: data }
}

/**
 * Updates exercise configuration (name, machine model, plate weight, bar weight, archive state).
 */
export async function updateExerciseSettingsAction(input: UpdateExerciseInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const { data, error } = await supabase
    .from('exercises')
    .update({
      name: input.name.trim(),
      machine_model: input.machineModel?.trim() || null,
      default_input: input.defaultInput,
      kg_per_plate: input.kgPerPlate || null,
      bar_kg: input.barKg || null,
      ...(input.isArchived !== undefined ? { is_archived: input.isArchived } : {}),
    })
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/')
  return { success: true, exercise: data }
}

/**
 * Toggles an exercise between archived and active.
 */
export async function toggleArchiveExerciseAction(exerciseId: string, isArchived: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  const { error } = await supabase
    .from('exercises')
    .update({ is_archived: isArchived })
    .eq('id', exerciseId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/')
  return { success: true }
}

/**
 * Sets user's default gym preference.
 */
export async function setDefaultGymAction(gym: GymType) {
  await setGymPreference(gym)
  revalidatePath('/settings')
  revalidatePath('/')
  return { success: true }
}
