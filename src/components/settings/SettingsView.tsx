'use client'

import { useState, useTransition } from 'react'
import {
  Archive,
  ArchiveRestore,
  Dumbbell,
  Edit2,
  LogOut,
  Plus,
  Shield,
  Loader2,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { signOutAction } from '@/lib/actions/auth'
import {
  addCustomExerciseAction,
  updateExerciseSettingsAction,
  toggleArchiveExerciseAction,
  setDefaultGymAction,
} from '@/lib/actions/settings'
import type { SettingsPageData, ExerciseRow } from '@/lib/data/settings'
import type { GymType } from '@/lib/catalog'
import { ALL_MUSCLE_GROUPS, type MuscleGroup } from '@/lib/routine'

interface SettingsViewProps {
  data: SettingsPageData
}

export function SettingsView({ data }: SettingsViewProps) {
  const [gymTab, setGymTab] = useState<GymType>(data.activeGym)
  const [isPending, startTransition] = useTransition()

  // Exercise modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<ExerciseRow | null>(null)

  // Form states for Add Exercise
  const [newName, setNewName] = useState('')
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('back')
  const [newEquipment, setNewEquipment] = useState('stack_machine')
  const [newMachine, setNewMachine] = useState('')
  const [newUnit, setNewUnit] = useState<'kg' | 'plates'>('kg')
  const [newKgPerPlate, setNewKgPerPlate] = useState('')
  const [newBarKg, setNewBarKg] = useState('')

  // Form states for Edit Exercise
  const [editName, setEditName] = useState('')
  const [editMachine, setEditMachine] = useState('')
  const [editUnit, setEditUnit] = useState<'kg' | 'plates'>('kg')
  const [editKgPerPlate, setEditKgPerPlate] = useState('')
  const [editBarKg, setEditBarKg] = useState('')

  const activeList = gymTab === 'home' ? data.homeExercises : data.collegeExercises

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction()
    })
  }

  const handleSetDefaultGym = (targetGym: GymType) => {
    startTransition(async () => {
      await setDefaultGymAction(targetGym)
    })
  }

  const handleOpenEdit = (ex: ExerciseRow) => {
    setEditingExercise(ex)
    setEditName(ex.name)
    setEditMachine(ex.machine_model || '')
    setEditUnit((ex.default_input as 'kg' | 'plates') || 'kg')
    setEditKgPerPlate(ex.kg_per_plate ? ex.kg_per_plate.toString() : '')
    setEditBarKg(ex.bar_kg ? ex.bar_kg.toString() : '')
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExercise) return

    startTransition(async () => {
      await updateExerciseSettingsAction({
        id: editingExercise.id,
        name: editName,
        machineModel: editMachine,
        defaultInput: editUnit,
        kgPerPlate: editKgPerPlate ? parseFloat(editKgPerPlate) : null,
        barKg: editBarKg ? parseFloat(editBarKg) : null,
      })
      setEditingExercise(null)
    })
  }

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    startTransition(async () => {
      await addCustomExerciseAction({
        name: newName,
        gym: gymTab,
        muscleGroup: newMuscle,
        equipment: newEquipment,
        machineModel: newMachine,
        defaultInput: newUnit,
        kgPerPlate: newKgPerPlate ? parseFloat(newKgPerPlate) : null,
        barKg: newBarKg ? parseFloat(newBarKg) : null,
      })
      setAddModalOpen(false)
      setNewName('')
      setNewMachine('')
      setNewKgPerPlate('')
      setNewBarKg('')
    })
  }

  const handleToggleArchive = (exerciseId: string, currentArchived: boolean) => {
    startTransition(async () => {
      await toggleArchiveExerciseAction(exerciseId, !currentArchived)
    })
  }

  return (
    <div className="space-y-6">
      {/* Account & Default Gym Card */}
      <div className="rounded-[28px] border border-hairline bg-canvas p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-ink" />
              <h2 className="font-heading text-lg font-bold text-ink">Account & Preferences</h2>
            </div>
            <p className="text-xs text-secondary">
              Logged in as <span className="font-bold text-ink">{data.userEmail}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-soft px-4 py-2 text-xs font-bold text-secondary hover:text-ink hover:bg-canvas transition-colors self-start sm:self-auto active:scale-95 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        {/* Default Gym Selection */}
        <div className="border-t border-hairline/80 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
              Active Gym Preference
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Determines default catalog view on login and app open.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-hairline bg-surface-soft p-1">
            <button
              type="button"
              onClick={() => handleSetDefaultGym('home')}
              className={clsx(
                'rounded-full px-4 py-1.5 text-xs font-bold transition-all',
                data.activeGym === 'home'
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-secondary hover:text-ink'
              )}
            >
              Home Gym
            </button>
            <button
              type="button"
              onClick={() => handleSetDefaultGym('college')}
              className={clsx(
                'rounded-full px-4 py-1.5 text-xs font-bold transition-all',
                data.activeGym === 'college'
                  ? 'bg-ink text-white shadow-xs'
                  : 'text-secondary hover:text-ink'
              )}
            >
              College Gym
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Catalog Management Card */}
      <div className="rounded-[28px] border border-hairline bg-canvas p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-4 w-4 text-ink" />
              <h2 className="font-heading text-lg font-bold text-ink">Manage Exercises</h2>
            </div>
            <p className="text-xs text-secondary">
              Configure kg-per-plate, bar weight, custom machines, and exercise archiving.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 active:scale-95 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add exercise</span>
          </button>
        </div>

        {/* Gym Catalog Selector */}
        <div className="flex gap-2 border-b border-hairline/80 pb-3">
          <button
            type="button"
            onClick={() => setGymTab('home')}
            className={clsx(
              'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all',
              gymTab === 'home'
                ? 'bg-ink text-white shadow-xs'
                : 'border border-hairline text-secondary hover:text-ink'
            )}
          >
            Home Gym ({data.homeExercises.length})
          </button>
          <button
            type="button"
            onClick={() => setGymTab('college')}
            className={clsx(
              'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all',
              gymTab === 'college'
                ? 'bg-ink text-white shadow-xs'
                : 'border border-hairline text-secondary hover:text-ink'
            )}
          >
            College Gym ({data.collegeExercises.length})
          </button>
        </div>

        {/* Exercises List */}
        <div className="divide-y divide-hairline">
          {activeList.map((ex) => (
            <div
              key={ex.id}
              className={clsx(
                'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 transition-colors',
                ex.is_archived && 'opacity-50'
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-sm sm:text-base">
                    {ex.name}
                  </span>
                  {ex.is_archived && (
                    <span className="rounded-md bg-neutral-200 px-1.5 py-0.2 text-[10px] font-bold uppercase text-neutral-700">
                      Archived
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-secondary">
                  <span className="capitalize font-medium">
                    {ex.machine_model || ex.equipment.replace('_', ' ')}
                  </span>
                  <span className="text-muted">·</span>
                  <span className="rounded bg-surface-soft px-1.5 py-0.2 text-[10px] font-bold uppercase">
                    {ex.muscle_group}
                  </span>
                  <span className="text-muted">·</span>
                  <span>Default: <strong className="text-ink">{ex.default_input}</strong></span>
                  {ex.kg_per_plate && (
                    <>
                      <span className="text-muted">·</span>
                      <span>{ex.kg_per_plate} kg/plate</span>
                    </>
                  )}
                  {ex.bar_kg && (
                    <>
                      <span className="text-muted">·</span>
                      <span>{ex.bar_kg} kg bar</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(ex)}
                  className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-surface-soft px-2.5 py-1 text-xs font-semibold text-secondary hover:text-ink hover:bg-canvas active:scale-95"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Configure</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleArchive(ex.id, ex.is_archived)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-hairline text-secondary hover:text-ink active:scale-95"
                  title={ex.is_archived ? 'Unarchive exercise' : 'Archive exercise'}
                >
                  {ex.is_archived ? (
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  ) : (
                    <Archive className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Exercise Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[28px] border border-hairline bg-canvas p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-ink">
                Add Custom Exercise ({gymTab === 'home' ? 'Home Gym' : 'College Gym'})
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Dumbbell Press"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm font-bold text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-mint"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Muscle Group
                  </label>
                  <select
                    value={newMuscle}
                    onChange={(e) => setNewMuscle(e.target.value as MuscleGroup)}
                    className="w-full rounded-xl border border-hairline bg-surface-soft px-3 py-2 text-xs font-bold text-ink"
                  >
                    {ALL_MUSCLE_GROUPS.map((g) => (
                      <option key={g} value={g} className="capitalize">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Equipment
                  </label>
                  <select
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-surface-soft px-3 py-2 text-xs font-bold text-ink"
                  >
                    <option value="stack_machine">Stack Machine</option>
                    <option value="plate_machine">Plate Machine</option>
                    <option value="cable">Cable</option>
                    <option value="dumbbell">Dumbbell</option>
                    <option value="barbell">Barbell</option>
                    <option value="bodyweight">Bodyweight</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Machine Model (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Turbuster E916"
                  value={newMachine}
                  onChange={(e) => setNewMachine(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-xs font-medium text-ink"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Default Unit
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as 'kg' | 'plates')}
                    className="w-full rounded-xl border border-hairline bg-surface-soft px-2 py-2 text-xs font-bold text-ink"
                  >
                    <option value="kg">kg</option>
                    <option value="plates">plates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Kg / Plate
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 5"
                    value={newKgPerPlate}
                    onChange={(e) => setNewKgPerPlate(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-canvas px-2.5 py-2 text-xs font-bold text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Bar Weight
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 20"
                    value={newBarKg}
                    onChange={(e) => setNewBarKg(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-canvas px-2.5 py-2 text-xs font-bold text-ink"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-bold text-white shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Add to catalog</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exercise Modal */}
      {editingExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[28px] border border-hairline bg-canvas p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-ink">
                Configure Exercise
              </h3>
              <button
                type="button"
                onClick={() => setEditingExercise(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm font-bold text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Machine Model
                </label>
                <input
                  type="text"
                  value={editMachine}
                  onChange={(e) => setEditMachine(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-xs font-medium text-ink"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Default Unit
                  </label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value as 'kg' | 'plates')}
                    className="w-full rounded-xl border border-hairline bg-surface-soft px-2 py-2 text-xs font-bold text-ink"
                  >
                    <option value="kg">kg</option>
                    <option value="plates">plates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Kg / Plate
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 5"
                    value={editKgPerPlate}
                    onChange={(e) => setEditKgPerPlate(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-canvas px-2.5 py-2 text-xs font-bold text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Bar Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 20"
                    value={editBarKg}
                    onChange={(e) => setEditBarKg(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-canvas px-2.5 py-2 text-xs font-bold text-ink"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-bold text-white shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Save configuration</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
