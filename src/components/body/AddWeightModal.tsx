'use client'

import { useState, useTransition } from 'react'
import { X, Scale, Loader2 } from 'lucide-react'
import { addWeightAction, editWeightAction } from '@/lib/actions/body'
import type { BodyWeightRow } from '@/lib/data/body'
import { getTodayIST } from '@/lib/time'

interface AddWeightModalProps {
  isOpen: boolean
  onClose: () => void
  editingEntry?: BodyWeightRow | null
}

export function AddWeightModal({
  isOpen,
  onClose,
  editingEntry,
}: AddWeightModalProps) {
  const [date, setDate] = useState(editingEntry?.measured_on || getTodayIST())
  const [weightKg, setWeightKg] = useState<string>(
    editingEntry ? editingEntry.weight_kg.toString() : ''
  )
  const [note, setNote] = useState<string>(editingEntry?.note || '')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    const num = parseFloat(weightKg)

    if (isNaN(num) || num <= 0) {
      setErrorMsg('Please enter a valid weight in kg.')
      return
    }

    startTransition(async () => {
      let res
      if (editingEntry) {
        res = await editWeightAction({
          id: editingEntry.id,
          weightKg: num,
          note,
        })
      } else {
        res = await addWeightAction({
          measuredOn: date,
          weightKg: num,
          note,
        })
      }

      if (res.success) {
        onClose()
      } else {
        setErrorMsg(res.error || 'Failed to save weight.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-[28px] border border-hairline bg-canvas p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-black font-bold shadow-2xs">
              <Scale className="h-5 w-5 stroke-[2.2]" />
            </div>
            <h3 className="font-heading text-xl font-bold text-ink">
              {editingEntry ? 'Edit Weight' : 'Log Body Weight'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:text-ink hover:bg-surface-soft"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Measured On Date */}
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Date (IST)
            </label>
            <input
              type="date"
              value={date}
              disabled={Boolean(editingEntry)} // Date is immutable in edit mode
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-hairline bg-surface-soft/40 px-3 py-2 text-sm font-semibold text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-mint"
              required
            />
          </div>

          {/* Weight in kg */}
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="20"
              max="350"
              placeholder="e.g. 72.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2.5 text-base font-bold text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-mint"
              required
              autoFocus
            />
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Fasted morning weight"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-xs font-medium text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-bold text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-xs hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white dark:text-black" />
                  <span>Saving…</span>
                </>
              ) : (
                <span>Save weight</span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="w-full rounded-full border border-hairline py-2.5 text-xs font-semibold text-secondary hover:text-ink active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
