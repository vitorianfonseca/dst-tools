/**
 * CanvasEditorApp: Componente integrado que engloba todo o editor visual
 * Layout: Toolbar + Canvas + Panels
 */

import React, { useState } from 'react';
import { Toolbar } from './Toolbar';
import { CanvasEditor } from './CanvasEditor';
import { LayerPanel } from './LayerPanel';
import { PropertiesPanel } from './PropertiesPanel';

interface CanvasEditorAppProps {
  width?: number;
  height?: number;
  showLeftPanel?: boolean;
  showRightPanel?: boolean;
}

export const CanvasEditorApp: React.FC<CanvasEditorAppProps> = ({
  width = 1400,
  height = 800,
  showLeftPanel = true,
  showRightPanel = true,
}) => {
  const [canvasWidth] = useState(width - (showLeftPanel ? 220 : 0) - (showRightPanel ? 280 : 0));
  const [canvasHeight] = useState(height - 60); // Toolbar height

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height, width }}>
      {/* Toolbar */}
      <Toolbar />

      {/* Main container: panels + canvas */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel: Layers */}
        {showLeftPanel && <LayerPanel />}

        {/* Canvas */}
        <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
          <CanvasEditor width={canvasWidth} height={canvasHeight} />
        </div>

        {/* Right Panel: Properties */}
        {showRightPanel && <PropertiesPanel />}
      </div>
    </div>
  );
};
