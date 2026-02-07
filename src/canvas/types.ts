/**
 * Tipos para o sistema de canvas contínuo (não-grid)
 * Arquitetura completa para editor visual 2D
 */

// ============================================================================
// POSICIONAMENTO E GEOMETRIA
// ============================================================================

export type AnchorPoint =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// OBJETO PLACÁVEL PRINCIPAL
// ============================================================================

export type ObjectLayer = 'ground' | 'structure' | 'decoration' | 'overlay';
export type ObjectType = 'structure' | 'decoration' | 'ground_modifier';

export interface PlaceableObject {
  // Identidade
  id: string;
  type: ObjectType;

  // Posição em coordenadas contínuas (pixels)
  position: Vec2;

  // Dimensões visuais
  dimensions: {
    width: number;
    height: number;
  };

  // Ponto de pivô (onde x,y se refere no objeto)
  anchor: AnchorPoint;

  // Ordem de render: primeiro por layer, depois por zIndex dentro da layer
  layer: ObjectLayer;
  zIndex: number;

  // Transformações
  rotation: number; // Graus (0-360)
  scale: {
    x: number;
    y: number;
  };

  // Propriedades visuais
  visual: {
    opacity: number; // 0-1
    highlighted: boolean; // Hover state
    selected: boolean; // Selection state
    locked: boolean; // Impede movimento/delete acidental
  };

  // Dados descritivos
  metadata: ObjectMetadata;
}

export interface ObjectMetadata {
  // Referência para asset (imagem, etc.)
  assetKey: string;

  // Nome/label exibível
  name: string;

  // Raio funcional (ex: lightning rod)
  functionalRadius?: number;
  functionalRadiusType?: 'circle' | 'square';

  // Dados estruturais customizados por tipo
  data?: Record<string, any>;
}

// ============================================================================
// ESTADO DO CANVAS
// ============================================================================

export interface CanvasCamera {
  x: number; // Offset X (pan)
  y: number; // Offset Y (pan)
  zoom: number; // Nível de zoom (1.0 = 100%)
}

export interface LayerSettings {
  visible: boolean;
  locked: boolean; // Não permite selecionar/mover nada na layer
  opacity: number; // 0-1
}

export interface CanvasWorkspace {
  // Identidade
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;

  // Objetos (Map para acesso O(1))
  objects: Map<string, PlaceableObject>;

  // Viewport
  canvasSize: {
    width: number;
    height: number;
  };
  camera: CanvasCamera;

  // Seleção atual
  selectedIds: Set<string>;

  // Settings de visualização
  layerSettings: Record<ObjectLayer, LayerSettings>;

  // Grid snap (opcional)
  snap: {
    enabled: boolean;
    size: number;
    threshold: number;
  };

  // Histórico para undo/redo
  history: HistoryStack;
}

// ============================================================================
// AÇÕES / HISTÓRICO
// ============================================================================

export type CanvasAction =
  | {
      type: 'move';
      objects: Array<{
        id: string;
        from: Vec2;
        to: Vec2;
      }>;
    }
  | {
      type: 'add';
      objects: PlaceableObject[];
    }
  | {
      type: 'delete';
      objects: { id: string; data: PlaceableObject }[];
    }
  | {
      type: 'modify';
      objects: Array<{
        id: string;
        from: Partial<PlaceableObject>;
        to: Partial<PlaceableObject>;
      }>;
    }
  | {
      type: 'reorder';
      objects: Array<{
        id: string;
        fromZIndex: number;
        toZIndex: number;
        fromLayer: ObjectLayer;
        toLayer: ObjectLayer;
      }>;
    }
  | {
      type: 'camera';
      from: CanvasCamera;
      to: CanvasCamera;
    };

export interface HistoryStack {
  undo: CanvasAction[];
  redo: CanvasAction[];
}

// ============================================================================
// EVENTOS E INTERAÇÃO
// ============================================================================

export interface DragState {
  active: boolean;
  isDragging: boolean;
  dragStart: Vec2; // Canvas coordinates
  screenStart: Vec2; // Screen coordinates
  selectedObjects: PlaceableObject[];
  objectOffsets: Map<
    string,
    {
      x: number;
      y: number;
    }
  >;
  threshold: number; // Mínimo de pixels para considerar drag
}

export interface CanvasInputState {
  mousePos: Vec2; // Posição do mouse em canvas coords
  hoveredObjectId: string | null;
  drag: DragState | null;
  multiSelectMode: boolean; // Shift pressionado
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

export interface AnchorOffsets {
  x: number;
  y: number;
}

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Função genérica para aplicar snap grid
 */
export function applyGridSnap(
  position: Vec2,
  snapSize: number,
  enabled: boolean,
  threshold: number = 50000 // Large default means no snap
): Vec2 {
  if (!enabled) return position;

  const snappedX = Math.round(position.x / snapSize) * snapSize;
  const snappedY = Math.round(position.y / snapSize) * snapSize;

  const distanceX = Math.abs(position.x - snappedX);
  const distanceY = Math.abs(position.y - snappedY);

  return {
    x: distanceX < threshold ? snappedX : position.x,
    y: distanceY < threshold ? snappedY : position.y,
  };
}

/**
 * Calcular índice Z global (layer + zIndex local)
 */
export function getGlobalZIndex(obj: PlaceableObject): number {
  const layerOrder: Record<ObjectLayer, number> = {
    ground: 0,
    structure: 1,
    decoration: 2,
    overlay: 3,
  };
  return layerOrder[obj.layer] * 10000 + obj.zIndex;
}
