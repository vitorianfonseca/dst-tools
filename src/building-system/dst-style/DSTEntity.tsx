/**
 * DST Style Entity Component
 * Estruturas com sombras, depth e estilo Don't Starve Together
 */

import React, { memo, useState } from 'react';
import { Structure } from '../types.ts';
import { STRUCTURE_DEFINITIONS } from '../constants.ts';
import { calculateZIndex } from '../collision.ts';
import { DST_STRUCTURE_COLORS, DST_STRUCTURE_IMAGES, DST_COLORS, DST_VISUAL, DST_FONT } from './constants.ts';

interface DSTEntityProps {
    structure: Structure;
    onClick?: (structure: Structure) => void;
    onPointerDown?: (structure: Structure, event: React.PointerEvent) => void;
    isSelected?: boolean;
    showPlacementBorders?: boolean;
    interactionEnabled?: boolean;
}

/**
 * Componente de estrutura com estilo DST
 */
export const DSTEntity = memo(({
    structure,
    onClick,
    onPointerDown,
    isSelected = false,
    showPlacementBorders = false,
    interactionEnabled = true
}: DSTEntityProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const definition = STRUCTURE_DEFINITIONS[structure.type];
    const baseColor = DST_STRUCTURE_COLORS[structure.type as keyof typeof DST_STRUCTURE_COLORS] || '#6b4423';
    const structureImage = DST_STRUCTURE_IMAGES[structure.type as keyof typeof DST_STRUCTURE_IMAGES];

    // Estrutura principal
    const structureStyle: React.CSSProperties = {
        position: 'absolute',
        left: structure.x,
        top: structure.y,
        width: structure.width,
        height: structure.height,
        border: showPlacementBorders
            ? `3px solid ${isSelected ? DST_COLORS.selection : 'rgba(0, 0, 0, 0.4)'}`
            : 'none',
        borderRadius: `${DST_VISUAL.borderRadius}px`,
        boxSizing: 'border-box',
        cursor: interactionEnabled ? 'pointer' : 'default',
        pointerEvents: interactionEnabled ? 'auto' : 'none',
        zIndex: calculateZIndex(structure),
        transform: `rotate(${structure.rotation}deg)`,
        transformOrigin: 'center center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        // Usar imagem da estrutura
        backgroundImage: structureImage ? `url(${structureImage})` : `linear-gradient(135deg, ${baseColor} 0%, rgba(0,0,0,0.2) 100%)`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: structureImage ? 'transparent' : baseColor,
        transition: `all ${DST_VISUAL.hoverGlowDuration} ease`,
        ...(showPlacementBorders && isSelected && {
            outline: `2px solid ${DST_COLORS.selection}`,
            outlineOffset: '2px'
        })
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.(structure);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        onPointerDown?.(structure, e);
    };

    return (
        <div
            style={structureStyle}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={definition.name}
        />
    );
});

DSTEntity.displayName = 'DSTEntity';

interface DSTEntityLayerProps {
    structures: Structure[];
    onStructureClick?: (structure: Structure) => void;
    onStructurePointerDown?: (structure: Structure, event: React.PointerEvent) => void;
    selectedStructureId?: string | null;
    showPlacementBorders?: boolean;
    hiddenStructureId?: string | null;
    interactionEnabled?: boolean;
}

/**
 * Layer de estruturas estilo DST
 */
export const DSTEntityLayer = memo(({
    structures,
    onStructureClick,
    onStructurePointerDown,
    selectedStructureId,
    showPlacementBorders = false,
    hiddenStructureId = null,
    interactionEnabled = true
}: DSTEntityLayerProps) => {
    return (
        <>
            {structures.map((structure) => {
                if (structure.id === hiddenStructureId) return null;

                return (
                    <DSTEntity
                        key={structure.id}
                        structure={structure}
                        onClick={onStructureClick}
                        onPointerDown={onStructurePointerDown}
                        isSelected={structure.id === selectedStructureId}
                        showPlacementBorders={showPlacementBorders}
                        interactionEnabled={interactionEnabled}
                    />
                );
            })}
        </>
    );
});

DSTEntityLayer.displayName = 'DSTEntityLayer';
