export const UNITS_PER_TILE = 4
export const BASE_PIXELS_PER_UNIT = 32

export interface Camera {
  x: number   // world center X in game units
  y: number   // world center Y in game units
  zoom: number // 1 = default, clamped 0.25–3
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: Camera,
  screenW: number,
  screenH: number
): { x: number; y: number } {
  const ppu = BASE_PIXELS_PER_UNIT * camera.zoom
  return {
    x: (worldX - camera.x) * ppu + screenW / 2,
    y: (worldY - camera.y) * ppu + screenH / 2,
  }
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera,
  screenW: number,
  screenH: number
): { x: number; y: number } {
  const ppu = BASE_PIXELS_PER_UNIT * camera.zoom
  return {
    x: (screenX - screenW / 2) / ppu + camera.x,
    y: (screenY - screenH / 2) / ppu + camera.y,
  }
}

export function unitsToPx(units: number, zoom: number): number {
  return units * BASE_PIXELS_PER_UNIT * zoom
}
