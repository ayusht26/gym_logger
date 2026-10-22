import { getProgressPageData } from '@/lib/data/progress'
import { ProgressView } from '@/components/progress/ProgressView'

export const metadata = {
  title: 'Progress · Gym Logger',
  description: 'Workout analysis, strength progression charts, and personal records',
}

export default async function ProgressPage() {
  const data = await getProgressPageData()

  return (
    <div className="mx-auto max-w-4xl pb-24 pt-4 sm:pt-6">
      <ProgressView
        todayStr={data.todayStr}
        exercises={data.exercises}
        allSets={data.allSets}
        cardioWeekly={data.cardioWeekly}
        cardioRecent={data.cardioRecent}
      />
    </div>
  )
}
