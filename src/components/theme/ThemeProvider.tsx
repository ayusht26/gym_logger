'use client'

import React, { createContext, useContext, useEffect, useSyncExternalStore, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'gym_theme'
const THEME_CHANGE_EVENT = 'gym_theme_change'

function subscribeTheme(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

function getThemeSnapshot(): Theme {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (val === 'light' || val === 'dark' || val === 'system') {
      return val
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'system'
}

function getServerSnapshot(): Theme {
  return 'system'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerSnapshot)
  const [systemIsDark, setSystemIsDark] = useState<boolean>(false)

  // Listen for mediaQuery system changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystem = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemIsDark(e.matches)
    }

    updateSystem(mediaQuery)

    const handler = (e: MediaQueryListEvent) => updateSystem(e)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : systemIsDark ? 'dark' : 'light'

  // Sync DOM classes and theme-color meta tag
  useEffect(() => {
    const root = document.documentElement
    const isDark = resolvedTheme === 'dark'

    if (isDark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    }

    let metaTheme = document.querySelector('meta[name="theme-color"]')
    if (!metaTheme) {
      metaTheme = document.createElement('meta')
      metaTheme.setAttribute('name', 'theme-color')
      document.head.appendChild(metaTheme)
    }
    metaTheme.setAttribute('content', isDark ? '#090a0f' : '#00f0a0')
  }, [resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
    } catch {
      // Ignore localStorage write errors
    }
  }

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
