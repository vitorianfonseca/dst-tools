import { useEffect, useRef, useCallback } from 'react'
import { Application } from 'pixi.js'
import { Camera, screenToWorld, UNITS_PER_TILE } from './coordinateSystem'
import { GroundLayer } from './layers/GroundLayer'
import { GridLayer } from './layers/GridLayer'
import { RadiusLayer } from './layers/RadiusLayer'
import { StructureLayer } from './layers/StructureLayer'
import { GhostLayer } from './layers/GhostLayer'
import { PlacedStructure } from '@/hooks/usePlacedStructures'
import { PlacedGroundTile } from '@/hooks/useGroundTiles'
import { Structure } from '@/data/structures'
import { GroundTile } from '@/data/groundTiles'

interface DSTPixiCanvasProps {
  placedStructures: PlacedStructure[]
  groundTiles: PlacedGroundTile[]
  selectedStructure: Structure | null
  selectedGroundTile: GroundTile | null
  isErasingTiles: boolean
  selectedId: string | null
  camera: Camera
  isReadOnly: boolean
  onAddStructure: (structure: Structure, gridX: number, gridY: number) => void
  onRemoveStructure: (id: string) => void
  onMoveStructure: (id: string, gridX: number, gridY: number) => void
  onSelectStructure: (id: string | null) => void
  onAddTile: (tile: GroundTile, gridX: number, gridY: number) => void
  onRemoveTile: (gridX: number, gridY: number) => void
  onPan: (dx: number, dy: number) => void
  onZoom: (delta: number, pivotX: number, pivotY: number, screenW: number, screenH: number) => void
}

export function DSTPixiCanvas({
  placedStructures,
  groundTiles,
  selectedStructure,
  selectedGroundTile,
  isErasingTiles,
  selectedId,
  camera,
  isReadOnly,
  onAddStructure,
  onRemoveStructure,
  onMoveStructure,
  onSelectStructure,
  onAddTile,
  onRemoveTile,
  onPan,
  onZoom,
}: DSTPixiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const layersRef = useRef<{
    ground: GroundLayer
    grid: GridLayer
    radius: RadiusLayer
    structures: StructureLayer
    ghost: GhostLayer
  } | null>(null)

  const isPanning = useRef(false)
  const isPainting = useRef(false)
  const lastPaintedCell = useRef<{ x: number; y: number } | null>(null)
  const lastPtr = useRef({ x: 0, y: 0 })
  const downPos = useRef({ x: 0, y: 0 })
  const cameraRef = useRef(camera)
  const structuresRef = useRef(placedStructures)
  const groundTilesRef = useRef(groundTiles)
  const selectedIdRef = useRef(selectedId)
  const selectedStructureRef = useRef(selectedStructure)
  const selectedGroundTileRef = useRef(selectedGroundTile)
  const isErasingRef = useRef(isErasingTiles)

  cameraRef.current = camera
  structuresRef.current = placedStructures
  groundTilesRef.current = groundTiles
  selectedIdRef.current = selectedId
  selectedStructureRef.current = selectedStructure
  selectedGroundTileRef.current = selectedGroundTile
  isErasingRef.current = isErasingTiles

  void onMoveStructure

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const app = new Application()
    let destroyed = false

    ;(async () => {
      await app.init({
        resizeTo: container,
        background: 0x1a1410,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      if (destroyed) { app.destroy(true); return }

      const pixiCanvas = app.canvas as HTMLCanvasElement
      pixiCanvas.style.position = 'absolute'
      pixiCanvas.style.inset = '0'
      container.appendChild(pixiCanvas)

      const ground = new GroundLayer()
      const grid = new GridLayer()
      const radius = new RadiusLayer()
      const structures = new StructureLayer()
      const ghost = new GhostLayer()

      // Ground below grid, structures above
      app.stage.addChild(ground.container)
      app.stage.addChild(grid.container)
      app.stage.addChild(radius.container)
      app.stage.addChild(structures.container)
      app.stage.addChild(ghost.container)

      layersRef.current = { ground, grid, radius, structures, ghost }
      appRef.current = app

      // Preload initial textures
      const structureIds = structuresRef.current.map(s => s.structure.id)
      await structures.preload(structureIds)

      const uniqueTiles = [...new Map(groundTilesRef.current.map(t => [t.tile.id, t.tile])).values()]
      await Promise.all(uniqueTiles.map(t => ground.preload(t.image, t.id)))

      if (destroyed) return

      app.ticker.add(() => {
        const { width, height } = app.screen
        const cam = cameraRef.current
        const structs = structuresRef.current
        const gTiles = groundTilesRef.current
        const selId = selectedIdRef.current
        ground.render(gTiles, cam, width, height)
        grid.render(cam, width, height)
        radius.render(structs, cam, width, height)
        structures.render(structs, selId, cam, width, height)
      })
    })()

    return () => {
      destroyed = true
      layersRef.current?.ground.destroy()
      layersRef.current?.grid.destroy()
      layersRef.current?.radius.destroy()
      layersRef.current?.structures.destroy()
      layersRef.current?.ghost.destroy()
      layersRef.current = null
      appRef.current = null
      app.destroy(true)
    }
  }, [])

  // Preload texture when selected structure changes
  useEffect(() => {
    if (!selectedStructure || !layersRef.current) return
    layersRef.current.ghost.setStructureType(selectedStructure.id)
    layersRef.current.structures.preload([selectedStructure.id])
  }, [selectedStructure?.id])

  // Preload tile texture when selected tile changes
  useEffect(() => {
    if (!selectedGroundTile || !layersRef.current) return
    layersRef.current.ground.preload(selectedGroundTile.image, selectedGroundTile.id)
  }, [selectedGroundTile?.id])

  const getWorldPos = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    return screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top,
      cameraRef.current,
      rect.width,
      rect.height
    )
  }, [])

  const worldToTileCoords = useCallback((worldX: number, worldY: number) => ({
    x: Math.floor(worldX / UNITS_PER_TILE),
    y: Math.floor(worldY / UNITS_PER_TILE),
  }), [])

  const paintTileAt = useCallback((worldX: number, worldY: number) => {
    const tile = selectedGroundTileRef.current
    const erasing = isErasingRef.current
    const { x, y } = worldToTileCoords(worldX, worldY)

    const last = lastPaintedCell.current
    if (last && last.x === x && last.y === y) return
    lastPaintedCell.current = { x, y }

    if (erasing) {
      onRemoveTile(x, y)
    } else if (tile) {
      onAddTile(tile, x, y)
    }
  }, [onAddTile, onRemoveTile, worldToTileCoords])

  // Returns the placed structure closest to world pos within threshold units, or null
  const findStructureAt = useCallback((worldX: number, worldY: number) => {
    const THRESHOLD = 2.5
    let closest: PlacedStructure | null = null
    let minDist = THRESHOLD
    for (const s of structuresRef.current) {
      const d = Math.hypot(s.gridX - worldX, s.gridY - worldY)
      if (d < minDist) { minDist = d; closest = s }
    }
    return closest
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Middle-click = pan
    if (e.button === 1) {
      isPanning.current = true
      lastPtr.current = { x: e.clientX, y: e.clientY }
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    // Right-click = erase structure or tile at cursor
    if (e.button === 2 && !isReadOnly) {
      const world = getWorldPos(e)
      const hit = findStructureAt(world.x, world.y)
      if (hit) {
        onRemoveStructure(hit.id)
        onSelectStructure(null)
      } else {
        const { x, y } = worldToTileCoords(world.x, world.y)
        onRemoveTile(x, y)
      }
      return
    }

    if (e.button === 0) {
      const tile = selectedGroundTileRef.current
      const erasing = isErasingRef.current
      const struct = selectedStructureRef.current

      if (!isReadOnly && (tile || erasing)) {
        isPainting.current = true
        lastPaintedCell.current = null
        e.currentTarget.setPointerCapture(e.pointerId)
        const world = getWorldPos(e)
        paintTileAt(world.x, world.y)
      } else {
        // Pan or select — track down position to distinguish click vs drag
        isPanning.current = !struct  // pan if no structure tool
        lastPtr.current = { x: e.clientX, y: e.clientY }
        downPos.current = { x: e.clientX, y: e.clientY }
        e.currentTarget.setPointerCapture(e.pointerId)
      }
    }
  }, [isReadOnly, getWorldPos, paintTileAt, findStructureAt, onRemoveStructure, onSelectStructure, onRemoveTile, worldToTileCoords])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning.current) {
      onPan(-(e.clientX - lastPtr.current.x), -(e.clientY - lastPtr.current.y))
      lastPtr.current = { x: e.clientX, y: e.clientY }
    }

    if (isPainting.current && !isReadOnly) {
      const world = getWorldPos(e)
      paintTileAt(world.x, world.y)
      return
    }

    const layers = layersRef.current
    const selStruct = selectedStructureRef.current
    if (!layers || !containerRef.current) return

    if (selStruct && !isReadOnly) {
      const world = getWorldPos(e)
      const snapped = { x: Math.round(world.x), y: Math.round(world.y) }
      const isValid = !structuresRef.current.some(s =>
        Math.hypot(s.gridX - snapped.x, s.gridY - snapped.y) < 3
      )
      layers.ghost.show()
      const rect = containerRef.current.getBoundingClientRect()
      layers.ghost.render(snapped.x, snapped.y, isValid, cameraRef.current, rect.width, rect.height)
    } else {
      layers.ghost.hide()
    }
  }, [isReadOnly, onPan, getWorldPos, paintTileAt])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPainting.current) {
      isPainting.current = false
      lastPaintedCell.current = null
      return
    }

    const wasPanning = isPanning.current
    isPanning.current = false

    if (e.button === 0 && !isReadOnly) {
      const selStruct = selectedStructureRef.current
      if (selStruct) {
        // Place structure
        const world = getWorldPos(e)
        const snapped = { x: Math.round(world.x), y: Math.round(world.y) }
        onAddStructure(selStruct, snapped.x, snapped.y)
      } else if (wasPanning) {
        // Check if it was a click (barely moved) → select structure
        const dx = e.clientX - downPos.current.x
        const dy = e.clientY - downPos.current.y
        if (Math.hypot(dx, dy) < 5) {
          const world = getWorldPos(e)
          const hit = findStructureAt(world.x, world.y)
          onSelectStructure(hit ? hit.id : null)
        }
      }
    }
  }, [isReadOnly, onAddStructure, onSelectStructure, getWorldPos, findStructureAt])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    if (e.ctrlKey) {
      // Pinch-to-zoom on trackpad
      onZoom(e.deltaY, e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height)
    } else {
      // Two-finger scroll = pan
      onPan(e.deltaX, e.deltaY)
    }
  }, [onZoom, onPan])

  const handlePointerLeave = useCallback(() => {
    isPanning.current = false
    isPainting.current = false
    lastPaintedCell.current = null
    layersRef.current?.ghost.hide()
  }, [])

  const hasTileMode = (selectedGroundTile || isErasingTiles) && !isReadOnly
  const cursor = selectedStructure && !isReadOnly
    ? 'crosshair'
    : hasTileMode
    ? 'cell'
    : 'grab'

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onWheel={handleWheel}
      onContextMenu={e => e.preventDefault()}
    />
  )
}
