import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Header } from "@/components/Header";
import { StructureLibrary } from "@/components/StructureLibrary";
import { PlanningCanvas } from "@/components/PlanningCanvas";
import { RightSidebar } from "@/components/RightSidebar";
import { usePlacedStructures, PlacedStructure } from "@/hooks/usePlacedStructures";
import { useGroundTiles, PlacedGroundTile } from "@/hooks/useGroundTiles";
import { Structure } from "@/data/structures";
import { GroundTile } from "@/data/groundTiles";
import { useWorkspaces, Workspace } from "@/hooks/useWorkspaces";
import { useAuth } from "@/contexts/AuthContext";
import { SyncIndicator } from "@/components/SyncIndicator";
import { toast } from "sonner";
import { useHistory, HistoryState } from "@/hooks/useHistory";
import { useKeyboardShortcuts, ShortcutAction } from "@/hooks/useKeyboardShortcuts";

const WORKSPACE_STORAGE_KEY = "dst-planner-current-workspace";

const Index = () => {
  const { user } = useAuth();
  const { workspaces, friendWorkspaces, loading: workspacesLoading, duplicateWorkspace } = useWorkspaces();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [selectedGroundTile, setSelectedGroundTile] = useState<GroundTile | null>(null);
  const [isErasingTiles, setIsErasingTiles] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  
  // History for undo/redo
  const { pushState, undo, redo, canUndo, canRedo, clear: clearHistory } = useHistory();
  const lastStateRef = useRef<string>("");
  
  const {
    placedStructures,
    syncStatus,
    addStructure,
    removeStructure,
    toggleBuilt,
    moveStructure,
    clearAll,
    setStructuresDirectly,
  } = usePlacedStructures(currentWorkspace, setCurrentWorkspace);

  const {
    groundTiles,
    addTile,
    addTilesInArea,
    removeTilesInArea,
    removeTile,
    clearAllTiles,
    setTilesDirectly,
  } = useGroundTiles(currentWorkspace, setCurrentWorkspace);

  // Track state changes for history
  useEffect(() => {
    const stateKey = JSON.stringify({ structures: placedStructures, groundTiles });
    if (stateKey !== lastStateRef.current && lastStateRef.current !== "") {
      pushState({ structures: placedStructures, groundTiles });
    }
    lastStateRef.current = stateKey;
  }, [placedStructures, groundTiles, pushState]);

  // Clear history when workspace changes
  useEffect(() => {
    clearHistory();
    lastStateRef.current = "";
  }, [currentWorkspace?.id, clearHistory]);

  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      setStructuresDirectly(state.structures as PlacedStructure[]);
      setTilesDirectly(state.groundTiles as PlacedGroundTile[]);
      toast.success("Action undone");
    }
  }, [undo, setStructuresDirectly, setTilesDirectly]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      setStructuresDirectly(state.structures as PlacedStructure[]);
      setTilesDirectly(state.groundTiles as PlacedGroundTile[]);
      toast.success("Action redone");
    }
  }, [redo, setStructuresDirectly, setTilesDirectly]);

  const handleClearSelection = useCallback(() => {
    setSelectedStructure(null);
    setSelectedGroundTile(null);
    setIsErasingTiles(false);
  }, []);

  // Check if current workspace belongs to the user
  const isOwnWorkspace = !!user && !!currentWorkspace && currentWorkspace.user_id === user.id;
  const canEdit = isOwnWorkspace;
  const isReadOnly = !!currentWorkspace && !isOwnWorkspace;

  // Define all keyboard shortcuts
  const shortcuts: ShortcutAction[] = useMemo(() => [
    {
      key: "z",
      ctrl: true,
      action: handleUndo,
      description: "Undo last action",
      category: "Editing",
    },
    {
      key: "z",
      ctrl: true,
      shift: true,
      action: handleRedo,
      description: "Redo action",
      category: "Editing",
    },
    {
      key: "y",
      ctrl: true,
      action: handleRedo,
      description: "Redo action (alternative)",
      category: "Editing",
    },
    {
      key: "Escape",
      action: handleClearSelection,
      description: "Cancel selection",
      category: "Ferramentas",
    },
    {
      key: "e",
      action: () => {
        if (canEdit) {
          setIsErasingTiles(!isErasingTiles);
          if (!isErasingTiles) {
            setSelectedGroundTile(null);
            setSelectedStructure(null);
          }
        }
      },
      description: "Ativar/desativar borracha",
      category: "Ferramentas",
    },
    {
      key: "Delete",
      action: () => {
        // This could be extended to delete selected items
      },
      description: "Apagar item selecionado",
      category: "Editing",
    },
  ], [handleUndo, handleRedo, handleClearSelection, canEdit, isErasingTiles]);

  // Register keyboard shortcuts
  useKeyboardShortcuts(shortcuts, canEdit);

  // Load saved workspace or auto-select first one
  useEffect(() => {
    if (workspacesLoading) return;
    if (currentWorkspace) return;

    const savedId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    let savedWorkspace: Workspace | null = null;
    
    if (savedId) {
      savedWorkspace = workspaces.find(w => w.id === savedId) || 
                       friendWorkspaces.find(w => w.id === savedId) || 
                       null;
    }
    
    setCurrentWorkspace(savedWorkspace || workspaces[0] || null);
  }, [workspaces, friendWorkspaces, workspacesLoading]);

  const handleWorkspaceChange = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspace.id);
    setSelectedStructure(null);
    setSelectedGroundTile(null);
    setIsErasingTiles(false);
  };

  const handleDuplicate = async () => {
    if (!currentWorkspace || !user) return;
    
    setIsDuplicating(true);
    const { data, error } = await duplicateWorkspace(currentWorkspace);
    setIsDuplicating(false);
    
    if (error) {
      toast.error("Error duplicating base");
    } else if (data) {
      toast.success("Base duplicated successfully!");
      handleWorkspaceChange(data);
    }
  };

  const handleToggleEraser = () => {
    setIsErasingTiles(!isErasingTiles);
    if (!isErasingTiles) {
      setSelectedGroundTile(null);
      setSelectedStructure(null);
    }
  };

  const handleSelectGroundTile = (tile: GroundTile | null) => {
    setSelectedGroundTile(tile);
    if (tile) {
      setIsErasingTiles(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header 
        currentWorkspace={currentWorkspace} 
        onWorkspaceChange={handleWorkspaceChange}
        syncIndicator={isOwnWorkspace ? <SyncIndicator status={syncStatus} /> : null}
        isReadOnly={isReadOnly}
        ownerName={currentWorkspace?.owner_name}
        onDuplicate={isReadOnly && user ? handleDuplicate : undefined}
        isDuplicating={isDuplicating}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        shortcuts={shortcuts}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {showLeftSidebar && (
          <StructureLibrary 
          selectedStructure={canEdit ? selectedStructure : null}
          onSelectStructure={canEdit ? setSelectedStructure : () => {}}
          selectedGroundTile={canEdit ? selectedGroundTile : null}
          onSelectGroundTile={canEdit ? handleSelectGroundTile : () => {}}
          isErasingTiles={isErasingTiles}
          onToggleEraser={canEdit ? handleToggleEraser : () => {}}
          disabled={!canEdit}
        />
        )}
        <button
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card border border-border rounded-r-lg p-2 hover:bg-accent transition-colors shadow-lg"
          style={{ left: showLeftSidebar ? '320px' : '0' }}
          title={showLeftSidebar ? 'Esconder estruturas' : 'Mostrar estruturas'}
        >
          <svg
            className="w-4 h-4 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ transform: showLeftSidebar ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <PlanningCanvas
          placedStructures={placedStructures}
          groundTiles={groundTiles}
          onAddStructure={canEdit ? addStructure : () => {}}
          onRemoveStructure={canEdit ? removeStructure : () => {}}
          onToggleBuilt={canEdit ? toggleBuilt : () => {}}
          onMoveStructure={canEdit ? moveStructure : () => {}}
          onClearAll={canEdit ? clearAll : () => {}}
          onAddTile={canEdit ? addTile : () => {}}
          onAddTilesInArea={canEdit ? addTilesInArea : () => {}}
          onRemoveTilesInArea={canEdit ? removeTilesInArea : () => {}}
          onRemoveTile={canEdit ? removeTile : () => {}}
          selectedStructure={canEdit ? selectedStructure : null}
          selectedGroundTile={canEdit ? selectedGroundTile : null}
          isErasingTiles={isErasingTiles}
          onClearSelection={() => setSelectedStructure(null)}
          onClearGroundTileSelection={() => {
            setSelectedGroundTile(null);
            setIsErasingTiles(false);
          }}
          isReadOnly={isReadOnly}
        />
        <button
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card border border-border rounded-l-lg p-2 hover:bg-accent transition-colors shadow-lg"
          style={{ right: showRightSidebar ? '320px' : '0' }}
          title={showRightSidebar ? 'Esconder materiais' : 'Mostrar materiais'}
        >
          <svg
            className="w-4 h-4 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ transform: showRightSidebar ? 'rotate(0deg)' : 'rotate(180deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {showRightSidebar && (
          <RightSidebar
          placedStructures={placedStructures}
          onToggleBuilt={canEdit ? toggleBuilt : () => {}}
        />
        )}
      </div>
    </div>
  );
};

export default Index;
