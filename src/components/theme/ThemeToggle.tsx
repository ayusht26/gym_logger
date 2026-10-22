'use client'

import { useTheme } from './ThemeProvider'
import { useIsMounted } from '@/lib/use-mounted'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, toggleTheme } = useTheme()
  const isMounted = useIsMounted()

  if (!isMounted) {
    return (
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-secondary opacity-0 ${className}`}
        aria-hidden="true"
      >
        <span className="h-4 w-4" />
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Theme: ${theme} (${resolvedTheme}) · Click to toggle`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full text-secondary hover:bg-surface-soft hover:text-ink transition-all cursor-pointer active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 stroke-[2.2] transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-secondary stroke-[2] transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  )
}
