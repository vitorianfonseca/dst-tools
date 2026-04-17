import { describe, test, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCamera } from './useCamera'

describe('useCamera', () => {
  test('initial camera is at origin, zoom 1', () => {
    const { result } = renderHook(() => useCamera())
    expect(result.current.camera).toEqual({ x: 0, y: 0, zoom: 1 })
  })

  test('pan(32, 0) moves camera +1 unit on X at zoom 1', () => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.pan(32, 0))
    expect(result.current.camera.x).toBeCloseTo(1)
  })

  test('zoom clamps at MIN_ZOOM', () => {
    const { result } = renderHook(() => useCamera(0.3))
    act(() => result.current.zoom(100000, 400, 300, 800, 600))
    expect(result.current.camera.zoom).toBeGreaterThanOrEqual(0.25)
  })

  test('zoom clamps at MAX_ZOOM', () => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.zoom(-100000, 400, 300, 800, 600))
    expect(result.current.camera.zoom).toBeLessThanOrEqual(3)
  })

  test('reset returns to origin', () => {
    const { result } = renderHook(() => useCamera())
    act(() => result.current.pan(200, 100))
    act(() => result.current.reset())
    expect(result.current.camera).toEqual({ x: 0, y: 0, zoom: 1 })
  })
})
