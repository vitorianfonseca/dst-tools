import { useState, useCallback, useRef } from "react";

export interface HistoryState {
  structures: unknown[];
  groundTiles: unknown[];
}

interface UseHistoryResult {
  pushState: (state: HistoryState) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

const MAX_HISTORY = 50;

export function useHistory(): UseHistoryResult {
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  const isUndoRedoAction = useRef(false);

  const pushState = useCallback((state: HistoryState) => {
    // Don't push if this is from an undo/redo action
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    setPast((prev) => {
      const newPast = [...prev, state];
      // Limit history size
      if (newPast.length > MAX_HISTORY) {
        return newPast.slice(-MAX_HISTORY);
      }
      return newPast;
    });
    // Clear future when new action is performed
    setFuture([]);
  }, []);

  const undo = useCallback((): HistoryState | null => {
    if (past.length === 0) return null;

    const newPast = [...past];
    const previous = newPast.pop()!;

    isUndoRedoAction.current = true;
    setPast(newPast);
    setFuture((prev) => [previous, ...prev]);

    // Return the state before the last action (or empty if no previous)
    return newPast.length > 0 ? newPast[newPast.length - 1] : { structures: [], groundTiles: [] };
  }, [past]);

  const redo = useCallback((): HistoryState | null => {
    if (future.length === 0) return null;

    const newFuture = [...future];
    const next = newFuture.shift()!;

    isUndoRedoAction.current = true;
    setFuture(newFuture);
    setPast((prev) => [...prev, next]);

    return next;
  }, [future]);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    pushState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clear,
  };
}
