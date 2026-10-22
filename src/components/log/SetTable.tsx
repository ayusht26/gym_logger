'use client'

import { useState, useTransition } from 'react'
import clsx from 'clsx'
import {
  Check,
  Plus,
  Trash2,
  Layers,
  Scale,
  Loader2,
} from 'lucide-react'
import {
  saveSetAction,
  deleteSetAction,
  updateExerciseDefaultUnitAction,
} from '@/lib/actions/log'
import { RestTimer } from './RestTimer'
import type { EvaluatedSet, ExerciseDetail, PreviousSessionData } from '@/lib/data/log'

interface SetTableProps {
  exercise: ExerciseDetail
  initialSets: EvaluatedSet[]
  previousSession: PreviousSessionData | null
  sessionId?: string | null
}

interface LocalSetRow {
  id?: string
  setNumber: number
  weight: number | ''
  weightUnit: 'kg' | 'plates'
  reps: number | ''
  isWarmup: boolean
  isSaved: boolean
  isPending?: boolean
  prResult?: EvaluatedSet['prResult']
}

export function SetTable({
  exercise,
  initialSets,
  previousSession,
  sessionId,
}: SetTableProps) {
  const [unit, setUnit] = useState<'kg' | 'plates'>(exercise.default_input)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId || null)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [timerKey, setTimerKey] = useState(0)

  // Map initial sets from server to local state
  const [rows, setRows] = useState<LocalSetRow[]>(() => {
    if (initialSets.length > 0) {
      return initialSets.map((s) => ({
        id: s.id,
        setNumber: s.set_number,
        weight: s.weight,
        weightUnit: s.weight_unit as 'kg' | 'plates',
        reps: s.reps,
        isWarmup: s.is_warmup,
        isSaved: true,
        prResult: s.prResult,
      }))
    }
    // Default initial row if no sets exist yet
    return [
      {
        setNumber: 1,
        weight: '',
        weightUnit: exercise.default_input,
        reps: '',
        isWarmup: false,
        isSaved: false,
      },
    ]
  })

  const [isPending, startTransition] = useTransition()

  // Handle unit toggle ('kg' vs 'plates')
  const handleToggleUnit = (newUnit: 'kg' | 'plates') => {
    if (newUnit === unit) return
    setUnit(newUnit)
    // Update local unsaved rows to match new preference
    setRows((prev) =>
      prev.map((r) => (!r.isSaved ? { ...r, weightUnit: newUnit } : r))
    )
    startTransition(async () => {
      await updateExerciseDefaultUnitAction(exercise.id, newUnit)
    })
  }

  // Update a field in a set row
  const updateRowField = <K extends keyof LocalSetRow>(
    index: number,
    field: K,
    value: LocalSetRow[K]
  ) => {
    setRows((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        [field]: value,
        isSaved: false, // Mark unsaved if inputs changed
      }
      return next
    })
  }

  // Save / Log a set
  const handleSaveSet = (index: number) => {
    const row = rows[index]
    const numWeight = typeof row.weight === 'number' ? row.weight : parseFloat(row.weight || '0')
    const numReps = typeof row.reps === 'number' ? row.reps : parseInt(row.reps || '0', 10)

    if (numWeight < 0 || numReps <= 0 || isNaN(numReps)) {
      return
    }

    // Set optimistic saving state
    setRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], isPending: true }
      return next
    })

    startTransition(async () => {
      const res = await saveSetAction({
        id: row.id,
        exerciseId: exercise.id,
        gym: exercise.gym,
        setNumber: row.setNumber,
        weight: numWeight,
        weightUnit: row.weightUnit,
        reps: numReps,
        isWarmup: row.isWarmup,
      })

      if (res.success && res.set) {
        if (res.sessionId && !activeSessionId) {
          setActiveSessionId(res.sessionId)
        }
        setRows((prev) => {
          const next = [...prev]
          next[index] = {
            ...next[index],
            id: res.set?.id,
            isSaved: true,
            isPending: false,
          }
          return next
        })
        // Trigger rest timer on completed working set
        setShowRestTimer(true)
        setTimerKey((k) => k + 1)
      } else {
        setRows((prev) => {
          const next = [...prev]
          next[index] = { ...next[index], isPending: false }
          return next
        })
      }
    })
  }

  // Add a new set row prefilled from previous row
  const handleAddSet = () => {
    const lastRow = rows[rows.length - 1]
    const nextSetNumber = rows.length + 1

    const newRow: LocalSetRow = {
      setNumber: nextSetNumber,
      weight: lastRow ? lastRow.weight : '',
      weightUnit: lastRow ? lastRow.weightUnit : unit,
      reps: lastRow ? lastRow.reps : '',
      isWarmup: false,
      isSaved: false,
    }

    setRows((prev) => [...prev, newRow])
  }

  // Delete a set
  const handleDeleteSet = (index: number) => {
    const row = rows[index]

    if (row.id && activeSessionId) {
      setRows((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], isPending: true }
        return next
      })

      startTransition(async () => {
        await deleteSetAction(row.id!, exercise.id, activeSessionId)
        setRows((prev) => {
          const filtered = prev.filter((_, i) => i !== index)
          // Re-sequence set numbers locally
          return filtered.map((r, i) => ({ ...r, setNumber: i + 1, isPending: false }))
        })
      })
    } else {
      // Unsaved local row
      setRows((prev) => {
        const filtered = prev.filter((_, i) => i !== index)
        if (filtered.length === 0) {
          return [
            {
              setNumber: 1,
              weight: '',
              weightUnit: unit,
              reps: '',
              isWarmup: false,
              isSaved: false,
            },
          ]
        }
        return filtered.map((r, i) => ({ ...r, setNumber: i + 1 }))
      })
    }
  }

  return (
    <div className="mb-8">
      {/* Table controls bar: Unit toggle */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-ink">Workout Sets</h2>

        {/* kg | plates segmented toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-secondary mr-1">Unit:</span>
          <div className="inline-flex rounded-full border border-hairline bg-surface-soft p-0.5">
            <button
              type="button"
              onClick={() => handleToggleUnit('kg')}
              className={clsx(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all',
                unit === 'kg'
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-secondary hover:text-ink'
              )}
            >
              <Scale className="h-3 w-3" />
              <span>kg</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleUnit('plates')}
              className={clsx(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all',
                unit === 'plates'
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-secondary hover:text-ink'
              )}
            >
              <Layers className="h-3 w-3" />
              <span>plates</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rest Timer display if active */}
      {showRestTimer && (
        <RestTimer key={timerKey} onDismiss={() => setShowRestTimer(false)} />
      )}

      {/* Set Rows Container */}
      <div className="overflow-hidden rounded-[20px] border border-hairline bg-canvas shadow-2xs">
        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_1.3fr_1fr_44px_44px_36px] sm:grid-cols-[48px_1.2fr_1.5fr_1.2fr_52px_52px_44px] items-center gap-1.5 sm:gap-2 border-b border-hairline bg-surface-soft/60 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
          <div className="text-center">Set</div>
          <div>Prev</div>
          <div>Weight ({unit})</div>
          <div>Reps</div>
          <div className="text-center" title="Warm-up set">W</div>
          <div className="text-center">Log</div>
          <div></div>
        </div>

        {/* Set List */}
        <div className="divide-y divide-hairline/70">
          {rows.map((row, index) => {
            // Find target from previous session for this set number
            const prevSet = previousSession?.sets.find(
              (p) => p.set_number === row.setNumber
            )

            const prResult = row.prResult
            const hasPr = prResult && prResult.isPr

            return (
              <div
                key={row.id || `row-${row.setNumber}`}
                className={clsx(
                  'grid grid-cols-[40px_1fr_1.3fr_1fr_44px_44px_36px] sm:grid-cols-[48px_1.2fr_1.5fr_1.2fr_52px_52px_44px] items-center gap-1.5 sm:gap-2 px-3 py-2.5 transition-colors',
                  row.isSaved ? 'bg-canvas' : 'bg-surface-soft/30',
                  row.isWarmup && 'bg-amber-50/40'
                )}
              >
                {/* Set Number & PR Medal Badge */}
                <div className="flex flex-col items-center justify-center">
                  <span
                    className={clsx(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      row.isWarmup
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-surface-soft text-ink'
                    )}
                  >
                    {row.setNumber}
                  </span>

                  {/* PR Medal Badge */}
                  {hasPr && (
                    <div
                      title={prResult.prLabels.join(' · ')}
                      className="mt-1 flex items-center justify-center rounded-full bg-mint px-1 py-0.2 text-[9px] font-black uppercase text-ink shadow-2xs cursor-help animate-pulse"
                    >
                      PR
                    </div>
                  )}
                </div>

                {/* Previous Target */}
                <div className="text-xs font-medium text-secondary truncate">
                  {prevSet ? (
                    <span className="truncate">
                      {prevSet.weight}
                      {prevSet.weight_unit === 'plates' ? 'p' : ''} × {prevSet.reps}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>

                {/* Weight Input */}
                <div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={row.weight}
                    onChange={(e) =>
                      updateRowField(
                        index,
                        'weight',
                        e.target.value === '' ? '' : parseFloat(e.target.value)
                      )
                    }
                    placeholder="0"
                    aria-label={`Set ${row.setNumber} weight in ${row.weightUnit}`}
                    className="w-full rounded-xl border border-hairline bg-canvas px-2.5 py-2 text-center text-base font-bold text-ink shadow-2xs focus:border-ink focus:outline-none focus:ring-2 focus:ring-mint transition-all"
                  />
                </div>

                {/* Reps Input */}
                <div>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="1"
                    value={row.reps}
                    onChange={(e) =>
                      updateRowField(
                        index,
                        'reps',
                        e.target.value === '' ? '' : parseInt(e.target.value, 10)
                      )
                    }
                    placeholder="0"
                    aria-label={`Set ${row.setNumber} repetitions`}
                    className="w-full rounded-xl border border-hairline bg-canvas px-2.5 py-2 text-center text-base font-bold text-ink shadow-2xs focus:border-ink focus:outline-none focus:ring-2 focus:ring-mint transition-all"
                  />
                </div>

                {/* Warm-up Checkbox Toggle */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => updateRowField(index, 'isWarmup', !row.isWarmup)}
                    className={clsx(
                      'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition-all active:scale-95',
                      row.isWarmup
                        ? 'border-amber-300 bg-amber-100 text-amber-900 shadow-xs'
                        : 'border-hairline bg-surface-soft text-muted hover:text-secondary'
                    )}
                    aria-label={`Set ${row.setNumber} warmup toggle`}
                  >
                    W
                  </button>
                </div>

                {/* Save / Checkmark Button */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleSaveSet(index)}
                    disabled={row.isPending}
                    className={clsx(
                      'flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-95',
                      row.isSaved
                        ? 'bg-mint text-ink font-bold shadow-xs'
                        : 'border border-hairline bg-surface-soft text-secondary hover:bg-ink hover:text-white',
                      row.isPending && 'opacity-60 cursor-wait'
                    )}
                    aria-label={row.isSaved ? 'Set completed' : 'Save set'}
                  >
                    {row.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check
                        className={clsx(
                          'h-4 w-4 stroke-[2.5]',
                          row.isSaved && 'stroke-[3]'
                        )}
                      />
                    )}
                  </button>
                </div>

                {/* Delete Set */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteSet(index)}
                    disabled={row.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-red-500 transition-colors"
                    aria-label={`Delete set ${row.setNumber}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Set Button */}
        <div className="border-t border-hairline bg-surface-soft/40 p-3">
          <button
            type="button"
            onClick={handleAddSet}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-canvas py-2.5 text-xs sm:text-sm font-bold text-ink hover:border-ink hover:bg-surface-soft transition-all active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span>Add set</span>
          </button>
        </div>
      </div>
    </div>
  )
}
