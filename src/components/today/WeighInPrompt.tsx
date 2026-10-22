'use client'

import { useState, useSyncExternalStore } from 'react'
import { Scale, ArrowRight } from 'lucide-react'
import { AddWeightModal } from '@/components/body/AddWeightModal'

interface WeighInPromptProps {
  isDue: boolean
  isTrainingDay: boolean
  periodHalf: string
  todayStr: string
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function WeighInPrompt({
  isDue,
  isTrainingDay,
  periodHalf,
  todayStr,
}: WeighInPromptProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [localDismissed, setLocalDismissed] = useState(false)

  const isSnoozed = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(`gym_weighin_snoozed_${todayStr}`) === '1',
    () => true
  )

  if (!isDue || isSnoozed || localDismissed) {
    return null
  }

  const handleSnooze = () => {
    localStorage.setItem(`gym_weighin_snoozed_${todayStr}`, '1')
    setLocalDismissed(true)
  }

  return (
    <>
      <div
        className={`mb-6 overflow-hidden rounded-[24px] border transition-all ${
          isTrainingDay
            ? 'border-mint/60 bg-canvas-mint/80 p-4 sm:p-5 shadow-xs'
            : 'border-hairline bg-surface-soft p-4'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-black font-bold shadow-2xs">
              <Scale className="h-5 w-5 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm sm:text-base font-bold text-ink">
                  Body Weight Check-in Due
                </span>
                <span className="rounded-md bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase text-secondary border border-hairline/60">
                  Period {periodHalf}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-secondary">
                Log your body weight for this 15-day window to keep your progress charts accurate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSnooze}
              className="rounded-full px-3 py-2 text-xs font-semibold text-secondary hover:text-ink hover:bg-canvas/60 active:scale-95"
            >
              Not now
            </button>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xs transition-all hover:bg-neutral-800 active:scale-95"
            >
              <span>Log weight</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <AddWeightModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
