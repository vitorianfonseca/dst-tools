/**
 * Properties Panel: UI para editar propriedades do objeto selecionado
 */

import React, { useState } from 'react';
import { useCanvasStore } from './store';
import { PlaceableObject, ObjectLayer } from './types';

export const PropertiesPanel: React.FC = () => {
  const { workspace, getSelectedObjects, updateObject } = useCanvasStore();
  const selectedObjects = getSelectedObjects();
  const selectedObj = selectedObjects.length === 1 ? selectedObjects[0] : null;

  if (!selectedObj) {
    return (
      <div style={{ padding: '16px', borderLeft: '1px solid #ddd', minWidth: '250px' }}>
        <p style={{ color: '#999', fontSize: '14px' }}>No object selected</p>
      </div>
    );
  }

  const handleUpdatePosition = (key: 'x' | 'y', value: number) => {
    updateObject(selectedObj.id, {
      position: {
        ...selectedObj.position,
        [key]: value,
      },
    });
  };

  const handleUpdateDimension = (key: 'width' | 'height', value: number) => {
    updateObject(selectedObj.id, {
      dimensions: {
        ...selectedObj.dimensions,
        [key]: Math.max(1, value),
      },
    });
  };

  const handleUpdateScale = (key: 'x' | 'y', value: number) => {
    updateObject(selectedObj.id, {
      scale: {
        ...selectedObj.scale,
        [key]: value,
      },
    });
  };

  const handleUpdateRotation = (value: number) => {
    updateObject(selectedObj.id, {
      rotation: value % 360,
    });
  };

  const handleUpdateOpacity = (value: number) => {
    updateObject(selectedObj.id, {
      visual: {
        ...selectedObj.visual,
        opacity: Math.max(0, Math.min(1, value)),
      },
    });
  };

  const handleUpdateLayer = (layer: ObjectLayer) => {
    updateObject(selectedObj.id, { layer });
  };

  const handleToggleLock = () => {
    updateObject(selectedObj.id, {
      visual: {
        ...selectedObj.visual,
        locked: !selectedObj.visual.locked,
      },
    });
  };

  const handleUpdateFunctionalRadius = (value: number) => {
    updateObject(selectedObj.id, {
      metadata: {
        ...selectedObj.metadata,
        functionalRadius: Math.max(0, value),
      },
    });
  };

  return (
    <div
      style={{
        padding: '16px',
        borderLeft: '1px solid #ddd',
        minWidth: '250px',
        maxHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ marginTop: 0 }}>{selectedObj.metadata.name}</h3>

      {/* ID */}
      <div style={{ marginBottom: '12px', fontSize: '12px', color: '#999' }}>
        ID: {selectedObj.id}
      </div>

      {/* POSITION */}
      <fieldset style={{ marginBottom: '12px' }}>
        <legend>Position</legend>
        <div style={{ fontSize: '12px' }}>
          <div style={{ marginBottom: '6px' }}>
            <label>
              X:{' '}
              <input
                type="number"
                value={Math.round(selectedObj.position.x * 10) / 10}
                onChange={(e) => handleUpdatePosition('x', parseFloat(e.target.value))}
                style={{ width: '60px' }}
              />
            </label>
          </div>
          <div>
            <label>
              Y:{' '}
              <input
                type="number"
                value={Math.round(selectedObj.position.y * 10) / 10}
                onChange={(e) => handleUpdatePosition('y', parseFloat(e.target.value))}
                style={{ width: '60px' }}
              />
            </label>
          </div>
        </div>
      </fieldset>

      {/* DIMENSIONS */}
      <fieldset style={{ marginBottom: '12px' }}>
        <legend>Size</legend>
        <div style={{ fontSize: '12px' }}>
          <div style={{ marginBottom: '6px' }}>
            <label>
              W:{' '}
              <input
                type="number"
                value={selectedObj.dimensions.width}
                onChange={(e) => handleUpdateDimension('width', parseFloat(e.target.value))}
                style={{ width: '60px' }}
              />
            </label>
          </div>
          <div>
            <label>
              H:{' '}
              <input
                type="number"
                value={selectedObj.dimensions.height}
                onChange={(e) => handleUpdateDimension('height', parseFloat(e.target.value))}
                style={{ width: '60px' }}
              />
            </label>
          </div>
        </div>
      </fieldset>

      {/* SCALE */}
      <fieldset style={{ marginBottom: '12px' }}>
        <legend>Scale</legend>
        <div style={{ fontSize: '12px' }}>
          <div style={{ marginBottom: '6px' }}>
            <label>
              X:{' '}
              <input
                type="number"
                step="0.1"
                value={selectedObj.scale.x.toFixed(2)}
                onChange={(e) => handleUpdateScale('x', parseFloat(e.target.value))}
                style={{ width: '60px' }}
              />
            </label>
          </div>
          <div>
            <label>
              Y:{' '}
              <input
                type="number"
                step="0.1"
                value={selectedObj.scale.y.toFixed(2)}
                onChange={(e) => handleUpdateScale('y', parseFloat(e.target.value))}
                style={{ width: '60px' }}
              />
            </label>
          </div>
        </div>
      </fieldset>

      {/* ROTATION */}
      <fieldset style={{ marginBottom: '12px' }}>
        <legend>Rotation</legend>
        <input
          type="number"
          min="0"
          max="359"
          value={Math.round(selectedObj.rotation)}
          onChange={(e) => handleUpdateRotation(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
        <input
          type="range"
          min="0"
          max="360"
          value={selectedObj.rotation}
          onChange={(e) => handleUpdateRotation(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: '8px' }}
        />
      </fieldset>

      {/* OPACITY */}
      <fieldset style={{ marginBottom: '12px' }}>
        <legend>Opacity</legend>
        <input
          type="range"
          min="0"
          max="100"
          value={selectedObj.visual.opacity * 100}
          onChange={(e) => handleUpdateOpacity(parseFloat(e.target.value) / 100)}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '12px', marginTop: '6px', color: '#666' }}>
          {Math.round(selectedObj.visual.opacity * 100)}%
        </div>
      </fieldset>

      {/* LAYER */}
      <fieldset style={{ marginBottom: '12px' }}>
        <legend>Layer</legend>
        <select
          value={selectedObj.layer}
          onChange={(e) => handleUpdateLayer(e.target.value as ObjectLayer)}
          style={{ width: '100%' }}
        >
          <option value="ground">Ground</option>
          <option value="structure">Structure</option>
          <option value="decoration">Decoration</option>
          <option value="overlay">Overlay</option>
        </select>
      </fieldset>

      {/* Z-INDEX */}
      <fieldset style={{ marginBottom: '12px' }}>
        <legend>Z-Index</legend>
        <input
          type="number"
          value={selectedObj.zIndex}
          onChange={(e) =>
            updateObject(selectedObj.id, { zIndex: parseInt(e.target.value) })
          }
          style={{ width: '100%' }}
        />
      </fieldset>

      {/* FUNCTIONAL RADIUS (se aplicável) */}
      {selectedObj.metadata.functionalRadius !== undefined && (
        <fieldset style={{ marginBottom: '12px' }}>
          <legend>Functional Radius</legend>
          <input
            type="number"
            value={selectedObj.metadata.functionalRadius}
            onChange={(e) => handleUpdateFunctionalRadius(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            px • {(selectedObj.metadata.functionalRadiusType || 'circle')}
          </div>
        </fieldset>
      )}

      {/* ANCHOR */}
      <fieldset style={{ marginBottom: '12px' }}>
        <legend>Anchor Point</legend>
        <select
          value={selectedObj.anchor}
          onChange={(e) =>
            updateObject(selectedObj.id, {
              anchor: e.target.value as any,
            })
          }
          style={{ width: '100%', fontSize: '12px' }}
        >
          <option value="top-left">Top Left</option>
          <option value="top-center">Top Center</option>
          <option value="top-right">Top Right</option>
          <option value="center-left">Center Left</option>
          <option value="center">Center</option>
          <option value="center-right">Center Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </fieldset>

      {/* LOCK */}
      <button
        onClick={handleToggleLock}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: selectedObj.visual.locked ? '#f0f0f0' : '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '12px',
        }}
      >
        {selectedObj.visual.locked ? '🔒 Locked' : '🔓 Unlocked'}
      </button>

      {/* METADATA DATA (customizável) */}
      {selectedObj.metadata.data && Object.keys(selectedObj.metadata.data).length > 0 && (
        <fieldset>
          <legend>Data</legend>
          <div style={{ fontSize: '12px' }}>
            {JSON.stringify(selectedObj.metadata.data, null, 2)}
          </div>
        </fieldset>
      )}
    </div>
  );
};
