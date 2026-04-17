import { useState, useCallback } from 'react'
import { Camera, BASE_PIXELS_PER_UNIT } from './coordinateSystem'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3

export function useCamera(initialZoom = 1) {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: initialZoom })

  const pan = useCallback((dx: number, dy: number) => {
    setCamera(c => {
      const ppu = BASE_PIXELS_PER_UNIT * c.zoom
      return { ...c, x: c.x + dx / ppu, y: c.y + dy / ppu }
    })
  }, [])

  const zoom = useCallback(
    (delta: number, pivotScreenX: number, pivotScreenY: number, screenW: number, screenH: number) => {
      setCamera(c => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, c.zoom * (1 - delta * 0.001)))
        const ppu = BASE_PIXELS_PER_UNIT * c.zoom
        const pivotWorldX = (pivotScreenX - screenW / 2) / ppu + c.x
        const pivotWorldY = (pivotScreenY - screenH / 2) / ppu + c.y
        const scale = newZoom / c.zoom
        return {
          zoom: newZoom,
          x: pivotWorldX + (c.x - pivotWorldX) / scale,
          y: pivotWorldY + (c.y - pivotWorldY) / scale,
        }
      })
    },
    []
  )

  const reset = useCallback(() => setCamera({ x: 0, y: 0, zoom: initialZoom }), [initialZoom])

  return { camera, pan, zoom, reset }
}
