/**
 * Histórico e operações de undo/redo
 */

import { CanvasAction, CanvasWorkspace, PlaceableObject } from './types';

/**
 * Aplicar uma ação e sua reversa ao workspace
 */
export function applyAction(workspace: CanvasWorkspace, action: CanvasAction): void {
  switch (action.type) {
    case 'move':
      action.objects.forEach(({ id, to }) => {
        const obj = workspace.objects.get(id);
        if (obj) {
          obj.position = to;
        }
      });
      break;

    case 'add':
      action.objects.forEach((obj) => {
        workspace.objects.set(obj.id, { ...obj });
      });
      break;

    case 'delete':
      action.objects.forEach(({ id }) => {
        workspace.objects.delete(id);
      });
      break;

    case 'modify':
      action.objects.forEach(({ id, to }) => {
        const obj = workspace.objects.get(id);
        if (obj) {
          Object.assign(obj, to);
        }
      });
      break;

    case 'reorder':
      action.objects.forEach(({ id, toZIndex, toLayer }) => {
        const obj = workspace.objects.get(id);
        if (obj) {
          obj.zIndex = toZIndex;
          obj.layer = toLayer;
        }
      });
      break;

    case 'camera':
      workspace.camera = action.to;
      break;
  }
}

/**
 * Reverter uma ação ao estado anterior
 */
export function reverseAction(workspace: CanvasWorkspace, action: CanvasAction): void {
  switch (action.type) {
    case 'move':
      action.objects.forEach(({ id, from }) => {
        const obj = workspace.objects.get(id);
        if (obj) {
          obj.position = from;
        }
      });
      break;

    case 'add':
      action.objects.forEach((obj) => {
        workspace.objects.delete(obj.id);
      });
      break;

    case 'delete':
      action.objects.forEach(({ id, data }) => {
        workspace.objects.set(id, { ...data });
      });
      break;

    case 'modify':
      action.objects.forEach(({ id, from }) => {
        const obj = workspace.objects.get(id);
        if (obj) {
          Object.assign(obj, from);
        }
      });
      break;

    case 'reorder':
      action.objects.forEach(({ id, fromZIndex, fromLayer }) => {
        const obj = workspace.objects.get(id);
        if (obj) {
          obj.zIndex = fromZIndex;
          obj.layer = fromLayer;
        }
      });
      break;

    case 'camera':
      workspace.camera = action.from;
      break;
  }
}
