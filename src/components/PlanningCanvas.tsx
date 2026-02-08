import { Grid3X3, MousePointer2, ZoomIn, ZoomOut, Focus, Trash2, X, Check } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Structure } from "@/data/structures";
import { GroundTile } from "@/data/groundTiles";
import { PlacedStructure } from "@/hooks/usePlacedStructures";
import { PlacedGroundTile } from "@/hooks/useGroundTiles";
import { useImageCache } from "@/hooks/useImageCache";
import { Camera, screenToCell, worldToScreen } from "./planning-canvas/camera";
import {
  drawGrid,
  drawGroundTiles,
  drawStructures,
  drawMovingStructure,
  drawPaintOverlay,
  drawDragHighlight,
  drawHoverHighlight,
  extractThemeColors,
  ThemeColors,
} from "./planning-canvas/renderers";

interface PlanningCanvasProps {
  placedStructures: PlacedStructure[];
  groundTiles: PlacedGroundTile[];
  onAddStructure: (structure: Structure, gridX: number, gridY: number) => void;
  onRemoveStructure: (id: string) => void;
  onToggleBuilt: (id: string) => void;
  onMoveStructure: (id: string, gridX: number, gridY: number) => void;
  onClearAll: () => void;
  onAddTile: (tile: GroundTile, gridX: number, gridY: number) => void;
  onAddTilesInArea: (tile: GroundTile, startX: number, startY: number, endX: number, endY: number) => void;
  onRemoveTilesInArea: (startX: number, startY: number, endX: number, endY: number) => void;
  onRemoveTile: (gridX: number, gridY: number) => void;
  selectedStructure: Structure | null;
  selectedGroundTile: GroundTile | null;
  isErasingTiles: boolean;
  onClearSelection: () => void;
  onClearGroundTileSelection: () => void;
  isReadOnly?: boolean;
}

const CELL_SIZE = 120;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.0;

export function PlanningCanvas({
  placedStructures,
  groundTiles,
  onAddStructure,
  onRemoveStructure,
  onToggleBuilt,
  onMoveStructure,
  onClearAll,
  onAddTile,
  onAddTilesInArea,
  onRemoveTilesInArea,
  onRemoveTile,
  selectedStructure,
  selectedGroundTile,
  isErasingTiles,
  onClearSelection,
  onClearGroundTileSelection,
  isReadOnly,
}: PlanningCanvasProps) {
  // Camera state
  const [camera, setCamera] = useState<Camera>({ x: -500, y: -500, zoom: 1 });

  // Interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null);

  // Hover state for HTML overlay
  const [hoveredStructure, setHoveredStructure] = useState<PlacedStructure | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Structure move state (canvas-native)
  const [movingStructure, setMovingStructure] = useState<PlacedStructure | null>(null);
  const [moveMousePos, setMoveMousePos] = useState<{ x: number; y: number } | null>(null);

  // Paint state
  const [isPainting, setIsPainting] = useState(false);
  const [paintStartCell, setPaintStartCell] = useState<{ x: number; y: number } | null>(null);
  const [paintCurrentCell, setPaintCurrentCell] = useState<{ x: number; y: number } | null>(null);

  // Mouse tracking for hover when tool is active
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const dirtyRef = useRef(true);
  const panStartRef = useRef<{ screenX: number; screenY: number; camX: number; camY: number } | null>(null);
  const themeColorsRef = useRef<ThemeColors>(extractThemeColors());
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const wasMovingRef = useRef(false);

  const hasActiveSelection = selectedStructure || selectedGroundTile || isErasingTiles;
  const imageCache = useImageCache();

  // Build structure lookup map for O(1) hit testing
  const structureMap = useMemo(() => {
    const map = new Map<string, PlacedStructure>();
    for (const s of placedStructures) {
      map.set(`${s.gridX},${s.gridY}`, s);
    }
    return map;
  }, [placedStructures]);

  // Preload images
  useEffect(() => {
    const srcs: string[] = [];
    for (const s of placedStructures) {
      if (s.structure.iconImage) srcs.push(s.structure.iconImage);
    }
    for (const t of groundTiles) {
      if (t.tile.image) srcs.push(t.tile.image);
    }
    imageCache.preloadImages(srcs);
  }, [placedStructures, groundTiles, imageCache]);

  // Re-extract theme colors on mount (CSS may not be fully loaded during module init)
  useEffect(() => {
    themeColorsRef.current = extractThemeColors();
    dirtyRef.current = true;
  }, []);

  // Canvas sizing via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvasSizeRef.current = { width, height };
      dirtyRef.current = true;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Mark dirty when state changes
  useEffect(() => {
    dirtyRef.current = true;
  }, [
    placedStructures, groundTiles, camera, dragOverCell,
    isPainting, paintStartCell, paintCurrentCell,
    hoveredStructure, selectedStructure, selectedGroundTile,
    isErasingTiles, hoverCell, movingStructure, moveMousePos,
  ]);

  // Render frame
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = themeColorsRef.current;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = canvasSizeRef.current.width;
    const h = canvasSizeRef.current.height;

    if (w === 0 || h === 0) return;

    // 1. Clear background
    ctx.fillStyle = colors.canvasBg;
    ctx.fillRect(0, 0, w, h);

    // 2. Draw grid
    drawGrid(ctx, camera, w, h, CELL_SIZE, colors);

    // 3. Draw ground tiles
    drawGroundTiles(ctx, groundTiles, camera, w, h, CELL_SIZE, imageCache.getImage);

    // 4. Draw hover highlight on cell when tool is active
    if (hoverCell && hasActiveSelection && !isReadOnly && !isPainting) {
      drawHoverHighlight(ctx, camera, CELL_SIZE, hoverCell, colors);
    }

    // 5. Draw paint overlay
    if (isPainting && paintStartCell && paintCurrentCell) {
      drawPaintOverlay(ctx, camera, CELL_SIZE, paintStartCell, paintCurrentCell, isErasingTiles, colors);
    }

    // 6. Draw drag-over highlight
    if (dragOverCell) {
      drawDragHighlight(ctx, camera, CELL_SIZE, dragOverCell, colors);
    }

    // 7. Draw structures
    drawStructures(
      ctx, placedStructures, camera, w, h, CELL_SIZE,
      imageCache.getImage, hoveredStructure?.id ?? null,
      movingStructure?.id ?? null, colors
    );

    // 8. Draw moving structure at cursor
    if (movingStructure && moveMousePos) {
      drawMovingStructure(
        ctx, movingStructure, moveMousePos.x, moveMousePos.y,
        CELL_SIZE, camera, imageCache.getImage, colors
      );
    }
  }, [
    camera, groundTiles, placedStructures, imageCache,
    dragOverCell, isPainting, paintStartCell, paintCurrentCell,
    isErasingTiles, hoveredStructure, hoverCell, hasActiveSelection,
    isReadOnly, movingStructure, moveMousePos,
  ]);

  // Animation frame loop
  useEffect(() => {
    const loop = () => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        renderFrame();
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [renderFrame]);

  // Get screen-relative mouse position from a mouse event
  const getScreenPos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // Wheel handler for zoom and pan
  const handleWheel = useCallback((e: WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Zoom (pinch / Ctrl+wheel)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.98 : 1.02;

      setCamera((prev) => {
        const newZoom = Math.min(Math.max(prev.zoom * factor, MIN_ZOOM), MAX_ZOOM);
        // Keep the world point under cursor stationary
        const worldX = screenX / prev.zoom + prev.x;
        const worldY = screenY / prev.zoom + prev.y;
        return {
          x: worldX - screenX / newZoom,
          y: worldY - screenY / newZoom,
          zoom: newZoom,
        };
      });
      return;
    }

    // Pan with touchpad scroll
    if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      setCamera((prev) => ({
        ...prev,
        x: prev.x + e.deltaX / prev.zoom,
        y: prev.y + e.deltaY / prev.zoom,
      }));
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const screen = getScreenPos(e);
    const cell = screenToCell(screen.x, screen.y, camera, CELL_SIZE);

    // Middle mouse button: always pan
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { screenX: e.clientX, screenY: e.clientY, camX: camera.x, camY: camera.y };
      return;
    }

    if (e.button !== 0) return;

    // Read-only: pan
    if (isReadOnly) {
      setIsPanning(true);
      panStartRef.current = { screenX: e.clientX, screenY: e.clientY, camX: camera.x, camY: camera.y };
      return;
    }

    // Check if clicking on an existing structure to move it (takes priority over placement)
    const hitStructure = structureMap.get(`${cell.x},${cell.y}`);
    if (hitStructure) {
      setMovingStructure(hitStructure);
      setMoveMousePos(screen);
      return;
    }

    // Structure placement mode: handled in click, do nothing on mousedown
    if (selectedStructure) return;

    // Paint/erase mode: start painting
    if (selectedGroundTile || isErasingTiles) {
      setIsPainting(true);
      setPaintStartCell(cell);
      setPaintCurrentCell(cell);
      return;
    }

    // Empty space: pan
    setIsPanning(true);
    panStartRef.current = { screenX: e.clientX, screenY: e.clientY, camX: camera.x, camY: camera.y };
  }, [camera, isReadOnly, selectedStructure, selectedGroundTile, isErasingTiles, structureMap, getScreenPos]);

  // Mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const screen = getScreenPos(e);
    const cell = screenToCell(screen.x, screen.y, camera, CELL_SIZE);

    // Panning
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.screenX;
      const dy = e.clientY - panStartRef.current.screenY;
      setCamera((prev) => ({
        ...prev,
        x: panStartRef.current!.camX - dx / prev.zoom,
        y: panStartRef.current!.camY - dy / prev.zoom,
      }));
      return;
    }

    // Moving a structure
    if (movingStructure) {
      setMoveMousePos(screen);
      return;
    }

    // Painting
    if (isPainting) {
      setPaintCurrentCell(cell);
      return;
    }

    // Hover tracking
    setHoverCell(cell);

    // Structure hover detection (only when no tool active)
    if (!hasActiveSelection && !isReadOnly) {
      const hit = structureMap.get(`${cell.x},${cell.y}`);
      if (hit) {
        setHoveredStructure(hit);
        const pos = worldToScreen(hit.gridX * CELL_SIZE, hit.gridY * CELL_SIZE, camera);
        setHoverScreenPos(pos);
      } else {
        setHoveredStructure(null);
        setHoverScreenPos(null);
      }
    } else {
      setHoveredStructure(null);
      setHoverScreenPos(null);
    }
  }, [camera, isPanning, isPainting, movingStructure, hasActiveSelection, isReadOnly, structureMap, getScreenPos]);

  // Mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Finish panning
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }

    // Finish structure move
    if (movingStructure && moveMousePos) {
      const screen = getScreenPos(e);
      const cell = screenToCell(screen.x, screen.y, camera, CELL_SIZE);
      if (cell.x !== movingStructure.gridX || cell.y !== movingStructure.gridY) {
        onMoveStructure(movingStructure.id, cell.x, cell.y);
      }
      setMovingStructure(null);
      setMoveMousePos(null);
      wasMovingRef.current = true;
      return;
    }

    // Finish painting
    if (isPainting && paintStartCell && paintCurrentCell) {
      if (selectedGroundTile) {
        onAddTilesInArea(selectedGroundTile, paintStartCell.x, paintStartCell.y, paintCurrentCell.x, paintCurrentCell.y);
      } else if (isErasingTiles) {
        onRemoveTilesInArea(paintStartCell.x, paintStartCell.y, paintCurrentCell.x, paintCurrentCell.y);
      }
    }
    setIsPainting(false);
    setPaintStartCell(null);
    setPaintCurrentCell(null);
  }, [
    isPanning, movingStructure, moveMousePos, isPainting,
    paintStartCell, paintCurrentCell, selectedGroundTile,
    isErasingTiles, camera, onMoveStructure, onAddTilesInArea,
    onRemoveTilesInArea, getScreenPos,
  ]);

  // Click handler (for structure placement and single tile/erase)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isReadOnly) return;
    if (isPanning || movingStructure) return;

    // Skip click if we just finished a move (click fires after mouseup)
    if (wasMovingRef.current) {
      wasMovingRef.current = false;
      return;
    }

    const screen = getScreenPos(e);
    const cell = screenToCell(screen.x, screen.y, camera, CELL_SIZE);

    if (selectedStructure) {
      onAddStructure(selectedStructure, cell.x, cell.y);
      return;
    }

    // Single click erase (non-drag)
    if (isErasingTiles && !isPainting) {
      onRemoveTile(cell.x, cell.y);
      return;
    }

    // Single click tile placement (non-drag)
    if (selectedGroundTile && !isPainting) {
      onAddTile(selectedGroundTile, cell.x, cell.y);
      return;
    }
  }, [
    isReadOnly, isPanning, movingStructure, camera, selectedStructure,
    selectedGroundTile, isErasingTiles, isPainting,
    onAddStructure, onRemoveTile, onAddTile, getScreenPos,
  ]);

  // Drag & drop from sidebar
  const getCellFromDragEvent = useCallback((e: React.DragEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return screenToCell(e.clientX - rect.left, e.clientY - rect.top, camera, CELL_SIZE);
  }, [camera]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const types = Array.from(e.dataTransfer.types ?? []);
    const isMove = types.includes("application/placed-structure");
    e.dataTransfer.dropEffect = isMove ? "move" : "copy";
    const cell = getCellFromDragEvent(e);
    setDragOverCell(cell);
  }, [getCellFromDragEvent]);

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCell(null);

    const cell = getCellFromDragEvent(e);
    if (!cell) return;

    // Check if it's a placed structure being moved via HTML5 DnD
    const placedData = e.dataTransfer.getData("application/placed-structure");
    if (placedData) {
      const placed = JSON.parse(placedData) as PlacedStructure;
      onMoveStructure(placed.id, cell.x, cell.y);
      return;
    }

    // New structure from library
    const structureData = e.dataTransfer.getData("application/json");
    if (structureData) {
      const structure = JSON.parse(structureData) as Structure;
      onAddStructure(structure, cell.x, cell.y);
    }
  }, [getCellFromDragEvent, onMoveStructure, onAddStructure]);

  // Zoom buttons
  const zoomIn = useCallback(() => {
    setCamera((prev) => {
      const w = canvasSizeRef.current.width;
      const h = canvasSizeRef.current.height;
      const centerX = w / 2;
      const centerY = h / 2;
      const newZoom = Math.min(prev.zoom + 0.15, MAX_ZOOM);
      const worldX = centerX / prev.zoom + prev.x;
      const worldY = centerY / prev.zoom + prev.y;
      return {
        x: worldX - centerX / newZoom,
        y: worldY - centerY / newZoom,
        zoom: newZoom,
      };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setCamera((prev) => {
      const w = canvasSizeRef.current.width;
      const h = canvasSizeRef.current.height;
      const centerX = w / 2;
      const centerY = h / 2;
      const newZoom = Math.max(prev.zoom - 0.15, MIN_ZOOM);
      const worldX = centerX / prev.zoom + prev.x;
      const worldY = centerY / prev.zoom + prev.y;
      return {
        x: worldX - centerX / newZoom,
        y: worldY - centerY / newZoom,
        zoom: newZoom,
      };
    });
  }, []);

  // Center on content
  const centerOnContent = useCallback(() => {
    const allItems = [
      ...placedStructures.map((s) => ({ x: s.gridX, y: s.gridY })),
      ...groundTiles.map((t) => ({ x: t.gridX, y: t.gridY })),
    ];
    if (allItems.length === 0) return;

    const minX = Math.min(...allItems.map((i) => i.x));
    const maxX = Math.max(...allItems.map((i) => i.x)) + 1;
    const minY = Math.min(...allItems.map((i) => i.y));
    const maxY = Math.max(...allItems.map((i) => i.y)) + 1;

    const contentCenterX = ((minX + maxX) / 2) * CELL_SIZE;
    const contentCenterY = ((minY + maxY) / 2) * CELL_SIZE;

    const w = canvasSizeRef.current.width;
    const h = canvasSizeRef.current.height;

    setCamera((prev) => ({
      ...prev,
      x: contentCenterX - w / (2 * prev.zoom),
      y: contentCenterY - h / (2 * prev.zoom),
    }));
  }, [placedStructures, groundTiles]);

  // Cursor
  const cursor = useMemo(() => {
    if (movingStructure) return "grabbing";
    if (isReadOnly) return isPanning ? "grabbing" : "grab";
    if (hasActiveSelection) return "crosshair";
    if (isPanning) return "grabbing";
    if (hoveredStructure) return "grab";
    return "grab";
  }, [isReadOnly, isPanning, hasActiveSelection, hoveredStructure, movingStructure]);

  return (
    <main className="flex-1 flex flex-col bg-canvas overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {placedStructures.length} structures • {groundTiles.length} tiles • Zoom: {Math.round(camera.zoom * 100)}%
            {isReadOnly && (
              <span className="ml-2 text-muted-foreground">
                • View only mode
              </span>
            )}
            {selectedStructure && !isReadOnly && (
              <span className="ml-2 text-primary">
                • Click to place: {selectedStructure.name}
              </span>
            )}
            {selectedGroundTile && !isReadOnly && (
              <span className="ml-2 text-primary">
                • Click & drag: {selectedGroundTile.name}
              </span>
            )}
            {isErasingTiles && !isReadOnly && (
              <span className="ml-2 text-destructive">
                • Eraser mode
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasActiveSelection && !isReadOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                onClearSelection();
                onClearGroundTileSelection();
              }}
            >
              Cancel
            </Button>
          )}
          {placedStructures.length > 0 && !isReadOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={onClearAll}
              title="Clear all structures"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={centerOnContent} title="Center on content">
            <Focus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor }}
      >
        <canvas
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="block w-full h-full"
        />

        {/* Hover action buttons overlay */}
        {hoveredStructure && hoverScreenPos && !isReadOnly && !isPanning && !movingStructure && (
          <div
            className="absolute z-20 pointer-events-auto flex gap-1"
            style={{
              left: hoverScreenPos.x + CELL_SIZE * camera.zoom - 4,
              top: hoverScreenPos.y - 4,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBuilt(hoveredStructure.id);
              }}
              className={`h-5 w-5 rounded-full flex items-center justify-center text-white transition-colors ${
                hoveredStructure.built ? "bg-primary" : "bg-muted-foreground hover:bg-primary"
              }`}
              title={hoveredStructure.built ? "Mark as not built" : "Mark as built"}
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveStructure(hoveredStructure.id);
              }}
              className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center text-white hover:bg-destructive/80 transition-colors"
              title="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Empty state overlay */}
        {placedStructures.length === 0 && groundTiles.length === 0 && !hasActiveSelection && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <EmptyState
              icon={MousePointer2}
              title="Drag or click to place"
              description="Drag from the library or click on a structure/tile and then on the grid"
              className="bg-card/90 backdrop-blur-sm rounded-xl shadow-soft-lg"
            />
          </div>
        )}
      </div>
    </main>
  );
}
