/**
 * Utilitários para canvas: cálculos de posição, bounds, etc.
 */

import {
  PlaceableObject,
  Bounds,
  AnchorOffsets,
  AnchorPoint,
  Vec2,
  Rect,
} from './types';

/**
 * Calcular offs when baseado no anchor point
 * Exemplo: anchor='center' com (100, 100) de tamanho
 * → posição (x,y) fica no centro do objeto
 */
export function calculateAnchorOffsets(
  anchor: AnchorPoint,
  width: number,
  height: number
): AnchorOffsets {
  let x = 0,
    y = 0;

  // Horizontal
  if (anchor.includes('center')) {
    x = -width / 2;
  } else if (anchor.includes('right')) {
    x = -width;
  }
  // 'left' stays 0

  // Vertical
  if (anchor.includes('center')) {
    y = -height / 2;
  } else if (anchor.includes('bottom')) {
    y = -height;
  }
  // 'top' stays 0

  return { x, y };
}

/**
 * Calcular bounding box visual completo de um objeto
 * Considerando posição, tamanho, anchor e rotação
 */
export function getObjectBounds(obj: PlaceableObject): Bounds {
  const offsets = calculateAnchorOffsets(obj.anchor, obj.dimensions.width, obj.dimensions.height);

  // Posição top-left (considerando anchor)
  const leftX = obj.position.x + offsets.x;
  const topY = obj.position.y + offsets.y;

  // Aplicar escala
  const actualWidth = obj.dimensions.width * Math.abs(obj.scale.x);
  const actualHeight = obj.dimensions.height * Math.abs(obj.scale.y);

  // NOTE: Rotação complica muito - para MVP, ignora rotação na hitbox
  // Em produção, usar SAT (Separating Axis Theorem) para hitbox rotacionada

  return {
    left: leftX,
    top: topY,
    right: leftX + actualWidth,
    bottom: topY + actualHeight,
    width: actualWidth,
    height: actualHeight,
    centerX: leftX + actualWidth / 2,
    centerY: topY + actualHeight / 2,
  };
}

/**
 * Verificar se um ponto está dentro do bounding box de um objeto
 */
export function objectContainsPoint(obj: PlaceableObject, point: Vec2): boolean {
  const bounds = getObjectBounds(obj);
  return (
    point.x >= bounds.left &&
    point.x <= bounds.right &&
    point.y >= bounds.top &&
    point.y <= bounds.bottom
  );
}

/**
 * Encontrar objetos que se sobrepõem com um ponto
 * Retorna em ordem de z-index (top primeiro)
 */
export function getObjectsAtPoint(
  point: Vec2,
  objects: Map<string, PlaceableObject>,
  filterLayers?: Set<string>
): PlaceableObject[] {
  const layerOrder: Record<string, number> = {
    ground: 0,
    structure: 1,
    decoration: 2,
    overlay: 3,
  };

  return Array.from(objects.values())
    .filter((obj) => {
      if (filterLayers && !filterLayers.has(obj.layer)) {
        return false;
      }
      return objectContainsPoint(obj, point);
    })
    .sort((a, b) => {
      const aLayer = layerOrder[a.layer] * 10000 + a.zIndex;
      const bLayer = layerOrder[b.layer] * 10000 + b.zIndex;
      return bLayer - aLayer; // Descendente (top primeiro)
    });
}

/**
 * Encontrar objeto top-most em um ponto
 * Retorna null se nada encontrado
 */
export function getTopObjectAtPoint(
  point: Vec2,
  objects: Map<string, PlaceableObject>,
  filterLayers?: Set<string>
): PlaceableObject | null {
  return getObjectsAtPoint(point, objects, filterLayers)[0] ?? null;
}

/**
 * Encontrar todos objetos dentro de um rect
 * Usado para seleção by dragging
 */
export function getObjectsInRect(
  rect: Rect,
  objects: Map<string, PlaceableObject>
): PlaceableObject[] {
  return Array.from(objects.values()).filter((obj) => {
    const bounds = getObjectBounds(obj);
    return !(
      bounds.right < rect.x ||
      bounds.left > rect.x + rect.width ||
      bounds.bottom < rect.y ||
      bounds.top > rect.y + rect.height
    );
  });
}

/**
 * Converter coordenadas de screen para canvas
 * Considerando camera pan e zoom
 */
export function screenToCanvas(
  screenPoint: Vec2,
  cameraX: number,
  cameraY: number,
  zoom: number
): Vec2 {
  return {
    x: screenPoint.x / zoom + cameraX,
    y: screenPoint.y / zoom + cameraY,
  };
}

/**
 * Converter coordenadas de canvas para screen
 * Considerando camera pan e zoom
 */
export function canvasToScreen(
  canvasPoint: Vec2,
  cameraX: number,
  cameraY: number,
  zoom: number
): Vec2 {
  return {
    x: (canvasPoint.x - cameraX) * zoom,
    y: (canvasPoint.y - cameraY) * zoom,
  };
}

/**
 * Render do objeto em contexto Canvas 2D
 * Baseado em posição, transformações e estado visual
 */
export function renderObject(
  ctx: CanvasRenderingContext2D,
  obj: PlaceableObject,
  image: HTMLImageElement | null,
  options: {
    cameraX: number;
    cameraY: number;
    zoom: number;
    layerOpacity: number;
  }
) {
  const bounds = getObjectBounds(obj);
  const screenBounds = {
    x: (bounds.left - options.cameraX) * options.zoom,
    y: (bounds.top - options.cameraY) * options.zoom,
    width: bounds.width * Math.abs(obj.scale.x) * options.zoom,
    height: bounds.height * Math.abs(obj.scale.y) * options.zoom,
  };

  // Skip if completely off-screen
  if (
    screenBounds.x + screenBounds.width < 0 ||
    screenBounds.x > ctx.canvas.width ||
    screenBounds.y + screenBounds.height < 0 ||
    screenBounds.y > ctx.canvas.height
  ) {
    return;
  }

  ctx.save();

  // Aplicar opacity combinada
  const finalOpacity = obj.visual.opacity * options.layerOpacity;
  ctx.globalAlpha = finalOpacity;

  // Aplicar transformações
  ctx.translate(screenBounds.x + screenBounds.width / 2, screenBounds.y + screenBounds.height / 2);
  ctx.rotate((obj.rotation * Math.PI) / 180);
  ctx.scale(obj.scale.x, obj.scale.y);

  // Desenhar imagem (se houver)
  if (image) {
    ctx.drawImage(
      image,
      -screenBounds.width / 2,
      -screenBounds.height / 2,
      screenBounds.width,
      screenBounds.height
    );
  } else {
    // Placeholder se sem imagem
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.fillRect(
      -screenBounds.width / 2,
      -screenBounds.height / 2,
      screenBounds.width,
      screenBounds.height
    );
    ctx.fillStyle = '#999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(obj.metadata.name, 0, 0);
  }

  ctx.restore();

  // Desenhar selection/hover UI (não rotacionado)
  if (obj.visual.highlighted && !obj.visual.selected) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenBounds.x, screenBounds.y, screenBounds.width, screenBounds.height);
  }

  if (obj.visual.selected) {
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 3;
    ctx.strokeRect(screenBounds.x, screenBounds.y, screenBounds.width, screenBounds.height);

    // Desenhar resize handles
    drawResizeHandles(ctx, screenBounds);
  }

  // Desenhar raio funcional se highlighted/selected
  if ((obj.visual.highlighted || obj.visual.selected) && obj.metadata.functionalRadius) {
    const centerScreen = canvasToScreen(obj.position, options.cameraX, options.cameraY, options.zoom);
    const radiusScreen = obj.metadata.functionalRadius * options.zoom;

    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerScreen.x, centerScreen.y, radiusScreen, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Desenhar handles para resize nos cantos e lados do objeto
 */
function drawResizeHandles(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number }
) {
  const handleSize = 8;
  ctx.fillStyle = '#0066FF';

  // Cantos
  const corners = [
    [bounds.x, bounds.y],
    [bounds.x + bounds.width, bounds.y],
    [bounds.x, bounds.y + bounds.height],
    [bounds.x + bounds.width, bounds.y + bounds.height],
  ];

  corners.forEach(([x, y]) => {
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  });
}

/**
 * Gerar ID único para novo objeto
 */
export function generateObjectId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clonar objeto (deep copy)
 */
export function cloneObject(obj: PlaceableObject): PlaceableObject {
  return {
    ...obj,
    position: { ...obj.position },
    dimensions: { ...obj.dimensions },
    scale: { ...obj.scale },
    visual: { ...obj.visual },
    metadata: {
      ...obj.metadata,
      data: obj.metadata.data ? { ...obj.metadata.data } : undefined,
    },
  };
}
