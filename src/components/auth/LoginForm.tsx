'use client'

import { useActionState } from 'react'
import { loginAction } from '@/lib/actions/auth'
import { Dumbbell, ArrowRight, Loader2 } from 'lucide-react'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="w-full max-w-[420px] rounded-[24px] border border-hairline bg-canvas p-6 sm:p-8 shadow-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mint text-ink font-bold shadow-sm">
          <Dumbbell className="h-6 w-6 stroke-[2.5]" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Gym Logger
        </h1>
        <p className="mt-1 text-sm font-medium text-secondary">
          Sign in to track your workout session
        </p>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="mb-5 rounded-[12px] border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-ink mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-[12px] border border-hairline bg-canvas px-4 py-3 text-[16px] text-ink placeholder:text-muted transition-colors focus:border-ink focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-ink mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-[12px] border border-hairline bg-canvas px-4 py-3 text-[16px] text-ink placeholder:text-muted transition-colors focus:border-ink focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[16px] font-semibold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-neutral-800 disabled:opacity-60 cursor-pointer min-h-[48px]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-hairline pt-4 text-center">
        <p className="text-xs font-medium text-muted">
          Single-user private tracker · Authorized access only
        </p>
      </div>
    </div>
  )
}
