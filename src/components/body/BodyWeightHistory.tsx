'use client'

import { useState, useTransition } from 'react'
import { Edit2, Trash2, Loader2, Calendar } from 'lucide-react'
import { deleteWeightAction } from '@/lib/actions/body'
import { AddWeightModal } from './AddWeightModal'
import type { BodyWeightRow } from '@/lib/data/body'
import { formatDateDisplay, formatRelativeDays } from '@/lib/time'

interface BodyWeightHistoryProps {
  weights: BodyWeightRow[]
  todayStr: string
}

export function BodyWeightHistory({
  weights,
  todayStr,
}: BodyWeightHistoryProps) {
  const [editingItem, setEditingItem] = useState<BodyWeightRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (weights.length === 0) {
    return null
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) return
    setDeletingId(id)
    startTransition(async () => {
      await deleteWeightAction(id)
      setDeletingId(null)
    })
  }

  return (
    <>
      <div className="mt-8 overflow-hidden rounded-[24px] border border-hairline bg-canvas p-4 sm:p-6 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ink" />
            <h2 className="font-heading text-lg font-bold text-ink">Measurement History</h2>
          </div>
        </div>

        <div className="divide-y divide-hairline">
          {weights.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between py-3.5 transition-colors hover:bg-surface-soft/40 px-2 rounded-xl"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">
                    {formatDateDisplay(row.measured_on)}
                  </span>
                  <span className="rounded-md bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                    {formatRelativeDays(row.measured_on, todayStr)}
                  </span>
                </div>
                {row.note && (
                  <p className="mt-0.5 text-xs text-secondary italic">
                    &ldquo;{row.note}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="font-heading text-base sm:text-lg font-bold text-ink">
                  {row.weight_kg}{' '}
                  <span className="text-xs font-semibold text-secondary">kg</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingItem(row)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:text-ink hover:bg-surface-soft active:scale-95"
                    aria-label={`Edit weight for ${row.measured_on}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    disabled={isPending && deletingId === row.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-red-500 hover:bg-red-50 active:scale-95 disabled:opacity-50"
                    aria-label={`Delete weight for ${row.measured_on}`}
                  >
                    {isPending && deletingId === row.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingItem && (
        <AddWeightModal
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          editingEntry={editingItem}
        />
      )}
    </>
  )
}
