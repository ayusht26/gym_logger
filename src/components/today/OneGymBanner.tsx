'use client'

import { useTransition } from 'react'
import { switchSessionGymAction } from '@/lib/actions/today'
import { setGymPreference, type GymType } from '@/lib/actions/gym'
import { AlertCircle, ArrowRightLeft, Check, Loader2 } from 'lucide-react'

interface OneGymBannerProps {
  currentGym: GymType
  sessionGym: GymType
}

export function OneGymBanner({ currentGym, sessionGym }: OneGymBannerProps) {
  const [isPending, startTransition] = useTransition()

  const handleSwitchSession = () => {
    startTransition(async () => {
      await switchSessionGymAction(currentGym)
    })
  }

  const handleStayOnSession = () => {
    startTransition(async () => {
      await setGymPreference(sessionGym)
    })
  }

  const otherGymTitle = sessionGym === 'home' ? 'Home' : 'College'
  const currentGymTitle = currentGym === 'home' ? 'Home' : 'College'

  return (
    <div
      role="region"
      aria-label="Gym session notice"
      className="rounded-[20px] border border-amber-300 bg-amber-50/90 p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <AlertCircle className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-ink">
              You trained at {otherGymTitle} Gym today
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm font-medium text-secondary">
              Gym Logger enforces one gym session per day. You can switch today&apos;s workout to {currentGymTitle} or return to {otherGymTitle}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={handleStayOnSession}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-4 py-2 text-xs sm:text-sm font-semibold text-ink shadow-2xs hover:bg-surface-soft active:scale-95 transition-all cursor-pointer min-h-[38px]"
          >
            <Check className="h-4 w-4" />
            <span>Stay on {otherGymTitle}</span>
          </button>

          <button
            type="button"
            onClick={handleSwitchSession}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer min-h-[38px]"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <ArrowRightLeft className="h-4 w-4 text-mint" />
            )}
            <span>Switch today to {currentGymTitle}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
