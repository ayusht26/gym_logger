'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Scale, TrendingUp } from 'lucide-react'
import type { BodyWeightRow } from '@/lib/data/body'
import { formatDateDisplay } from '@/lib/time'
import { useIsMounted } from '@/lib/use-mounted'
import { useTheme } from '@/components/theme/ThemeProvider'

interface BodyWeightChartProps {
  weights: BodyWeightRow[]
}

export function BodyWeightChart({ weights }: BodyWeightChartProps) {
  const mounted = useIsMounted()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  if (weights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-hairline bg-surface-soft/40 p-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-secondary shadow-2xs">
          <Scale className="h-6 w-6 stroke-[1.75]" />
        </div>
        <h3 className="font-heading text-base font-bold text-ink">No Weight Entries Yet</h3>
        <p className="mt-1 max-w-sm text-xs text-secondary">
          Log your body weight twice a month to track your progress and see your weight trends plotted here.
        </p>
      </div>
    )
  }

  const chartData = weights.map((w) => ({
    date: w.measured_on,
    formattedDate: formatDateDisplay(w.measured_on),
    weight: w.weight_kg,
  }))

  const minWeight = Math.floor(Math.min(...weights.map((w) => w.weight_kg)) - 2)
  const maxWeight = Math.ceil(Math.max(...weights.map((w) => w.weight_kg)) + 2)

  return (
    <div className="overflow-hidden rounded-[24px] border border-hairline bg-canvas p-4 sm:p-6 shadow-2xs">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-ink" />
          <h2 className="font-heading text-lg font-bold text-ink">Weight Progression</h2>
        </div>
        <span className="text-xs font-semibold text-secondary">
          {weights.length} {weights.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {mounted ? (
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
                domain={[minWeight, maxWeight]}
                stroke={isDark ? '#94a3b8' : '#86909c'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                unit=" kg"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-xl border border-hairline bg-ink px-3 py-2 text-white dark:bg-[#141720] shadow-md">
                        <p className="text-[10px] font-semibold text-neutral-300">
                          {data.formattedDate}
                        </p>
                        <p className="font-heading text-sm font-bold text-mint">
                          {data.weight} kg
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke={isDark ? '#00f0a0' : '#000000'}
                strokeWidth={2.5}
                dot={{
                  fill: '#00f0a0',
                  stroke: isDark ? '#090a0f' : '#000000',
                  strokeWidth: 2,
                  r: 4.5,
                }}
                activeDot={{
                  fill: '#00f0a0',
                  stroke: isDark ? '#090a0f' : '#000000',
                  strokeWidth: 2.5,
                  r: 6.5,
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
  )
}
