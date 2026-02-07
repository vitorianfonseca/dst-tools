import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import type { Json } from "@/lib/localData";
 
export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  visibility: "public" | "private";
  data: Json;
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

interface WorkspaceWithOwner extends Workspace {
  owner?: {
    id: string;
    display_name?: string | null;
  } | null;
}

export function useWorkspaces() {
   const { user } = useAuth();
   const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
   const [friendWorkspaces, setFriendWorkspaces] = useState<Workspace[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchWorkspaces = useCallback(async () => {
     if (!user) {
       setWorkspaces([]);
       setFriendWorkspaces([]);
       setLoading(false);
       return;
     }
 
     setLoading(true);

    try {
      let own = await apiRequest<Workspace[]>(`/workspaces?userId=${user.id}`);
      if (own.length === 0) {
        const created = await apiRequest<Workspace>("/workspaces", {
          method: "POST",
          body: JSON.stringify({
            user_id: user.id,
            name: "Minha base",
            visibility: "private",
            data: {},
          }),
        });
        own = [created];
      }
      setWorkspaces(own);

      const publicWorkspaces = await apiRequest<WorkspaceWithOwner[]>(
        `/workspaces/public?excludeUserId=${user.id}`
      );
      setFriendWorkspaces(
        publicWorkspaces.map((workspace) => ({
          ...workspace,
          owner_name: workspace.owner?.display_name || "Desconhecido",
        }))
      );
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      setWorkspaces([]);
      setFriendWorkspaces([]);
    } finally {
      setLoading(false);
    }
   }, [user]);
 
   useEffect(() => {
     fetchWorkspaces();
   }, [fetchWorkspaces]);
 
   const createWorkspace = async (name: string) => {
     if (!user) return { error: new Error("Not authenticated"), data: null };

    try {
      const created = await apiRequest<Workspace>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, name, visibility: "private", data: {} }),
      });
      await fetchWorkspaces();
      return { error: null, data: created };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  };

  const updateWorkspace = async (id: string, updates: Partial<Omit<Workspace, "data"> & { data?: Json }>) => {
    try {
      await apiRequest<Workspace>(`/workspaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      await fetchWorkspaces();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      await apiRequest<void>(`/workspaces/${id}`, { method: "DELETE" });
      await fetchWorkspaces();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const duplicateWorkspace = async (workspace: Workspace, newName?: string) => {
    if (!user) return { error: new Error("Not authenticated"), data: null };

    try {
      const created = await apiRequest<Workspace>("/workspaces", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          name: newName || `${workspace.name} (cópia)`,
          visibility: "private",
          data: workspace.data,
        }),
      });
      await fetchWorkspaces();
      return { error: null, data: created };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  };

  return { workspaces, friendWorkspaces, loading, createWorkspace, updateWorkspace, deleteWorkspace, duplicateWorkspace, refetch: fetchWorkspaces };
 }