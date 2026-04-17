import { describe, test, expect } from 'vitest'
import { getRadii, STRUCTURE_RADII } from './structureRadii'

describe('structureRadii', () => {
  test('fire-pit has heat and light radii', () => {
    const radii = getRadii('fire-pit')
    expect(radii).toHaveLength(2)
    expect(radii[0].label).toBe('Heat')
    expect(radii[0].radius).toBe(3.5)
    expect(radii[1].label).toBe('Light')
  })

  test('lightning-rod protection radius is 16 units', () => {
    const radii = getRadii('lightning-rod')
    expect(radii[0].radius).toBe(16)
  })

  test('unknown structure returns empty array', () => {
    expect(getRadii('does-not-exist')).toEqual([])
  })

  test('all radii have required fields', () => {
    Object.entries(STRUCTURE_RADII).forEach(([id, radii]) => {
      radii.forEach(r => {
        expect(r.label, `${id} missing label`).toBeTruthy()
        expect(r.radius, `${id} radius must be > 0`).toBeGreaterThan(0)
        expect(r.fillAlpha, `${id} fillAlpha must be 0-1`).toBeGreaterThan(0)
        expect(r.strokeAlpha, `${id} strokeAlpha must be 0-1`).toBeGreaterThan(0)
      })
    })
  })
})
