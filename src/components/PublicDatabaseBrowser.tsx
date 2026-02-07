import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getProfiles, getWorkspaces } from "@/lib/localData";

interface PublicWorkspace {
  id: string;
  name: string;
  description?: string;
  visibility: string;
  created_at: string;
  user_id: string;
  owner?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export function PublicDatabaseBrowser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [publicWorkspaces, setPublicWorkspaces] = useState<PublicWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<PublicWorkspace[]>([]);

  useEffect(() => {
    fetchPublicWorkspaces();
  }, []);

  useEffect(() => {
    // Filter workspaces based on search query
    if (searchQuery.trim() === "") {
      setFilteredWorkspaces(publicWorkspaces);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredWorkspaces(
        publicWorkspaces.filter(
          (ws) =>
            ws.name.toLowerCase().includes(query) ||
            ws.description?.toLowerCase().includes(query) ||
            ws.owner?.display_name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, publicWorkspaces]);

  const fetchPublicWorkspaces = async () => {
    setLoading(true);
    try {
      const profiles = getProfiles();
      const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
      const workspaces = getWorkspaces()
        .filter((workspace) => workspace.visibility === "public")
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      const transformedWorkspaces = workspaces.map((workspace) => ({
        ...workspace,
        owner: profileMap.get(workspace.user_id),
      }));

      setPublicWorkspaces(transformedWorkspaces);
      setFilteredWorkspaces(transformedWorkspaces);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error loading public bases");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWorkspace = (workspaceId: string) => {
    if (!user) {
      toast.error("Faça login para ver esta base");
      navigate("/auth");
      return;
    }

    // Open the workspace as read-only view
    localStorage.setItem("dst-planner-current-workspace", workspaceId);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-lg p-12">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-white/60">Loading public databases...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2 flex items-center gap-3" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            <Globe className="h-8 w-8 text-[#d4823b]" />
            Bases da Comunidade
          </h2>
          <p className="text-white/60">Explore public plans created by other players</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search by name, description or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-black/60 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
        </div>
      </div>

      {/* Public Workspaces Grid */}
      {filteredWorkspaces.length === 0 ? (
        <div className="bg-black/40 border border-white/10 rounded-lg p-12">
          <div className="text-center text-white/60 text-lg">
            {publicWorkspaces.length === 0
              ? "No public databases yet"
              : "No bases found with that search"}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((workspace) => (
            <div key={workspace.id} className="group bg-black/40 border border-white/10 hover:border-[#d4823b]/50 rounded-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-[#d4823b]/20">
              <div
                className="h-32 bg-gradient-to-br from-[#d4823b]/20 to-black/60 relative cursor-pointer"
                onClick={() => handleOpenWorkspace(workspace.id)}
              />
              <div className="p-6">
                {/* Owner Info */}
                <div className="flex items-center gap-3 mb-4 -mt-12 relative z-10">
                  <Avatar className="h-14 w-14 border-4 border-[#1a1410]">
                    <AvatarImage src={workspace.owner?.avatar_url || undefined} />
                    <AvatarFallback className="text-sm bg-[#d4823b] text-white font-black">
                      {workspace.owner?.display_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white/70 truncate">
                      Por {workspace.owner?.display_name || "Desconhecido"}
                    </p>
                  </div>
                </div>

                {/* Workspace Info */}
                <h3 className="font-black text-lg mb-2 line-clamp-2 uppercase tracking-tight" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>{workspace.name}</h3>
                <p className="text-sm text-white/60 mb-4 line-clamp-2">
                  {workspace.description || "No description"}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between mb-4">
                  <Badge className="text-xs gap-1.5 bg-[#d4823b]/20 border border-[#d4823b]/30 text-[#d4823b]">
                    <Globe className="h-3 w-3" />
                    Public
                  </Badge>
                  <span className="text-xs text-white/50">
                    {new Date(workspace.created_at).toLocaleDateString("pt-PT")}
                  </span>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleOpenWorkspace(workspace.id)}
                  className="w-full bg-[#d4823b] hover:bg-[#b56f2f] text-white font-bold uppercase"
                >
                  Ver Base
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-8">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-4xl font-black text-[#d4823b] mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>{publicWorkspaces.length}</p>
            <p className="text-sm text-white/60 uppercase tracking-wide font-bold">Public Bases</p>
          </div>
          <div>
            <p className="text-4xl font-black text-[#d4823b] mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              {new Set(publicWorkspaces.map((w) => w.user_id)).size}
            </p>
            <p className="text-sm text-white/60 uppercase tracking-wide font-bold">Creators</p>
          </div>
          <div>
            <p className="text-4xl font-black text-[#d4823b] mb-2" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>{filteredWorkspaces.length}</p>
            <p className="text-sm text-white/60 uppercase tracking-wide font-bold">Encontradas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
