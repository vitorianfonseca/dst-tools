/**
 * Tile Blending System for DST Style
 * Sistema de blend e adjacência para tiles parecerem orgânicos
 */

import { Tile, TileType } from '../types.ts';

// Direções para verificar adjacência
export type Direction = 'north' | 'south' | 'east' | 'west' |
    'northeast' | 'northwest' | 'southeast' | 'southwest';

export interface TileAdjacency {
    north: TileType | null;
    south: TileType | null;
    east: TileType | null;
    west: TileType | null;
    northeast: TileType | null;
    northwest: TileType | null;
    southeast: TileType | null;
    southwest: TileType | null;
}

/**
 * Obtém o tipo de tile numa posição específica
 */
function getTileAt(tiles: Tile[][], x: number, y: number): TileType | null {
    if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) {
        return null;
    }
    return tiles[y][x].type;
}

/**
 * Calcula a adjacência de um tile (que tipos estão ao redor)
 */
export function calculateTileAdjacency(
    tiles: Tile[][],
    x: number,
    y: number
): TileAdjacency {
    return {
        north: getTileAt(tiles, x, y - 1),
        south: getTileAt(tiles, x, y + 1),
        east: getTileAt(tiles, x + 1, y),
        west: getTileAt(tiles, x - 1, y),
        northeast: getTileAt(tiles, x + 1, y - 1),
        northwest: getTileAt(tiles, x - 1, y - 1),
        southeast: getTileAt(tiles, x + 1, y + 1),
        southwest: getTileAt(tiles, x - 1, y + 1)
    };
}

/**
 * Verifica se um tile tem vizinhos do mesmo tipo
 */
export function hasSameTypeNeighbors(
    adjacency: TileAdjacency,
    currentType: TileType
): boolean {
    return Object.values(adjacency).some(type => type === currentType);
}

/**
 * Conta quantos vizinhos são do mesmo tipo
 */
export function countSameTypeNeighbors(
    adjacency: TileAdjacency,
    currentType: TileType
): number {
    return Object.values(adjacency).filter(type => type === currentType).length;
}

/**
 * Verifica se deve mostrar borda em determinada direção
 */
export function shouldShowBorder(
    adjacency: TileAdjacency,
    currentType: TileType,
    direction: 'top' | 'right' | 'bottom' | 'left'
): boolean {
    const directionMap = {
        top: adjacency.north,
        right: adjacency.east,
        bottom: adjacency.south,
        left: adjacency.west
    };

    const neighbor = directionMap[direction];
    return neighbor !== null && neighbor !== currentType;
}

/**
 * Calcula o "blend factor" para transições suaves
 */
export function calculateBlendFactor(
    adjacency: TileAdjacency,
    currentType: TileType
): number {
    const sameTypeCount = countSameTypeNeighbors(adjacency, currentType);
    return Math.min(sameTypeCount / 8, 1);
}

/**
 * Gera um padrão de borda orgânico (pseudo-random mas consistente)
 */
export function generateOrganicEdgePattern(x: number, y: number, direction: Direction): number {
    const seed = x * 73 + y * 137;
    const noise = Math.sin(seed) * 0.5 + 0.5;
    return noise * 3;
}

/**
 * Determina se um tile é uma "edge tile" (borda entre diferentes tipos)
 */
export function isEdgeTile(adjacency: TileAdjacency, currentType: TileType): boolean {
    return Object.values(adjacency).some(type => type !== null && type !== currentType);
}

/**
 * Calcula opacidade da grid line baseado na adjacência
 */
export function calculateGridLineOpacity(
    adjacency: TileAdjacency,
    currentType: TileType,
    direction: 'horizontal' | 'vertical'
): number {
    if (direction === 'horizontal') {
        const sameAbove = adjacency.north === currentType;
        const sameBelow = adjacency.south === currentType;
        return (sameAbove || sameBelow) ? 0.05 : 0.15;
    } else {
        const sameLeft = adjacency.west === currentType;
        const sameRight = adjacency.east === currentType;
        return (sameLeft || sameRight) ? 0.05 : 0.15;
    }
}
