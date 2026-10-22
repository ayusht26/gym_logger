'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import clsx from 'clsx'
import type { TodayExerciseItem } from '@/lib/data/today'
import { Dumbbell, Check, Activity, Layers } from 'lucide-react'

interface ExerciseCardProps {
  exercise: TodayExerciseItem
  priority?: boolean
}

export function ExerciseCard({ exercise, priority = false }: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false)
  const hasImage = Boolean(exercise.image_path) && !imageError

  return (
    <Link
      href={`/log/${exercise.id}`}
      aria-label={`${exercise.name}, ${exercise.machine_model || exercise.equipment}. ${exercise.lastPerformanceSummary}`}
      className={clsx(
        'group flex flex-col justify-between overflow-hidden rounded-[20px] border bg-canvas p-3 sm:p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
        exercise.loggedToday
          ? 'border-mint/60 shadow-xs'
          : 'border-hairline shadow-2xs'
      )}
    >
      <div>
        {/* Machine Photo / Fallback Tile Frame */}
        <div className="relative mb-3 w-full aspect-[4/3] overflow-hidden rounded-[14px] bg-canvas-mint/80 border border-hairline/60 flex items-center justify-center">
          {hasImage && exercise.image_path ? (
            <Image
              src={exercise.image_path}
              alt={`${exercise.name} ${exercise.machine_model || ''}`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              onError={() => setImageError(true)}
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink shadow-2xs">
                <Dumbbell className="h-5 w-5 text-ink stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                {exercise.muscle_group}
              </span>
            </div>
          )}

          {/* Today Logged Mint Check Badge */}
          {exercise.loggedToday && (
            <div
              title="Logged today"
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-mint text-black font-extrabold shadow-xs"
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
          )}

          {/* Equipment / Plate tag */}
          {exercise.default_input === 'plates' && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
              <Layers className="h-3 w-3" />
              <span>Plates</span>
            </div>
          )}
        </div>

        {/* Name and Machine Model */}
        <h3 className="font-sans text-sm sm:text-base font-bold text-ink leading-snug line-clamp-2 group-hover:text-mint transition-colors">
          {exercise.name}
        </h3>

        <p className="mt-0.5 text-xs font-medium text-secondary truncate">
          {exercise.machine_model || exercise.equipment.replace('_', ' ')}
        </p>
      </div>

      {/* Performance Summary Pill */}
      <div className="mt-3 pt-2.5 border-t border-hairline/60">
        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-secondary">
          <Activity className="h-3 w-3 shrink-0 text-muted" />
          <span className="truncate">{exercise.lastPerformanceSummary}</span>
        </div>
      </div>
    </Link>
  )
}
