import { describe, it, expect } from 'vitest'
import { convertWeightToKg, formatSetWeight } from './units'

describe('units: convertWeightToKg', () => {
  it('returns kg directly when unit is kg', () => {
    const res = convertWeightToKg({ weight: 65, weightUnit: 'kg' })
    expect(res.weightKg).toBe(65)
    expect(res.canConvert).toBe(true)
    expect(res.displayLabel).toBe('65 kg')
  })

  it('converts stack/cable plates to kg when kgPerPlate is specified', () => {
    const res = convertWeightToKg({
      weight: 8,
      weightUnit: 'plates',
      equipment: 'cable',
      kgPerPlate: 5,
    })
    expect(res.weightKg).toBe(40) // 8 * 5 = 40 kg
    expect(res.canConvert).toBe(true)
    expect(res.displayLabel).toBe('40 kg (8 pl)')
  })

  it('converts barbell plates using plates-per-side logic + bar weight', () => {
    // 3 plates per side with 20kg bar and 20kg plates
    // total = 20 + 2 * (3 * 20) = 140 kg
    const res = convertWeightToKg({
      weight: 3,
      weightUnit: 'plates',
      equipment: 'barbell',
      kgPerPlate: 20,
      barKg: 20,
    })
    expect(res.weightKg).toBe(140)
    expect(res.canConvert).toBe(true)
    expect(res.displayLabel).toBe('140 kg (3 pl/side)')
  })

  it('uses default 20kg bar when barKg is null for barbell', () => {
    const res = convertWeightToKg({
      weight: 2,
      weightUnit: 'plates',
      equipment: 'smith machine',
      kgPerPlate: 10,
      barKg: null,
    })
    // 20 + 2 * (2 * 10) = 60 kg
    expect(res.weightKg).toBe(60)
    expect(res.canConvert).toBe(true)
  })

  it('returns null and canConvert=false when kgPerPlate is null for plates', () => {
    const res = convertWeightToKg({
      weight: 5,
      weightUnit: 'plates',
      equipment: 'machine',
      kgPerPlate: null,
    })
    expect(res.weightKg).toBeNull()
    expect(res.canConvert).toBe(false)
    expect(res.displayLabel).toBe('5 plates')
  })

  it('handles 0 plates and 0 kg correctly', () => {
    const resZero = convertWeightToKg({ weight: 0, weightUnit: 'kg' })
    expect(resZero.weightKg).toBe(0)

    const resPlatesZero = convertWeightToKg({
      weight: 0,
      weightUnit: 'plates',
      equipment: 'cable',
      kgPerPlate: 5,
    })
    expect(resPlatesZero.weightKg).toBe(0)
  })
})

describe('units: formatSetWeight', () => {
  it('formats kg accurately', () => {
    expect(formatSetWeight(75, 'kg')).toBe('75 kg')
  })

  it('formats convertible plates accurately', () => {
    expect(formatSetWeight(4, 'plates', 5, 'cable')).toBe('20 kg (4 pl)')
  })

  it('formats non-convertible plates with singular/plural plates suffix', () => {
    expect(formatSetWeight(1, 'plates', null)).toBe('1 plate')
    expect(formatSetWeight(6, 'plates', null)).toBe('6 plates')
  })
})
