import { Settings, Shield } from 'lucide-react'
import { SignOutButton } from '@/components/layout/SignOutButton'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-hairline bg-canvas p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint/30 text-ink">
              <Settings className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Settings
              </h1>
              <p className="text-xs sm:text-sm font-medium text-secondary">
                Catalog management, plate sizes, and preferences
              </p>
            </div>
          </div>

          <SignOutButton />
        </div>

        <div className="mt-8 space-y-4 border-t border-hairline pt-6">
          <div className="flex items-center justify-between rounded-[16px] border border-hairline p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-mint stroke-[2.5]" />
              <div>
                <p className="text-sm font-semibold text-ink">Account & Security</p>
                <p className="text-xs text-secondary">Single-user mode active with Row Level Security</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              Protected
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
