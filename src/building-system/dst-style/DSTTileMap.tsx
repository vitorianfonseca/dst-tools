/**
 * DST Style TileMap Component
 * TileMap com textura de grass
 */

import React, { memo, useMemo } from 'react';
import { Tile } from '../types.ts';
import { TILE_SIZE } from '../constants.ts';
import { DST_COLORS, DST_TILE_COLORS, DST_TILE_EDGE_COLORS, DST_VISUAL } from './constants.ts';
import { calculateTileAdjacency, generateOrganicEdgePattern, isEdgeTile, shouldShowBorder, TileAdjacency } from './tileBlending.ts';

interface DSTTileCellProps {
    tile: Tile;
    adjacency: TileAdjacency;
    isIso: boolean;
    interactive: boolean;
    isPainting: boolean;
    onTilePointerDown?: (tile: Tile, event: React.PointerEvent<HTMLDivElement>) => void;
    onTilePointerEnter?: (tile: Tile, event: React.PointerEvent<HTMLDivElement>) => void;
}

// const TILE_SHEET = {
//     // src: '/src/assets/tiles/grassTiles.png',
//     src: '/src/assets/tiles/gt.png',
//     columns: 24,
//     rows: 12
// };
//
// const TILE_SPRITES: Record<TileType, Array<{ col: number; row: number }>> = {
//     grass: [{ col: 0, row: 0 }],
//     dirt: [{ col: 0, row: 0 }],
//     water: [{ col: 0, row: 0 }],
//     stone: [{ col: 0, row: 0 }],
//     sand: [{ col: 0, row: 0 }]
// };

const TILE_IMAGE_VARIANTS: Record<Tile['type'], string[]> = {
    grass: ['/src/assets/tiles/grass.png', '/src/assets/tiles/grass_test.png', '/src/assets/tiles/gt.png'],
    dirt: ['/src/assets/tiles/gt.png', '/src/assets/tiles/grass_test.png'],
    water: ['/src/assets/tiles/marsh.png'],
    stone: ['/src/assets/tiles/rock2.png', '/src/assets/tiles/rock.png', '/src/assets/tiles/cobblestone.png'],
    sand: ['/src/assets/tiles/wheat.png', '/src/assets/tiles/grass_test.png']
};

const TILE_TEXTURE_TUNING: Record<Tile['type'], {
    sizeIso: string;
    sizeFlat: string;
    repeat: 'repeat' | 'no-repeat';
    tintA: string;
    tintB: string;
}> = {
    grass: {
        sizeIso: '74% 74%',
        sizeFlat: '74% 74%',
        repeat: 'repeat',
        tintA: 'rgba(70, 100, 52, 0.30)',
        tintB: 'rgba(32, 48, 26, 0.26)'
    },
    dirt: {
        sizeIso: '78% 78%',
        sizeFlat: '78% 78%',
        repeat: 'repeat',
        tintA: 'rgba(98, 74, 54, 0.34)',
        tintB: 'rgba(45, 34, 26, 0.28)'
    },
    water: {
        sizeIso: '70% 70%',
        sizeFlat: '70% 70%',
        repeat: 'repeat',
        tintA: 'rgba(44, 72, 89, 0.32)',
        tintB: 'rgba(20, 34, 45, 0.28)'
    },
    stone: {
        sizeIso: '76% 76%',
        sizeFlat: '76% 76%',
        repeat: 'repeat',
        tintA: 'rgba(86, 93, 95, 0.28)',
        tintB: 'rgba(44, 46, 47, 0.26)'
    },
    sand: {
        sizeIso: '80% 80%',
        sizeFlat: '80% 80%',
        repeat: 'repeat',
        tintA: 'rgba(139, 115, 85, 0.28)',
        tintB: 'rgba(80, 62, 43, 0.20)'
    }
};

const TILE_OVERLAP = 2;
const TILE_W = 64;
const TILE_H = 32;
const TILE_BLEED_X = 6;
const TILE_BLEED_Y = 3;
const TILE_LIFT_Y = -1;

function worldToIso(x: number, y: number) {
    return {
        x: (x - y) * TILE_W / 2,
        y: (x + y) * TILE_H / 2
    };
}

// const getSpriteForTile = (tile: Tile) => {
//     const variants = TILE_SPRITES[tile.type] || TILE_SPRITES.grass;
//     const index = (tile.x + tile.y * 7) % variants.length;
//     return variants[index];
// };

/**
 * Componente individual de tile com estilo DST
 */
const DSTTileCell = memo(({ tile, adjacency, isIso, interactive, isPainting, onTilePointerDown, onTilePointerEnter }: DSTTileCellProps) => {
    const p = worldToIso(tile.x, tile.y);
    const tileWidth = isIso ? TILE_W + TILE_BLEED_X : TILE_SIZE + TILE_OVERLAP;
    const tileHeight = isIso ? TILE_H + TILE_BLEED_Y : TILE_SIZE + TILE_OVERLAP;
    const left = isIso ? p.x - tileWidth / 2 : tile.x * TILE_SIZE - TILE_OVERLAP / 2;
    const top = isIso ? p.y - tileHeight / 2 + TILE_LIFT_Y : tile.y * TILE_SIZE - TILE_OVERLAP / 2;
    const variants = TILE_IMAGE_VARIANTS[tile.type];
    const variantIndex = Math.abs((tile.x * 31 + tile.y * 17 + tile.x * tile.y) % variants.length);
    const tileImage = variants[variantIndex];
    const tileColor = DST_TILE_COLORS[tile.type];
    const edgeColor = DST_TILE_EDGE_COLORS[tile.type];
    const tuning = TILE_TEXTURE_TUNING[tile.type];
    const organicTop = generateOrganicEdgePattern(tile.x, tile.y, 'north');
    const organicRight = generateOrganicEdgePattern(tile.x, tile.y, 'east');
    const organicBottom = generateOrganicEdgePattern(tile.x, tile.y, 'south');
    const organicLeft = generateOrganicEdgePattern(tile.x, tile.y, 'west');
    const hasEdge = isEdgeTile(adjacency, tile.type);

    // Only show borders at transitions between different tile types
    const showTop = shouldShowBorder(adjacency, tile.type, 'top');
    const showRight = shouldShowBorder(adjacency, tile.type, 'right');
    const showBottom = shouldShowBorder(adjacency, tile.type, 'bottom');
    const showLeft = shouldShowBorder(adjacency, tile.type, 'left');
    const topBorder = showTop ? `${1 + organicTop * 0.2}px solid ${edgeColor}` : 'none';
    const rightBorder = showRight ? `${1 + organicRight * 0.2}px solid ${edgeColor}` : 'none';
    const bottomBorder = showBottom ? `${1 + organicBottom * 0.2}px solid ${edgeColor}` : 'none';
    const leftBorder = showLeft ? `${1 + organicLeft * 0.2}px solid ${edgeColor}` : 'none';

    const style: React.CSSProperties = {
        position: 'absolute',
        left,
        top,
        width: tileWidth,
        height: tileHeight,
        boxSizing: 'border-box',
        backgroundColor: tileColor,
        backgroundImage: `linear-gradient(160deg, ${tuning.tintA}, ${tuning.tintB}), url(${tileImage})`,
        backgroundSize: isIso ? tuning.sizeIso : tuning.sizeFlat,
        backgroundRepeat: tuning.repeat,
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply, normal',
        filter: 'contrast(1.05) saturate(0.86) brightness(0.97)',
        borderTop: topBorder,
        borderRight: rightBorder,
        borderBottom: bottomBorder,
        borderLeft: leftBorder,
        borderRadius: isIso ? 0 : DST_VISUAL.borderRadius,
        clipPath: isIso ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : undefined,
        boxShadow: isIso
            ? 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 0 rgba(0,0,0,0.18)'
            : 'none',
        pointerEvents: interactive ? 'auto' : 'none',
        cursor: interactive ? 'cell' : 'default'
    };

    return (
        <div
            style={style}
            onPointerDown={(event) => onTilePointerDown?.(tile, event)}
            onPointerEnter={(event) => {
                if (isPainting) {
                    onTilePointerEnter?.(tile, event);
                }
            }}
        />
    );
});

DSTTileCell.displayName = 'DSTTileCell';

interface DSTTileMapProps {
    tiles: Tile[][];
    width: number;
    height: number;
    projection?: 'flat' | 'iso';
    interactive?: boolean;
    isPainting?: boolean;
    onTilePointerDown?: (tile: Tile, event: React.PointerEvent<HTMLDivElement>) => void;
    onTilePointerEnter?: (tile: Tile, event: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * TileMap com estilo DST completo
 */
export const DSTTileMap = memo(({
    tiles,
    width,
    height,
    projection = 'flat',
    interactive = false,
    isPainting = false,
    onTilePointerDown,
    onTilePointerEnter
}: DSTTileMapProps) => {
    const isIso = projection === 'iso';
    const mapRows = tiles.length;
    const mapCols = tiles[0]?.length ?? 0;
    const isoOffsetX = ((mapRows - 1) * TILE_W) / 2;
    const sortedTiles = useMemo(
        () => tiles.flat().sort((a, b) => ((a.x + a.y) - (b.x + b.y)) || (a.y - b.y) || (a.x - b.x)),
        [tiles]
    );

    const adjacencyMap = useMemo(() => {
        const map = new Map<string, TileAdjacency>();
        for (const tile of sortedTiles) {
            map.set(`${tile.x}-${tile.y}`, calculateTileAdjacency(tiles, tile.x, tile.y));
        }
        return map;
    }, [tiles, sortedTiles]);

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: interactive ? 'auto' : 'none',
        filter: 'contrast(1.05) brightness(0.97) saturate(0.9)',
        backgroundColor: DST_COLORS.background,
        overflow: 'visible'
    };

    const layerStyle: React.CSSProperties = isIso
        ? {
            position: 'relative',
            width: (mapCols + mapRows) * (TILE_W / 2),
            height: (mapCols + mapRows) * (TILE_H / 2),
            left: isoOffsetX,
            top: 0
        }
        : {
            position: 'relative',
            width,
            height
        };

    return (
        <div style={containerStyle}>
            <div style={layerStyle}>
                {sortedTiles.map((tile) => (
                    <DSTTileCell
                        key={`tile-${tile.x}-${tile.y}`}
                        tile={tile}
                        adjacency={adjacencyMap.get(`${tile.x}-${tile.y}`) ?? calculateTileAdjacency(tiles, tile.x, tile.y)}
                        isIso={isIso}
                        interactive={interactive}
                        isPainting={isPainting}
                        onTilePointerDown={onTilePointerDown}
                        onTilePointerEnter={onTilePointerEnter}
                    />
                ))}
            </div>
        </div>
    );
});

DSTTileMap.displayName = 'DSTTileMap';
