/**
 * Don't Starve Together Style Constants
 * Paleta de cores e configurações visuais inspiradas no DST
 */

import { TileType } from '../types.ts';

// Paleta de cores DST
export const DST_COLORS = {
    // Background e grid
    background: '#2a1f14',      // dark brown earth
    gridLines: '#3a2f24',       // subtle grid lines

    // Interação  
    hoverCell: '#d4823b33',     // warm amber glow (transparent)
    selection: '#d4823b',       // amber/gold signature color
    builtOverlay: '#4a8c3a33',  // green tint for built

    // Sombras e profundidade
    shadowDark: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(0, 0, 0, 0.25)',

    // Brilho (firelight)
    glowWarm: '#ff9d5c',
    glowIntense: '#ffb366'
};

// Cores de tiles estilo DST (terrosas e orgânicas)
export const DST_TILE_COLORS: Record<TileType, string> = {
    grass: '#5a7a42',      // verde grama DST (mais vibrante)
    dirt: '#6b5a4a',       // terra marrom clara
    water: '#2d4a5c',      // azul escuro lodoso
    stone: '#4a5459',      // cinza pedra azulado (como na imagem)
    sand: '#8b7355'        // areia bege
};

// Cores de borda para blending (mais escuras para depth)
export const DST_TILE_EDGE_COLORS: Record<TileType, string> = {
    grass: '#3d5a2d',      // verde escuro
    dirt: '#534237',       // marrom escuro
    water: '#1d3a4c',
    stone: '#353a3d',      // cinza bem escuro
    sand: '#7b6345'
};

// Configurações visuais
export const DST_VISUAL = {
    // Sombra das estruturas
    shadowOffsetX: 4,
    shadowOffsetY: 6,
    shadowBlur: 8,

    // Grid
    gridOpacity: 0.15,        // Quase invisível
    gridLineWidth: 1,

    // Texturas
    noiseIntensity: 0.03,     // Intensidade do noise no background

    // Bordas orgânicas
    borderRadius: 2,
    roughEdgeVariation: 2,

    // Animações
    hoverGlowDuration: '0.3s',
    placementDuration: '0.2s'
};

// Estruturas com cores estilo DST
export const DST_STRUCTURE_COLORS = {
    house: '#6b4423',       // madeira escura
    factory: '#4a4a4a',     // metal/pedra
    tower: '#5a4a3a',       // pedra/tijolo
    wall: '#6a5a4a',        // madeira/pedra
    campfire: '#8b3a1a',    // vermelho fogo
    chest: '#7a5a3a',       // madeira
    workbench: '#8a6a4a'    // madeira clara
};

// Font style DST
export const DST_FONT = {
    family: '"Courier New", monospace, serif',
    sizeLarge: '24px',
    sizeMedium: '16px',
    sizeSmall: '14px',
    weight: 'bold',
    color: '#e8d4b8',           // cor de texto bege/pergaminho
    shadowColor: '#1a1410'      // sombra do texto
};

// Mapeamento de estruturas para imagens
export const DST_STRUCTURE_IMAGES = {
    house: '/src/assets/structures/pig-house.png',
    factory: '/src/assets/structures/science-machine.png',
    tower: '/src/assets/structures/lightning-rod.png',
    wall: '/src/assets/structures/wood-wall.png',
    campfire: '/src/assets/structures/campfire.png',
    chest: '/src/assets/structures/chest.png',
    workbench: '/src/assets/structures/alchemy-engine.png'
};
