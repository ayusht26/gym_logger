'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Dumbbell, AlertCircle, Award } from 'lucide-react'
import type { ExerciseDetail } from '@/lib/data/log'

interface LogHeroProps {
  exercise: ExerciseDetail
  allTimeBests: {
    heaviestWeight: number
    oneRepMax: number
    bestVolume: number
    mostReps: number
  }
  hasHistoricalBaseline: boolean
}

export function LogHero({
  exercise,
  allTimeBests,
  hasHistoricalBaseline,
}: LogHeroProps) {
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(exercise.image_path) && !imgError

  return (
    <div className="relative mb-6 overflow-hidden rounded-[28px] border border-hairline bg-canvas p-4 sm:p-6 shadow-2xs">
      {/* Back button */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-soft px-3.5 py-1.5 text-xs font-semibold text-secondary hover:text-ink hover:border-neutral-300 transition-colors"
          aria-label="Back to Today's workout"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Today</span>
        </Link>

        {/* Gym Badge */}
        <span className="rounded-full bg-canvas-mint px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink border border-mint/40">
          {exercise.gym === 'home' ? 'Home Gym' : 'College Gym'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Machine Photo / Feature Frame */}
        <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-[20px] bg-canvas-mint/80 border border-hairline/80 flex items-center justify-center shadow-2xs">
          {hasImage && exercise.image_path ? (
            <Image
              src={exercise.image_path}
              alt={`${exercise.name} ${exercise.machine_model || ''}`}
              fill
              sizes="128px"
              priority
              onError={() => setImgError(true)}
              className="object-contain p-2"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink shadow-2xs mb-1">
                <Dumbbell className="h-5 w-5 stroke-[2]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                {exercise.muscle_group}
              </span>
            </div>
          )}
        </div>

        {/* Title and Equipment Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-block rounded-md bg-surface-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
              {exercise.muscle_group}
            </span>
            {exercise.machine_model && (
              <span className="inline-block rounded-md bg-ink text-white px-2 py-0.5 text-[11px] font-semibold tracking-wide">
                {exercise.machine_model}
              </span>
            )}
            <span className="text-xs text-secondary capitalize">
              {exercise.equipment.replace('_', ' ')}
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
            {exercise.name}
          </h1>

          {/* Historical PR Records Badge */}
          {hasHistoricalBaseline && allTimeBests.heaviestWeight > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-secondary">
              <div className="flex items-center gap-1 font-semibold text-ink bg-canvas-mint/60 border border-mint/40 rounded-full px-2.5 py-0.5">
                <Award className="h-3.5 w-3.5 text-ink" />
                <span>Best: {allTimeBests.heaviestWeight} kg</span>
              </div>
              <span className="text-muted">·</span>
              <span>1RM: {allTimeBests.oneRepMax} kg</span>
              <span className="text-muted">·</span>
              <span>Max Reps: {allTimeBests.mostReps}</span>
            </div>
          ) : (
            <p className="mt-2 text-xs font-medium text-secondary">
              First session for this exercise establishes your baseline PR.
            </p>
          )}

          {/* Hint if plates unit is active but kg_per_plate is missing */}
          {exercise.default_input === 'plates' && !exercise.kg_per_plate && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg p-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Plate weights are tracked directly. Set kg-per-plate in Settings to enable kg conversion.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
