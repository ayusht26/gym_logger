'use client'

import { useTransition } from 'react'
import { History, Copy, Loader2 } from 'lucide-react'
import { copyPreviousSetsAction } from '@/lib/actions/log'
import type { PreviousSessionData, ExerciseDetail } from '@/lib/data/log'

interface PreviousSetsPanelProps {
  previousSession: PreviousSessionData | null
  exercise: ExerciseDetail
}

export function PreviousSetsPanel({
  previousSession,
  exercise,
}: PreviousSetsPanelProps) {
  const [isPending, startTransition] = useTransition()

  if (!previousSession || previousSession.sets.length === 0) {
    return (
      <div className="mb-6 rounded-[20px] border border-hairline bg-surface-soft/60 p-4 text-xs font-medium text-secondary flex items-center gap-2">
        <History className="h-4 w-4 shrink-0 text-muted" />
        <span>No previous session for this exercise. Today will establish your baseline.</span>
      </div>
    )
  }

  const handleCopySets = () => {
    startTransition(async () => {
      await copyPreviousSetsAction(exercise.id, exercise.gym)
    })
  }

  return (
    <div className="mb-6 overflow-hidden rounded-[20px] border border-hairline bg-surface-soft p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-ink" />
          <span className="text-xs font-bold text-ink">
            Previous: {previousSession.relativeDate}
          </span>
          <span className="text-xs text-secondary">
            ({previousSession.sets.length} {previousSession.sets.length === 1 ? 'set' : 'sets'})
          </span>
        </div>

        {/* Copy Sets Action */}
        <button
          type="button"
          onClick={handleCopySets}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{isPending ? 'Copying…' : 'Copy sets'}</span>
        </button>
      </div>

      {/* Compact set chips */}
      <div className="flex flex-wrap gap-2">
        {previousSession.sets.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-1.5 rounded-lg border border-hairline/80 bg-canvas px-2.5 py-1 text-xs font-medium text-ink shadow-2xs"
          >
            <span className="font-bold text-secondary text-[11px]">#{s.set_number}</span>
            <span>
              {s.weight} {s.weight_unit}
            </span>
            <span className="text-secondary">×</span>
            <span>{s.reps}</span>
            {s.is_warmup && (
              <span className="rounded bg-amber-100 px-1 py-0.2 text-[10px] font-bold uppercase text-amber-800">
                W
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
