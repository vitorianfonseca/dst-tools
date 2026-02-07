import { useState, useCallback, useEffect, useRef } from "react";
import { Structure } from "@/data/structures";
import { Workspace } from "@/hooks/useWorkspaces";
import { updateWorkspaceData, type Json } from "@/lib/localData";
import { toast } from "sonner";
 
 export interface PlacedStructure {
   id: string;
   structure: Structure;
   gridX: number;
   gridY: number;
   built: boolean;
  isNew?: boolean;
 }
 
 interface WorkspaceData {
   structures?: PlacedStructure[];
 }
 
 export type SyncStatus = "idle" | "saving" | "saved" | "error";
 
 export function usePlacedStructures(workspace: Workspace | null, onWorkspaceUpdate?: (workspace: Workspace) => void) {
   const [placedStructures, setPlacedStructures] = useState<PlacedStructure[]>([]);
   const [loading, setLoading] = useState(false);
   const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
   const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const lastWorkspaceIdRef = useRef<string | null>(null);
 
   // Load structures when workspace changes
   useEffect(() => {
     if (!workspace) {
       setPlacedStructures([]);
       lastWorkspaceIdRef.current = null;
       return;
     }
 
     if (workspace.id === lastWorkspaceIdRef.current) {
       return;
     }
 
     lastWorkspaceIdRef.current = workspace.id;
     const data = workspace.data as WorkspaceData | null;
     setPlacedStructures(data?.structures || []);
   }, [workspace]);
 
   // Save structures to database (debounced)
   const saveStructures = useCallback(async (structures: PlacedStructure[]) => {
     if (!workspace) return;
 
     if (saveTimeoutRef.current) {
       clearTimeout(saveTimeoutRef.current);
     }
     if (savedTimeoutRef.current) {
       clearTimeout(savedTimeoutRef.current);
     }
 
     setSyncStatus("saving");
 
     saveTimeoutRef.current = setTimeout(async () => {
       const newData: WorkspaceData = { structures };
      const updatedWorkspace = updateWorkspaceData(workspace.id, newData as unknown as Json);

      if (!updatedWorkspace) {
        toast.error("Erro ao guardar estruturas");
        setSyncStatus("error");
        return;
      }

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, data: newData as unknown as Json });
      }
      setSyncStatus("saved");
      savedTimeoutRef.current = setTimeout(() => {
        setSyncStatus("idle");
      }, 2000);
     }, 500);
   }, [workspace, onWorkspaceUpdate]);
 
   const addStructure = useCallback((structure: Structure, gridX: number, gridY: number) => {
     const newPlaced: PlacedStructure = {
       id: `${structure.id}-${Date.now()}`,
       structure,
       gridX,
       gridY,
       built: false,
      isNew: true,
     };
     setPlacedStructures((prev) => {
      // Clear isNew flag from previous structures
      const cleared = prev.map(s => ({ ...s, isNew: false }));
      const updated = [...cleared, newPlaced];
       saveStructures(updated);
       return updated;
     });
    // Clear the isNew flag after animation completes
    setTimeout(() => {
      setPlacedStructures((prev) => 
        prev.map(s => s.id === newPlaced.id ? { ...s, isNew: false } : s)
      );
    }, 500);
   }, [saveStructures]);
 
   const removeStructure = useCallback((id: string) => {
     setPlacedStructures((prev) => {
       const updated = prev.filter((s) => s.id !== id);
       saveStructures(updated);
       return updated;
     });
   }, [saveStructures]);
 
   const toggleBuilt = useCallback((id: string) => {
     setPlacedStructures((prev) => {
       const updated = prev.map((s) => (s.id === id ? { ...s, built: !s.built } : s));
       saveStructures(updated);
       return updated;
     });
   }, [saveStructures]);
 
   const moveStructure = useCallback((id: string, gridX: number, gridY: number) => {
     setPlacedStructures((prev) => {
       const updated = prev.map((s) => (s.id === id ? { ...s, gridX, gridY } : s));
       saveStructures(updated);
       return updated;
     });
   }, [saveStructures]);
 
  const clearAll = useCallback(() => {
    setPlacedStructures([]);
    saveStructures([]);
  }, [saveStructures]);

  // Set structures directly (for undo/redo)
  const setStructuresDirectly = useCallback((structures: PlacedStructure[]) => {
    setPlacedStructures(structures);
    saveStructures(structures);
  }, [saveStructures]);

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
    placedStructures,
    loading,
    syncStatus,
    addStructure,
    removeStructure,
    toggleBuilt,
    moveStructure,
    clearAll,
    setStructuresDirectly,
  };
}