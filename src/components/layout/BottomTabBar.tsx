'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { Dumbbell, TrendingUp, Scale, History } from 'lucide-react'

const TABS = [
  { href: '/', label: 'Today', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/body', label: 'Body', icon: Scale },
  { href: '/history', label: 'History', icon: History },
]

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur-md pb-safe"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {TABS.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/' || pathname.startsWith('/log')
              : pathname.startsWith(tab.href)

          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] py-1 text-xs font-semibold transition-colors',
                isActive
                  ? 'text-ink'
                  : 'text-secondary hover:text-ink'
              )}
            >
              <div
                className={clsx(
                  'flex items-center justify-center h-7 w-7 rounded-full transition-transform',
                  isActive ? 'bg-mint/30' : ''
                )}
              >
                <Icon
                  className={clsx(
                    'h-5 w-5',
                    isActive ? 'stroke-[2.5] text-ink' : 'stroke-[1.75]'
                  )}
                />
              </div>
              <span className="mt-0.5 text-[11px] leading-tight tracking-tight">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
