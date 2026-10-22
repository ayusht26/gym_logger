'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  Trash2,
} from 'lucide-react'
import {
  deleteSessionAction,
  updateHistorySetAction,
  deleteHistorySetAction,
} from '@/lib/actions/history'
import { deleteCardioAction } from '@/lib/actions/today'
import type { SessionDetailData, SessionExerciseGroup } from '@/lib/data/history'
import type { Database } from '@/types/database'

type SetRow = Database['public']['Tables']['sets']['Row']

interface SessionDetailViewProps {
  data: SessionDetailData
}

export function SessionDetailView({ data }: SessionDetailViewProps) {
  const router = useRouter()
  const { session, exerciseGroups, cardioLogs } = data

  const [groups, setGroups] = useState<SessionExerciseGroup[]>(exerciseGroups)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState<number>(0)
  const [editReps, setEditReps] = useState<number>(0)
  const [editWarmup, setEditWarmup] = useState<boolean>(false)

  const [isPending, startTransition] = useTransition()
  const [isDeletingSession, setIsDeletingSession] = useState(false)

  const handleDeleteSession = () => {
    if (!confirm('Are you sure you want to delete this entire workout session?')) return
    setIsDeletingSession(true)
    startTransition(async () => {
      const res = await deleteSessionAction(session.id)
      if (res.success) {
        router.push('/history')
      } else {
        setIsDeletingSession(false)
      }
    })
  }

  const startEditSet = (s: SetRow) => {
    setEditingSetId(s.id)
    setEditWeight(s.weight)
    setEditReps(s.reps)
    setEditWarmup(s.is_warmup)
  }

  const handleSaveSet = (setId: string) => {
    startTransition(async () => {
      await updateHistorySetAction({
        setId,
        sessionId: session.id,
        weight: editWeight,
        reps: editReps,
        isWarmup: editWarmup,
      })

      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          sets: g.sets.map((s) =>
            s.id === setId
              ? { ...s, weight: editWeight, reps: editReps, is_warmup: editWarmup }
              : s
          ),
        }))
      )
      setEditingSetId(null)
    })
  }

  const handleDeleteSet = (setId: string) => {
    if (!confirm('Delete this set?')) return
    startTransition(async () => {
      await deleteHistorySetAction(setId, session.id)
      setGroups((prev) =>
        prev
          .map((g) => ({
            ...g,
            sets: g.sets.filter((s) => s.id !== setId),
          }))
          .filter((g) => g.sets.length > 0)
      )
    })
  }

  const handleDeleteCardio = (cardioId: string) => {
    if (!confirm('Delete this cardio entry?')) return
    startTransition(async () => {
      await deleteCardioAction(cardioId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Delete Session Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-soft px-3.5 py-1.5 text-xs font-semibold text-secondary hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to History</span>
        </Link>

        <button
          type="button"
          onClick={handleDeleteSession}
          disabled={isDeletingSession}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {isDeletingSession ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          <span>Delete session</span>
        </button>
      </div>

      {/* Session Hero Banner */}
      <div className="overflow-hidden rounded-[28px] border border-hairline bg-canvas p-6 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
            <Calendar className="h-3.5 w-3.5 text-ink" />
            <span>{data.formattedDateLong}</span>
          </div>
          <span className="text-muted">·</span>
          <span className="rounded-full bg-canvas-mint px-2.5 py-0.5 text-[10px] font-bold uppercase text-ink border border-mint/40">
            {session.gym === 'home' ? 'Home Gym' : 'College Gym'}
          </span>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          {data.splitName}
        </h1>

        <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold border-t border-hairline/80 pt-4">
          <div className="flex items-center gap-1.5 text-ink">
            <Dumbbell className="h-4 w-4 text-secondary" />
            <span>{data.totalSetsCount} working sets</span>
          </div>
          <div className="flex items-center gap-1.5 text-ink">
            <Flame className="h-4 w-4 text-ink fill-mint" />
            <span>{data.totalVolumeKg} kg volume</span>
          </div>
          {data.durationMin > 0 && (
            <div className="flex items-center gap-1.5 text-secondary">
              <Clock className="h-4 w-4 text-muted" />
              <span>{data.durationMin} minutes</span>
            </div>
          )}
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-ink px-1">
          Exercises ({groups.length})
        </h2>

        {groups.map((group) => (
          <div
            key={group.exercise.id}
            className="overflow-hidden rounded-[24px] border border-hairline bg-canvas p-4 sm:p-5 shadow-2xs space-y-3"
          >
            {/* Exercise Header */}
            <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-ink">
                  {group.exercise.name}
                </h3>
                <p className="text-xs text-secondary">
                  {group.exercise.machine_model || group.exercise.equipment.replace('_', ' ')}
                  {' · '}
                  <span className="font-semibold text-ink">{group.volumeKg} kg volume</span>
                </p>
              </div>

              <span className="rounded-md bg-surface-soft px-2 py-0.5 text-[10px] font-bold uppercase text-secondary">
                {group.exercise.muscle_group}
              </span>
            </div>

            {/* Set Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-hairline text-[11px] font-bold uppercase text-secondary">
                    <th className="pb-2 w-12 text-center">Set</th>
                    <th className="pb-2">Weight</th>
                    <th className="pb-2">Reps</th>
                    <th className="pb-2 text-center">Warmup</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {group.sets.map((set) => {
                    const isEditing = editingSetId === set.id

                    return (
                      <tr key={set.id} className="hover:bg-surface-soft/30 transition-colors">
                        <td className="py-2.5 text-center font-bold text-secondary">
                          {set.set_number}
                        </td>

                        <td className="py-2.5 font-bold text-ink">
                          {isEditing ? (
                            <input
                              type="number"
                              inputMode="decimal"
                              step="any"
                              value={editWeight}
                              onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                              className="w-20 rounded-lg border border-hairline px-2 py-1 text-xs font-bold text-ink focus:outline-none focus:ring-1 focus:ring-mint"
                            />
                          ) : (
                            <span>
                              {set.weight} {set.weight_unit}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 font-bold text-ink">
                          {isEditing ? (
                            <input
                              type="number"
                              inputMode="numeric"
                              min="1"
                              value={editReps}
                              onChange={(e) => setEditReps(parseInt(e.target.value, 10) || 0)}
                              className="w-16 rounded-lg border border-hairline px-2 py-1 text-xs font-bold text-ink focus:outline-none focus:ring-1 focus:ring-mint"
                            />
                          ) : (
                            <span>{set.reps}</span>
                          )}
                        </td>

                        <td className="py-2.5 text-center">
                          {isEditing ? (
                            <input
                              type="checkbox"
                              checked={editWarmup}
                              onChange={(e) => setEditWarmup(e.target.checked)}
                              className="h-4 w-4 rounded accent-ink"
                            />
                          ) : set.is_warmup ? (
                            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                              W
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => handleSaveSet(set.id)}
                                disabled={isPending}
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-mint text-ink font-bold shadow-2xs hover:brightness-105 active:scale-95"
                                title="Save changes"
                              >
                                {isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditSet(set)}
                                className="rounded-md px-2 py-1 text-[11px] font-semibold text-secondary hover:text-ink hover:bg-surface-soft active:scale-95"
                              >
                                Edit
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteSet(set.id)}
                              disabled={isPending}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-red-500 hover:bg-red-50 active:scale-95"
                              title="Delete set"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Cardio Section (if any logged) */}
      {cardioLogs.length > 0 && (
        <div className="overflow-hidden rounded-[24px] border border-hairline bg-canvas p-4 sm:p-5 shadow-2xs space-y-3">
          <h2 className="font-heading text-lg font-bold text-ink">
            Cardio Logs
          </h2>

          <div className="divide-y divide-hairline">
            {cardioLogs.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <span className="text-xs font-bold text-ink">{c.machine}</span>
                  <div className="text-[11px] text-secondary">
                    {c.duration_min} min · {c.speed_kmh} km/h · {c.incline_pct}% incline
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">
                    {Math.round((c.duration_min * c.speed_kmh / 60) * 10) / 10} km
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCardio(c.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
