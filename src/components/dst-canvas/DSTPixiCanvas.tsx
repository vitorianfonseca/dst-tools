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

  // Suppress unused-variable warnings for callbacks passed as props
  void onRemoveStructure
  void onMoveStructure
  void onSelectStructure

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
        background: 0x1a1410,
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
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const observer = new ResizeObserver(() => {
      const app = appRef.current
      if (!app) return
      app.renderer.resize(canvas.clientWidth, canvas.clientHeight)
    })
    observer.observe(canvas)
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
      onPan(-(e.clientX - lastPtr.current.x), -(e.clientY - lastPtr.current.y))
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
