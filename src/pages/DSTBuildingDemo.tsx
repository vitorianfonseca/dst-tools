/**
 * Don't Starve Together Style Building Demo
 * Página de teste com estilo visual DST completo
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Structure, StructureType, Tile, GhostState, BuildState } from '../building-system/types.ts';
import { DSTTileMap } from '../building-system/dst-style/DSTTileMap.tsx';
import { DSTEntityLayer } from '../building-system/dst-style/DSTEntity.tsx';
import { DSTGhostPreview } from '../building-system/dst-style/DSTGhostPreview.tsx';
import {
    STRUCTURE_DEFINITIONS,
    MAP_WIDTH_PX,
    MAP_HEIGHT_PX,
    MAP_WIDTH_TILES,
    MAP_HEIGHT_TILES,
    TILE_SIZE
} from '../building-system/constants.ts';
import { DST_COLORS, DST_FONT, DST_STRUCTURE_COLORS } from '../building-system/dst-style/constants.ts';

const CAMERA_PROJECTIONS: Array<'flat' | 'iso'> = ['flat', 'iso'];
const CAMERA_TURN_TILT_DEG = 7;
const CAMERA_TURN_RESET_MS = 180;

/**
 * Gera um tilemap com diferentes elevações/terrenos para dar impressão de inclinação
 */
function generateSlopedTerrain(): Tile[][] {
    const tiles: Tile[][] = [];

    const pseudoNoise = (x: number, y: number, seed: number) => {
        const value = Math.sin((x + seed) * 12.9898 + (y - seed) * 78.233) * 43758.5453;
        return value - Math.floor(value);
    };

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        const row: Tile[] = [];
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const centerX = MAP_WIDTH_TILES / 2;
            const centerY = MAP_HEIGHT_TILES / 2;
            const nx = (x - centerX) / MAP_WIDTH_TILES;
            const ny = (y - centerY) / MAP_HEIGHT_TILES;
            const radial = Math.sqrt(nx * nx + ny * ny);

            const mainNoise = pseudoNoise(x, y, 3);
            const detailNoise = pseudoNoise(x, y, 17);
            const waterNoise = pseudoNoise(x, y, 31);

            let type: Tile['type'] = 'grass';

            // Base orgânica: quase tudo grama, com pequenos patches como no DST
            if (mainNoise > 0.86) {
                type = 'dirt';
            }

            // Pequenos agrupamentos de pedra
            if (detailNoise > 0.92) {
                type = 'stone';
            }

            // Água/pântano muito rara e mais nas bordas
            if (waterNoise > 0.975 && radial > 0.25) {
                type = 'water';
            }

            // Bordas sempre grama para delimitar bem
            if (x === 0 || x === MAP_WIDTH_TILES - 1 || y === 0 || y === MAP_HEIGHT_TILES - 1) {
                type = 'grass';
            }

            row.push({ x, y, type });
        }
        tiles.push(row);
    }

    return tiles;
}

const parseOriginValue = (value: string, size: number) => {
    if (value.endsWith('%')) {
        return (parseFloat(value) / 100) * size;
    }
    return parseFloat(value);
};

export default function DSTBuildingDemo() {
    const [tiles, setTiles] = useState<Tile[][]>(() => generateSlopedTerrain());

    const [structures, setStructures] = useState<Structure[]>([]);
    const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
    const [movingStructureId, setMovingStructureId] = useState<string | null>(null);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [zoom, setZoom] = useState(1.8); // Zoom inicial mais próximo
    const [isTerrainMode, setIsTerrainMode] = useState(false);
    const [selectedTerrainType, setSelectedTerrainType] = useState<Tile['type']>('grass');
    const [isTerrainPainting, setIsTerrainPainting] = useState(false);
    const [cameraProjectionIndex, setCameraProjectionIndex] = useState(1);
    const [cameraTiltDeg, setCameraTiltDeg] = useState(0);
    const cameraProjection = CAMERA_PROJECTIONS[cameraProjectionIndex] ?? 'iso';
    const isoOffsetX = ((MAP_HEIGHT_TILES - 1) * TILE_SIZE) / 2;

    const terrainOptions: Array<{ type: Tile['type']; label: string; preview: string }> = [
        { type: 'grass', label: 'Grama', preview: '/src/assets/tiles/grass.png' },
        { type: 'dirt', label: 'Terra', preview: '/src/assets/tiles/gt.png' },
        { type: 'stone', label: 'Pedra', preview: '/src/assets/tiles/cobblestone.png' },
        { type: 'water', label: 'Pântano', preview: '/src/assets/tiles/marsh.png' },
        { type: 'sand', label: 'Palha', preview: '/src/assets/tiles/wheat.png' }
    ];

    const structuresRef = useRef<Structure[]>([]);
    const moveOffsetRef = useRef<{ x: number; y: number } | null>(null);
    const dragPointRef = useRef<{ x: number; y: number } | null>(null);
    const dragPositionRef = useRef<{ x: number; y: number } | null>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dragFrameRef = useRef<number | null>(null);
    const panStartRef = useRef<{ x: number; y: number } | null>(null);
    const panOriginRef = useRef<{ x: number; y: number } | null>(null);
    const panFrameRef = useRef<number | null>(null);
    const cameraTiltResetTimeoutRef = useRef<number | null>(null);

    const [buildState, setBuildState] = useState<BuildState>({
        mode: 'idle',
        selectedStructureType: null,
        ghost: null
    });

    const worldRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const nextIdRef = useRef(1);

    const startBuilding = useCallback((structureType: StructureType) => {
        setBuildState({
            mode: 'placing',
            selectedStructureType: structureType,
            ghost: null
        });
        setSelectedStructureId(null);
    }, []);

    const cancelBuilding = useCallback(() => {
        setBuildState({
            mode: 'idle',
            selectedStructureType: null,
            ghost: null
        });
    }, []);

    const applyTerrainPaint = useCallback((tileX: number, tileY: number, type: Tile['type']) => {
        if (tileY < 0 || tileY >= tiles.length) return;
        if (tileX < 0 || tileX >= (tiles[tileY]?.length ?? 0)) return;

        setTiles(prev => {
            const targetRow = prev[tileY];
            if (!targetRow) return prev;
            const targetTile = targetRow[tileX];
            if (!targetTile || targetTile.type === type) return prev;

            const next = [...prev];
            const nextRow = [...targetRow];
            nextRow[tileX] = { ...targetTile, type };
            next[tileY] = nextRow;
            return next;
        });
    }, [tiles]);

    const toggleTerrainMode = useCallback(() => {
        setIsTerrainMode(prev => {
            const next = !prev;
            if (next) {
                cancelBuilding();
            }
            return next;
        });
        setIsTerrainPainting(false);
    }, [cancelBuilding]);

    const handleTerrainTilePointerDown = useCallback((tile: Tile, event: React.PointerEvent<HTMLDivElement>) => {
        if (!isTerrainMode) return;
        event.preventDefault();
        event.stopPropagation();
        setIsTerrainPainting(true);
        applyTerrainPaint(tile.x, tile.y, selectedTerrainType);
    }, [applyTerrainPaint, isTerrainMode, selectedTerrainType]);

    const handleTerrainTilePointerEnter = useCallback((tile: Tile, event: React.PointerEvent<HTMLDivElement>) => {
        if (!isTerrainMode || !isTerrainPainting) return;
        event.preventDefault();
        event.stopPropagation();
        applyTerrainPaint(tile.x, tile.y, selectedTerrainType);
    }, [applyTerrainPaint, isTerrainMode, isTerrainPainting, selectedTerrainType]);

    const getWorldPoint = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
        if (!worldRef.current) return { x: 0, y: 0 };

        const world = worldRef.current;
        const style = getComputedStyle(world);
        const transform = style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);

        const [originXRaw, originYRaw] = style.transformOrigin.split(' ');
        const originX = parseOriginValue(originXRaw, world.clientWidth);
        const originY = parseOriginValue(originYRaw, world.clientHeight);

        const containerRect = containerRef.current?.getBoundingClientRect();
        const layoutX = containerRect ? containerRect.left + world.offsetLeft : world.getBoundingClientRect().left;
        const layoutY = containerRect ? containerRect.top + world.offsetTop : world.getBoundingClientRect().top;

        // Matriz completa: layout + origem + transform
        const fullMatrix = new DOMMatrix()
            .translate(layoutX + originX, layoutY + originY)
            .multiply(transform)
            .translate(-originX, -originY);

        const localPoint = new DOMPoint(clientX, clientY).matrixTransform(fullMatrix.inverse());
        // Handle homogeneous coordinates for 3D perspective transforms
        const pw = localPoint.w || 1;
        const lx = localPoint.x / pw;
        const ly = localPoint.y / pw;

        if (cameraProjection !== 'iso') {
            return { x: lx, y: ly };
        }

        const xIsoWithoutOffset = lx - isoOffsetX;
        const yIso = ly;

        return {
            x: xIsoWithoutOffset + (2 * yIso),
            y: (2 * yIso) - xIsoWithoutOffset
        };
    }, [cameraProjection, isoOffsetX]);

    const getWorldCoordinates = useCallback((e: React.MouseEvent): { x: number; y: number } => {
        return getWorldPoint(e.clientX, e.clientY);
    }, [getWorldPoint]);

    const updateGhost = useCallback((x: number, y: number) => {
        if (!buildState.selectedStructureType) return;

        const definition = STRUCTURE_DEFINITIONS[buildState.selectedStructureType];
        const ghostX = x - definition.width / 2;
        const ghostY = y - definition.height / 2;

        setBuildState(prev => ({
            ...prev,
            ghost: {
                type: buildState.selectedStructureType!,
                x: ghostX,
                y: ghostY,
                isValid: true
            }
        }));
    }, [buildState.selectedStructureType]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (isTerrainMode) return;
        if (buildState.mode === 'idle') return;
        const { x, y } = getWorldCoordinates(e);
        updateGhost(x, y);
        setBuildState(prev => ({ ...prev, mode: 'dragging' }));
    }, [buildState.mode, getWorldCoordinates, isTerrainMode, updateGhost]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isTerrainMode) return;
        if (movingStructureId) return;

        if (buildState.mode !== 'placing' && buildState.mode !== 'dragging') return;
        const { x, y } = getWorldCoordinates(e);
        updateGhost(x, y);
    }, [buildState.mode, getWorldCoordinates, isTerrainMode, movingStructureId, updateGhost]);

    const finishMovingStructure = useCallback(() => {
        if (!movingStructureId) return;

        setMovingStructureId(null);
        moveOffsetRef.current = null;
        dragPositionRef.current = null;
        dragStartRef.current = null;
        setBuildState({ mode: 'idle', selectedStructureType: null, ghost: null });
    }, [movingStructureId]);

    const handleMouseUp = useCallback(() => {
        if (isTerrainMode) return;
        if (movingStructureId) {
            finishMovingStructure();
            return;
        }

        if (buildState.mode !== 'dragging' || !buildState.ghost?.isValid) {
            if (buildState.mode !== 'idle') {
                setBuildState(prev => ({ ...prev, mode: 'placing', ghost: null }));
            }
            return;
        }

        const definition = STRUCTURE_DEFINITIONS[buildState.ghost.type];
        const newStructure: Structure = {
            id: `structure-${nextIdRef.current++}`,
            type: buildState.ghost.type,
            x: buildState.ghost.x,
            y: buildState.ghost.y,
            width: definition.width,
            height: definition.height,
            rotation: 0
        };

        setStructures(prev => [...prev, newStructure]);
        setBuildState({ mode: 'idle', selectedStructureType: null, ghost: null });
    }, [buildState.mode, buildState.ghost, finishMovingStructure, isTerrainMode]);

    const handleMapPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (isTerrainMode) return;
        if (buildState.mode !== 'idle' || movingStructureId) return;
        if (e.button !== 0) return;

        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panOriginRef.current = { ...pan };
        setIsPanning(true);
    }, [buildState.mode, isTerrainMode, movingStructureId, pan]);

    const handleMapPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!panStartRef.current || !panOriginRef.current) return;

        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        const nextPan = { x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy };

        if (panFrameRef.current !== null) return;

        panFrameRef.current = requestAnimationFrame(() => {
            panFrameRef.current = null;
            setPan(nextPan);
        });
    }, []);

    const handleMapPointerUp = useCallback(() => {
        panStartRef.current = null;
        panOriginRef.current = null;
        setIsPanning(false);
    }, []);

    const handleStructureClick = useCallback((structure: Structure) => {
        setSelectedStructureId(structure.id);
    }, []);

    const handleStructurePointerDown = useCallback((structure: Structure, e: React.PointerEvent) => {
        if (buildState.mode !== 'idle') return;

        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);

        const sourceStructure = structuresRef.current.find(item => item.id === structure.id) ?? structure;

        const { x, y } = getWorldPoint(e.clientX, e.clientY);
        setSelectedStructureId(sourceStructure.id);
        setMovingStructureId(sourceStructure.id);
        const offset = { x: x - sourceStructure.x, y: y - sourceStructure.y };
        moveOffsetRef.current = offset;
        dragStartRef.current = { x: sourceStructure.x, y: sourceStructure.y };
        dragPositionRef.current = { x: sourceStructure.x, y: sourceStructure.y };
    }, [buildState.mode, getWorldPoint]);

    useEffect(() => {
        structuresRef.current = structures;
    }, [structures]);

    useEffect(() => {
        if (!movingStructureId) return;

        const handlePointerMove = (event: PointerEvent) => {
            const { x, y } = getWorldPoint(event.clientX, event.clientY);
            dragPointRef.current = { x, y };

            if (dragFrameRef.current !== null) return;

            dragFrameRef.current = requestAnimationFrame(() => {
                dragFrameRef.current = null;
                const target = structuresRef.current.find(structure => structure.id === movingStructureId);
                const offset = moveOffsetRef.current;
                const point = dragPointRef.current;

                if (!target || !offset || !point) return;

                const nextX = point.x - offset.x;
                const nextY = point.y - offset.y;

                dragPositionRef.current = { x: nextX, y: nextY };

                setStructures(prev => prev.map(structure => (
                    structure.id === movingStructureId
                        ? { ...structure, x: nextX, y: nextY }
                        : structure
                )));
            });
        };

        const handlePointerUp = () => {
            finishMovingStructure();
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [finishMovingStructure, getWorldPoint, movingStructureId]);

    useEffect(() => {
        return () => {
            if (dragFrameRef.current !== null) {
                cancelAnimationFrame(dragFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const stopPainting = () => setIsTerrainPainting(false);
        window.addEventListener('pointerup', stopPainting);
        window.addEventListener('pointercancel', stopPainting);
        return () => {
            window.removeEventListener('pointerup', stopPainting);
            window.removeEventListener('pointercancel', stopPainting);
        };
    }, []);

    const movingGhost = useMemo<GhostState | null>(() => {
        if (!movingStructureId) return null;

        const moving = structures.find(structure => structure.id === movingStructureId);
        if (!moving) return null;

        return {
            type: moving.type,
            x: moving.x,
            y: moving.y,
            isValid: true
        };
    }, [movingStructureId, structures]);

    const renderedStructures = useMemo(() => {
        if (cameraProjection === 'iso') {
            return structures.map((structure) => {
                const cx = structure.x + structure.width / 2;
                const cy = structure.y + structure.height / 2;
                return {
                    ...structure,
                    x: ((cx - cy) / 2) + isoOffsetX - structure.width / 2,
                    y: ((cx + cy) / 4) - structure.height / 2
                };
            });
        }
        return structures;
    }, [cameraProjection, isoOffsetX, structures]);

    const activeGhost = movingGhost ?? buildState.ghost;

    const renderedGhost = useMemo<GhostState | null>(() => {
        if (!activeGhost) return null;
        if (cameraProjection !== 'iso') return activeGhost;

        const def = STRUCTURE_DEFINITIONS[activeGhost.type];
        const cx = activeGhost.x + def.width / 2;
        const cy = activeGhost.y + def.height / 2;
        return {
            ...activeGhost,
            x: ((cx - cy) / 2) + isoOffsetX - def.width / 2,
            y: ((cx + cy) / 4) - def.height / 2
        };
    }, [activeGhost, cameraProjection, isoOffsetX]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            if (key === 'q' || key === 'e') {
                e.preventDefault();
                const direction = key === 'q' ? -1 : 1;

                setCameraTiltDeg(direction * CAMERA_TURN_TILT_DEG);
                if (cameraTiltResetTimeoutRef.current !== null) {
                    window.clearTimeout(cameraTiltResetTimeoutRef.current);
                }
                cameraTiltResetTimeoutRef.current = window.setTimeout(() => {
                    setCameraTiltDeg(0);
                    cameraTiltResetTimeoutRef.current = null;
                }, CAMERA_TURN_RESET_MS);

                // Compute the viewport center in world-space before switching
                const container = containerRef.current;
                const viewCenterX = container ? container.clientWidth / 2 : 0;
                const viewCenterY = container ? container.clientHeight / 2 : 0;
                // Approximate world center the user is looking at
                const worldCX = (viewCenterX - pan.x) / zoom;
                const worldCY = (viewCenterY - pan.y) / zoom;

                if (key === 'q') {
                    setCameraProjectionIndex(prev => (prev - 1 + CAMERA_PROJECTIONS.length) % CAMERA_PROJECTIONS.length);
                } else {
                    setCameraProjectionIndex(prev => (prev + 1) % CAMERA_PROJECTIONS.length);
                }

                // After switching, re-center pan so the same world point stays in view
                setPan({
                    x: viewCenterX - worldCX * zoom,
                    y: viewCenterY - worldCY * zoom
                });
                return;
            }

            if (e.key === 'Escape' && buildState.mode !== 'idle') {
                cancelBuilding();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [buildState.mode, cancelBuilding, pan, zoom]);

    useEffect(() => {
        return () => {
            if (cameraTiltResetTimeoutRef.current !== null) {
                window.clearTimeout(cameraTiltResetTimeoutRef.current);
            }
        };
    }, []);

    // Controle de zoom com Ctrl + scroll
    const handleWheel = useCallback((e: React.WheelEvent) => {
        // Só faz zoom se Ctrl estiver pressionado
        if (!e.ctrlKey) return;

        e.preventDefault();
        setZoom(prev => {
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            const newZoom = prev + delta;
            return Math.max(0.5, Math.min(3, newZoom)); // Min 0.5x, Max 3x
        });
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: DST_COLORS.background,
            backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(90, 70, 50, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(70, 60, 50, 0.2) 0%, transparent 50%)
      `,
            color: DST_FONT.color,
            padding: '24px',
            fontFamily: DST_FONT.family
        }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                {/* Header */}
                <header style={{
                    marginBottom: '24px',
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: `3px solid ${DST_COLORS.selection}`,
                    borderRadius: '8px',
                    boxShadow: `0 4px 12px ${DST_COLORS.shadowDark}`
                }}>
                    <h1 style={{
                        fontSize: '42px',
                        margin: '0 0 8px 0',
                        textShadow: `3px 3px 6px ${DST_COLORS.shadowDark}`,
                        letterSpacing: '2px'
                    }}>
                        🔥 Don't Starve Together 🔥
                    </h1>
                    <p style={{
                        fontSize: '18px',
                        margin: 0,
                        color: '#c4b49a',
                        textShadow: `2px 2px 4px ${DST_COLORS.shadowDark}`
                    }}>
                        Sistema de Construção - Teste Visual DST
                    </p>
                </header>

                {/* Toolbar */}
                <div style={{
                    marginBottom: '16px',
                    padding: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: `2px solid ${DST_COLORS.gridLines}`,
                    borderRadius: '6px',
                    boxShadow: `inset 0 2px 8px ${DST_COLORS.shadowDark}`
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        <button
                            onClick={toggleTerrainMode}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: isTerrainMode ? '#4a8c3a' : 'rgba(60, 50, 40, 0.8)',
                                color: DST_FONT.color,
                                border: isTerrainMode
                                    ? `3px solid ${DST_COLORS.selection}`
                                    : `2px solid ${DST_COLORS.gridLines}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontFamily: DST_FONT.family,
                                fontSize: DST_FONT.sizeMedium,
                                fontWeight: DST_FONT.weight as any,
                                textShadow: `2px 2px 4px ${DST_COLORS.shadowDark}`,
                                boxShadow: isTerrainMode
                                    ? `0 0 15px ${DST_COLORS.glowWarm}`
                                    : `0 2px 6px ${DST_COLORS.shadowDark}`
                            }}
                        >
                            🖌️ Pintar Terreno
                        </button>

                        {Object.values(STRUCTURE_DEFINITIONS).map(def => {
                            const color = DST_STRUCTURE_COLORS[def.type as keyof typeof DST_STRUCTURE_COLORS] || '#6b4423';
                            const isActive = !isTerrainMode && buildState.selectedStructureType === def.type;

                            return (
                                <button
                                    key={def.type}
                                    onClick={() => {
                                        if (isTerrainMode) setIsTerrainMode(false);
                                        startBuilding(def.type);
                                    }}
                                    style={{
                                        padding: '12px 20px',
                                        backgroundColor: isActive ? color : 'rgba(60, 50, 40, 0.8)',
                                        color: DST_FONT.color,
                                        border: isActive
                                            ? `3px solid ${DST_COLORS.selection}`
                                            : `2px solid ${DST_COLORS.gridLines}`,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontFamily: DST_FONT.family,
                                        fontSize: DST_FONT.sizeMedium,
                                        fontWeight: DST_FONT.weight as any,
                                        textShadow: `2px 2px 4px ${DST_COLORS.shadowDark}`,
                                        boxShadow: isActive
                                            ? `0 0 15px ${DST_COLORS.glowWarm}`
                                            : `0 2px 6px ${DST_COLORS.shadowDark}`,
                                        transition: 'all 0.2s ease',
                                        transform: isActive ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = `0 0 20px ${DST_COLORS.glowWarm}`;
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.boxShadow = `0 2px 6px ${DST_COLORS.shadowDark}`;
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                >
                                    {def.name}
                                </button>
                            );
                        })}

                        {isTerrainMode && terrainOptions.map(option => {
                            const isSelected = selectedTerrainType === option.type;
                            return (
                                <button
                                    key={option.type}
                                    onClick={() => setSelectedTerrainType(option.type)}
                                    style={{
                                        padding: '8px 12px',
                                        backgroundColor: isSelected ? 'rgba(212, 130, 59, 0.35)' : 'rgba(60, 50, 40, 0.8)',
                                        color: DST_FONT.color,
                                        border: isSelected
                                            ? `2px solid ${DST_COLORS.selection}`
                                            : `2px solid ${DST_COLORS.gridLines}`,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontFamily: DST_FONT.family,
                                        fontSize: DST_FONT.sizeSmall,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <span style={{
                                        width: '22px',
                                        height: '22px',
                                        backgroundImage: `url(${option.preview})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        borderRadius: '2px'
                                    }} />
                                    {option.label}
                                </button>
                            );
                        })}

                        {buildState.mode !== 'idle' && (
                            <button
                                onClick={cancelBuilding}
                                style={{
                                    padding: '12px 20px',
                                    backgroundColor: '#8b3a1a',
                                    color: DST_FONT.color,
                                    border: `2px solid #ff4500`,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontFamily: DST_FONT.family,
                                    fontSize: DST_FONT.sizeMedium,
                                    fontWeight: DST_FONT.weight as any,
                                    textShadow: `2px 2px 4px ${DST_COLORS.shadowDark}`,
                                    boxShadow: `0 0 15px #ff4500`
                                }}
                            >
                                ✗ Cancelar (ESC)
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: `2px solid ${DST_COLORS.gridLines}`,
                    borderRadius: '4px',
                    fontSize: DST_FONT.sizeMedium,
                    textShadow: `1px 1px 2px ${DST_COLORS.shadowDark}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div>
                        <strong style={{ color: DST_COLORS.selection }}>Modo:</strong>{' '}
                        {isTerrainMode ? `🖌️ Pintando terreno (${selectedTerrainType})` :
                            buildState.mode === 'idle' ? '⚡ Selecione uma estrutura' :
                                buildState.mode === 'placing' ? '🔨 Clique e arraste para construir' :
                                    '🏗️ Construindo...'}
                    </div>
                    <div>
                        <strong style={{ color: DST_COLORS.selection }}>Estruturas:</strong>{' '}
                        {structures.length}
                    </div>
                    <div>
                        <strong style={{ color: DST_COLORS.selection }}>Perspectiva:</strong>{' '}
                        {cameraProjection === 'iso' ? '🔷 Losango' : '⬜ Quadrada'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: DST_COLORS.selection }}>Zoom:</strong>
                        <button
                            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#3a2f24',
                                color: DST_FONT.color,
                                border: `2px solid ${DST_COLORS.gridLines}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            −
                        </button>
                        <span style={{ minWidth: '60px', textAlign: 'center' }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#3a2f24',
                                color: DST_FONT.color,
                                border: `2px solid ${DST_COLORS.gridLines}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            +
                        </button>
                        <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '4px' }}>(Ctrl+Scroll)</span>
                    </div>
                </div>

                {/* World */}
                <div
                    ref={containerRef}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '24px',
                        perspective: 'none',
                        overflow: 'hidden',
                        minHeight: '700px',
                        position: 'relative',
                        // Vinheta nas bordas para parecer infinito
                        boxShadow: 'inset 0 0 100px 40px rgba(42, 31, 20, 0.8)',
                        borderRadius: '12px',
                        backgroundColor: DST_COLORS.background
                    }}>
                    <div
                        ref={worldRef}
                        style={{
                            position: 'relative',
                            width: MAP_WIDTH_PX,
                            height: MAP_HEIGHT_PX,
                            overflow: 'visible',
                            cursor: isTerrainMode ? 'cell' : (buildState.mode !== 'idle' ? 'crosshair' : (isPanning ? 'grabbing' : 'grab')),
                            backgroundColor: 'transparent',
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformStyle: 'flat',
                            transformOrigin: 'center top',
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onPointerDown={handleMapPointerDown}
                        onPointerMove={handleMapPointerMove}
                        onPointerUp={handleMapPointerUp}
                        onPointerCancel={handleMapPointerUp}
                        onWheel={handleWheel}
                    >
                        {/* Tile layer: gets perspective tilt in flat mode */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                transform: cameraProjection === 'flat'
                                    ? `perspective(3000px) rotateX(45deg) rotate(${cameraTiltDeg}deg) scale(${cameraTiltDeg === 0 ? 1 : 0.985})`
                                    : `rotate(${cameraTiltDeg}deg) scale(${cameraTiltDeg === 0 ? 1 : 0.985})`,
                                transformOrigin: 'center center',
                                transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
                                pointerEvents: isTerrainMode ? 'auto' : 'none'
                            }}
                        >
                            <DSTTileMap
                                tiles={tiles}
                                width={MAP_WIDTH_PX}
                                height={MAP_HEIGHT_PX}
                                projection={cameraProjection}
                                interactive={isTerrainMode}
                                isPainting={isTerrainPainting}
                                onTilePointerDown={handleTerrainTilePointerDown}
                                onTilePointerEnter={handleTerrainTilePointerEnter}
                            />
                        </div>

                        {/* Structure + Ghost layer: inside same perspective transform so they sit on the ground */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                transform: cameraProjection === 'flat'
                                    ? `perspective(3000px) rotateX(45deg)`
                                    : undefined,
                                transformOrigin: 'center center',
                                pointerEvents: isTerrainMode ? 'none' : 'auto'
                            }}
                        >
                            <DSTEntityLayer
                                structures={renderedStructures}
                                onStructureClick={handleStructureClick}
                                onStructurePointerDown={handleStructurePointerDown}
                                selectedStructureId={selectedStructureId}
                                showPlacementBorders={false}
                                hiddenStructureId={movingStructureId}
                                interactionEnabled={!isTerrainMode}
                            />

                            <DSTGhostPreview ghost={renderedGhost} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{
                    padding: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: `2px solid ${DST_COLORS.gridLines}`,
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: DST_FONT.sizeSmall,
                    color: '#c4b49a',
                    textShadow: `1px 1px 2px ${DST_COLORS.shadowDark}`
                }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                        🎨 <strong>Estilo Visual:</strong> Hand-drawn, Tim Burton-esque, Earthy Palette
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                        ⚡ <strong>Features:</strong> Tile Blending • Organic Edges • Depth Shadows • Firelight Glow
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
                        🎮 <strong>Controles:</strong> Q/E para Perspectiva • Ctrl+Scroll para Zoom • ESC para Cancelar • Clique e Arraste para Construir
                    </p>
                </footer>
            </div>
        </div>
    );
}
