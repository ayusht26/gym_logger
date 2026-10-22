import { notFound } from 'next/navigation'
import { getExerciseLogData } from '@/lib/data/log'
import { LogHero } from '@/components/log/LogHero'
import { PreviousSetsPanel } from '@/components/log/PreviousSetsPanel'
import { SetTable } from '@/components/log/SetTable'
import { LogSummaryStrip } from '@/components/log/LogSummaryStrip'

interface ExerciseLogPageProps {
  params: Promise<{ exerciseId: string }>
}

export default async function ExerciseLogPage({ params }: ExerciseLogPageProps) {
  const { exerciseId } = await params
  const data = await getExerciseLogData(exerciseId)

  if (!data) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl pb-24 pt-4 sm:pt-6">
      {/* Exercise Hero Card */}
      <LogHero
        exercise={data.exercise}
        allTimeBests={data.allTimeBests}
        hasHistoricalBaseline={data.hasHistoricalBaseline}
      />

      {/* Previous Session Panel with Copy Sets */}
      <PreviousSetsPanel
        previousSession={data.previousSession}
        exercise={data.exercise}
      />

      {/* Set Table: kg/plates switch, numeric keypad inputs, live PR medals */}
      <SetTable
        exercise={data.exercise}
        initialSets={data.todaySets}
        previousSession={data.previousSession}
        sessionId={data.todaySession?.id}
      />

      {/* Running Totals and Finish Workout Mint Pill */}
      <LogSummaryStrip totals={data.totals} />
    </div>
  )
}
