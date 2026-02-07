/**
 * CanvasEditor: Componente React que gerencia o canvas 2D
 * Responsável por render, eventos de mouse, zoom/pan, seleção
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from './store';
import {
  PlaceableObject,
  DragState,
  Vec2,
  CanvasInputState,
} from './types';
import {
  getTopObjectAtPoint,
  getObjectsInRect,
  screenToCanvas,
  canvasToScreen,
  renderObject,
} from './utils';

interface CanvasEditorProps {
  width?: number;
  height?: number;
  onObjectSelected?: (obj: PlaceableObject | null) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  width = 1280,
  height = 720,
  onObjectSelected,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workspace = useCanvasStore((state) => state.workspace);
  const {
    selectObject,
    selectMultiple,
    moveObjects,
    panCamera,
    zoomCamera,
    updateObject,
  } = useCanvasStore();

  // Estado de Input
  const [inputState, setInputState] = useState<CanvasInputState>({
    mousePos: { x: 0, y: 0 },
    hoveredObjectId: null,
    drag: null,
    multiSelectMode: false,
  });

  const [spacePressed, setSpacePressed] = useState(false);

  // Referência para comparar com anterior e atualizar apenas se necessário
  const prevRenderStateRef = useRef<string>();

  // ========================================================================
  // RENDER LOOP
  // ========================================================================

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar grid (opcional, para referência)
    drawGrid(ctx, canvas.width, canvas.height, workspace.camera, 50);

    // Desenhar todos os objetos ordenados por z-index
    const objectsArray = Array.from(workspace.objects.values()).sort((a, b) => {
      const layerOrder: Record<string, number> = {
        ground: 0,
        structure: 1,
        decoration: 2,
        overlay: 3,
      };
      const aZ = layerOrder[a.layer] * 10000 + a.zIndex;
      const bZ = layerOrder[b.layer] * 10000 + b.zIndex;
      return aZ - bZ;
    });

    objectsArray.forEach((obj) => {
      if (!workspace.layerSettings[obj.layer].visible) return;

      // Update visual state (selected/highlighted)
      const isSelected = workspace.selectedIds.has(obj.id);
      const isHovered = inputState.hoveredObjectId === obj.id;

      updateObject(obj.id, {
        visual: {
          ...obj.visual,
          selected: isSelected,
          highlighted: isHovered,
        },
      });

      const updatedObj = workspace.objects.get(obj.id);
      if (!updatedObj) return;

      // Renderizar objeto
      // NOTE: Aqui você carregaria a imagem real do objeto
      // Por agora é placeholder
      renderObject(ctx, updatedObj, null, {
        cameraX: workspace.camera.x,
        cameraY: workspace.camera.y,
        zoom: workspace.camera.zoom,
        layerOpacity: workspace.layerSettings[obj.layer].opacity,
      });
    });

    // Desenhar seleção by dragging (retângulo)
    if (inputState.drag?.active && !inputState.drag.isDragging) {
      drawSelectionRect(ctx, inputState.drag.dragStart, inputState.mousePos, workspace.camera);
    }
  }, [workspace, inputState, updateObject]);

  // Render whenever workspace or input changes
  useEffect(() => {
    render();
  }, [render]);

  // ========================================================================
  // EVENTS: MOUSE
  // ========================================================================

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenPos: Vec2 = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const canvasPos = screenToCanvas(
        screenPos,
        workspace.camera.x,
        workspace.camera.y,
        workspace.camera.zoom
      );

      // Verificar se clicou em objeto
      const targetObj = getTopObjectAtPoint(canvasPos, workspace.objects);

      // Preparar drag state
      const newDragState: DragState = {
        active: true,
        isDragging: false,
        dragStart: canvasPos,
        screenStart: screenPos,
        selectedObjects: workspace.selectedIds.has(targetObj?.id || '')
          ? Array.from(workspace.selectedIds)
              .map((id) => workspace.objects.get(id))
              .filter((obj): obj is PlaceableObject => !!obj)
          : targetObj
            ? [targetObj]
            : [],
        objectOffsets: new Map(),
        threshold: 5,
      };

      // Calcular offsets para cada objeto selecionado
      newDragState.selectedObjects.forEach((obj) => {
        newDragState.objectOffsets.set(obj.id, {
          x: obj.position.x - canvasPos.x,
          y: obj.position.y - canvasPos.y,
        });
      });

      // Atualizar seleção
      if (e.ctrlKey || e.metaKey) {
        // Multi-select mode
        if (targetObj) {
          selectObject(targetObj.id, true);
        }
      } else if (e.shiftKey) {
        // Range select (placeholder - implementar depois)
        if (targetObj) {
          selectObject(targetObj.id, false);
        }
      } else {
        // Normal select
        selectObject(targetObj?.id || null, false);
      }

      setInputState({
        ...inputState,
        drag: newDragState,
        multiSelectMode: e.ctrlKey || e.metaKey,
      });
    },
    [workspace, selectObject, inputState]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenPos: Vec2 = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const canvasPos = screenToCanvas(
        screenPos,
        workspace.camera.x,
        workspace.camera.y,
        workspace.camera.zoom
      );

      setInputState((prev) => ({
        ...prev,
        mousePos: canvasPos,
      }));

      // Hover object
      const hoveredObj = getTopObjectAtPoint(canvasPos, workspace.objects);
      setInputState((prev) => ({
        ...prev,
        hoveredObjectId: hoveredObj?.id ?? null,
      }));

      // Drag
      if (inputState.drag?.active) {
        const distance = Math.hypot(
          screenPos.x - inputState.drag.screenStart.x,
          screenPos.y - inputState.drag.screenStart.y
        );

        if (distance >= inputState.drag.threshold) {
          setInputState((prev) => ({
            ...prev,
            drag: prev.drag ? { ...prev.drag, isDragging: true } : null,
          }));

          // Mover objetos
          const movements = inputState.drag.selectedObjects.map((obj) => {
            const offset = inputState.drag!.objectOffsets.get(obj.id);
            return {
              id: obj.id,
              position: {
                x: canvasPos.x + (offset?.x ?? 0),
                y: canvasPos.y + (offset?.y ?? 0),
              },
            };
          });

          moveObjects(movements);
        }
      }

      // Pan com middle mouse button ou spacebar
      if (e.buttons === 4 || (e.buttons === 1 && spacePressed)) {
        const delta = {
          x: screenPos.x - (inputState.drag?.screenStart.x ?? screenPos.x),
          y: screenPos.y - (inputState.drag?.screenStart.y ?? screenPos.y),
        };
        panCamera(delta);
      }
    },
    [inputState, workspace, moveObjects, panCamera]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!inputState.drag) return;

      const { isDragging, selectedObjects } = inputState.drag;

      if (!isDragging && selectedObjects.length === 0) {
        // Click em vazio: clear selection
        selectObject(null);
      }

      setInputState((prev) => ({
        ...prev,
        drag: null,
      }));
    },
    [inputState, selectObject]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenPos: Vec2 = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const canvasPos = screenToCanvas(
        screenPos,
        workspace.camera.x,
        workspace.camera.y,
        workspace.camera.zoom
      );

      // Zoom in (negative wheel) / out (positive wheel)
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      zoomCamera(factor, canvasPos);
    },
    [workspace.camera, zoomCamera]
  );

  // ========================================================================
  // KEYBOARD SHORTCUTS
  // ========================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        // TODO: Call undo from store
      }

      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        // TODO: Call redo from store
      }

      // Delete: Remover selecionados
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        // TODO: Delete selected objects
      }

      // Spacebar: Pan mode
      if (e.key === ' ') {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        border: '1px solid #ccc',
        cursor: inputState.drag?.isDragging ? 'grabbing' : 'grab',
        display: 'block',
      }}
    />
  );
};

// ============================================================================
// HELPER RENDERING FUNCTIONS
// ============================================================================

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: { x: number; y: number; zoom: number },
  gridSize: number = 50
) {
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;

  const startX = Math.floor(camera.x / gridSize) * gridSize;
  const startY = Math.floor(camera.y / gridSize) * gridSize;

  for (let x = startX; x < camera.x + width / camera.zoom; x += gridSize) {
    const screenX = (x - camera.x) * camera.zoom;
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, height);
    ctx.stroke();
  }

  for (let y = startY; y < camera.y + height / camera.zoom; y += gridSize) {
    const screenY = (y - camera.y) * camera.zoom;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(width, screenY);
    ctx.stroke();
  }
}

function drawSelectionRect(
  ctx: CanvasRenderingContext2D,
  start: Vec2,
  end: Vec2,
  camera: { x: number; y: number; zoom: number }
) {
  const screenStart = canvasToScreen(start, camera.x, camera.y, camera.zoom);
  const screenEnd = canvasToScreen(end, camera.x, camera.y, camera.zoom);

  const x = Math.min(screenStart.x, screenEnd.x);
  const y = Math.min(screenStart.y, screenEnd.y);
  const width = Math.abs(screenEnd.x - screenStart.x);
  const height = Math.abs(screenEnd.y - screenStart.y);

  ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = '#0066FF';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(x, y, width, height);
  ctx.setLineDash([]);
}
