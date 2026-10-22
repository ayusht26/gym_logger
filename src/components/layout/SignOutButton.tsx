'use client'

import { useTransition } from 'react'
import { signOutAction } from '@/lib/actions/auth'
import { LogOut, Loader2 } from 'lucide-react'

export function SignOutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => signOutAction())}
      disabled={isPending}
      title="Sign out"
      aria-label="Sign out"
      className="flex h-9 w-9 items-center justify-center rounded-full text-secondary hover:bg-surface-soft hover:text-ink transition-colors cursor-pointer"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </button>
  )
}
