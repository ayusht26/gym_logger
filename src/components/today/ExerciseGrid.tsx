'use client'

import { useState, useMemo } from 'react'
import type { TodayExerciseItem } from '@/lib/data/today'
import { ExerciseCard } from './ExerciseCard'
import {
  ALL_MUSCLE_GROUPS,
  getMuscleGroupDisplayName,
  type MuscleGroup,
} from '@/lib/routine'
import clsx from 'clsx'
import { Search, X, Dumbbell, Sparkles } from 'lucide-react'

interface ExerciseGridProps {
  exercises: TodayExerciseItem[]
  routineMuscleGroups: MuscleGroup[]
  isRestDay: boolean
}

export function ExerciseGrid({
  exercises,
  routineMuscleGroups,
  isRestDay,
}: ExerciseGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>(
    isRestDay ? [] : routineMuscleGroups
  )
  const [trainAnyway, setTrainAnyway] = useState(false)

  // Toggle single muscle group chip
  const handleToggleGroup = (group: MuscleGroup) => {
    if (isRestDay && !trainAnyway) {
      setTrainAnyway(true)
    }

    setSelectedGroups((prev) => {
      if (prev.includes(group)) {
        const next = prev.filter((g) => g !== group)
        return next
      } else {
        return [...prev, group]
      }
    })
  }

  const handleSelectAll = () => {
    if (isRestDay && !trainAnyway) setTrainAnyway(true)
    setSelectedGroups([...ALL_MUSCLE_GROUPS])
  }

  const handleClearGroups = () => {
    setSelectedGroups([])
  }

  // Filter exercises
  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return exercises.filter((ex) => {
      // Muscle group filter:
      if (selectedGroups.length > 0) {
        if (!selectedGroups.includes(ex.muscle_group)) return false
      } else if (isRestDay && !trainAnyway) {
        // Rest day without manual override
        return false
      }

      // Search query filter:
      if (q) {
        const nameMatch = ex.name.toLowerCase().includes(q)
        const machineMatch = ex.machine_model ? ex.machine_model.toLowerCase().includes(q) : false
        const muscleMatch = ex.muscle_group.toLowerCase().includes(q)
        return nameMatch || machineMatch || muscleMatch
      }

      return true
    })
  }, [exercises, selectedGroups, searchQuery, isRestDay, trainAnyway])

  const showRestNotice = isRestDay && !trainAnyway && selectedGroups.length === 0

  return (
    <div className="space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-col gap-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises by name, machine model, or muscle..."
            className="w-full rounded-full border border-hairline bg-canvas pl-10 pr-10 py-2.5 text-[15px] sm:text-base text-ink placeholder:text-muted shadow-2xs transition-all focus:border-ink focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-secondary hover:bg-surface-soft hover:text-ink cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Muscle Group Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={selectedGroups.length === ALL_MUSCLE_GROUPS.length ? handleClearGroups : handleSelectAll}
            className={clsx(
              'rounded-full px-3 py-1 text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[34px]',
              selectedGroups.length === ALL_MUSCLE_GROUPS.length
                ? 'bg-ink text-white shadow-xs'
                : 'bg-surface-soft text-secondary hover:bg-surface-soft/80 hover:text-ink'
            )}
          >
            All
          </button>

          {ALL_MUSCLE_GROUPS.map((group) => {
            const isSelected = selectedGroups.includes(group)
            return (
              <button
                key={group}
                type="button"
                onClick={() => handleToggleGroup(group)}
                className={clsx(
                  'rounded-full px-3 py-1 text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[34px]',
                  isSelected
                    ? 'bg-ink text-white shadow-xs'
                    : 'bg-surface-soft text-secondary hover:bg-surface-soft/80 hover:text-ink'
                )}
              >
                {getMuscleGroupDisplayName(group)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Rest Day Message with Train Anyway option */}
      {showRestNotice && (
        <div className="rounded-[24px] border border-hairline bg-canvas p-8 text-center shadow-xs">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-secondary">
            <Sparkles className="h-6 w-6 text-mint stroke-[2.5]" />
          </div>
          <h3 className="font-display text-xl font-bold text-ink">
            Scheduled Rest Day
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm font-medium text-secondary">
            Take time to recover, stretch, or log a cardio session below. You can also pick muscle groups to train anyway.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                setTrainAnyway(true)
                setSelectedGroups(['back', 'biceps'])
              }}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-neutral-800 transition-all cursor-pointer min-h-[40px]"
            >
              Train anyway
            </button>
          </div>
        </div>
      )}

      {/* Exercise Cards Grid */}
      {!showRestNotice && filteredExercises.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredExercises.map((exercise, idx) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              priority={idx < 4}
            />
          ))}
        </div>
      )}

      {/* Empty State when filter/search yields 0 */}
      {!showRestNotice && filteredExercises.length === 0 && (
        <div className="rounded-[24px] border border-hairline bg-canvas p-10 text-center shadow-xs">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft text-muted">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            No exercises match your filter
          </h3>
          <p className="mt-1 text-sm font-medium text-secondary">
            {searchQuery
              ? `No results for "${searchQuery}". Try a different name or clear the search.`
              : 'Select one or more muscle group chips above to display exercises.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="rounded-full border border-hairline bg-canvas px-4 py-2 text-xs sm:text-sm font-semibold text-ink shadow-2xs hover:bg-surface-soft transition-colors cursor-pointer"
              >
                Clear search
              </button>
            )}
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-full bg-ink px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Show all exercises
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
