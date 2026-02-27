import { useState, useCallback, useEffect, useRef } from "react";
import { GroundTile, groundTiles } from "@/data/groundTiles";
import { Workspace } from "@/hooks/useWorkspaces";
import { updateWorkspaceData, type Json } from "@/lib/localData";
import { toast } from "sonner";

export interface PlacedGroundTile {
  id: string;
  tile: GroundTile;
  gridX: number;
  gridY: number;
  isNew?: boolean;
}

interface WorkspaceData {
  structures?: unknown[];
  groundTiles?: PlacedGroundTile[];
}

export type SyncStatus = "idle" | "saving" | "saved" | "error";

interface GroundTileFromDB {
  id: string;
  workspace_id: string;
  grid_x: number;
  grid_y: number;
  tile_name: string;
  created_at: string;
  updated_at: string;
}

// Create a Map index for O(1) tile lookups
const groundTileMap = new Map(groundTiles.map(tile => [tile.id, tile]));

// Map ground tile name to GroundTile object (O(1) lookup)
function getTileByName(name: string): GroundTile | null {
  return groundTileMap.get(name) || null;
}

// Fast comparison for tile arrays (avoid JSON.stringify)
function areTilesEqual(a: PlacedGroundTile[], b: PlacedGroundTile[]): boolean {
  if (a.length !== b.length) return false;

  // Create a lookup map for b for O(n) comparison instead of O(n²)
  const bMap = new Set(b.map(t => `${t.gridX},${t.gridY},${t.tile.id}`));
  for (const tile of a) {
    if (!bMap.has(`${tile.gridX},${tile.gridY},${tile.tile.id}`)) {
      return false;
    }
  }
  return true;
}

export function useGroundTiles(workspace: Workspace | null, onWorkspaceUpdate?: (workspace: Workspace) => void) {
  const [groundTiles, setGroundTiles] = useState<PlacedGroundTile[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastWorkspaceIdRef = useRef<string | null>(null);

  // Save tiles to database (debounced)
  const saveTiles = useCallback(async (tiles: PlacedGroundTile[]) => {
    if (!workspace) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }

    setSyncStatus("saving");

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Convert PlacedGroundTile to API format (grid_x, grid_y, tile_name)
        // Use faster construction instead of .map() for large arrays
        const tilesToSave: Array<{ grid_x: number; grid_y: number; tile_name: string }> = [];
        for (const t of tiles) {
          tilesToSave.push({
            grid_x: t.gridX,
            grid_y: t.gridY,
            tile_name: t.tile.id || t.tile.name,
          });
        }

        // Save to localStorage for offline support
        const existingData = (workspace.data as WorkspaceData) || {};
        const newData: WorkspaceData = { ...existingData, groundTiles: tiles };
        updateWorkspaceData(workspace.id, newData as unknown as Json);

        // Sync to API (batch update)
        if (tilesToSave.length > 0) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

          try {
            const response = await fetch(`/api/workspaces/${workspace.id}/tiles`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(tilesToSave),
              signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
          } catch (fetchError) {
            clearTimeout(timeout);
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              console.warn("Tile save timeout");
            } else {
              throw fetchError;
            }
          }
        }

        if (onWorkspaceUpdate) {
          onWorkspaceUpdate({ ...workspace, data: newData as unknown as Json });
        }
        setSyncStatus("saved");
        savedTimeoutRef.current = setTimeout(() => {
          setSyncStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Failed to save tiles:", error);
        toast.error("Erro ao guardar tiles");
        setSyncStatus("error");
      }
    }, 500);
  }, [workspace, onWorkspaceUpdate]);

  // Load tiles when workspace changes
  useEffect(() => {
    if (!workspace) {
      setGroundTiles([]);
      lastWorkspaceIdRef.current = null;
      return;
    }

    if (workspace.id === lastWorkspaceIdRef.current) {
      return;
    }

    lastWorkspaceIdRef.current = workspace.id;

    // Load from localStorage immediately (instant load)
    const data = workspace.data as WorkspaceData | null;
    const localTiles = data?.groundTiles || [];
    setGroundTiles(localTiles);

    // Then sync with API in background (don't block on API)
    const loadTilesFromAPI = async () => {
      try {
        // Use AbortController with timeout to prevent hanging
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(`/api/workspaces/${workspace.id}/tiles`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) throw new Error("Failed to load tiles");

        const dbTiles: GroundTileFromDB[] = await response.json();

        // Convert DB tiles to PlacedGroundTile format with early exit for large datasets
        const tiles: PlacedGroundTile[] = [];
        for (const tile of dbTiles) {
          const groundTile = getTileByName(tile.tile_name);
          if (!groundTile) {
            console.warn(`Ground tile not found: ${tile.tile_name}`);
            continue;
          }
          tiles.push({
            id: tile.id,
            tile: groundTile,
            gridX: tile.grid_x,
            gridY: tile.grid_y,
          });
        }

        // Only update if different
        if (!areTilesEqual(tiles, localTiles)) {
          setGroundTiles(tiles);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn("Tile loading timeout - using localStorage version");
        } else {
          console.warn("Failed to load tiles from API, using localStorage:", error);
        }
        // Keep using local tiles on error
      }
    };

    // Load from API asynchronously without blocking initial render
    // Use requestIdleCallback if available, otherwise setTimeout
    const loadAsync = () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => loadTilesFromAPI(), { timeout: 100 });
      } else {
        setTimeout(loadTilesFromAPI, 0);
      }
    };
    
    loadAsync();
  }, [workspace]);

  const addTile = useCallback((tile: GroundTile, gridX: number, gridY: number) => {
    // Check if tile already exists at position
    setGroundTiles((prev) => {
      // Quick check if tile already exists at position with same ID
      const existing = prev.find(t => t.gridX === gridX && t.gridY === gridY);
      if (existing && existing.tile.id === tile.id) return prev; // Same tile, skip

      const newTile: PlacedGroundTile = {
        id: `${tile.id}-${gridX}-${gridY}`,
        tile,
        gridX,
        gridY,
        isNew: true,
      };

      // Remove any existing tile at this position + build result in one pass
      const updated: PlacedGroundTile[] = [];
      for (const t of prev) {
        if (t.gridX !== gridX || t.gridY !== gridY) {
          updated.push({ ...t, isNew: false });
        }
      }
      updated.push(newTile);

      // Schedule save immediately without waiting for isNew animation
      saveTiles(updated);

      // Schedule async removal of isNew flag
      setTimeout(() => {
        setGroundTiles((current) =>
          current.map(t => t.id === newTile.id ? { ...t, isNew: false } : t)
        );
      }, 500);

      return updated;
    });
  }, [saveTiles]);

  const addTilesInArea = useCallback((tile: GroundTile, startX: number, startY: number, endX: number, endY: number) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    setGroundTiles((prev) => {
      // Pre-compute new tiles
      const newTiles: PlacedGroundTile[] = [];
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          newTiles.push({
            id: `${tile.id}-${x}-${y}`,
            tile,
            gridX: x,
            gridY: y,
            isNew: true,
          });
        }
      }

      // Filter out tiles in the area and clear isNew in one pass
      const updated = [];
      for (const t of prev) {
        if (!(t.gridX >= minX && t.gridX <= maxX && t.gridY >= minY && t.gridY <= maxY)) {
          updated.push({ ...t, isNew: false });
        }
      }
      updated.push(...newTiles);

      saveTiles(updated);

      // Schedule async removal of isNew flag
      setTimeout(() => {
        setGroundTiles((current) =>
          current.map(t => t.isNew ? { ...t, isNew: false } : t)
        );
      }, 500);

      return updated;
    });
  }, [saveTiles]);

  const removeTile = useCallback((gridX: number, gridY: number) => {
    setGroundTiles((prev) => {
      const updated = prev.filter(t => !(t.gridX === gridX && t.gridY === gridY));
      saveTiles(updated);

      // Delete from API
      if (workspace) {
        fetch(`/api/workspaces/${workspace.id}/tiles/${gridX}/${gridY}`, {
          method: "DELETE",
        }).catch(err => console.error("Failed to delete tile from API:", err));
      }

      return updated;
    });
  }, [saveTiles, workspace]);

  const removeTilesInArea = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    setGroundTiles((prev) => {
      const tilesToDelete: Array<{ x: number; y: number }> = [];
      const updated: PlacedGroundTile[] = [];

      // Process removal in single pass
      for (const t of prev) {
        if (t.gridX >= minX && t.gridX <= maxX && t.gridY >= minY && t.gridY <= maxY) {
          tilesToDelete.push({ x: t.gridX, y: t.gridY });
        } else {
          updated.push(t);
        }
      }

      saveTiles(updated);

      // Batch API deletions if we have a workspace
      if (workspace && tilesToDelete.length > 0) {
        // Use Promise.all for parallel cleanup
        Promise.all(
          tilesToDelete.map(({ x, y }) =>
            fetch(`/api/workspaces/${workspace.id}/tiles/${x}/${y}`, {
              method: "DELETE",
            }).catch(err => console.error(`Failed to delete tile at ${x},${y}:`, err))
          )
        ).catch(() => {});
      }

      return updated;
    });
  }, [saveTiles, workspace]);

  const clearAllTiles = useCallback(() => {
    setGroundTiles([]);
    saveTiles([]);
  }, [saveTiles]);

  // Set tiles directly (for undo/redo)
  const setTilesDirectly = useCallback((tiles: PlacedGroundTile[]) => {
    setGroundTiles(tiles);
    saveTiles(tiles);
  }, [saveTiles]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  return {
    groundTiles,
    syncStatus,
    addTile,
    addTilesInArea,
    removeTilesInArea,
    removeTile,
    clearAllTiles,
    setTilesDirectly,
  };
}