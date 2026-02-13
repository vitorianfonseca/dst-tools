/**
 * Building System Constants
 */

import { StructureDefinition, StructureType, TileType } from './types';

// Tamanho de cada tile do grid (em pixels) - maior para parecer DST
export const TILE_SIZE = 64;

// Dimensões do mapa em tiles (maior para parecer infinito)
export const MAP_WIDTH_TILES = 60;
export const MAP_HEIGHT_TILES = 50;

// Dimensões do mapa em pixels
export const MAP_WIDTH_PX = MAP_WIDTH_TILES * TILE_SIZE;
export const MAP_HEIGHT_PX = MAP_HEIGHT_TILES * TILE_SIZE;

// Definições de estruturas com suas dimensões (2x para TILE_SIZE 64px)
export const STRUCTURE_DEFINITIONS: Record<StructureType, StructureDefinition> = {
    house: {
        type: 'house',
        width: 128,
        height: 128,
        color: '#8B4513',
        name: 'Casa'
    },
    factory: {
        type: 'factory',
        width: 256,
        height: 192,
        color: '#696969',
        name: 'Fábrica'
    },
    tower: {
        type: 'tower',
        width: 128,
        height: 256,
        color: '#4A4A4A',
        name: 'Torre'
    },
    wall: {
        type: 'wall',
        width: 64,
        height: 64,
        color: '#808080',
        name: 'Muro'
    },
    campfire: {
        type: 'campfire',
        width: 96,
        height: 96,
        color: '#FF4500',
        name: 'Fogueira'
    },
    chest: {
        type: 'chest',
        width: 80,
        height: 64,
        color: '#CD853F',
        name: 'Baú'
    },
    workbench: {
        type: 'workbench',
        width: 160,
        height: 128,
        color: '#A0522D',
        name: 'Bancada'
    }
};

// Cores para os tipos de tile
export const TILE_COLORS: Record<TileType, string> = {
    grass: '#7CFC00',
    dirt: '#8B7355',
    water: '#4682B4',
    stone: '#708090',
    sand: '#F4A460'
};

// Configurações visuais do ghost
export const GHOST_OPACITY = 0.6;
export const GHOST_VALID_COLOR = '#00FF00';
export const GHOST_INVALID_COLOR = '#FF0000';
