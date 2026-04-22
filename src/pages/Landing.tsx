import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import {
  Users, BookOpen, ArrowRight, MapPin, Calendar, Swords, Globe, Flame, Search,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { PlacedStructure } from "@/hooks/usePlacedStructures";
import heroImage from "@/assets/1.png";

interface WorkspaceData {
  structures?: PlacedStructure[];
}

interface ApiWorkspace {
  id: string;
  user_id: string;
  name: string;
  visibility: "public" | "private";
  data: WorkspaceData | null;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

const IMPACT_FONT = 'Impact, "Arial Black", sans-serif';

const FEATURES = [
  {
    icon: MapPin,
    title: "Base Planner",
    description: "Drag & drop structures onto an infinite canvas. Plan your perfect base layout before building.",
    link: "/planner",
    live: true,
  },
  {
    icon: Users,
    title: "Community",
    description: "Browse bases shared by other players. Get inspired and share your own creations.",
    link: "/community",
    live: true,
  },
  {
    icon: BookOpen,
    title: "Advanced Guides",
    description: "Survival tips, boss strategies, seasons, and everything you need to not starve.",
    link: "/guides",
    live: true,
  },
  {
    icon: Calendar,
    title: "Season Planner",
    description: "Plan your survival strategy season by season. Never get caught unprepared again.",
    link: "/planner",
    live: false,
  },
  {
    icon: Swords,
    title: "Character Database",
    description: "Every character's perks, stats, and recommended strategies in one place.",
    link: "/guides",
    live: false,
  },
];

const NAV_TABS = [
  { label: "Ferramentas", path: "/planner" },
  { label: "Comunidade", path: "/community" },
  { label: "Guias Avancados", path: "/guides" },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [allPublicWorkspaces, setAllPublicWorkspaces] = useState<ApiWorkspace[]>([]);

  useEffect(() => {
    apiRequest<ApiWorkspace[]>("/workspaces/public")
      .then(setAllPublicWorkspaces)
      .catch(() => setAllPublicWorkspaces([]));
  }, []);

  const publicWorkspaces = allPublicWorkspaces.slice(0, 6);

  const communityStats = useMemo(() => {
    const publicCount = allPublicWorkspaces.length;
    const creators = new Set(allPublicWorkspaces.map((w) => w.user_id)).size;
    const totalStructures = allPublicWorkspaces.reduce(
      (sum, w) => sum + (w.data?.structures?.length ?? 0), 0
    );
    return { publicCount, creators, totalStructures };
  }, [allPublicWorkspaces]);

  const getStructureCount = (workspace: ApiWorkspace) => {
    return workspace.data?.structures?.length ?? 0;
  };

  return (
    <div className="min-h-screen bg-[#1a1410] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-gradient-to-b from-black/70 via-black/50 to-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <FontAwesomeIcon
              icon={faScrewdriverWrench}
              className="h-6 w-6"
              style={{ color: "#d4823b" }}
            />
            <span
              className="text-lg font-black uppercase tracking-tight"
              style={{ fontFamily: IMPACT_FONT }}
            >
              DST Tools
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 shadow-[0_0_20px_rgba(212,130,59,0.12)]"
              onMouseLeave={() => setActiveTab(null)}
            >
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => {
                    setActiveTab(tab.label);
                    navigate(tab.path);
                  }}
                  onMouseEnter={() => setActiveTab(tab.label)}
                  className="relative rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white transition-colors duration-200"
                >
                  {activeTab === tab.label && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-[#d4823b]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="relative w-[200px] hidden lg:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Pesquisar"
                className="pl-9 h-9 bg-white/5 border-white/8 text-white placeholder:text-white/35 rounded-full backdrop-blur-xl focus:border-white/20 focus:ring-white/10"
              />
            </div>

            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Hero Section - Split layout inspired by DST website */}
      <section className="relative min-h-[85vh] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-6xl sm:text-7xl md:text-8xl font-black leading-none tracking-tighter uppercase flex flex-wrap items-baseline gap-4" style={{ fontFamily: IMPACT_FONT }}>
                  <span className="text-white">DST</span>
                  <span className="text-[#d4823b]">TOOLS</span>
                </h1>
              </div>

              <p className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-xl">
                Plan your Don't Starve Together base like a pro. Track resources,
                share builds, and survive together.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {user ? (
                  <>
                    <Button
                      onClick={() => navigate("/planner")}
                      size="lg"
                      className="bg-[#d4823b] hover:bg-[#b56f2f] text-white border-none gap-2 text-lg h-14 px-8 font-bold uppercase tracking-wide"
                    >
                      Start Planning
                    </Button>
                    <Button
                      onClick={() => navigate("/community")}
                      variant="outline"
                      size="lg"
                      className="border-white/30 bg-transparent text-white hover:bg-white/20 hover:text-white hover:border-white/50 gap-2 text-lg h-14 px-8 font-bold uppercase tracking-wide"
                    >
                      Browse Community
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate("/auth")}
                      size="lg"
                      className="bg-[#d4823b] hover:bg-[#b56f2f] text-white border-none gap-2 text-lg h-14 px-8 font-bold uppercase tracking-wide"
                    >
                      Get Started Free
                    </Button>
                    <Button
                      onClick={() => navigate("/community")}
                      variant="outline"
                      size="lg"
                      className="border-white/30 bg-transparent text-white hover:bg-white/20 hover:text-white hover:border-white/50 gap-2 text-lg h-14 px-8 font-bold uppercase tracking-wide"
                    >
                      Browse Community
                    </Button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-6">
                <div>
                  <p className="text-3xl font-bold text-[#d4823b]">60+</p>
                  <p className="text-sm text-white/60 uppercase tracking-wide">Structures</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#d4823b]">40+</p>
                  <p className="text-sm text-white/60 uppercase tracking-wide">Materials</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#d4823b]">100%</p>
                  <p className="text-sm text-white/60 uppercase tracking-wide">Free</p>
                </div>
              </div>
            </div>

            {/* Right side - Featured Image */}
            <div className="relative lg:h-[600px] h-[450px] flex items-center justify-center">
              <img
                src={heroImage}
                alt="Don't Starve Together"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-20 px-8 bg-black/20">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: IMPACT_FONT }}>
              Everything You Need to Survive
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              A complete toolkit built by DST players, for DST players.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                onClick={() => navigate(feature.link)}
                className={`group relative p-7 bg-black/40 hover:bg-black/60 transition-all border border-white/10 hover:border-[#d4823b]/50 cursor-pointer hover:shadow-[0_0_30px_rgba(212,130,59,0.1)] ${
                  !feature.live ? "opacity-60" : ""
                }`}
              >
                {!feature.live && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-[#d4823b] bg-[#d4823b]/15 border border-[#d4823b]/30 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}
                <div className="mb-4">
                  <feature.icon className="h-8 w-8 text-[#d4823b]" />
                </div>
                <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed text-sm">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm text-[#d4823b] opacity-0 group-hover:opacity-100 transition-opacity">
                  {feature.live ? "Open" : "Coming soon"}
                  {feature.live && <ArrowRight className="h-4 w-4" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Showcase */}
      <section className="py-20 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between gap-6 mb-10 flex-wrap">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3" style={{ fontFamily: IMPACT_FONT }}>
                Featured Bases
              </h2>
              <p className="text-lg text-white/60">See what the community is building</p>
            </div>
            <Button
              onClick={() => navigate("/community")}
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 gap-2 font-bold uppercase tracking-wide"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {publicWorkspaces.length === 0 ? (
            <div className="text-center py-16 bg-black/30 border border-white/10">
              <Globe className="h-12 w-12 text-[#d4823b]/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Public Bases Yet</h3>
              <p className="text-white/50 mb-6 max-w-md mx-auto">
                Be the first to share your base with the community! Create a workspace and make it public.
              </p>
              <Button
                onClick={() => navigate("/planner")}
                className="bg-[#d4823b] hover:bg-[#b56f2f] text-white font-bold uppercase"
              >
                Create Your Base
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  onClick={() => {
                    localStorage.setItem("dst-planner-current-workspace", workspace.id);
                    navigate("/planner");
                  }}
                  className="group bg-black/40 border border-white/10 hover:border-[#d4823b]/50 overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(212,130,59,0.1)] cursor-pointer"
                >
                  {/* Preview header */}
                  <div className="h-28 bg-gradient-to-br from-[#d4823b]/20 via-[#d4823b]/5 to-black/60 relative flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-black text-[#d4823b]/40" style={{ fontFamily: IMPACT_FONT }}>
                        {getStructureCount(workspace)}
                      </p>
                      <p className="text-xs text-white/30 uppercase tracking-wider font-bold">structures</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8 border-2 border-[#1a1410]">
                        <AvatarImage src={workspace.owner?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-[#d4823b] text-white font-black">
                          {workspace.owner?.display_name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-white/60 truncate">
                        {workspace.owner?.display_name || "Unknown"}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1 truncate uppercase tracking-tight" style={{ fontFamily: IMPACT_FONT }}>
                      {workspace.name}
                    </h3>
                    <p className="text-xs text-white/40">
                      {new Date(workspace.updated_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-8 bg-black/20 border-y border-white/5">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Flame className="h-5 w-5 text-[#d4823b]" />
            <p className="text-lg text-white/60 uppercase tracking-widest font-semibold">
              Made by DST players, for DST players
            </p>
            <Flame className="h-5 w-5 text-[#d4823b]" />
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-4xl md:text-5xl font-black text-[#d4823b] mb-2" style={{ fontFamily: IMPACT_FONT }}>
                {communityStats.publicCount || "0"}
              </p>
              <p className="text-sm text-white/50 uppercase tracking-wide font-bold">Public Bases</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-[#d4823b] mb-2" style={{ fontFamily: IMPACT_FONT }}>
                {communityStats.creators || "0"}
              </p>
              <p className="text-sm text-white/50 uppercase tracking-wide font-bold">Creators</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-[#d4823b] mb-2" style={{ fontFamily: IMPACT_FONT }}>
                {communityStats.totalStructures || "0"}
              </p>
              <p className="text-sm text-white/50 uppercase tracking-wide font-bold">Structures Placed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6" style={{ fontFamily: IMPACT_FONT }}>
            Ready to Plan Your Base?
          </h2>
          <p className="text-xl text-white/70 mb-10">
            Join the community and start building the perfect base today.
          </p>
          <Button
            onClick={() => navigate(user ? "/planner" : "/auth")}
            size="lg"
            className="bg-[#d4823b] hover:bg-[#b56f2f] text-white border-none gap-2 text-lg h-14 px-10 font-bold uppercase tracking-wide"
          >
            {user ? "Start Planning" : "Get Started Free"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-8 bg-black/40">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/60 mb-6">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={faScrewdriverWrench}
                className="h-5 w-5"
                style={{ color: "#d4823b" }}
              />
              <span>&copy; 2026 DST Tools</span>
            </div>
            <div className="flex gap-6">
              <Link to="/community" className="hover:text-white transition-colors">
                Community
              </Link>
              <Link to="/profile" className="hover:text-white transition-colors">
                Profile
              </Link>
            </div>
          </div>
          <div className="text-center text-xs text-white/40 pt-6 border-t border-white/5">
            <p>This project is a fan-made tool and is not officially affiliated with Klei Entertainment.</p>
            <p className="mt-1">Don&apos;t Starve Together and all related assets are property of Klei Entertainment Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
