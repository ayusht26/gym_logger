'use client'

import { useState, useEffect } from 'react'
import { Timer, Play, Pause, RotateCcw, X } from 'lucide-react'

interface RestTimerProps {
  initialSeconds?: number
  onDismiss?: () => void
}

export function RestTimer({ initialSeconds = 90, onDismiss }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, secondsLeft])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`
  const progressPct = ((initialSeconds - secondsLeft) / initialSeconds) * 100

  return (
    <div className="my-4 overflow-hidden rounded-[16px] border border-mint/60 bg-canvas-mint/50 p-3 shadow-2xs transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mint text-ink font-bold shadow-2xs">
            <Timer className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-lg font-bold text-ink">
                {formattedTime}
              </span>
              <span className="text-[11px] font-semibold text-secondary">Rest timer</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSecondsLeft((prev) => prev + 30)}
            className="rounded-lg border border-hairline bg-canvas px-2 py-1 text-xs font-semibold text-ink hover:bg-surface-soft active:scale-95"
            aria-label="Add 30 seconds"
          >
            +30s
          </button>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-canvas text-ink hover:bg-surface-soft active:scale-95"
            aria-label={isActive ? 'Pause timer' : 'Start timer'}
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-ink" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setSecondsLeft(initialSeconds)
              setIsActive(true)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-canvas text-secondary hover:text-ink active:scale-95"
            aria-label="Reset timer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:text-ink"
              aria-label="Dismiss timer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Visual progress bar */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-hairline/60">
        <div
          className="h-full bg-mint transition-all duration-1000 ease-linear"
          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
        />
      </div>
    </div>
  )
}
