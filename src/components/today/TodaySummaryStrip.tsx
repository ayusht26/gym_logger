'use client'

import { useState, useTransition } from 'react'
import { finishWorkoutAction } from '@/lib/actions/today'
import { CheckCircle2, Clock, Dumbbell, Award, Flame, Loader2, X } from 'lucide-react'

interface TodaySummaryStripProps {
  summary: {
    setsCount: number
    volumeKg: number
    durationMin: number
    prsCount: number
  }
  isFinished?: boolean
}

export function TodaySummaryStrip({ summary, isFinished }: TodaySummaryStripProps) {
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleFinish = () => {
    startTransition(async () => {
      await finishWorkoutAction()
      setShowModal(false)
    })
  }

  return (
    <>
      <section
        aria-label="Today workout summary"
        className="rounded-[24px] border border-hairline bg-canvas p-4 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Stat metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            <div className="flex items-center gap-2.5 rounded-[16px] bg-surface-soft p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink shadow-2xs">
                <Dumbbell className="h-4 w-4 stroke-[2]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">Sets</p>
                <p className="font-display text-lg font-bold text-ink leading-none">{summary.setsCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-[16px] bg-surface-soft p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink shadow-2xs">
                <Flame className="h-4 w-4 stroke-[2] text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">Volume</p>
                <p className="font-display text-lg font-bold text-ink leading-none">{summary.volumeKg} kg</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-[16px] bg-surface-soft p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink shadow-2xs">
                <Clock className="h-4 w-4 stroke-[2] text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">Duration</p>
                <p className="font-display text-lg font-bold text-ink leading-none">{summary.durationMin} min</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-[16px] bg-surface-soft p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint/40 text-ink shadow-2xs">
                <Award className="h-4 w-4 stroke-[2]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">PRs</p>
                <p className="font-display text-lg font-bold text-ink leading-none">{summary.prsCount}</p>
              </div>
            </div>
          </div>

          {/* Signature Accent Action: The Mint Pill */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex w-full md:w-auto items-center justify-center gap-2 rounded-full border border-ink bg-mint px-6 py-3 text-sm sm:text-base font-semibold text-ink shadow-sm hover:bg-[#15f5a8] active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
              <span>{isFinished ? 'Workout finished' : 'Finish workout'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Finish Workout Summary Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="finish-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-[28px] border border-hairline bg-canvas p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-ink font-bold">
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                </div>
                <h3 id="finish-modal-title" className="font-display text-xl font-bold text-ink">
                  Finish Workout
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-surface-soft hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-6 space-y-3">
              <p className="text-sm font-medium text-secondary">
                Great session! Here is your workout summary for today:
              </p>

              <div className="rounded-[18px] bg-canvas-mint p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-secondary">Total Working Sets:</span>
                  <span className="font-bold text-ink">{summary.setsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-secondary">Total Lifted Volume:</span>
                  <span className="font-bold text-ink">{summary.volumeKg} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-secondary">Estimated Duration:</span>
                  <span className="font-bold text-ink">{summary.durationMin} minutes</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full border border-hairline bg-canvas px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-soft transition-colors cursor-pointer min-h-[40px]"
              >
                Keep training
              </button>

              <button
                type="button"
                onClick={handleFinish}
                disabled={isPending}
                className="flex items-center gap-2 rounded-full border border-ink bg-mint px-5 py-2.5 text-sm font-semibold text-ink shadow-xs hover:bg-[#15f5a8] transition-all cursor-pointer min-h-[40px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-ink" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Confirm & save session</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
