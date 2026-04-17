# DST-Accurate Pixi.js Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `PlanningCanvas` with a Pixi.js v8 canvas that uses DST's actual coordinate system, renders structure sprites with Y-sorting, shows influence radii, and validates placement distances.

**Architecture:** A new `DSTPixiCanvas` React component wraps a Pixi.js v8 `Application`. World coordinates use DST game units — the same `gridX`/`gridY` from the existing `PlacedStructure` type are treated as DST game units (1 tile = 4 units). Five rendering layers handle grid, radii, structures, and ghost preview. The existing `usePlacedStructures` hook is kept as-is for persistence.

**Tech Stack:** Pixi.js v8, React, TypeScript, Vitest

---

### Task 1: Install Pixi.js

**Files:**
- Modify: `package.json` (via npm)

- [ ] Run:
```bash
npm install pixi.js@8
```

- [ ] Verify:
```bash
node -e "console.log(require('./node_modules/pixi.js/package.json').version)"
```
Expected: `8.x.x`

- [ ] Commit:
```bash
git add package.json package-lock.json
git commit -m "chore: add pixi.js v8"
```

---

### Task 2: DST Coordinate System

**Files:**
- Create: `src/components/dst-canvas/coordinateSystem.ts`
- Create: `src/components/dst-canvas/coordinateSystem.test.ts`

- [ ] Create `src/components/dst-canvas/coordinateSystem.ts`:

```ts
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
```

- [ ] Create `src/components/dst-canvas/coordinateSystem.test.ts`:

```ts
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
    expect(unitsToPx(4, 1)).toBe(128) // 1 tile = 128px at zoom 1
  })

  test('worldToScreen respects camera offset', () => {
    const cam = { x: 5, y: 0, zoom: 1 }
    const r = worldToScreen(5, 0, cam, 800, 600)
    expect(r).toEqual({ x: 400, y: 300 }) // camera centered on world (5,0)
  })
})
```

- [ ] Run:
```bash
npm test -- coordinateSystem
```
Expected: 5 tests passing

- [ ] Commit:
```bash
git add src/components/dst-canvas/
git commit -m "feat: DST coordinate system with world/screen conversion"
```

---

### Task 3: Structure Radii Data

**Files:**
- Create: `src/components/dst-canvas/structureRadii.ts`
- Create: `src/components/dst-canvas/structureRadii.test.ts`

- [ ] Create `src/components/dst-canvas/structureRadii.ts`:

```ts
export interface RadiusDef {
  label: string
  radius: number  // DST game units
  color: number   // Pixi.js hex (0xRRGGBB)
  fillAlpha: number
  strokeAlpha: number
}

// Key: structure id (matches Structure.id from data/structures.ts)
export const STRUCTURE_RADII: Record<string, RadiusDef[]> = {
  'campfire': [
    { label: 'Heat', radius: 3.5, color: 0xff6600, fillAlpha: 0.12, strokeAlpha: 0.4 },
    { label: 'Light', radius: 5, color: 0xffaa00, fillAlpha: 0.06, strokeAlpha: 0.2 },
  ],
  'fire-pit': [
    { label: 'Heat', radius: 3.5, color: 0xff6600, fillAlpha: 0.12, strokeAlpha: 0.4 },
    { label: 'Light', radius: 5, color: 0xffaa00, fillAlpha: 0.06, strokeAlpha: 0.2 },
  ],
  'endothermic-fire-pit': [
    { label: 'Coolness', radius: 3.5, color: 0x88eeff, fillAlpha: 0.12, strokeAlpha: 0.4 },
  ],
  'lightning-rod': [
    { label: 'Protection', radius: 16, color: 0x4466ff, fillAlpha: 0.04, strokeAlpha: 0.25 },
  ],
  'ice-flingomatic': [
    { label: 'Range', radius: 12, color: 0x88ccff, fillAlpha: 0.07, strokeAlpha: 0.3 },
  ],
  'bee-box': [
    { label: 'Flower range', radius: 20, color: 0xffee44, fillAlpha: 0.03, strokeAlpha: 0.15 },
  ],
  'scaled-furnace': [
    { label: 'Heat', radius: 6, color: 0xff4400, fillAlpha: 0.1, strokeAlpha: 0.35 },
  ],
  'mushroom-light': [
    { label: 'Light', radius: 4, color: 0xaa88ff, fillAlpha: 0.08, strokeAlpha: 0.25 },
  ],
  'mushroom-light-bloom': [
    { label: 'Light', radius: 5, color: 0xaa88ff, fillAlpha: 0.08, strokeAlpha: 0.25 },
  ],
  'night-light': [
    { label: 'Light', radius: 4, color: 0xcc88ff, fillAlpha: 0.08, strokeAlpha: 0.25 },
  ],
  'houndius-shootius': [
    { label: 'Attack range', radius: 15, color: 0xff4444, fillAlpha: 0.04, strokeAlpha: 0.2 },
  ],
  'tooth-trap': [
    { label: 'Trigger radius', radius: 1, color: 0xff4444, fillAlpha: 0.15, strokeAlpha: 0.5 },
  ],
}

export function getRadii(structureId: string): RadiusDef[] {
  return STRUCTURE_RADII[structureId] ?? []
}
```

- [ ] Create `src/components/dst-canvas/structureRadii.test.ts`:

```ts
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
```

- [ ] Run:
```bash
npm test -- structureRadii
```
Expected: 4 tests passing

- [ ] Commit:
```bash
git add src/components/dst-canvas/structureRadii.ts src/components/dst-canvas/structureRadii.test.ts
git commit -m "feat: DST structure influence radii definitions"
```

---

### Task 4: Camera Hook

**Files:**
- Create: `src/components/dst-canvas/useCamera.ts`
- Create: `src/components/dst-canvas/useCamera.test.ts`

- [ ] Create `src/components/dst-canvas/useCamera.ts`:

```ts
import { useState, useCallback } from 'react'
import { Camera, BASE_PIXELS_PER_UNIT } from './coordinateSystem'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3

export function useCamera(initialZoom = 1) {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: initialZoom })

  const pan = useCallback((dx: number, dy: number) => {
    setCamera(c => {
      const ppu = BASE_PIXELS_PER_UNIT * c.zoom
      return { ...c, x: c.x - dx / ppu, y: c.y - dy / ppu }
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
```

- [ ] Create `src/components/dst-canvas/useCamera.test.ts`:

```ts
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
```

- [ ] Run:
```bash
npm test -- useCamera
```
Expected: 5 tests passing

- [ ] Commit:
```bash
git add src/components/dst-canvas/useCamera.ts src/components/dst-canvas/useCamera.test.ts
git commit -m "feat: camera hook with pan/zoom/reset"
```

---

### Task 5: GridLayer

**Files:**
- Create: `src/components/dst-canvas/layers/GridLayer.ts`

- [ ] Create `src/components/dst-canvas/layers/GridLayer.ts`:

```ts
import { Graphics, Container } from 'pixi.js'
import { Camera, UNITS_PER_TILE, BASE_PIXELS_PER_UNIT, worldToScreen } from '../coordinateSystem'

export class GridLayer {
  container: Container
  private g: Graphics

  constructor() {
    this.container = new Container()
    this.g = new Graphics()
    this.container.addChild(this.g)
  }

  render(camera: Camera, screenW: number, screenH: number) {
    this.g.clear()
    const ppu = BASE_PIXELS_PER_UNIT * camera.zoom

    const left   = camera.x - screenW / 2 / ppu
    const right  = camera.x + screenW / 2 / ppu
    const top    = camera.y - screenH / 2 / ppu
    const bottom = camera.y + screenH / 2 / ppu

    // unit grid (faint)
    const u0x = Math.floor(left) - 1
    const u1x = Math.ceil(right) + 1
    const u0y = Math.floor(top) - 1
    const u1y = Math.ceil(bottom) + 1

    for (let ux = u0x; ux <= u1x; ux++) {
      const isTile = ux % UNITS_PER_TILE === 0
      const sx = worldToScreen(ux, 0, camera, screenW, screenH).x
      this.g.moveTo(sx, 0).lineTo(sx, screenH)
        .stroke({ width: 1, color: 0x3a2f24, alpha: isTile ? 0.45 : 0.15 })
    }
    for (let uy = u0y; uy <= u1y; uy++) {
      const isTile = uy % UNITS_PER_TILE === 0
      const sy = worldToScreen(0, uy, camera, screenW, screenH).y
      this.g.moveTo(0, sy).lineTo(screenW, sy)
        .stroke({ width: 1, color: 0x3a2f24, alpha: isTile ? 0.45 : 0.15 })
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
```

- [ ] Commit:
```bash
git add src/components/dst-canvas/layers/GridLayer.ts
git commit -m "feat: Pixi.js grid layer with unit + tile lines"
```

---

### Task 6: RadiusLayer

**Files:**
- Create: `src/components/dst-canvas/layers/RadiusLayer.ts`

- [ ] Create `src/components/dst-canvas/layers/RadiusLayer.ts`:

```ts
import { Graphics, Container } from 'pixi.js'
import { Camera, worldToScreen, unitsToPx } from '../coordinateSystem'
import { PlacedStructure } from '@/hooks/usePlacedStructures'
import { getRadii } from '../structureRadii'

export class RadiusLayer {
  container: Container
  private g: Graphics

  constructor() {
    this.container = new Container()
    this.g = new Graphics()
    this.container.addChild(this.g)
  }

  render(structures: PlacedStructure[], camera: Camera, screenW: number, screenH: number) {
    this.g.clear()

    for (const s of structures) {
      const radii = getRadii(s.structure.id)
      if (radii.length === 0) continue

      const screen = worldToScreen(s.gridX, s.gridY, camera, screenW, screenH)

      for (const r of radii) {
        const radiusPx = unitsToPx(r.radius, camera.zoom)
        this.g.circle(screen.x, screen.y, radiusPx)
        this.g.fill({ color: r.color, alpha: r.fillAlpha })
        this.g.stroke({ width: 1.5, color: r.color, alpha: r.strokeAlpha })
      }
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
```

- [ ] Commit:
```bash
git add src/components/dst-canvas/layers/RadiusLayer.ts
git commit -m "feat: Pixi.js radius layer for structure influence"
```

---

### Task 7: StructureLayer

**Files:**
- Create: `src/components/dst-canvas/layers/StructureLayer.ts`

The structure display size is 4 DST units (one full tile). Sprites are anchored at (0.5, 0.8) — slightly below center, matching DST's visual style where structures sit on the ground.

- [ ] Create `src/components/dst-canvas/layers/StructureLayer.ts`:

```ts
import { Container, Sprite, Assets, Texture } from 'pixi.js'
import { Camera, worldToScreen, unitsToPx } from '../coordinateSystem'
import { PlacedStructure } from '@/hooks/usePlacedStructures'

const DISPLAY_UNITS = 4  // each structure renders as 4x4 units (1 tile)
const ANCHOR_Y = 0.8

export class StructureLayer {
  container: Container
  private sprites = new Map<string, Sprite>()
  private textures = new Map<string, Texture>()

  constructor() {
    this.container = new Container()
    this.container.sortableChildren = true
  }

  async preload(structureIds: string[]) {
    const unique = [...new Set(structureIds)]
    await Promise.all(
      unique.map(async id => {
        if (this.textures.has(id)) return
        try {
          const tex = await Assets.load(`/src/assets/structures/${id}.png`)
          this.textures.set(id, tex)
        } catch {
          // missing sprite — skip silently
        }
      })
    )
  }

  render(
    structures: PlacedStructure[],
    selectedId: string | null,
    camera: Camera,
    screenW: number,
    screenH: number
  ) {
    const currentIds = new Set(structures.map(s => s.id))

    // Remove sprites for deleted structures
    for (const [id, sprite] of this.sprites) {
      if (!currentIds.has(id)) {
        this.container.removeChild(sprite)
        sprite.destroy()
        this.sprites.delete(id)
      }
    }

    for (const s of structures) {
      let sprite = this.sprites.get(s.id)
      const tex = this.textures.get(s.structure.id)
      if (!tex) continue

      if (!sprite) {
        sprite = new Sprite(tex)
        sprite.anchor.set(0.5, ANCHOR_Y)
        this.sprites.set(s.id, sprite)
        this.container.addChild(sprite)
      }

      const screen = worldToScreen(s.gridX, s.gridY, camera, screenW, screenH)
      const sizePx = unitsToPx(DISPLAY_UNITS, camera.zoom)

      sprite.position.set(screen.x, screen.y)
      sprite.width = sizePx
      sprite.height = sizePx
      sprite.tint = s.built ? 0x88aa66 : selectedId === s.id ? 0xd4823b : 0xffffff
      sprite.zIndex = s.gridY  // Y-sort: lower Y = drawn first (behind)
      sprite.alpha = s.built ? 0.7 : 1
    }

    this.container.sortChildren()
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
```

- [ ] Commit:
```bash
git add src/components/dst-canvas/layers/StructureLayer.ts
git commit -m "feat: Pixi.js structure sprite layer with Y-sort and built state"
```

---

### Task 8: GhostLayer (Placement Preview)

**Files:**
- Create: `src/components/dst-canvas/layers/GhostLayer.ts`

- [ ] Create `src/components/dst-canvas/layers/GhostLayer.ts`:

```ts
import { Container, Sprite, Assets, Texture, Graphics } from 'pixi.js'
import { Camera, worldToScreen, unitsToPx } from '../coordinateSystem'

const DISPLAY_UNITS = 4
const ANCHOR_Y = 0.8

export class GhostLayer {
  container: Container
  private sprite: Sprite | null = null
  private ring: Graphics
  private loadedId: string | null = null

  constructor() {
    this.container = new Container()
    this.container.visible = false
    this.ring = new Graphics()
    this.container.addChild(this.ring)
  }

  async setStructureType(id: string) {
    if (this.loadedId === id) return
    this.loadedId = id

    if (this.sprite) {
      this.container.removeChild(this.sprite)
      this.sprite.destroy()
      this.sprite = null
    }

    try {
      const tex: Texture = await Assets.load(`/src/assets/structures/${id}.png`)
      this.sprite = new Sprite(tex)
      this.sprite.anchor.set(0.5, ANCHOR_Y)
      this.sprite.alpha = 0.55
      this.container.addChildAt(this.sprite, 0)
    } catch {
      // no sprite available
    }
  }

  render(worldX: number, worldY: number, isValid: boolean, camera: Camera, screenW: number, screenH: number) {
    const screen = worldToScreen(worldX, worldY, camera, screenW, screenH)
    const sizePx = unitsToPx(DISPLAY_UNITS, camera.zoom)

    if (this.sprite) {
      this.sprite.position.set(screen.x, screen.y)
      this.sprite.width = sizePx
      this.sprite.height = sizePx
      this.sprite.tint = isValid ? 0xffffff : 0xff4444
    }

    this.ring.clear()
    this.ring.circle(screen.x, screen.y, sizePx * 0.5)
    this.ring.stroke({ width: 2, color: isValid ? 0x44ff88 : 0xff4444, alpha: 0.85 })
  }

  show() { this.container.visible = true }
  hide() { this.container.visible = false }

  destroy() {
    this.container.destroy({ children: true })
  }
}
```

- [ ] Commit:
```bash
git add src/components/dst-canvas/layers/GhostLayer.ts
git commit -m "feat: Pixi.js ghost preview layer with valid/invalid indicator"
```

---

### Task 9: DSTPixiCanvas React Component

**Files:**
- Create: `src/components/dst-canvas/DSTPixiCanvas.tsx`
- Create: `src/components/dst-canvas/index.ts`

This component mirrors the `PlanningCanvas` interface so it can be swapped in `Index.tsx` with minimal changes.

- [ ] Create `src/components/dst-canvas/DSTPixiCanvas.tsx`:

```tsx
import { useEffect, useRef, useCallback } from 'react'
import { Application } from 'pixi.js'
import { Camera, screenToWorld } from './coordinateSystem'
import { GridLayer } from './layers/GridLayer'
import { RadiusLayer } from './layers/RadiusLayer'
import { StructureLayer } from './layers/StructureLayer'
import { GhostLayer } from './layers/GhostLayer'
import { PlacedStructure } from '@/hooks/usePlacedStructures'
import { Structure } from '@/data/structures'

interface DSTPixiCanvasProps {
  placedStructures: PlacedStructure[]
  selectedStructure: Structure | null
  selectedId: string | null
  camera: Camera
  isReadOnly: boolean
  onAddStructure: (structure: Structure, gridX: number, gridY: number) => void
  onRemoveStructure: (id: string) => void
  onMoveStructure: (id: string, gridX: number, gridY: number) => void
  onSelectStructure: (id: string | null) => void
  onPan: (dx: number, dy: number) => void
  onZoom: (delta: number, pivotX: number, pivotY: number, screenW: number, screenH: number) => void
}

export function DSTPixiCanvas({
  placedStructures,
  selectedStructure,
  selectedId,
  camera,
  isReadOnly,
  onAddStructure,
  onRemoveStructure,
  onMoveStructure,
  onSelectStructure,
  onPan,
  onZoom,
}: DSTPixiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)
  const layersRef = useRef<{
    grid: GridLayer
    radius: RadiusLayer
    structures: StructureLayer
    ghost: GhostLayer
  } | null>(null)

  const isPanning = useRef(false)
  const lastPtr = useRef({ x: 0, y: 0 })
  const cameraRef = useRef(camera)
  const structuresRef = useRef(placedStructures)
  const selectedIdRef = useRef(selectedId)
  const selectedStructureRef = useRef(selectedStructure)

  cameraRef.current = camera
  structuresRef.current = placedStructures
  selectedIdRef.current = selectedId
  selectedStructureRef.current = selectedStructure

  // Initialize Pixi
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const app = new Application()

    ;(async () => {
      await app.init({
        canvas,
        width: canvas.clientWidth || 800,
        height: canvas.clientHeight || 600,
        backgroundColor: 0x1a1410,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      const grid = new GridLayer()
      const radius = new RadiusLayer()
      const structures = new StructureLayer()
      const ghost = new GhostLayer()

      app.stage.addChild(grid.container)
      app.stage.addChild(radius.container)
      app.stage.addChild(structures.container)
      app.stage.addChild(ghost.container)

      layersRef.current = { grid, radius, structures, ghost }
      appRef.current = app

      // Preload all current structure textures
      const ids = structuresRef.current.map(s => s.structure.id)
      await structures.preload(ids)

      app.ticker.add(() => {
        const { width, height } = app.screen
        const cam = cameraRef.current
        const structs = structuresRef.current
        const selId = selectedIdRef.current
        grid.render(cam, width, height)
        radius.render(structs, cam, width, height)
        structures.render(structs, selId, cam, width, height)
      })
    })()

    return () => {
      layersRef.current?.grid.destroy()
      layersRef.current?.radius.destroy()
      layersRef.current?.structures.destroy()
      layersRef.current?.ghost.destroy()
      layersRef.current = null
      app.destroy()
      appRef.current = null
    }
  }, [])

  // Resize observer
  useEffect(() => {
    if (!canvasRef.current || !appRef.current) return
    const observer = new ResizeObserver(() => {
      const app = appRef.current
      const canvas = canvasRef.current
      if (!app || !canvas) return
      app.renderer.resize(canvas.clientWidth, canvas.clientHeight)
    })
    observer.observe(canvasRef.current)
    return () => observer.disconnect()
  }, [])

  // Preload texture when selected structure changes
  useEffect(() => {
    if (!selectedStructure || !layersRef.current) return
    layersRef.current.ghost.setStructureType(selectedStructure.id)
    layersRef.current.structures.preload([selectedStructure.id])
  }, [selectedStructure?.id])

  const getWorldPos = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top,
      cameraRef.current,
      rect.width,
      rect.height
    )
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2) {
      isPanning.current = true
      lastPtr.current = { x: e.clientX, y: e.clientY }
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning.current) {
      onPan(e.clientX - lastPtr.current.x, e.clientY - lastPtr.current.y)
      lastPtr.current = { x: e.clientX, y: e.clientY }
    }

    const layers = layersRef.current
    const selStruct = selectedStructureRef.current
    if (!layers || !canvasRef.current) return

    if (selStruct && !isReadOnly) {
      const world = getWorldPos(e)
      const snapped = { x: Math.round(world.x), y: Math.round(world.y) }
      const isValid = !structuresRef.current.some(s =>
        Math.hypot(s.gridX - snapped.x, s.gridY - snapped.y) < 3
      )
      layers.ghost.show()
      const rect = canvasRef.current.getBoundingClientRect()
      layers.ghost.render(snapped.x, snapped.y, isValid, cameraRef.current, rect.width, rect.height)
    } else {
      layers.ghost.hide()
    }
  }, [isReadOnly, onPan, getWorldPos])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanning.current && (e.button === 1 || e.button === 2)) {
      isPanning.current = false
      return
    }

    if (e.button === 0 && !isReadOnly) {
      const selStruct = selectedStructureRef.current
      if (selStruct) {
        const world = getWorldPos(e)
        const snapped = { x: Math.round(world.x), y: Math.round(world.y) }
        onAddStructure(selStruct, snapped.x, snapped.y)
      }
    }
  }, [isReadOnly, onAddStructure, getWorldPos])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    onZoom(e.deltaY, e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height)
  }, [onZoom])

  const handlePointerLeave = useCallback(() => {
    isPanning.current = false
    layersRef.current?.ghost.hide()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: selectedStructure && !isReadOnly ? 'crosshair' : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onWheel={handleWheel}
      onContextMenu={e => e.preventDefault()}
    />
  )
}
```

- [ ] Create `src/components/dst-canvas/index.ts`:

```ts
export { DSTPixiCanvas } from './DSTPixiCanvas'
export { useCamera } from './useCamera'
```

- [ ] Commit:
```bash
git add src/components/dst-canvas/DSTPixiCanvas.tsx src/components/dst-canvas/index.ts
git commit -m "feat: DSTPixiCanvas Pixi.js React component"
```

---

### Task 10: Integrate into Index.tsx

**Files:**
- Modify: `src/pages/Index.tsx`

- [ ] Read the current `PlanningCanvas` usage in `src/pages/Index.tsx` (lines ~265–286)

- [ ] Add imports at the top of `Index.tsx`:
```tsx
import { DSTPixiCanvas, useCamera } from '@/components/dst-canvas'
```

- [ ] Inside the `Index` component, add the camera hook (after the existing hooks, around line 54):
```tsx
const { camera, pan, zoom: zoomCamera, reset: resetCamera } = useCamera(1)
const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null)
```

- [ ] Replace the `<PlanningCanvas ... />` block (lines 265–286) with:
```tsx
<DSTPixiCanvas
  placedStructures={placedStructures}
  selectedStructure={canEdit ? selectedStructure : null}
  selectedId={selectedStructureId}
  camera={camera}
  isReadOnly={isReadOnly}
  onAddStructure={(structure, gridX, gridY) => {
    if (canEdit) addStructure(structure, gridX, gridY)
  }}
  onRemoveStructure={id => { if (canEdit) removeStructure(id) }}
  onMoveStructure={(id, gridX, gridY) => { if (canEdit) moveStructure(id, gridX, gridY) }}
  onSelectStructure={setSelectedStructureId}
  onPan={pan}
  onZoom={(delta, pivotX, pivotY, screenW, screenH) =>
    zoomCamera(delta, pivotX, pivotY, screenW, screenH)
  }
/>
```

- [ ] Remove the `import { PlanningCanvas } from "@/components/PlanningCanvas"` line

- [ ] Run dev server and check for TypeScript errors:
```bash
npm run dev
```

- [ ] Open http://localhost:8080/planner — verify:
  - [ ] Dark grid visible with faint unit lines and stronger tile lines
  - [ ] Selecting a structure from sidebar → ghost preview follows cursor
  - [ ] Click to place a fire-pit → sprite appears, red heat circle and orange light circle render
  - [ ] Place a lightning-rod → large blue protection circle renders
  - [ ] Middle-mouse drag pans the canvas
  - [ ] Scroll wheel zooms in/out, centered on cursor
  - [ ] Ghost turns red when too close to an existing structure

- [ ] Commit:
```bash
git add src/pages/Index.tsx
git commit -m "feat: integrate DSTPixiCanvas into planner — replace PlanningCanvas"
```

---

### Task 11: Cleanup

**Files:**
- Delete: `src/building-system/dst-style/` (old demo system, now replaced)

- [ ] Confirm nothing in `src/pages/Index.tsx` imports from `src/building-system/`
- [ ] Run:
```bash
grep -r "building-system" src/pages/ src/components/PlanningCanvas.tsx
```
Expected: no matches

- [ ] Remove old files:
```bash
rm -rf src/building-system/dst-style
```

- [ ] Run `npm run build` and verify no TypeScript errors
- [ ] Commit:
```bash
git add -A
git commit -m "chore: remove old DST demo building system"
```

---

## Self-Review

**Spec coverage:**
- ✅ DST coordinate system (Task 2)
- ✅ Structure sprites with Y-sort (Task 7)
- ✅ Influence radii (fire pit, lightning rod, ice flingomatic, etc.) (Tasks 3 + 6)
- ✅ Ghost preview with valid/invalid indicator (Task 8)
- ✅ Pan/zoom camera (Task 4)
- ✅ Integration into existing planner (Task 10)
- ✅ Cleanup of old system (Task 11)

**Placeholder scan:** None found — all tasks contain complete code.

**Type consistency:**
- `PlacedStructure` is the existing type from `@/hooks/usePlacedStructures` — unchanged
- `Camera` defined in `coordinateSystem.ts`, used consistently across all layers
- `getRadii(id)` returns `RadiusDef[]` — used in `RadiusLayer.render()`
- `DISPLAY_UNITS = 4` used consistently in `StructureLayer` and `GhostLayer`
