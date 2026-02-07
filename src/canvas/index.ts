/**
 * Canvas module: re-exports de todos os tipos, store, e componentes
 */

// Types
export * from './types';

// Store
export { useCanvasStore } from './store';

// Utils
export * from './utils';

// Components
export { CanvasEditor } from './CanvasEditor';
export { LayerPanel } from './LayerPanel';
export { PropertiesPanel } from './PropertiesPanel';
export { Toolbar } from './Toolbar';

// Integrated Editor
export { CanvasEditorApp } from './CanvasEditorApp';
