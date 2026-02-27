/**
 * Collision Detection Utilities
 * Sistema de colisão AABB (Axis-Aligned Bounding Box)
 */

import { BoundingBox, Structure } from './types';

/**
 * Verifica se dois bounding boxes colidem (AABB collision)
 */
export function checkAABBCollision(a: BoundingBox, b: BoundingBox): boolean {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * Cria um bounding box a partir de uma estrutura
 */
export function getStructureBoundingBox(structure: Structure): BoundingBox {
    return {
        x: structure.x,
        y: structure.y,
        width: structure.width,
        height: structure.height
    };
}

/**
 * Verifica se uma estrutura colide com alguma outra estrutura existente
 */
export function checkStructureCollision(
    newStructure: BoundingBox,
    existingStructures: Structure[]
): boolean {
    for (const structure of existingStructures) {
        const existingBox = getStructureBoundingBox(structure);
        if (checkAABBCollision(newStructure, existingBox)) {
            return true; // há colisão
        }
    }
    return false; // sem colisão
}

/**
 * Verifica se uma estrutura está dentro dos limites do mapa
 */
export function isWithinMapBounds(
    structure: BoundingBox,
    mapWidth: number,
    mapHeight: number
): boolean {
    return (
        structure.x >= 0 &&
        structure.y >= 0 &&
        structure.x + structure.width <= mapWidth &&
        structure.y + structure.height <= mapHeight
    );
}

/**
 * Verifica se uma estrutura pode ser colocada (sem colisões e dentro do mapa)
 */
export function canPlaceStructure(
    newStructure: BoundingBox,
    existingStructures: Structure[],
    mapWidth: number,
    mapHeight: number
): boolean {
    // Verifica se está dentro dos limites do mapa
    if (!isWithinMapBounds(newStructure, mapWidth, mapHeight)) {
        return false;
    }

    // Verifica se não colide com estruturas existentes
    if (checkStructureCollision(newStructure, existingStructures)) {
        return false;
    }

    return true;
}

/**
 * Calcula o z-index baseado na posição Y (depth sorting)
 * Objetos mais "embaixo" no ecrã aparecem à frente
 */
export function calculateZIndex(structure: Structure): number {
    return Math.floor(structure.y + structure.height);
}
