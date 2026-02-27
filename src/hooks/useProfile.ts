import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";

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

    try {
      const nextProfile = await apiRequest<Profile>(`/profiles/${user.id}`);
      setProfile(nextProfile);
    } catch (error) {
      const displayName = user.name || user.email?.split("@")[0] || "Utilizador";
      try {
        const created = await apiRequest<Profile>(`/profiles/${user.id}`, {
          method: "PUT",
          body: JSON.stringify({
            email: user.email,
            display_name: displayName,
            avatar_url: null,
            bio: null,
            banner_url: null,
            is_private: false,
          }),
        });
        setProfile(created);
      } catch (createError) {
        console.error("Error creating profile:", createError);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const current = profile || {
      id: user.id,
      display_name: user.name || user.email?.split("@")[0] || "Utilizador",
      avatar_url: null,
      bio: null,
      banner_url: null,
      is_private: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const updated = await apiRequest<Profile>(`/profiles/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          display_name: updates.display_name ?? current.display_name,
          avatar_url: updates.avatar_url ?? current.avatar_url,
          bio: updates.bio ?? current.bio,
          banner_url: updates.banner_url ?? current.banner_url,
          is_private: updates.is_private ?? current.is_private,
        }),
      });
      setProfile(updated);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}