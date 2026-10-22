import { getTodayIST, formatDateDisplay } from '@/lib/time'
import { getRoutineForDate, getMuscleGroupDisplayName } from '@/lib/routine'
import { getActiveGym } from '@/lib/actions/gym'
import clsx from 'clsx'
import { Dumbbell, Flame, Calendar, Sparkles } from 'lucide-react'

export default async function TodayPage() {
  const activeGym = await getActiveGym()
  const today = getTodayIST()
  const formattedDate = formatDateDisplay(today)
  const routine = getRoutineForDate(today)

  return (
    <div className="space-y-6">
      {/* Hero Header per DESIGN.md & CONTEXT.md */}
      <section className="rounded-[28px] border border-hairline bg-canvas-mint p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-secondary">
              <Calendar className="h-4 w-4 text-ink" />
              <span>{formattedDate}</span>
              <span className="text-muted">·</span>
              <span className="capitalize">{activeGym} Gym</span>
            </div>

            <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight text-ink">
              {routine.splitName}
            </h1>

            <p className="mt-1 text-sm sm:text-base font-medium text-secondary">
              {routine.isRest
                ? 'Scheduled rest day. Cardio and light recovery available.'
                : `Targeting: ${routine.muscleGroups.map(getMuscleGroupDisplayName).join(', ')}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider',
                routine.isRest
                  ? 'bg-surface-soft text-secondary border border-hairline'
                  : 'bg-mint text-ink border border-ink'
              )}
            >
              <Flame className="h-4 w-4" />
              {routine.isRest ? 'Rest' : 'Workout Day'}
            </span>
          </div>
        </div>

        {/* Muscle group chips */}
        {routine.muscleGroups.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-hairline/60">
            {routine.muscleGroups.map((group) => (
              <span
                key={group}
                className="inline-flex items-center gap-1 rounded-[12px] bg-canvas px-3 py-1.5 text-xs sm:text-sm font-semibold text-ink border border-hairline shadow-2xs"
              >
                <Dumbbell className="h-3.5 w-3.5 text-muted" />
                {getMuscleGroupDisplayName(group)}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Quick session status placeholder for Phase 1 */}
      <section className="rounded-[24px] border border-hairline bg-canvas p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
              Today&apos;s Session
            </h2>
            <p className="text-xs sm:text-sm font-medium text-secondary">
              Phase 1 shell active · Exercises & Cardio engine in Phase 2
            </p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-secondary">
            <Sparkles className="h-3.5 w-3.5 text-mint stroke-[2.5]" />
            Foundation Ready
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-[16px] bg-surface-soft p-4">
            <span className="text-xs font-medium text-secondary">Completed Sets</span>
            <p className="mt-1 font-display text-2xl font-bold text-ink">0</p>
          </div>
          <div className="rounded-[16px] bg-surface-soft p-4">
            <span className="text-xs font-medium text-secondary">Total Volume</span>
            <p className="mt-1 font-display text-2xl font-bold text-ink">0 kg</p>
          </div>
          <div className="rounded-[16px] bg-surface-soft p-4">
            <span className="text-xs font-medium text-secondary">Active PRs</span>
            <p className="mt-1 font-display text-2xl font-bold text-ink">0</p>
          </div>
          <div className="rounded-[16px] bg-surface-soft p-4">
            <span className="text-xs font-medium text-secondary">Cardio</span>
            <p className="mt-1 font-display text-2xl font-bold text-ink">0 min</p>
          </div>
        </div>
      </section>
    </div>
  )
}
