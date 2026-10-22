import { getBodyWeightData } from '@/lib/data/body'
import { BodyWeightHero } from '@/components/body/BodyWeightHero'
import { BodyWeightChart } from '@/components/body/BodyWeightChart'
import { BodyWeightHistory } from '@/components/body/BodyWeightHistory'

export const metadata = {
  title: 'Body Weight · Gym Logger',
  description: 'Twice-monthly body weight tracking and progression charts',
}

export default async function BodyWeightPage() {
  const data = await getBodyWeightData()

  return (
    <div className="mx-auto max-w-4xl pb-24 pt-4 sm:pt-6">
      {/* Hero Overview */}
      <BodyWeightHero data={data} />

      {/* Recharts Progression Line Chart */}
      <BodyWeightChart weights={data.weightsChronological} />

      {/* History List with Edit/Delete */}
      <BodyWeightHistory
        weights={data.weightsRecent}
        todayStr={data.todayStr}
      />
    </div>
  )
}
