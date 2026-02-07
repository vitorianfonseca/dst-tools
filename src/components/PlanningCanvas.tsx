import { Grid3X3, MousePointer2, ZoomIn, ZoomOut, Focus, Trash2 } from "lucide-react";
 import { EmptyState } from "./EmptyState";
 import { useState, useRef, useCallback, useEffect, useMemo } from "react";
 import { Button } from "./ui/button";
 import { Structure } from "@/data/structures";
 import { GroundTile } from "@/data/groundTiles";
 import { PlacedStructure } from "@/hooks/usePlacedStructures";
 import { PlacedGroundTile } from "@/hooks/useGroundTiles";
 import { PlacedStructureItem } from "./PlacedStructureItem";
 import { PlacedGroundTileItem } from "./PlacedGroundTileItem";
 
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
   const cellSize = 120;
   
   const [zoom, setZoom] = useState(1);
   const [pan, setPan] = useState({ x: 0, y: 0 });
   const [isPanning, setIsPanning] = useState(false);
   const [startPan, setStartPan] = useState({ x: 0, y: 0 });
   const [isDragging, setIsDragging] = useState(false);
   const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null);
   const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
   
   // Ground tile painting state
   const [isPainting, setIsPainting] = useState(false);
   const [paintStartCell, setPaintStartCell] = useState<{ x: number; y: number } | null>(null);
   const [paintCurrentCell, setPaintCurrentCell] = useState<{ x: number; y: number } | null>(null);
   
   const containerRef = useRef<HTMLDivElement>(null);
   const gridRef = useRef<HTMLDivElement>(null);
 
   const isInPaintMode = selectedGroundTile !== null || isErasingTiles;
   const hasActiveSelection = selectedStructure || selectedGroundTile || isErasingTiles;
 
   // Calculate grid size dynamically based on zoom and container size
   const gridSize = useMemo(() => {
     const cellsNeededX = Math.ceil(containerSize.width / (cellSize * zoom)) + 4;
     const cellsNeededY = Math.ceil(containerSize.height / (cellSize * zoom)) + 4;
      // Keep a big margin so it keeps feeling "infinite" while panning
      return Math.max(60, Math.max(cellsNeededX, cellsNeededY) + 20);
   }, [zoom, containerSize.width, containerSize.height]);
 
   // Track container size
   useEffect(() => {
     const container = containerRef.current;
     if (!container) return;
 
     const updateSize = () => {
       setContainerSize({
         width: container.clientWidth,
         height: container.clientHeight,
       });
     };
 
     updateSize();
     const resizeObserver = new ResizeObserver(updateSize);
     resizeObserver.observe(container);
 
     return () => resizeObserver.disconnect();
   }, []);
 
  // Calculate the center of all placed content (structures + tiles)
  const getContentCenter = useCallback(() => {
    const allItems = [
      ...placedStructures.map((s) => ({ x: s.gridX + 0.5, y: s.gridY + 0.5 })),
      ...groundTiles.map((t) => ({ x: t.gridX + 0.5, y: t.gridY + 0.5 })),
    ];
    
    if (allItems.length === 0) {
      return { x: gridSize / 2, y: gridSize / 2 };
    }
    
    const minX = Math.min(...allItems.map(i => i.x));
    const maxX = Math.max(...allItems.map(i => i.x));
    const minY = Math.min(...allItems.map(i => i.y));
    const maxY = Math.max(...allItems.map(i => i.y));
    
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
  }, [placedStructures, groundTiles, gridSize]);

   // Touchpad support:
   // - pinch (Ctrl/Cmd + wheel) => zoom
   // - two-finger scroll => pan
   const handleWheel = useCallback((e: WheelEvent) => {
     const container = containerRef.current;
     if (!container) return;

     const rect = container.getBoundingClientRect();
     const mx = e.clientX - rect.left - rect.width / 2;
     const my = e.clientY - rect.top - rect.height / 2;

     // Zoom (pinch)
     if (e.ctrlKey || e.metaKey) {
       e.preventDefault();
       const delta = e.deltaY > 0 ? 0.98 : 1.02;

       setZoom((prev) => {
         const next = Math.min(Math.max(prev * delta, 0.3), 2);
         const scale = next / prev;

         // Keep the world position under the cursor stable while zooming
         setPan((p) => ({
           x: mx - (mx - p.x) * scale,
           y: my - (my - p.y) * scale,
         }));

         return next;
       });
       return;
     }

     // Pan with touchpad scroll
     if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
       // Prevent the page from scrolling while interacting with the canvas
       e.preventDefault();
       setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
     }
   }, []);

   useEffect(() => {
     const container = containerRef.current;
     if (!container) return;

     container.addEventListener("wheel", handleWheel, { passive: false });
     return () => container.removeEventListener("wheel", handleWheel);
   }, [handleWheel]);
 
   const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button (1) or left click (0) when no tool is active
    if (e.button === 1 || (e.button === 0 && !isDragging && !hasActiveSelection)) {
      e.preventDefault();
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
     }
   };
 
   const handleMouseMove = (e: React.MouseEvent) => {
     if (!isPanning) return;
     setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
   };
 
  const handleMouseUp = () => {
    setIsPanning(false);
    
    // Finish painting if we were painting tiles
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
  };
 
  const centerOnContent = useCallback(() => {
    const center = getContentCenter();
    const gridCenterPx = (gridSize * cellSize) / 2;
    const contentCenterPxX = center.x * cellSize;
    const contentCenterPxY = center.y * cellSize;

    // With nested transforms (translate then scale), translation is in screen px.
    // Offset needs to account for zoom.
    setPan({
      x: (gridCenterPx - contentCenterPxX) * zoom,
      y: (gridCenterPx - contentCenterPxY) * zoom,
    });
  }, [getContentCenter, gridSize, zoom]);
 
  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.3));
 
   const getCellFromDragEvent = useCallback((e: React.DragEvent): { x: number; y: number } | null => {
     const grid = gridRef.current;
     if (!grid) return null;
 
     const rect = grid.getBoundingClientRect();
     const x = (e.clientX - rect.left) / zoom;
     const y = (e.clientY - rect.top) / zoom;
 
     const cellX = Math.floor(x / cellSize);
     const cellY = Math.floor(y / cellSize);
 
     // Allow placement anywhere on the canvas - no restrictions
     return { x: cellX, y: cellY };
   }, [zoom]);
 
   const handleDragOver = useCallback((e: React.DragEvent) => {
     e.preventDefault();
     const types = Array.from(e.dataTransfer.types ?? []);
     const isMove = isDragging || types.includes("application/placed-structure");
     e.dataTransfer.dropEffect = isMove ? "move" : "copy";
 
     const cell = getCellFromDragEvent(e);
     setDragOverCell(cell);
   }, [isDragging, getCellFromDragEvent]);
 
   const handleDragLeave = () => {
     setDragOverCell(null);
   };
 
   const handleDrop = (e: React.DragEvent) => {
     e.preventDefault();
     setDragOverCell(null);
     setIsDragging(false);
 
     const cell = getCellFromDragEvent(e);
     if (!cell) return;
 
     // Check if it's a placed structure being moved
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
   };
 
   const handlePlacedDragStart = (e: React.DragEvent, placed: PlacedStructure) => {
     e.dataTransfer.setData("application/placed-structure", JSON.stringify(placed));
     e.dataTransfer.effectAllowed = "move";
     setIsDragging(true);
   };
 
   const handleCellClick = useCallback((cellX: number, cellY: number, e: React.MouseEvent) => {
     e.stopPropagation();
     
     // Handle structure placement
     if (selectedStructure) {
       onAddStructure(selectedStructure, cellX, cellY);
       return;
     }
     
     // Handle tile erasing
     if (isErasingTiles) {
       onRemoveTile(cellX, cellY);
       return;
     }
     
     // Handle single tile placement (for click, not drag)
     if (selectedGroundTile) {
       onAddTile(selectedGroundTile, cellX, cellY);
       return;
     }
   }, [selectedStructure, selectedGroundTile, isErasingTiles, onAddStructure, onAddTile, onRemoveTile]);
 
   const handleCellMouseDown = useCallback((cellX: number, cellY: number, e: React.MouseEvent) => {
     if (isReadOnly) return;

     // If no tool is active, let the event bubble up for panning
     if (!selectedGroundTile && !isErasingTiles && !selectedStructure) {
       return;
     }

     // Stop propagation when a tool is active (prevents pan interference)
     e.stopPropagation();

     // Handle tile painting
     if (selectedGroundTile || isErasingTiles) {
       setIsPainting(true);
       setPaintStartCell({ x: cellX, y: cellY });
       setPaintCurrentCell({ x: cellX, y: cellY });
     }
   }, [selectedGroundTile, isErasingTiles, selectedStructure, isReadOnly]);
 
   const handleCellMouseEnter = useCallback((cellX: number, cellY: number) => {
     if (isPainting) {
       setPaintCurrentCell({ x: cellX, y: cellY });
     }
   }, [isPainting]);
 
   // Get cells in paint selection area
   const paintSelectionCells = useMemo(() => {
     if (!isPainting || !paintStartCell || !paintCurrentCell) return new Set<string>();
     
     const minX = Math.min(paintStartCell.x, paintCurrentCell.x);
     const maxX = Math.max(paintStartCell.x, paintCurrentCell.x);
     const minY = Math.min(paintStartCell.y, paintCurrentCell.y);
     const maxY = Math.max(paintStartCell.y, paintCurrentCell.y);
     
     const cells = new Set<string>();
     for (let x = minX; x <= maxX; x++) {
       for (let y = minY; y <= maxY; y++) {
         cells.add(`${x}-${y}`);
       }
     }
     return cells;
   }, [isPainting, paintStartCell, paintCurrentCell]);
 
    const gridCells = useMemo(() => Array.from({ length: gridSize * gridSize }), [gridSize]);

    const paintOverlayRect = useMemo(() => {
      if (!isPainting || !paintStartCell || !paintCurrentCell) return null;

      const minX = Math.min(paintStartCell.x, paintCurrentCell.x);
      const maxX = Math.max(paintStartCell.x, paintCurrentCell.x);
      const minY = Math.min(paintStartCell.y, paintCurrentCell.y);
      const maxY = Math.max(paintStartCell.y, paintCurrentCell.y);

      return {
        left: minX * cellSize,
        top: minY * cellSize,
        width: (maxX - minX + 1) * cellSize,
        height: (maxY - minY + 1) * cellSize,
      };
    }, [cellSize, isPainting, paintCurrentCell, paintStartCell]);

    return (
     <main className="flex-1 flex flex-col bg-canvas overflow-hidden">
       <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
         <div className="flex items-center gap-2">
           <Grid3X3 className="h-4 w-4 text-muted-foreground" />
           <span className="text-sm font-medium text-muted-foreground">
             {placedStructures.length} structures • {groundTiles.length} tiles • Zoom: {Math.round(zoom * 100)}%
             {isReadOnly && (
               <span className="ml-2 text-muted-foreground">
                 • Modo visualização
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
 
       <div
         ref={containerRef}
         className="flex-1 overflow-hidden relative"
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         style={{ cursor: isReadOnly ? (isPanning ? "grabbing" : "grab") : (hasActiveSelection ? "crosshair" : isPanning ? "grabbing" : "grab") }}
        onContextMenu={(e) => e.preventDefault()}
       >
         <div 
           className="flex items-center justify-center w-full h-full"
           style={{ minHeight: "100%" }}
         >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transition: isPanning ? "none" : "transform 0.08s ease-out",
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: isPanning ? "none" : "transform 0.08s ease-out",
                }}
              >
                {/* Grid with square cells */}
                <div
                  ref={gridRef}
                  className="grid border border-border rounded-lg overflow-hidden shadow-soft"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
                    position: "relative",
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                {gridCells.map((_, i) => {
                  const x = i % gridSize;
                  const y = Math.floor(i / gridSize);
                  const isHighlighted = dragOverCell?.x === x && dragOverCell?.y === y;
                  const isInPaintSelection = paintSelectionCells.has(`${x}-${y}`);
                  
                  return (
                    <div
                      key={i}
                      onClick={(e) => !isReadOnly && !isPainting && handleCellClick(x, y, e)}
                      onMouseDown={(e) => handleCellMouseDown(x, y, e)}
                      onMouseEnter={() => handleCellMouseEnter(x, y)}
                      className={`bg-surface-elevated border-r border-b border-canvas-grid transition-colors select-none ${
                        isReadOnly 
                          ? "" 
                          : isInPaintSelection
                            ? isErasingTiles
                              ? "bg-destructive/30"
                              : "bg-primary/30"
                            : isHighlighted 
                              ? "bg-primary/20" 
                              : hasActiveSelection 
                                ? "hover:bg-primary/20 cursor-crosshair" 
                                : "hover:bg-primary/5"
                      }`}
                      style={{ width: cellSize, height: cellSize }}
                    />
                  );
                })}

                {paintOverlayRect && (
                  <div
                    className={`absolute pointer-events-none z-20 rounded-sm border ${
                      isErasingTiles ? "bg-destructive/20 border-destructive/60" : "bg-primary/20 border-primary/60"
                    }`}
                    style={{
                      left: paintOverlayRect.left,
                      top: paintOverlayRect.top,
                      width: paintOverlayRect.width,
                      height: paintOverlayRect.height,
                    }}
                  />
                )}
                
                {/* Ground tiles layer (below structures) */}
                {groundTiles.map((tile) => (
                  <PlacedGroundTileItem
                    key={tile.id}
                    tile={tile}
                    cellSize={cellSize}
                  />
                ))}
               
               {/* Placed structures overlay */}
               {placedStructures.map((placed) => (
                 <PlacedStructureItem
                   key={placed.id}
                   placed={placed}
                   cellSize={cellSize}
                   onRemove={onRemoveStructure}
                   onToggleBuilt={onToggleBuilt}
                   onDragStart={handlePlacedDragStart}
                   isNew={placed.isNew}
                 />
               ))}
                </div>
              </div>
           </div>
         </div>
         
         {/* Empty state overlay - fixed position */}
         {placedStructures.length === 0 && groundTiles.length === 0 && !hasActiveSelection && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <EmptyState
               icon={MousePointer2}
               title="Arraste ou clique para colocar"
               description="Arraste da biblioteca à esquerda ou clique numa estrutura/tile e depois no grid"
               className="bg-card/90 backdrop-blur-sm rounded-xl shadow-soft-lg"
             />
           </div>
         )}
       </div>
     </main>
   );
 }