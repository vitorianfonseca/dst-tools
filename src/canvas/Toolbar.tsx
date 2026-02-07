/**
 * Toolbar: Controles rápidos e ações globais
 */

import React from 'react';
import { useCanvasStore } from './store';

export const Toolbar: React.FC = () => {
  const {
    workspace,
    addObject,
    deleteObjects,
    duplicateObjects,
    getSelectedObjects,
    clearSelection,
    resetCamera,
    setSnapEnabled,
    setSnapSize,
  } = useCanvasStore();

  const selectedObjects = getSelectedObjects();
  const hasSelection = selectedObjects.length > 0;

  const handleAddStructure = () => {
    addObject({
      type: 'structure',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      dimensions: { width: 64, height: 64 },
      anchor: 'center',
      layer: 'structure',
      zIndex: 0,
      rotation: 0,
      scale: { x: 1, y: 1 },
      visual: {
        opacity: 1,
        highlighted: false,
        selected: false,
        locked: false,
      },
      metadata: {
        assetKey: 'science-machine',
        name: 'New Structure',
        functionalRadius: 64,
        functionalRadiusType: 'circle',
      },
    });
  };

  const handleDelete = () => {
    const ids = selectedObjects.map((obj) => obj.id);
    deleteObjects(ids);
  };

  const handleDuplicate = () => {
    const ids = selectedObjects.map((obj) => obj.id);
    duplicateObjects(ids);
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        flexWrap: 'wrap',
      }}
    >
      {/* Add */}
      <button
        onClick={handleAddStructure}
        style={{
          padding: '8px 12px',
          backgroundColor: '#0066FF',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        ➕ Add Structure
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={!hasSelection}
        style={{
          padding: '8px 12px',
          backgroundColor: hasSelection ? '#FF6B6B' : '#e0e0e0',
          color: hasSelection ? 'white' : '#999',
          border: 'none',
          borderRadius: '4px',
          cursor: hasSelection ? 'pointer' : 'not-allowed',
          fontSize: '13px',
        }}
      >
        🗑️ Delete
      </button>

      {/* Duplicate */}
      <button
        onClick={handleDuplicate}
        disabled={!hasSelection}
        style={{
          padding: '8px 12px',
          backgroundColor: hasSelection ? '#50C878' : '#e0e0e0',
          color: hasSelection ? 'white' : '#999',
          border: 'none',
          borderRadius: '4px',
          cursor: hasSelection ? 'pointer' : 'not-allowed',
          fontSize: '13px',
        }}
      >
        📋 Duplicate ({selectedObjects.length})
      </button>

      {/* Clear Selection */}
      <button
        onClick={clearSelection}
        disabled={!hasSelection}
        style={{
          padding: '8px 12px',
          backgroundColor: '#e0e0e0',
          color: hasSelection ? '#333' : '#999',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: hasSelection ? 'pointer' : 'not-allowed',
          fontSize: '13px',
        }}
      >
        Clear
      </button>

      {/* Reset Camera */}
      <button
        onClick={resetCamera}
        title="Reset zoom and pan"
        style={{
          padding: '8px 12px',
          backgroundColor: '#e0e0e0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        🏠 Home
      </button>

      {/* Separator */}
      <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd' }} />

      {/* Snap Grid */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
        <input
          type="checkbox"
          checked={workspace.snap.enabled}
          onChange={(e) => setSnapEnabled(e.target.checked)}
        />
        Grid Snap
      </label>

      {workspace.snap.enabled && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          Size:
          <input
            type="number"
            min="4"
            max="256"
            value={workspace.snap.size}
            onChange={(e) => setSnapSize(parseInt(e.target.value))}
            style={{ width: '50px' }}
          />
        </label>
      )}

      {/* Info */}
      <div
        style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: '#666',
          display: 'flex',
          gap: '16px',
        }}
      >
        <span>
          Objects: <strong>{workspace.objects.size}</strong>
        </span>
        <span>
          Zoom: <strong>{Math.round(workspace.camera.zoom * 100)}%</strong>
        </span>
      </div>
    </div>
  );
};
