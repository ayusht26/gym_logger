'use client'

import { useState } from 'react'
import { Plus, TrendingDown, TrendingUp, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { AddWeightModal } from './AddWeightModal'
import type { BodyWeightPageData } from '@/lib/data/body'
import { formatDateDisplay } from '@/lib/time'

interface BodyWeightHeroProps {
  data: BodyWeightPageData
}

export function BodyWeightHero({ data }: BodyWeightHeroProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { latestWeight, weightDeltaKg, isDue, currentPeriod } = data

  const isUp = weightDeltaKg !== null && weightDeltaKg > 0
  const isDown = weightDeltaKg !== null && weightDeltaKg < 0

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-[28px] border border-hairline bg-canvas p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-md bg-surface-soft px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-secondary">
                Body Metrics
              </span>

              {/* Twice-a-month period indicator */}
              <div className="flex items-center gap-1 rounded-full border border-hairline/80 bg-canvas px-2.5 py-0.5 text-xs font-semibold text-secondary">
                <Calendar className="h-3 w-3 text-muted" />
                <span>
                  Period {currentPeriod.half} ({currentPeriod.startDate.slice(8)}–{currentPeriod.endDate.slice(8)}{' '}
                  {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${data.todayStr}T12:00:00Z`))})
                </span>
              </div>

              {/* Due / Logged status badge */}
              {isDue ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                  <AlertCircle className="h-3 w-3" />
                  <span>Check-in due</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-mint/40 border border-mint/60 px-2 py-0.5 text-[11px] font-bold text-ink">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Logged</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-ink">
                {latestWeight ? latestWeight.weight_kg : '—'}{' '}
                <span className="text-xl sm:text-2xl font-bold text-secondary">kg</span>
              </h1>

              {/* Trend Pill */}
              {weightDeltaKg !== null && (
                <div
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                    isDown
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isUp
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-surface-soft text-secondary'
                  }`}
                >
                  {isDown && <TrendingDown className="h-3.5 w-3.5" />}
                  {isUp && <TrendingUp className="h-3.5 w-3.5" />}
                  <span>
                    {weightDeltaKg > 0 ? `+${weightDeltaKg}` : weightDeltaKg} kg
                  </span>
                </div>
              )}
            </div>

            <p className="mt-1 text-xs text-secondary">
              {latestWeight
                ? `Last measured on ${formatDateDisplay(latestWeight.measured_on)}${
                    latestWeight.note ? ` · "${latestWeight.note}"` : ''
                  }`
                : 'Twice-monthly check-in: 1st–15th and 16th–end of month.'}
            </p>
          </div>

          {/* Primary Action: Add weight button */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-xs transition-transform hover:opacity-90 active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add weight</span>
          </button>
        </div>
      </div>

      <AddWeightModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
