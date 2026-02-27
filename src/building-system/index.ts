/**
 * Building System - Entry Point
 */

// Componentes principais
export { TileMap, generateTileMap } from './TileMap';

// Tipos
export type {
    Tile,
    TileType,
    Structure,
    StructureType,
    StructureDefinition,
    BoundingBox,
    GhostState,
    BuildState
} from './types';

// Constantes
export {
    TILE_SIZE,
    MAP_WIDTH_TILES,
    MAP_HEIGHT_TILES,
    MAP_WIDTH_PX,
    MAP_HEIGHT_PX,
    STRUCTURE_DEFINITIONS,
    TILE_COLORS
} from './constants';

// Utilitários
export {
    checkAABBCollision,
    getStructureBoundingBox,
    checkStructureCollision,
    isWithinMapBounds,
    canPlaceStructure,
    calculateZIndex
} from './collision';
