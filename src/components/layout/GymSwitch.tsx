'use client'

import { useTransition } from 'react'
import { setGymPreference, type GymType } from '@/lib/actions/gym'
import clsx from 'clsx'
import { Home, GraduationCap } from 'lucide-react'

interface GymSwitchProps {
  currentGym: GymType
}

export function GymSwitch({ currentGym }: GymSwitchProps) {
  const [isPending, startTransition] = useTransition()

  const handleSelect = (gym: GymType) => {
    if (gym === currentGym || isPending) return
    startTransition(async () => {
      await setGymPreference(gym)
    })
  }

  return (
    <div
      role="radiogroup"
      aria-label="Active gym selection"
      className="inline-flex items-center rounded-full bg-surface-soft p-1 border border-hairline shadow-xs"
    >
      <button
        type="button"
        role="radio"
        aria-checked={currentGym === 'home'}
        onClick={() => handleSelect('home')}
        disabled={isPending}
        className={clsx(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[32px]',
          currentGym === 'home'
            ? 'bg-ink text-white shadow-xs'
            : 'text-secondary hover:text-ink hover:bg-white/60'
        )}
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={currentGym === 'college'}
        onClick={() => handleSelect('college')}
        disabled={isPending}
        className={clsx(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[32px]',
          currentGym === 'college'
            ? 'bg-ink text-white shadow-xs'
            : 'text-secondary hover:text-ink hover:bg-white/60'
        )}
      >
        <GraduationCap className="h-3.5 w-3.5" />
        <span>College</span>
      </button>
    </div>
  )
}
