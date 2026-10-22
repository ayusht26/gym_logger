import { getActiveGym } from '@/lib/actions/gym'
import { getTodayData } from '@/lib/data/today'
import { getRoutineForDate } from '@/lib/routine'
import { formatDateDisplay } from '@/lib/time'
import { OneGymBanner } from '@/components/today/OneGymBanner'
import { ExerciseGrid } from '@/components/today/ExerciseGrid'
import { CardioCard } from '@/components/today/CardioCard'
import { TodaySummaryStrip } from '@/components/today/TodaySummaryStrip'
import { WeighInPrompt } from '@/components/today/WeighInPrompt'
import clsx from 'clsx'
import { Calendar, Flame, Moon } from 'lucide-react'

export default async function TodayPage() {
  const activeGym = await getActiveGym()
  const data = await getTodayData(activeGym)
  const routine = getRoutineForDate(data.todayStr)
  const formattedDate = formatDateDisplay(data.todayStr)

  return (
    <div className="space-y-6">
      {/* 1. One Gym Per Day Alert Banner (if trained at the other gym today) */}
      {data.otherGymSession && (
        <OneGymBanner
          currentGym={activeGym}
          sessionGym={data.otherGymSession}
        />
      )}

      {/* 2. Twice-Monthly Weigh-In Due Prompt */}
      <WeighInPrompt
        isDue={data.weighInDue}
        isTrainingDay={!routine.isRest}
        periodHalf={data.periodHalf}
        todayStr={data.todayStr}
      />

      {/* 2. Today Split Hero Header */}
      <section
        aria-label="Today workout schedule"
        className="rounded-[28px] border border-hairline bg-canvas-mint p-6 sm:p-8 shadow-xs"
      >
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
                ? 'Scheduled rest day. Cardio, stretching, or custom training available.'
                : `Targeting: ${routine.muscleGroups.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider',
                routine.isRest
                  ? 'bg-canvas text-secondary border border-hairline shadow-2xs'
                  : 'bg-mint text-ink border border-ink shadow-2xs'
              )}
            >
              {routine.isRest ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Rest</span>
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  <span>Workout Day</span>
                </>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Exercise Grid with Search and Muscle Group Chips */}
      <section aria-label="Exercise catalog and routine">
        <ExerciseGrid
          exercises={data.exercises}
          routineMuscleGroups={routine.muscleGroups}
          isRestDay={routine.isRest}
        />
      </section>

      {/* 4. Cardio Card (Available every day on both gyms) */}
      <CardioCard gym={activeGym} cardioLogs={data.cardioLogs} />

      {/* 5. Today's Workout Summary Strip */}
      <TodaySummaryStrip
        summary={data.summary}
        isFinished={Boolean(data.session?.ended_at)}
      />
    </div>
  )
}
