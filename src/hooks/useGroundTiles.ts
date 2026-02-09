import { useState, useCallback, useEffect, useRef } from "react";
import { GroundTile, groundTiles } from "@/data/groundTiles";
import { Workspace } from "@/hooks/useWorkspaces";
import { updateWorkspaceData, type Json } from "@/lib/localData";
import { syncWorkspaceData } from "@/lib/api";
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

// Map ground tile name to GroundTile object
function getTileByName(name: string): GroundTile | null {
  return groundTiles.find(tile => tile.id === name) || null;
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
        const tilesToSave = tiles.map(t => ({
          grid_x: t.gridX,
          grid_y: t.gridY,
          tile_name: t.tile.id || t.tile.name,
        }));

        // Save to localStorage for offline support
        const existingData = (workspace.data as WorkspaceData) || {};
        const newData: WorkspaceData = { ...existingData, groundTiles: tiles };
        updateWorkspaceData(workspace.id, newData as unknown as Json);

        // Sync to API
        if (tilesToSave.length > 0) {
          await fetch(`/api/workspaces/${workspace.id}/tiles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tilesToSave),
          });
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

    // Then sync with API in background
    const loadTilesFromAPI = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspace.id}/tiles`);
        if (!response.ok) throw new Error("Failed to load tiles");

        const dbTiles: GroundTileFromDB[] = await response.json();

        // Convert DB tiles to PlacedGroundTile format
        const tiles: PlacedGroundTile[] = dbTiles
          .map(tile => {
            const groundTile = getTileByName(tile.tile_name);
            if (!groundTile) {
              console.warn(`Ground tile not found: ${tile.tile_name}`);
              return null;
            }
            return {
              id: tile.id,
              tile: groundTile,
              gridX: tile.grid_x,
              gridY: tile.grid_y,
            };
          })
          .filter((tile): tile is PlacedGroundTile => tile !== null);

        // Only update if different from local data
        if (JSON.stringify(tiles) !== JSON.stringify(localTiles)) {
          setGroundTiles(tiles);
        }
      } catch (error) {
        console.warn("Failed to load tiles from API, using localStorage:", error);
        // Keep using local tiles on error
      }
    };

    // Load from API asynchronously without blocking initial render
    const timeoutId = setTimeout(loadTilesFromAPI, 0);
    return () => clearTimeout(timeoutId);
  }, [workspace]);

  const addTile = useCallback((tile: GroundTile, gridX: number, gridY: number) => {
    // Check if tile already exists at position
    const existing = groundTiles.find(t => t.gridX === gridX && t.gridY === gridY);
    if (existing && existing.tile.id === tile.id) return; // Same tile, skip

    const newTile: PlacedGroundTile = {
      id: `${tile.id}-${gridX}-${gridY}`,
      tile,
      gridX,
      gridY,
      isNew: true,
    };

    setGroundTiles((prev) => {
      // Remove any existing tile at this position
      const filtered = prev.filter(t => !(t.gridX === gridX && t.gridY === gridY));
      const cleared = filtered.map(t => ({ ...t, isNew: false }));
      const updated = [...cleared, newTile];
      saveTiles(updated);
      return updated;
    });

    setTimeout(() => {
      setGroundTiles((prev) =>
        prev.map(t => t.id === newTile.id ? { ...t, isNew: false } : t)
      );
    }, 500);
  }, [groundTiles, saveTiles]);

  const addTilesInArea = useCallback((tile: GroundTile, startX: number, startY: number, endX: number, endY: number) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

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

    setGroundTiles((prev) => {
      // Remove tiles in the area
      const filtered = prev.filter(t =>
        !(t.gridX >= minX && t.gridX <= maxX && t.gridY >= minY && t.gridY <= maxY)
      );
      const cleared = filtered.map(t => ({ ...t, isNew: false }));
      const updated = [...cleared, ...newTiles];
      saveTiles(updated);
      return updated;
    });

    setTimeout(() => {
      setGroundTiles((prev) =>
        prev.map(t => ({ ...t, isNew: false }))
      );
    }, 500);
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
      const tilesToDelete: Array<{ x: number, y: number }> = [];
      const updated = prev.filter(t => {
        if (t.gridX >= minX && t.gridX <= maxX && t.gridY >= minY && t.gridY <= maxY) {
          tilesToDelete.push({ x: t.gridX, y: t.gridY });
          return false;
        }
        return true;
      });

      saveTiles(updated);

      // Delete from API
      if (workspace) {
        tilesToDelete.forEach(({ x, y }) => {
          fetch(`/api/workspaces/${workspace.id}/tiles/${x}/${y}`, {
            method: "DELETE",
          }).catch(err => console.error("Failed to delete tile from API:", err));
        });
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