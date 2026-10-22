'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type GymType = 'home' | 'college'

export async function setGymPreference(gym: GymType) {
  const cookieStore = await cookies()
  cookieStore.set('gym', gym, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  revalidatePath('/', 'layout')
}

export async function getActiveGym(): Promise<GymType> {
  const cookieStore = await cookies()
  const val = cookieStore.get('gym')?.value
  return val === 'college' ? 'college' : 'home'
}
