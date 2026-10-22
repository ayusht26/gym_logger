'use client'

import { useState, useActionState, useTransition } from 'react'
import { logCardioAction, deleteCardioAction, type ActionResponse } from '@/lib/actions/today'
import { calculateCardioDistance } from '@/lib/today'
import type { GymType } from '@/lib/catalog'
import type { Database } from '@/types/database'
import { Activity, Plus, Trash2, Loader2, Gauge, Timer, TrendingUp } from 'lucide-react'

type CardioRow = Database['public']['Tables']['cardio_logs']['Row']

interface CardioCardProps {
  gym: GymType
  cardioLogs: CardioRow[]
}

export function CardioCard({ gym, cardioLogs }: CardioCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [speed, setSpeed] = useState('6.0')
  const [incline, setIncline] = useState('1.0')
  const [duration, setDuration] = useState('20')
  const [machine, setMachine] = useState('Treadmill')

  const [formState, formAction, isPending] = useActionState(
    async (prev: ActionResponse | null, formData: FormData) => {
      const res = await logCardioAction(prev, formData)
      if (res.success) {
        setIsOpen(false)
      }
      return res
    },
    null
  )

  const [isDeleting, startDeleteTransition] = useTransition()

  const handleDelete = (id: string) => {
    startDeleteTransition(async () => {
      await deleteCardioAction(id)
    })
  }

  const estDistance = calculateCardioDistance(
    parseFloat(duration) || 0,
    parseFloat(speed) || 0
  )

  const totalMinutes = cardioLogs.reduce((acc, c) => acc + Number(c.duration_min), 0)
  const totalKm = cardioLogs.reduce(
    (acc, c) => acc + calculateCardioDistance(Number(c.duration_min), Number(c.speed_kmh)),
    0
  )

  return (
    <section
      aria-label="Cardio activity tracker"
      className="rounded-[24px] border border-hairline bg-canvas p-5 sm:p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint/30 text-ink">
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink">
              Cardio Tracker
            </h2>
            <p className="text-xs sm:text-sm font-medium text-secondary">
              {cardioLogs.length > 0
                ? `${totalMinutes} min logged today · approx. ${Math.round(totalKm * 10) / 10} km`
                : 'Available every day · Treadmill, Incline, Speed'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xs hover:bg-neutral-800 transition-all cursor-pointer min-h-[36px]"
        >
          <Plus className="h-4 w-4" />
          <span>{isOpen ? 'Close' : 'Log cardio'}</span>
        </button>
      </div>

      {/* Quick Add Form Drawer */}
      {isOpen && (
        <form
          action={formAction}
          className="mt-5 rounded-[18px] border border-hairline bg-surface-soft/60 p-4 sm:p-5 space-y-4"
        >
          <input type="hidden" name="gym" value={gym} />

          {formState?.error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 p-2.5 text-xs font-semibold text-red-800"
            >
              {formState.error}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="duration_min" className="block text-xs font-semibold text-ink mb-1">
                Duration (min)
              </label>
              <div className="relative">
                <input
                  id="duration_min"
                  name="duration_min"
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  inputMode="decimal"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-[12px] border border-hairline bg-canvas px-3 py-2 text-sm text-ink font-semibold focus:border-ink focus:outline-none"
                />
                <Timer className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="speed_kmh" className="block text-xs font-semibold text-ink mb-1">
                Speed (km/h)
              </label>
              <div className="relative">
                <input
                  id="speed_kmh"
                  name="speed_kmh"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  inputMode="decimal"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="w-full rounded-[12px] border border-hairline bg-canvas px-3 py-2 text-sm text-ink font-semibold focus:border-ink focus:outline-none"
                />
                <Gauge className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="incline_pct" className="block text-xs font-semibold text-ink mb-1">
                Incline (%)
              </label>
              <div className="relative">
                <input
                  id="incline_pct"
                  name="incline_pct"
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  inputMode="decimal"
                  value={incline}
                  onChange={(e) => setIncline(e.target.value)}
                  className="w-full rounded-[12px] border border-hairline bg-canvas px-3 py-2 text-sm text-ink font-semibold focus:border-ink focus:outline-none"
                />
                <TrendingUp className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="machine" className="block text-xs font-semibold text-ink mb-1">
                Machine
              </label>
              <input
                id="machine"
                name="machine"
                type="text"
                value={machine}
                onChange={(e) => setMachine(e.target.value)}
                className="w-full rounded-[12px] border border-hairline bg-canvas px-3 py-2 text-sm text-ink font-semibold focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-secondary">
              Est. Distance: <strong className="text-ink font-bold">{estDistance} km</strong>
            </span>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-xs sm:text-sm font-semibold text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xs hover:bg-neutral-800 disabled:opacity-60 transition-all cursor-pointer min-h-[38px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white dark:text-black" />
                  <span>Logging...</span>
                </>
              ) : (
                <span>Save cardio entry</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* List of today's cardio entries */}
      {cardioLogs.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-hairline/60 pt-3">
          {cardioLogs.map((log) => {
            const dist = calculateCardioDistance(Number(log.duration_min), Number(log.speed_kmh))
            return (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-[14px] bg-surface-soft/60 px-3.5 py-2.5 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{log.machine}</span>
                  <span className="text-muted">·</span>
                  <span className="font-semibold text-ink">{log.duration_min} min</span>
                  <span className="text-muted">·</span>
                  <span className="text-secondary">{log.speed_kmh} km/h</span>
                  <span className="text-muted">·</span>
                  <span className="text-secondary">{log.incline_pct}% incline</span>
                  <span className="text-muted">·</span>
                  <span className="font-semibold text-ink">~{dist} km</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(log.id)}
                  disabled={isDeleting}
                  title="Delete cardio entry"
                  aria-label="Delete cardio entry"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-soft hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
