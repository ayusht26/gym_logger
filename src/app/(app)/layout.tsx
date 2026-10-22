import { AppHeader } from '@/components/layout/AppHeader'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { getActiveGym } from '@/lib/actions/gym'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentGym = await getActiveGym()

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <AppHeader currentGym={currentGym} />
      <main className="flex-1 pb-24 md:pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-4 sm:pt-6">
          {children}
        </div>
      </main>
      <BottomTabBar />
    </div>
  )
}
