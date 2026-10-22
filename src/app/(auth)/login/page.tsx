import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in · Gym Logger',
  description: 'Sign in to access your workout and training log',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas-mint p-4 sm:p-6">
      <LoginForm />
    </main>
  )
}
