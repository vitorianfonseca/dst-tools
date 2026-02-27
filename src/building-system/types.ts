/**
 * Building System Types
 * Sistema de construção 2D inspirado em Don't Starve Together e Factorio
 */

// Tipos de tiles para o terreno
export type TileType = 'grass' | 'dirt' | 'water' | 'stone' | 'sand';

// Tile individual do grid
export interface Tile {
    x: number; // posição no grid (não em pixels)
    y: number;
    type: TileType;
}

// Tipos de estruturas disponíveis
export type StructureType =
    | 'house'
    | 'factory'
    | 'tower'
    | 'wall'
    | 'campfire'
    | 'chest'
    | 'workbench';

// Definição de dimensões para cada tipo de estrutura
export interface StructureDefinition {
    type: StructureType;
    width: number;
    height: number;
    color: string; // cor para visualização
    name: string;
}

// Estrutura colocada no mundo (Entity)
export interface Structure {
    id: string;
    type: StructureType;
    x: number; // posição em pixels (free positioning)
    y: number;
    width: number;
    height: number;
    rotation: number; // em graus (0, 90, 180, 270)
}

// Bounding box para colisão AABB
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Estado do ghost preview
export interface GhostState {
    type: StructureType;
    x: number;
    y: number;
    isValid: boolean; // true se não houver colisão
}

// Estado do sistema de construção
export interface BuildState {
    mode: 'idle' | 'placing' | 'dragging';
    selectedStructureType: StructureType | null;
    ghost: GhostState | null;
}
