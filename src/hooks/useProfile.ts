 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface Profile {
   id: string;
   display_name: string | null;
   avatar_url: string | null;
   bio: string | null;
   banner_url: string | null;
   is_private: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export function useProfile() {
   const { user } = useAuth();
   const [profile, setProfile] = useState<Profile | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!user) {
       setProfile(null);
       setLoading(false);
       return;
     }
 
     fetchProfile();
   }, [user]);
 
   const fetchProfile = async () => {
     if (!user) return;
     
     setLoading(true);
 
     const { data, error } = await supabase
       .from("profiles")
       .select("*")
       .eq("id", user.id)
       .maybeSingle();
 
     if (error) {
       console.error("Error fetching profile:", error);
     } else {
       setProfile(data);
     }
     setLoading(false);
   };
 
   const updateProfile = async (updates: Partial<Profile>) => {
     if (!user) return { error: new Error("Not authenticated") };
 
     const { error } = await supabase
       .from("profiles")
       .update(updates)
       .eq("id", user.id);
 
     if (!error) {
       await fetchProfile();
     }
 
     return { error };
   };
 
   return { profile, loading, updateProfile, refetch: fetchProfile };
 }