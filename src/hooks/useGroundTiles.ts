 import { useState, useCallback, useEffect, useRef } from "react";
 import { GroundTile } from "@/data/groundTiles";
 import { Workspace } from "@/hooks/useWorkspaces";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { Json } from "@/integrations/supabase/types";
 
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
 
 export function useGroundTiles(workspace: Workspace | null, onWorkspaceUpdate?: (workspace: Workspace) => void) {
   const [groundTiles, setGroundTiles] = useState<PlacedGroundTile[]>([]);
   const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
   const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const lastWorkspaceIdRef = useRef<string | null>(null);
 
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
     const data = workspace.data as WorkspaceData | null;
     setGroundTiles(data?.groundTiles || []);
   }, [workspace]);
 
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
       const existingData = (workspace.data as WorkspaceData) || {};
       const newData: WorkspaceData = { ...existingData, groundTiles: tiles };
       
       const { error } = await supabase
         .from("workspaces")
         .update({ data: newData as unknown as Json })
         .eq("id", workspace.id);
 
       if (error) {
         console.error("Error saving ground tiles:", error);
         toast.error("Erro ao guardar tiles");
         setSyncStatus("error");
       } else if (onWorkspaceUpdate) {
         onWorkspaceUpdate({ ...workspace, data: newData as unknown as Json });
         setSyncStatus("saved");
         savedTimeoutRef.current = setTimeout(() => {
           setSyncStatus("idle");
         }, 2000);
       }
     }, 500);
   }, [workspace, onWorkspaceUpdate]);
 
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
     return updated;
   });
 }, [saveTiles]);

 const removeTilesInArea = useCallback((startX: number, startY: number, endX: number, endY: number) => {
   const minX = Math.min(startX, endX);
   const maxX = Math.max(startX, endX);
   const minY = Math.min(startY, endY);
   const maxY = Math.max(startY, endY);
   
     setGroundTiles((prev) => {
     const updated = prev.filter(t => 
       !(t.gridX >= minX && t.gridX <= maxX && t.gridY >= minY && t.gridY <= maxY)
     );
       saveTiles(updated);
       return updated;
     });
   }, [saveTiles]);
 
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