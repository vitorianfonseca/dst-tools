import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicDatabaseBrowser } from "@/components/PublicDatabaseBrowser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import { ArrowLeft, Users } from "lucide-react";

export default function Community() {
  return (
    <div className="min-h-screen bg-[#1a1410] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <FontAwesomeIcon
              icon={faScrewdriverWrench}
              className="h-9 w-9"
              style={{ color: "#d4823b" }}
            />
            <div className="flex flex-col">
              <span className="text-lg font-black uppercase tracking-tight text-foreground" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>DST Tools</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-[#d4823b] transition-colors"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d4823b]/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <span className="relative flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="border-b border-white/10 bg-black/20">
        <div className="max-w-[1200px] mx-auto px-8 py-16">
          <div className="flex items-center gap-4 mb-4">
            <Users className="h-12 w-12 text-[#d4823b]" />
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              Comunidade
            </h1>
          </div>
          <p className="text-xl text-white/70 max-w-3xl">
            Explora bases criadas por outros jogadores. Inspira-te e descobre novas ideias para os teus projetos.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-8 py-12">
        <PublicDatabaseBrowser />
      </div>
    </div>
  );
}
