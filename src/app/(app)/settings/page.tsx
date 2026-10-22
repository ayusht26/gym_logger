import { getSettingsPageData } from '@/lib/data/settings'
import { SettingsView } from '@/components/settings/SettingsView'

export const metadata = {
  title: 'Settings · Gym Logger',
  description: 'Manage workout preferences, catalog exercises, plate weights, and account',
}

export default async function SettingsPage() {
  const data = await getSettingsPageData()

  return (
    <div className="mx-auto max-w-3xl pb-24 pt-4 sm:pt-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Settings & Catalog
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-medium text-secondary">
          Configure default gym, custom machines, weight ratios, and exercise options.
        </p>
      </div>

      <SettingsView data={data} />
    </div>
  )
}
