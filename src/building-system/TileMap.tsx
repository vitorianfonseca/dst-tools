/**
 * TileMap Component
 * Renderiza o terreno em grid (não contém estruturas)
 */

import React, { memo } from 'react';
import { Tile, TileType } from './types';
import { TILE_SIZE, TILE_COLORS, MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from './constants';

interface TileMapProps {
    tiles: Tile[][];
}

/**
 * Componente individual de um tile (otimizado com memo)
 */
const TileCell = memo(({ tile }: { tile: Tile }) => {
    const style: React.CSSProperties = {
        position: 'absolute',
        left: tile.x * TILE_SIZE,
        top: tile.y * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundColor: TILE_COLORS[tile.type],
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box'
    };

    return <div style={style} />;
});

TileCell.displayName = 'TileCell';

/**
 * Componente principal do TileMap
 */
export const TileMap = memo(({ tiles }: TileMapProps) => {
    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: MAP_WIDTH_TILES * TILE_SIZE,
        height: MAP_HEIGHT_TILES * TILE_SIZE,
        pointerEvents: 'none' // permite eventos de rato passarem através
    };

    return (
        <div style={containerStyle}>
            {tiles.flat().map((tile) => (
                <TileCell key={`tile-${tile.x}-${tile.y}`} tile={tile} />
            ))}
        </div>
    );
});

TileMap.displayName = 'TileMap';

/**
 * Utilitário para gerar um tilemap inicial
 */
export function generateTileMap(
    width: number = MAP_WIDTH_TILES,
    height: number = MAP_HEIGHT_TILES,
    defaultType: TileType = 'grass'
): Tile[][] {
    const tiles: Tile[][] = [];

    for (let y = 0; y < height; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < width; x++) {
            // Gera padrão simples: água nas bordas, resto de grama
            let type: TileType = defaultType;

            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                type = 'water';
            } else if (Math.random() > 0.9) {
                type = Math.random() > 0.5 ? 'dirt' : 'stone';
            }

            row.push({ x, y, type });
        }
        tiles.push(row);
    }

    return tiles;
}
