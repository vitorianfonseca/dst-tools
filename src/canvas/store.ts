/**
 * Zustand store para gerenciar estado do canvas
 * Inclui: objects, camera, selection, undo/redo, settings
 */

import { create } from 'zustand';
import {
  PlaceableObject,
  CanvasWorkspace,
  CanvasAction,
  CanvasCamera,
  ObjectLayer,
  Vec2,
} from './types';
import { cloneObject, generateObjectId } from './utils';

interface CanvasStore {
  // Estado
  workspace: CanvasWorkspace;

  // Objeto
  addObject: (obj: Omit<PlaceableObject, 'id'>) => void;
  deleteObjects: (ids: string[]) => void;
  updateObject: (id: string, updates: Partial<PlaceableObject>) => void;
  moveObjects: (movements: Array<{ id: string; position: Vec2 }>) => void;
  duplicateObjects: (ids: string[]) => void;

  // Seleção
  selectObject: (id: string | null, multiSelect?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  toggleObjectSelection: (id: string) => void;

  // Visibilidade de layers
  toggleLayerVisibility: (layer: ObjectLayer) => void;
  toggleLayerLock: (layer: ObjectLayer) => void;
  setLayerOpacity: (layer: ObjectLayer, opacity: number) => void;

  // Camera (zoom/pan)
  setCamera: (camera: CanvasCamera) => void;
  panCamera: (delta: Vec2) => void;
  zoomCamera: (factor: number, centerPoint?: Vec2) => void;
  resetCamera: () => void;

  // Undo/Redo
  pushAction: (action: CanvasAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Snap grid
  setSnapEnabled: (enabled: boolean) => void;
  setSnapSize: (size: number) => void;

  // Workspace
  loadWorkspace: (workspace: CanvasWorkspace) => void;
  saveWorkspace: () => string; // Retorna JSON
  createNewWorkspace: (name: string, width: number, height: number) => void;

  // Utilitários
  getSelectedObjects: () => PlaceableObject[];
  getObjectsByLayer: (layer: ObjectLayer) => PlaceableObject[];
}

const INITIAL_WORKSPACE: CanvasWorkspace = {
  id: `ws_${Date.now()}`,
  name: 'Untitled',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  objects: new Map(),
  canvasSize: { width: 1280, height: 720 },
  camera: { x: 0, y: 0, zoom: 1 },
  selectedIds: new Set(),
  layerSettings: {
    ground: { visible: true, locked: false, opacity: 1 },
    structure: { visible: true, locked: false, opacity: 1 },
    decoration: { visible: true, locked: false, opacity: 1 },
    overlay: { visible: true, locked: false, opacity: 1 },
  },
  snap: {
    enabled: false,
    size: 32,
    threshold: 50000,
  },
  history: {
    undo: [],
    redo: [],
  },
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  workspace: INITIAL_WORKSPACE,

  // ========================================================================
  // OBJETOS
  // ========================================================================

  addObject: (objData) => {
    set((state) => {
      const newObj: PlaceableObject = {
        ...objData,
        id: generateObjectId(),
      };
      const newObjects = new Map(state.workspace.objects);
      newObjects.set(newObj.id, newObj);

      return {
        workspace: {
          ...state.workspace,
          objects: newObjects,
          updatedAt: Date.now(),
        },
      };
    });

    // Adicionar ao history
    const { workspace } = get();
    const newObj = Array.from(workspace.objects.values()).pop();
    if (newObj) {
      get().pushAction({ type: 'add', objects: [newObj] });
    }
  },

  deleteObjects: (ids) => {
    set((state) => {
      const deletedObjects = ids
        .map((id) => state.workspace.objects.get(id))
        .filter((obj): obj is PlaceableObject => !!obj)
        .map((obj) => ({ id: obj.id, data: obj }));

      const newObjects = new Map(state.workspace.objects);
      ids.forEach((id) => newObjects.delete(id));

      const newSelectedIds = new Set<string>(state.workspace.selectedIds);
      ids.forEach((id) => newSelectedIds.delete(id));

      return {
        workspace: {
          ...state.workspace,
          objects: newObjects,
          selectedIds: newSelectedIds,
          updatedAt: Date.now(),
        },
      };
    });

    // History
    const { workspace } = get();
    const deletedObjects = ids
      .map((id) => workspace.objects.get(id))
      .filter((obj): obj is PlaceableObject => !!obj)
      .map((obj) => ({ id: obj.id, data: obj }));

    if (deletedObjects.length > 0) {
      get().pushAction({ type: 'delete', objects: deletedObjects });
    }
  },

  updateObject: (id, updates) => {
    set((state) => {
      const newObjects = new Map(state.workspace.objects);
      const existing = newObjects.get(id);
      if (existing) {
        newObjects.set(id, { ...existing, ...updates });
      }
      return {
        workspace: {
          ...state.workspace,
          objects: newObjects,
          updatedAt: Date.now(),
        },
      };
    });
  },

  moveObjects: (movements) => {
    set((state) => {
      const newObjects = new Map(state.workspace.objects);
      movements.forEach(({ id, position }) => {
        const obj = newObjects.get(id);
        if (obj) {
          newObjects.set(id, { ...obj, position });
        }
      });
      return {
        workspace: {
          ...state.workspace,
          objects: newObjects,
          updatedAt: Date.now(),
        },
      };
    });
  },

  duplicateObjects: (ids) => {
    set((state) => {
      const newObjects = new Map(state.workspace.objects);
      const newIds: string[] = [];

      ids.forEach((id) => {
        const original = state.workspace.objects.get(id);
        if (original) {
          const clone = cloneObject(original);
          const newId = generateObjectId();
          clone.id = newId;
          // Offset pequeno para ele não ficar no mesmo local
          clone.position.x += 20;
          clone.position.y += 20;
          newObjects.set(newId, clone);
          newIds.push(newId);
        }
      });

      return {
        workspace: {
          ...state.workspace,
          objects: newObjects,
          selectedIds: new Set<string>(newIds),
          updatedAt: Date.now(),
        },
      };
    });
  },

  // ========================================================================
  // SELEÇÃO
  // ========================================================================

  selectObject: (id, multiSelect = false) => {
    set((state) => {
      const newSelectedIds: Set<string> = multiSelect
        ? new Set(state.workspace.selectedIds)
        : new Set<string>();

      if (id) {
        newSelectedIds.add(id);
      }

      return {
        workspace: {
          ...state.workspace,
          selectedIds: newSelectedIds,
        },
      };
    });
  },

  selectMultiple: (ids) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        selectedIds: new Set<string>(ids),
      },
    }));
  },

  clearSelection: () => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        selectedIds: new Set<string>(),
      },
    }));
  },

  toggleObjectSelection: (id) => {
    set((state) => {
      const newSelectedIds = new Set<string>(state.workspace.selectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return {
        workspace: {
          ...state.workspace,
          selectedIds: newSelectedIds,
        },
      };
    });
  },

  // ========================================================================
  // LAYERS
  // ========================================================================

  toggleLayerVisibility: (layer) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        layerSettings: {
          ...state.workspace.layerSettings,
          [layer]: {
            ...state.workspace.layerSettings[layer],
            visible: !state.workspace.layerSettings[layer].visible,
          },
        },
      },
    }));
  },

  toggleLayerLock: (layer) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        layerSettings: {
          ...state.workspace.layerSettings,
          [layer]: {
            ...state.workspace.layerSettings[layer],
            locked: !state.workspace.layerSettings[layer].locked,
          },
        },
      },
    }));
  },

  setLayerOpacity: (layer, opacity) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        layerSettings: {
          ...state.workspace.layerSettings,
          [layer]: {
            ...state.workspace.layerSettings[layer],
            opacity: Math.max(0, Math.min(1, opacity)),
          },
        },
      },
    }));
  },

  // ========================================================================
  // CAMERA
  // ========================================================================

  setCamera: (camera) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        camera,
      },
    }));
  },

  panCamera: (delta) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        camera: {
          ...state.workspace.camera,
          x: state.workspace.camera.x - delta.x / state.workspace.camera.zoom,
          y: state.workspace.camera.y - delta.y / state.workspace.camera.zoom,
        },
      },
    }));
  },

  zoomCamera: (factor, centerPoint) => {
    set((state) => {
      const newZoom = Math.max(0.1, Math.min(5, state.workspace.camera.zoom * factor));
      const zoomDelta = newZoom / state.workspace.camera.zoom;

      // Se tem ponto de centro, manter zoom centrado nele
      let newCameraX = state.workspace.camera.x;
      let newCameraY = state.workspace.camera.y;

      if (centerPoint) {
        newCameraX = centerPoint.x - (centerPoint.x - newCameraX) / zoomDelta;
        newCameraY = centerPoint.y - (centerPoint.y - newCameraY) / zoomDelta;
      }

      return {
        workspace: {
          ...state.workspace,
          camera: {
            x: newCameraX,
            y: newCameraY,
            zoom: newZoom,
          },
        },
      };
    });
  },

  resetCamera: () => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        camera: { x: 0, y: 0, zoom: 1 },
      },
    }));
  },

  // ========================================================================
  // UNDO/REDO
  // ========================================================================

  pushAction: (action) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        history: {
          undo: [...state.workspace.history.undo, action],
          redo: [],
        },
      },
    }));
  },

  undo: () => {
    set((state) => {
      const history = state.workspace.history;
      if (history.undo.length === 0) return state;

      const action = history.undo[history.undo.length - 1];
      // TODO: Implementar reverse das ações
      return state;
    });
  },

  redo: () => {
    set((state) => {
      const history = state.workspace.history;
      if (history.redo.length === 0) return state;

      const action = history.redo[history.redo.length - 1];
      // TODO: Implementar redo das ações
      return state;
    });
  },

  canUndo: () => {
    return get().workspace.history.undo.length > 0;
  },

  canRedo: () => {
    return get().workspace.history.redo.length > 0;
  },

  // ========================================================================
  // SNAP GRID
  // ========================================================================

  setSnapEnabled: (enabled) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        snap: {
          ...state.workspace.snap,
          enabled,
        },
      },
    }));
  },

  setSnapSize: (size) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        snap: {
          ...state.workspace.snap,
          size,
        },
      },
    }));
  },

  // ========================================================================
  // WORKSPACE
  // ========================================================================

  loadWorkspace: (newWorkspace) => {
    set({ workspace: newWorkspace });
  },

  saveWorkspace: () => {
    const { workspace } = get();
    const serializable = {
      ...workspace,
      objects: Array.from(workspace.objects.entries()).map(([id, obj]) => ({
        id,
        ...obj,
      })),
      selectedIds: Array.from(workspace.selectedIds),
    };
    return JSON.stringify(serializable, null, 2);
  },

  createNewWorkspace: (name, width, height) => {
    set({
      workspace: {
        ...INITIAL_WORKSPACE,
        id: `ws_${Date.now()}`,
        name,
        canvasSize: { width, height },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        selectedIds: new Set<string>(),
      },
    });
  },

  // ========================================================================
  // UTILITÁRIOS
  // ========================================================================

  getSelectedObjects: () => {
    const { workspace } = get();
    return Array.from(workspace.selectedIds)
      .map((id) => workspace.objects.get(id))
      .filter((obj): obj is PlaceableObject => !!obj);
  },

  getObjectsByLayer: (layer) => {
    const { workspace } = get();
    return Array.from(workspace.objects.values()).filter((obj) => obj.layer === layer);
  },
}));
