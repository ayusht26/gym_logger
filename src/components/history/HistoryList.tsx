'use client'

import Link from 'next/link'
import { Calendar, ChevronRight, Clock, Dumbbell, Flame } from 'lucide-react'
import type { HistoryPageData } from '@/lib/data/history'

interface HistoryListProps {
  data: HistoryPageData
}

export function HistoryList({ data }: HistoryListProps) {
  const { monthGroups, totalSessions, totalVolumeAllTime } = data

  if (monthGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-hairline bg-surface-soft/40 p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-secondary shadow-2xs">
          <Calendar className="h-7 w-7 stroke-[1.75]" />
        </div>
        <h2 className="font-heading text-xl font-bold text-ink">No Workouts Logged Yet</h2>
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-secondary">
          Your completed workouts, volume totals, and session history will appear here month by month.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white shadow-xs transition-opacity hover:opacity-90 active:scale-95"
        >
          <span>Start today’s workout</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats Bar */}
      <div className="rounded-[24px] border border-hairline bg-canvas p-4 sm:p-6 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 divide-x divide-hairline">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
              Total Sessions
            </span>
            <span className="font-heading text-2xl sm:text-3xl font-bold text-ink">
              {totalSessions}
            </span>
          </div>

          <div className="pl-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
              Lifted Volume
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-2xl sm:text-3xl font-bold text-ink">
                {totalVolumeAllTime.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-secondary">kg</span>
            </div>
          </div>

          <div className="hidden sm:block pl-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
              Consistency
            </span>
            <span className="font-heading text-2xl sm:text-3xl font-bold text-ink">
              {totalSessions > 0 ? 'Active' : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Month Groups */}
      {monthGroups.map((group) => (
        <div key={group.monthKey} className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-ink flex items-center gap-2 px-1">
            <Calendar className="h-4 w-4 text-ink" />
            <span>{group.monthLabel}</span>
            <span className="text-xs font-semibold text-secondary">
              ({group.sessions.length} {group.sessions.length === 1 ? 'session' : 'sessions'})
            </span>
          </h2>

          <div className="space-y-2.5">
            {group.sessions.map((session) => (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 overflow-hidden rounded-[20px] border border-hairline bg-canvas p-4 text-left transition-all hover:border-neutral-300 hover:shadow-xs active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink">
                      {session.formattedDate}
                    </span>
                    <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-[10px] font-bold uppercase text-secondary">
                      {session.gym === 'home' ? 'Home Gym' : 'College Gym'}
                    </span>
                  </div>

                  <h3 className="mt-1 font-heading text-base font-bold text-ink group-hover:text-neutral-700">
                    {session.splitName}
                  </h3>

                  <p className="mt-0.5 text-xs text-secondary">
                    {session.exercisesCount} {session.exercisesCount === 1 ? 'exercise' : 'exercises'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-hairline/60 pt-2 sm:border-t-0 sm:pt-0">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-ink">
                      <Dumbbell className="h-3.5 w-3.5 text-secondary" />
                      <span>{session.totalSets} sets</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-ink">
                      <Flame className="h-3.5 w-3.5 text-ink fill-mint" />
                      <span>{session.totalVolumeKg} kg</span>
                    </div>

                    {session.durationMin > 0 && (
                      <div className="flex items-center gap-1 text-secondary">
                        <Clock className="h-3.5 w-3.5 text-muted" />
                        <span>{session.durationMin}m</span>
                      </div>
                    )}
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft text-secondary group-hover:bg-ink group-hover:text-white transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
