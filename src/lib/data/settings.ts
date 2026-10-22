import { createClient } from '@/lib/supabase/server'
import { getActiveGym } from '@/lib/actions/gym'
import type { Database } from '@/types/database'
import type { GymType } from '@/lib/catalog'

export type ExerciseRow = Database['public']['Tables']['exercises']['Row']

export interface SettingsPageData {
  userEmail: string
  activeGym: GymType
  homeExercises: ExerciseRow[]
  collegeExercises: ExerciseRow[]
  userAuthenticated: boolean
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const activeGym = await getActiveGym()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      userEmail: '',
      activeGym,
      homeExercises: [],
      collegeExercises: [],
      userAuthenticated: false,
    }
  }

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  const homeExercises: ExerciseRow[] = []
  const collegeExercises: ExerciseRow[] = []

  for (const ex of exercises || []) {
    if (ex.gym === 'home') {
      homeExercises.push(ex)
    } else {
      collegeExercises.push(ex)
    }
  }

  return {
    userEmail: user.email || '',
    activeGym,
    homeExercises,
    collegeExercises,
    userAuthenticated: true,
  }
}
