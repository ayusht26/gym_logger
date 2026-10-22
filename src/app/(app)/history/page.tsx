import { getHistoryPageData } from '@/lib/data/history'
import { HistoryList } from '@/components/history/HistoryList'

export const metadata = {
  title: 'Workout History · Gym Logger',
  description: 'Past workout sessions, training log, and lifted volume archives',
}

export default async function HistoryPage() {
  const data = await getHistoryPageData()

  return (
    <div className="mx-auto max-w-3xl pb-24 pt-4 sm:pt-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Workout History
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-medium text-secondary">
          Month-by-month log of your completed training sessions and lifted volume.
        </p>
      </div>

      <HistoryList data={data} />
    </div>
  )
}
