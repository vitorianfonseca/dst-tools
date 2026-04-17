import { describe, test, expect } from 'vitest'
import { worldToScreen, screenToWorld, unitsToPx } from './coordinateSystem'

describe('coordinateSystem', () => {
  const camera = { x: 0, y: 0, zoom: 1 }

  test('world origin maps to screen center', () => {
    const r = worldToScreen(0, 0, camera, 800, 600)
    expect(r).toEqual({ x: 400, y: 300 })
  })

  test('worldToScreen: +1 unit = +32px at zoom 1', () => {
    const r = worldToScreen(1, 0, camera, 800, 600)
    expect(r.x).toBe(432)
    expect(r.y).toBe(300)
  })

  test('screenToWorld round-trips worldToScreen', () => {
    const screen = worldToScreen(5, -3, camera, 800, 600)
    const world = screenToWorld(screen.x, screen.y, camera, 800, 600)
    expect(world.x).toBeCloseTo(5)
    expect(world.y).toBeCloseTo(-3)
  })

  test('unitsToPx scales with zoom', () => {
    expect(unitsToPx(1, 1)).toBe(32)
    expect(unitsToPx(1, 2)).toBe(64)
    expect(unitsToPx(4, 1)).toBe(128)
  })

  test('worldToScreen respects camera offset', () => {
    const cam = { x: 5, y: 0, zoom: 1 }
    const r = worldToScreen(5, 0, cam, 800, 600)
    expect(r).toEqual({ x: 400, y: 300 })
  })
})
