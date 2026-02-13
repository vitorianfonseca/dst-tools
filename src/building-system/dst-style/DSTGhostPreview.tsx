/**
 * DST Style Ghost Preview Component
 * Preview fantasma com brilho quente estilo Don't Starve Together
 */

import React, { memo } from 'react';
import { GhostState } from '../types.ts';
import { STRUCTURE_DEFINITIONS } from '../constants.ts';
import { DST_STRUCTURE_IMAGES, DST_VISUAL } from './constants.ts';

interface DSTGhostPreviewProps {
  ghost: GhostState | null;
}

/**
 * Ghost preview com estilo DST
 */
export const DSTGhostPreview = memo(({ ghost }: DSTGhostPreviewProps) => {
  if (!ghost) return null;

  const definition = STRUCTURE_DEFINITIONS[ghost.type];
  const structureImage = DST_STRUCTURE_IMAGES[ghost.type as keyof typeof DST_STRUCTURE_IMAGES];

  // Ghost principal
  const ghostStyle: React.CSSProperties = {
    position: 'absolute',
    left: ghost.x,
    top: ghost.y,
    width: definition.width,
    height: definition.height,
    border: 'none',
    borderRadius: `${DST_VISUAL.borderRadius}px`,
    boxSizing: 'border-box',
    pointerEvents: 'none',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    // Usar imagem da estrutura com opacidade
    backgroundImage: structureImage ? `url(${structureImage})` : undefined,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'transparent',
    animation: 'dst-ghost-pulse 1.5s ease-in-out infinite',
    opacity: 0.55,
    filter: 'brightness(1.05) saturate(0.95)'
  };

  return (
    <>
      <div style={ghostStyle} title={definition.name} />
      <style>{`
        @keyframes dst-ghost-pulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.02);
          }
        }
      `}</style>
    </>
  );
});

DSTGhostPreview.displayName = 'DSTGhostPreview';
