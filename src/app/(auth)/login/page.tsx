import { LoginForm } from '@/components/auth/LoginForm'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in · Gym Logger',
  description: 'Sign in to access your workout and training log',
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-canvas-mint p-4 sm:p-6 transition-colors">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle className="bg-canvas border border-hairline shadow-2xs" />
      </div>
      <LoginForm />
    </main>
  )
}
