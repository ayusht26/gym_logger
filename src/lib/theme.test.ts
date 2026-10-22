import { describe, it, expect } from 'vitest'

export type Theme = 'light' | 'dark' | 'system'

export function resolveEffectiveTheme(
  theme: Theme,
  systemPrefersDark: boolean
): 'light' | 'dark' {
  if (theme === 'dark') return 'dark'
  if (theme === 'light') return 'light'
  return systemPrefersDark ? 'dark' : 'light'
}

describe('Theme resolution helper', () => {
  it('resolves dark theme explicitly', () => {
    expect(resolveEffectiveTheme('dark', false)).toBe('dark')
    expect(resolveEffectiveTheme('dark', true)).toBe('dark')
  })

  it('resolves light theme explicitly', () => {
    expect(resolveEffectiveTheme('light', false)).toBe('light')
    expect(resolveEffectiveTheme('light', true)).toBe('light')
  })

  it('resolves system theme based on prefers-color-scheme', () => {
    expect(resolveEffectiveTheme('system', true)).toBe('dark')
    expect(resolveEffectiveTheme('system', false)).toBe('light')
  })
})
