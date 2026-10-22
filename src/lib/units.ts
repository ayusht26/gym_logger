/**
 * Pure functions for weight unit handling and conversion.
 * 
 * Rules (CONTEXT.md §8.1):
 * - kg -> as is.
 * - plates + stack/cable/plate_machine -> plates * kg_per_plate.
 * - plates + barbell -> bar_kg + 2 * plates * kg_per_plate (plates per side).
 * - If kg_per_plate is null, plates cannot be converted to kg (returns null).
 * - Dumbbell weight = kg per dumbbell (one hand).
 */

export interface WeightConversionParams {
  weight: number
  weightUnit: 'kg' | 'plates'
  equipment?: string | null
  kgPerPlate?: number | null
  barKg?: number | null
}

export interface WeightConversionResult {
  weightKg: number | null
  canConvert: boolean
  displayLabel: string
}

/**
 * Converts a weight entry to kilograms if possible.
 */
export function convertWeightToKg({
  weight,
  weightUnit,
  equipment = '',
  kgPerPlate = null,
  barKg = 20,
}: WeightConversionParams): WeightConversionResult {
  if (weight < 0) {
    return { weightKg: 0, canConvert: true, displayLabel: '0 kg' }
  }

  if (weightUnit === 'kg') {
    return {
      weightKg: weight,
      canConvert: true,
      displayLabel: `${weight} kg`,
    }
  }

  // Unit is 'plates'
  if (kgPerPlate === null || kgPerPlate === undefined || kgPerPlate <= 0) {
    return {
      weightKg: null,
      canConvert: false,
      displayLabel: `${weight} plate${weight === 1 ? '' : 's'}`,
    }
  }

  const eq = (equipment || '').toLowerCase().trim()
  const isBarbell = eq.includes('barbell') || eq.includes('smith')

  if (isBarbell) {
    const bar = barKg ?? 20
    // Barbell: weight represents plates per side
    const totalKg = bar + 2 * weight * kgPerPlate
    return {
      weightKg: totalKg,
      canConvert: true,
      displayLabel: `${totalKg} kg (${weight} pl/side)`,
    }
  }

  // Stack, cable, lever or selectorized plate machine
  const totalKg = weight * kgPerPlate
  return {
    weightKg: totalKg,
    canConvert: true,
    displayLabel: `${totalKg} kg (${weight} pl)`,
  }
}

/**
 * Formats a set weight for display in summary cards and tables.
 */
export function formatSetWeight(
  weight: number,
  weightUnit: 'kg' | 'plates',
  kgPerPlate?: number | null,
  equipment?: string | null,
  barKg?: number | null
): string {
  if (weightUnit === 'kg') {
    return `${weight} kg`
  }

  const conversion = convertWeightToKg({
    weight,
    weightUnit,
    equipment,
    kgPerPlate,
    barKg,
  })

  if (conversion.canConvert && conversion.weightKg !== null) {
    return `${conversion.weightKg} kg (${weight} pl)`
  }

  return `${weight} plate${weight === 1 ? '' : 's'}`
}
