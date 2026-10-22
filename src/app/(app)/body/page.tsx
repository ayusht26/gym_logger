import { Scale } from 'lucide-react'

export default function BodyPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-hairline bg-canvas p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint/30 text-ink">
            <Scale className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Body Weight Tracking
            </h1>
            <p className="text-xs sm:text-sm font-medium text-secondary">
              Bi-monthly weigh-in charts and history (Phase 4)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
