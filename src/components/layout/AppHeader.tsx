'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { GymSwitch } from './GymSwitch'
import { SignOutButton } from './SignOutButton'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import type { GymType } from '@/lib/actions/gym'
import { Settings, Play } from 'lucide-react'

const NAV_LINKS = [
  { href: '/', label: 'Today' },
  { href: '/progress', label: 'Progress' },
  { href: '/body', label: 'Body' },
  { href: '/history', label: 'History' },
]

interface AppHeaderProps {
  currentGym: GymType
}

export function AppHeader({ currentGym }: AppHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-hairline bg-canvas/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-black font-bold shadow-xs">
              <span className="font-display text-base font-extrabold leading-none">G</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Gym Logger
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Desktop Navigation"
            className="hidden md:flex items-center gap-1 pl-4"
          >
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/' || pathname.startsWith('/log')
                  : pathname.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-surface-soft text-ink'
                      : 'text-secondary hover:bg-surface-soft/60 hover:text-ink'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Gym Pill Switch */}
          <GymSwitch currentGym={currentGym} />

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Desktop Pill "Start workout" */}
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xs transition-all hover:bg-neutral-800 active:scale-95 min-h-[36px]"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Start workout</span>
          </Link>

          {/* Settings link */}
          <Link
            href="/settings"
            title="Settings"
            aria-label="Settings"
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
              pathname === '/settings'
                ? 'bg-surface-soft text-ink'
                : 'text-secondary hover:bg-surface-soft hover:text-ink'
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>

          {/* Sign out */}
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
