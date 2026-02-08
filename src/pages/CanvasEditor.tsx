/**
 * Página do novo Canvas Editor visual
 */

import React from 'react';
import { CanvasEditorApp } from '@/canvas';

const CanvasEditorPage: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
      <CanvasEditorApp
        width={window.innerWidth}
        height={window.innerHeight}
        showLeftPanel
        showRightPanel
      />
    </div>
  );
};

export default CanvasEditorPage;
