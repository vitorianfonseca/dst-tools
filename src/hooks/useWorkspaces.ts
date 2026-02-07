 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { Json } from "@/integrations/supabase/types";
 
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
     
     // Fetch own workspaces
     const { data: ownData, error: ownError } = await supabase
       .from("workspaces")
       .select("*")
       .eq("user_id", user.id)
       .order("updated_at", { ascending: false });
 
     if (ownError) {
       console.error("Error fetching workspaces:", ownError);
     } else {
       setWorkspaces(ownData as Workspace[]);
     }
 
     // Fetch friend's public workspaces
     const { data: friendData, error: friendError } = await supabase
       .from("workspaces")
       .select("*, profiles!workspaces_user_id_fkey(display_name)")
       .eq("visibility", "public")
       .neq("user_id", user.id)
       .order("updated_at", { ascending: false });
 
     if (friendError) {
       console.error("Error fetching friend workspaces:", friendError);
     } else {
       const mapped = (friendData || []).map((w: any) => ({
         ...w,
         owner_name: w.profiles?.display_name || "Unknown",
       })) as Workspace[];
       setFriendWorkspaces(mapped);
     }
 
     setLoading(false);
   }, [user]);
 
   useEffect(() => {
     fetchWorkspaces();
   }, [fetchWorkspaces]);
 
   const createWorkspace = async (name: string) => {
     if (!user) return { error: new Error("Not authenticated"), data: null };
 
     const { data, error } = await supabase
       .from("workspaces")
       .insert({ user_id: user.id, name, visibility: "private" as const })
       .select()
       .single();
 
     if (!error) {
       await fetchWorkspaces();
     }
 
     return { error, data: data as Workspace | null };
   };
 
 
   const updateWorkspace = async (id: string, updates: Partial<Omit<Workspace, 'data'> & { data?: Json }>) => {
     const { error } = await supabase
       .from("workspaces")
       .update(updates)
       .eq("id", id);
 
     if (!error) {
       await fetchWorkspaces();
     }
 
     return { error };
   };
 
   const deleteWorkspace = async (id: string) => {
     const { error } = await supabase
       .from("workspaces")
       .delete()
       .eq("id", id);
 
     if (!error) {
       await fetchWorkspaces();
     }
 
     return { error };
   };
 
  const duplicateWorkspace = async (workspace: Workspace, newName?: string) => {
    if (!user) return { error: new Error("Not authenticated"), data: null };

    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        user_id: user.id,
        name: newName || `${workspace.name} (cópia)`,
        visibility: "private" as const,
        data: workspace.data,
      })
      .select()
      .single();

    if (!error) {
      await fetchWorkspaces();
    }

    return { error, data: data as Workspace | null };
  };

  return { workspaces, friendWorkspaces, loading, createWorkspace, updateWorkspace, deleteWorkspace, duplicateWorkspace, refetch: fetchWorkspaces };
 }