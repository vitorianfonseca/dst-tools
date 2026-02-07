/**
 * Layer Panel: UI para gerenciar visibilidade, lock, opacity de layers
 */

import React from 'react';
import { useCanvasStore } from './store';
import { ObjectLayer } from './types';

const LAYERS: ObjectLayer[] = ['ground', 'structure', 'decoration', 'overlay'];

const LAYER_LABELS: Record<ObjectLayer, string> = {
  ground: 'Ground',
  structure: 'Structures',
  decoration: 'Decorations',
  overlay: 'Overlays',
};

const LAYER_COLORS: Record<ObjectLayer, string> = {
  ground: '#8B7355',
  structure: '#4A90E2',
  decoration: '#7ED321',
  overlay: '#F5A623',
};

export const LayerPanel: React.FC = () => {
  const { workspace, toggleLayerVisibility, toggleLayerLock, setLayerOpacity } = useCanvasStore();

  return (
    <div style={{ padding: '16px', borderRight: '1px solid #ddd', minWidth: '200px' }}>
      <h3 style={{ marginTop: 0 }}>Layers</h3>

      {LAYERS.map((layer) => {
        const settings = workspace.layerSettings[layer];
        const objectCount = Array.from(workspace.objects.values()).filter(
          (obj) => obj.layer === layer
        ).length;

        return (
          <div
            key={layer}
            style={{
              marginBottom: '12px',
              padding: '8px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#fafafa',
            }}
          >
            {/* Header com label e ícones */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: LAYER_COLORS[layer],
                  marginRight: '8px',
                }}
              />
              <span style={{ flex: 1, fontWeight: 500, fontSize: '14px' }}>
                {LAYER_LABELS[layer]}
              </span>
              <span style={{ fontSize: '12px', color: '#999' }}>({objectCount})</span>
            </div>

            {/* Controles */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Visibility toggle */}
              <button
                onClick={() => toggleLayerVisibility(layer)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  backgroundColor: settings.visible ? '#ddd' : '#fff',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
                title={settings.visible ? 'Hide layer' : 'Show layer'}
              >
                {settings.visible ? '👁️' : '🚫'}
              </button>

              {/* Lock toggle */}
              <button
                onClick={() => toggleLayerLock(layer)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  backgroundColor: settings.locked ? '#ddd' : '#fff',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
                title={settings.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {settings.locked ? '🔒' : '🔓'}
              </button>

              {/* Opacity slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={settings.opacity * 100}
                onChange={(e) => setLayerOpacity(layer, parseInt(e.target.value) / 100)}
                style={{ flex: 1, cursor: 'pointer' }}
                title={`Opacity: ${Math.round(settings.opacity * 100)}%`}
              />
              <span style={{ fontSize: '12px', color: '#666', minWidth: '30px' }}>
                {Math.round(settings.opacity * 100)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
