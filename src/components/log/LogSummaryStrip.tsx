'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Award, CheckCircle2, Flame, Loader2 } from 'lucide-react'
import { finishWorkoutAction } from '@/lib/actions/today'

interface LogSummaryStripProps {
  totals: {
    completedSets: number
    totalReps: number
    totalVolumeKg: number
    prCount: number
  }
}

export function LogSummaryStrip({ totals }: LogSummaryStripProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleFinish = () => {
    startTransition(async () => {
      const res = await finishWorkoutAction()
      if (res.success) {
        setShowModal(false)
        router.push('/')
      }
    })
  }

  return (
    <>
      <div className="sticky bottom-16 md:bottom-6 z-20 mt-8 overflow-hidden rounded-[24px] border border-hairline bg-canvas/95 p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Running Totals Badges */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 divide-x divide-hairline">
            <div className="text-center">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
                Sets
              </span>
              <span className="font-heading text-lg sm:text-xl font-bold text-ink">
                {totals.completedSets}
              </span>
            </div>

            <div className="text-center pl-2 sm:pl-4">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
                Reps
              </span>
              <span className="font-heading text-lg sm:text-xl font-bold text-ink">
                {totals.totalReps}
              </span>
            </div>

            <div className="text-center pl-2 sm:pl-4">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
                Volume
              </span>
              <span className="font-heading text-lg sm:text-xl font-bold text-ink">
                {totals.totalVolumeKg} <span className="text-xs font-semibold text-secondary">kg</span>
              </span>
            </div>

            <div className="text-center pl-2 sm:pl-4">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
                PRs
              </span>
              <div className="flex items-center justify-center gap-1">
                {totals.prCount > 0 && (
                  <Award className="h-4 w-4 text-ink fill-mint" />
                )}
                <span className="font-heading text-lg sm:text-xl font-bold text-ink">
                  {totals.prCount}
                </span>
              </div>
            </div>
          </div>

          {/* Signature Accent Action: Mint Pill */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 rounded-full border border-black dark:border-mint/80 bg-mint px-6 py-3 font-sans text-sm font-bold text-black shadow-xs transition-all hover:brightness-105 active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
            <span>Finish workout</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[28px] border border-hairline bg-canvas p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mint text-black shadow-xs">
              <Flame className="h-7 w-7 stroke-[2.5]" />
            </div>

            <h3 className="font-heading text-2xl font-bold text-ink">
              Finish Workout?
            </h3>
            <p className="mt-1 text-xs text-secondary">
              This will wrap up today’s session and log your completed volume.
            </p>

            <div className="my-5 rounded-2xl border border-hairline bg-surface-soft p-4 text-left">
              <div className="flex justify-between py-1 text-xs">
                <span className="text-secondary">Completed Sets:</span>
                <span className="font-bold text-ink">{totals.completedSets}</span>
              </div>
              <div className="flex justify-between py-1 text-xs">
                <span className="text-secondary">Total Reps:</span>
                <span className="font-bold text-ink">{totals.totalReps}</span>
              </div>
              <div className="flex justify-between py-1 text-xs">
                <span className="text-secondary">Lifted Volume:</span>
                <span className="font-bold text-ink">{totals.totalVolumeKg} kg</span>
              </div>
              {totals.prCount > 0 && (
                <div className="flex justify-between py-1 text-xs border-t border-hairline mt-1 pt-1.5 font-bold text-ink">
                  <span>PRs Set:</span>
                  <span className="rounded bg-mint px-1.5 py-0.2 text-black">
                    {totals.prCount} PR
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleFinish}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-bold text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xs transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white dark:text-black" />
                    <span>Wrapping up…</span>
                  </>
                ) : (
                  <span>Yes, finish workout</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="w-full rounded-full border border-hairline py-2.5 text-xs font-semibold text-secondary hover:text-ink hover:bg-surface-soft active:scale-95"
              >
                Continue logging
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
