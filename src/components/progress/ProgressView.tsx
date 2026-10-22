'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import {
  Award,
  Flame,
  Activity,
  Zap,
  Clock,
} from 'lucide-react'
import clsx from 'clsx'
import { useIsMounted } from '@/lib/use-mounted'
import { useTheme } from '@/components/theme/ThemeProvider'
import type {
  ExerciseOption,
  ProgressMetric,
  ProgressRange,
  WeeklyCardioPoint,
  CardioEntryItem,
} from '@/lib/data/progress'
import { formatDateDisplay } from '@/lib/time'
import { calculateEpley1RM } from '@/lib/prs'
import type { Database } from '@/types/database'

type SetRow = Database['public']['Tables']['sets']['Row']

interface ProgressViewProps {
  todayStr: string
  exercises: ExerciseOption[]
  allSets: (SetRow & { session_date: string; gym: string })[]
  cardioWeekly: WeeklyCardioPoint[]
  cardioRecent: CardioEntryItem[]
}

const METRICS: { key: ProgressMetric; label: string; unit: string }[] = [
  { key: 'heaviest_weight', label: 'Heaviest Weight', unit: 'kg' },
  { key: 'one_rep_max', label: 'One Rep Max', unit: 'kg' },
  { key: 'best_volume', label: 'Best Volume', unit: 'kg' },
  { key: 'most_reps', label: '# of Reps', unit: 'reps' },
]

const RANGES: ProgressRange[] = ['1M', '3M', '6M', '1Y', 'ALL']

export function ProgressView({
  todayStr,
  exercises,
  allSets,
  cardioWeekly,
  cardioRecent,
}: ProgressViewProps) {
  const mounted = useIsMounted()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [mainTab, setMainTab] = useState<'lifting' | 'cardio'>('lifting')

  // Selected exercise (default to first exercise with logged sets, or first in list)
  const defaultExerciseId = useMemo(() => {
    const exWithSets = exercises.find((e) =>
      allSets.some((s) => s.exercise_id === e.id)
    )
    return exWithSets ? exWithSets.id : exercises[0]?.id || ''
  }, [exercises, allSets])

  const [selectedExerciseId, setSelectedExerciseId] = useState(defaultExerciseId)
  const [metric, setMetric] = useState<ProgressMetric>('heaviest_weight')
  const [range, setRange] = useState<ProgressRange>('ALL')
  const [combineGyms, setCombineGyms] = useState(true)

  // Find currently selected exercise
  const currentExercise = useMemo(
    () => exercises.find((e) => e.id === selectedExerciseId) || exercises[0],
    [exercises, selectedExerciseId]
  )

  // Get matching sets for current exercise (and combine gyms if toggled)
  const relevantSets = useMemo(() => {
    if (!currentExercise) return []

    const matchingExerciseIds = new Set<string>()
    if (combineGyms && currentExercise.canonical_slug) {
      exercises
        .filter((e) => e.canonical_slug === currentExercise.canonical_slug)
        .forEach((e) => matchingExerciseIds.add(e.id))
    } else {
      matchingExerciseIds.add(currentExercise.id)
    }

    return allSets.filter(
      (s) => matchingExerciseIds.has(s.exercise_id) && !s.is_warmup
    )
  }, [currentExercise, combineGyms, exercises, allSets])

  // Filter sets by date range
  const filteredSets = useMemo(() => {
    if (range === 'ALL' || !todayStr) return relevantSets

    const now = new Date(`${todayStr}T12:00:00Z`)
    let daysToSubtract = 30
    if (range === '3M') daysToSubtract = 90
    if (range === '6M') daysToSubtract = 180
    if (range === '1Y') daysToSubtract = 365

    const cutoff = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    return relevantSets.filter((s) => s.session_date >= cutoffStr)
  }, [relevantSets, range, todayStr])

  // Compute session-level data points for the selected metric
  const chartData = useMemo(() => {
    // Group sets by session_date
    const sessionMap = new Map<string, SetRow[]>()
    for (const s of filteredSets) {
      const arr = sessionMap.get(s.session_date) || []
      arr.push(s)
      sessionMap.set(s.session_date, arr)
    }

    // Sort dates ascending
    const sortedDates = Array.from(sessionMap.keys()).sort((a, b) =>
      a.localeCompare(b)
    )

    const points: Array<{
      date: string
      formattedDate: string
      value: number
      isPr: boolean
    }> = []

    let runningMax = 0
    for (let sessionIdx = 0; sessionIdx < sortedDates.length; sessionIdx++) {
      const dateStr = sortedDates[sessionIdx]
      const setsInSession = sessionMap.get(dateStr) || []
      let sessionValue = 0

      if (metric === 'heaviest_weight') {
        sessionValue = Math.max(...setsInSession.map((s) => Number(s.weight)))
      } else if (metric === 'one_rep_max') {
        sessionValue = Math.max(
          ...setsInSession.map((s) => calculateEpley1RM(Number(s.weight), s.reps))
        )
      } else if (metric === 'best_volume') {
        sessionValue = Math.max(
          ...setsInSession.map((s) => Math.round(Number(s.weight) * s.reps))
        )
      } else if (metric === 'most_reps') {
        sessionValue = setsInSession.reduce((acc, s) => acc + s.reps, 0)
      }

      const isPr = sessionIdx > 0 && sessionValue > runningMax
      if (sessionValue > runningMax) {
        runningMax = sessionValue
      }

      points.push({
        date: dateStr,
        formattedDate: formatDateDisplay(dateStr),
        value: sessionValue,
        isPr,
      })
    }

    return points
  }, [filteredSets, metric])

  // Calculate Records Board (all-time best for all 4 metrics)
  const records = useMemo(() => {
    let heaviest = { value: 0, date: null as string | null }
    let orm = { value: 0, date: null as string | null }
    let volume = { value: 0, date: null as string | null }
    let maxReps = { value: 0, date: null as string | null }

    for (const s of relevantSets) {
      const w = Number(s.weight)
      const r = s.reps
      const calc1rm = calculateEpley1RM(w, r)
      const vol = Math.round(w * r)

      if (w > heaviest.value) heaviest = { value: w, date: s.session_date }
      if (calc1rm > orm.value) orm = { value: calc1rm, date: s.session_date }
      if (vol > volume.value) volume = { value: vol, date: s.session_date }
      if (r > maxReps.value) maxReps = { value: r, date: s.session_date }
    }

    return {
      heaviest: {
        value: heaviest.value,
        formattedDate: heaviest.date ? formatDateDisplay(heaviest.date) : '—',
      },
      orm: {
        value: orm.value,
        formattedDate: orm.date ? formatDateDisplay(orm.date) : '—',
      },
      volume: {
        value: volume.value,
        formattedDate: volume.date ? formatDateDisplay(volume.date) : '—',
      },
      maxReps: {
        value: maxReps.value,
        formattedDate: maxReps.date ? formatDateDisplay(maxReps.date) : '—',
      },
    }
  }, [relevantSets])

  return (
    <div className="space-y-6">
      {/* Top Header & Main Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Analyze Progress
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-secondary">
            Charts, personal records, and cardio endurance over time.
          </p>
        </div>

        {/* Lifting / Cardio Tab Switcher */}
        <div className="inline-flex rounded-full border border-hairline bg-surface-soft p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMainTab('lifting')}
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all',
              mainTab === 'lifting'
                ? 'bg-ink text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-secondary hover:text-ink'
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Lifting</span>
          </button>
          <button
            type="button"
            onClick={() => setMainTab('cardio')}
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all',
              mainTab === 'cardio'
                ? 'bg-ink text-white dark:bg-white dark:text-black shadow-xs'
                : 'text-secondary hover:text-ink'
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Cardio</span>
          </button>
        </div>
      </div>

      {mainTab === 'lifting' ? (
        <>
          {/* Exercise Picker Card */}
          <div className="rounded-[24px] border border-hairline bg-canvas p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <label htmlFor="exercise-picker" className="text-xs font-bold uppercase tracking-wider text-secondary">
                Select Exercise
              </label>

              {/* Combine Gyms Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-secondary">
                <input
                  type="checkbox"
                  checked={combineGyms}
                  onChange={(e) => setCombineGyms(e.target.checked)}
                  className="h-4 w-4 rounded accent-ink"
                />
                <span>Combine Home & College records</span>
              </label>
            </div>

            {/* Searchable Select Input */}
            <div className="relative">
              <select
                id="exercise-picker"
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-hairline bg-surface-soft/60 px-4 py-3 text-sm font-bold text-ink shadow-2xs focus:border-ink focus:outline-none focus:ring-2 focus:ring-mint transition-all"
              >
                {exercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.gym === 'home' ? 'Home' : 'College'}
                    {e.machine_model ? ` · ${e.machine_model}` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metric Chips & Range Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Metric Chips (Active = Black Pill per CONTEXT §9.3) */}
            <div className="flex flex-wrap gap-1.5">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMetric(m.key)}
                  className={clsx(
                    'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95',
                    metric === m.key
                      ? 'bg-ink text-white dark:bg-white dark:text-black shadow-xs'
                      : 'border border-hairline bg-canvas text-secondary hover:text-ink hover:bg-surface-soft'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Range Selector: 1M · 3M · 6M · 1Y · ALL */}
            <div className="inline-flex rounded-full border border-hairline bg-surface-soft p-0.5 self-start sm:self-auto">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={clsx(
                    'rounded-full px-2.5 py-1 text-xs font-bold transition-all',
                    range === r
                      ? 'bg-ink text-white dark:bg-white dark:text-black shadow-xs'
                      : 'text-secondary hover:text-ink'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Line Chart */}
          <div className="overflow-hidden rounded-[24px] border border-hairline bg-canvas p-4 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">
                  {METRICS.find((m) => m.key === metric)?.label} Trend
                </h2>
                <p className="text-xs text-secondary">
                  {currentExercise?.name} · {combineGyms ? 'Combined gyms' : `${currentExercise?.gym} gym`}
                </p>
              </div>

              {chartData.length > 0 && (
                <span className="rounded-full bg-canvas-mint px-3 py-1 text-xs font-bold text-ink border border-mint/40">
                  {chartData.length} sessions
                </span>
              )}
            </div>

            <div className="h-64 sm:h-80 w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-surface-soft/30 p-6 text-center">
                  <Flame className="h-8 w-8 text-muted mb-2" />
                  <p className="font-heading text-sm font-bold text-ink">
                    No Sets Logged for this Exercise
                  </p>
                  <p className="mt-1 text-xs text-secondary max-w-xs">
                    Log your first working set in Today to see your performance curve and PR badges plotted here.
                  </p>
                </div>
              ) : mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={isDark ? '#222834' : '#e5e7eb'} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="formattedDate"
                      stroke={isDark ? '#94a3b8' : '#86909c'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#94a3b8' : '#86909c'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit={` ${METRICS.find((m) => m.key === metric)?.unit}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload
                          return (
                            <div className="rounded-xl border border-hairline bg-ink px-3 py-2 text-white dark:bg-[#141720] shadow-md">
                              <p className="text-[10px] font-semibold text-neutral-300">
                                {pt.formattedDate}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-heading text-sm font-bold text-mint">
                                  {pt.value} {METRICS.find((m) => m.key === metric)?.unit}
                                </span>
                                {pt.isPr && (
                                  <span className="rounded bg-mint px-1.5 py-0.2 text-[10px] font-black text-black">
                                    PR
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={isDark ? '#00f0a0' : '#000000'}
                      strokeWidth={2.5}
                      dot={(props) => {
                        const { cx, cy, payload } = props
                        const isPr = payload.isPr
                        return (
                          <circle
                            key={`${payload.date}-${cx}`}
                            cx={cx}
                            cy={cy}
                            r={isPr ? 6 : 4.5}
                            fill={isPr ? '#00f0a0' : isDark ? '#141720' : '#ffffff'}
                            stroke={isDark ? (isPr ? '#090a0f' : '#00f0a0') : '#000000'}
                            strokeWidth={isPr ? 2.5 : 2}
                          />
                        )
                      }}
                      activeDot={{
                        fill: '#00f0a0',
                        stroke: isDark ? '#090a0f' : '#000000',
                        strokeWidth: 2.5,
                        r: 7,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-secondary">
                  Loading chart…
                </div>
              )}
            </div>
          </div>

          {/* Hevy-Style Records Board */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-ink" />
              <h2 className="font-heading text-lg font-bold text-ink">Records Board</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Heaviest Weight */}
              <div className="rounded-[20px] border border-hairline bg-canvas p-4 shadow-2xs">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
                  Heaviest Weight
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-bold text-ink">
                    {records.heaviest.value || '—'}
                  </span>
                  <span className="text-xs font-bold text-secondary">kg</span>
                </div>
                <span className="mt-1 block text-[11px] text-muted truncate">
                  {records.heaviest.formattedDate}
                </span>
              </div>

              {/* One Rep Max */}
              <div className="rounded-[20px] border border-hairline bg-canvas p-4 shadow-2xs">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
                  One Rep Max
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-bold text-ink">
                    {records.orm.value || '—'}
                  </span>
                  <span className="text-xs font-bold text-secondary">kg</span>
                </div>
                <span className="mt-1 block text-[11px] text-muted truncate">
                  {records.orm.formattedDate}
                </span>
              </div>

              {/* Best Volume */}
              <div className="rounded-[20px] border border-hairline bg-canvas p-4 shadow-2xs">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
                  Best Volume
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-bold text-ink">
                    {records.volume.value || '—'}
                  </span>
                  <span className="text-xs font-bold text-secondary">kg</span>
                </div>
                <span className="mt-1 block text-[11px] text-muted truncate">
                  {records.volume.formattedDate}
                </span>
              </div>

              {/* Most Reps */}
              <div className="rounded-[20px] border border-hairline bg-canvas p-4 shadow-2xs">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-secondary">
                  Most Reps (Set)
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-bold text-ink">
                    {records.maxReps.value || '—'}
                  </span>
                  <span className="text-xs font-bold text-secondary">reps</span>
                </div>
                <span className="mt-1 block text-[11px] text-muted truncate">
                  {records.maxReps.formattedDate}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Cardio Analytics Tab */
        <div className="space-y-6">
          {/* Weekly Cardio Minutes */}
          <div className="overflow-hidden rounded-[24px] border border-hairline bg-canvas p-4 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-ink" />
                <h2 className="font-heading text-lg font-bold text-ink">
                  Weekly Cardio Volume (Minutes)
                </h2>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              {cardioWeekly.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="font-heading text-sm font-bold text-ink">No Cardio Logged</p>
                  <p className="text-xs text-secondary mt-1">Log your treadmill or cardio sessions on the Today tab.</p>
                </div>
              ) : mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cardioWeekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke={isDark ? '#222834' : '#e5e7eb'} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="weekLabel"
                      stroke={isDark ? '#94a3b8' : '#86909c'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#94a3b8' : '#86909c'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit=" min"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload
                          return (
                            <div className="rounded-xl border border-hairline bg-ink px-3 py-2 text-white dark:bg-[#141720] shadow-md">
                              <p className="text-[10px] text-neutral-300">{d.weekLabel}</p>
                              <p className="font-heading text-sm font-bold text-mint">
                                {d.totalMinutes} minutes
                              </p>
                              <p className="text-xs text-secondary">
                                Avg Speed: {d.avgSpeed} km/h
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="totalMinutes" fill="#00f0a0" stroke={isDark ? '#00f0a0' : '#000000'} strokeWidth={1.5} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          {/* Recent Cardio Table */}
          <div className="overflow-hidden rounded-[24px] border border-hairline bg-canvas p-4 sm:p-6 shadow-2xs">
            <h2 className="font-heading text-lg font-bold text-ink mb-4">
              Recent Cardio Entries
            </h2>

            {cardioRecent.length === 0 ? (
              <p className="text-xs text-secondary">No cardio entries recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline text-[11px] font-bold uppercase text-secondary">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Machine</th>
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Speed</th>
                      <th className="pb-2">Incline</th>
                      <th className="pb-2">Est. Dist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {cardioRecent.map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-soft/40">
                        <td className="py-2.5 font-semibold text-ink">
                          {formatDateDisplay(entry.date)}
                        </td>
                        <td className="py-2.5 text-secondary">{entry.machine}</td>
                        <td className="py-2.5 font-bold text-ink">
                          {entry.durationMin} min
                        </td>
                        <td className="py-2.5 text-secondary">{entry.speedKmh} km/h</td>
                        <td className="py-2.5 text-secondary">{entry.inclinePct}%</td>
                        <td className="py-2.5 font-bold text-ink">
                          {entry.distanceKm} km
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
