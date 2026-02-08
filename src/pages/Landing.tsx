import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import { Users, Search, BookOpen, ArrowRight, MapPin, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/1.png";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
              style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
            >
              DST Tools
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 shadow-[0_0_20px_rgba(212,130,59,0.12)]">
              <Button
                onClick={() => navigate("/planner")}
                variant="ghost"
                className="relative rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-[#d4823b] transition-colors"
                size="sm"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d4823b]/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <span className="relative">Ferramentas</span>
              </Button>
              <Button
                onClick={() => navigate("/community")}
                variant="ghost"
                className="relative rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-[#d4823b] transition-colors"
                size="sm"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d4823b]/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <span className="relative">Comunidade</span>
              </Button>
              <Button
                onClick={() => navigate("/guides")}
                variant="ghost"
                className="relative rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-[#d4823b] transition-colors"
                size="sm"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d4823b]/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <span className="relative">Guias Avancados</span>
              </Button>
            </div>

            <div className="relative w-[220px]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d4823b]/20 to-transparent blur-sm" />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Pesquisar"
                className="relative pl-9 h-9 bg-black/60 border-white/20 text-white placeholder:text-white/40 rounded-full focus:border-[#d4823b]/60 focus:ring-[#d4823b]/20"
              />
            </div>
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
                <h1 className="text-6xl sm:text-7xl md:text-8xl font-black leading-none tracking-tighter uppercase flex flex-wrap items-baseline gap-4" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                  <span className="text-white">DST</span>
                  <span className="text-[#d4823b]">TOOLS</span>
                </h1>
              </div>

              <p className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-xl">
                Uma suite de ferramentas para Don't Starve Together. Planeia bases,
                pesquisa conteúdos e partilha conhecimentos com a comunidade.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {user ? (
                  <>
                    <Button
                      onClick={() => navigate("/planner")}
                      size="lg"
                      className="bg-[#d4823b] hover:bg-[#b56f2f] text-white border-none gap-2 text-lg h-14 px-8 font-bold uppercase tracking-wide"
                    >
                      Abrir Ferramenta
                    </Button>
                    <Button
                      onClick={() => navigate("/community")}
                      variant="outline"
                      size="lg"
                      className="border-white/30 bg-transparent text-white hover:bg-white/10 gap-2 text-lg h-14 px-8 font-bold uppercase tracking-wide"
                    >
                      Comunidade
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate("/auth")}
                      size="lg"
                      className="bg-[#d4823b] hover:bg-[#b56f2f] text-white border-none gap-2 text-lg h-14 px-8 font-bold uppercase tracking-wide"
                    >
                      Começar Grátis
                    </Button>
                    <Button
                      onClick={() => navigate("/community")}
                      variant="outline"
                      size="lg"
                      className="border-white/30 bg-transparent text-white hover:bg-white/10 gap-2 text-lg h-14 px-8 font-bold uppercase tracking-wide"
                    >
                      Ver Exemplos
                    </Button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-6">
                <div>
                  <p className="text-3xl font-bold text-[#d4823b]">60+</p>
                  <p className="text-sm text-white/60 uppercase tracking-wide">Estruturas</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#d4823b]">40+</p>
                  <p className="text-sm text-white/60 uppercase tracking-wide">Materiais</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#d4823b]">100%</p>
                  <p className="text-sm text-white/60 uppercase tracking-wide">Grátis</p>
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

          {/* Top Tools */}
          <div className="mt-14">
            <div className="flex items-center justify-between gap-6 mb-6 flex-wrap">
              <h2
                className="text-2xl sm:text-3xl font-black uppercase tracking-tighter"
                style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
              >
                Ferramentas Principais
              </h2>
              <p className="text-white/60">As 3 funcionalidades core do DST Tools</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="group p-6 bg-black/40 hover:bg-black/60 transition-all border border-white/10 hover:border-[#d4823b]/50">
                <div className="mb-3">
                  <Users className="h-6 w-6 text-[#d4823b]" />
                </div>
                <h3 className="text-lg font-bold mb-2 uppercase tracking-wide">Tab de Comunidade</h3>
                <p className="text-white/70 leading-relaxed text-sm">
                  Descobre planos e partilha projetos com a comunidade.
                </p>
              </div>

              <div className="group p-6 bg-black/40 hover:bg-black/60 transition-all border border-white/10 hover:border-[#d4823b]/50">
                <div className="mb-3">
                  <Search className="h-6 w-6 text-[#d4823b]" />
                </div>
                <h3 className="text-lg font-bold mb-2 uppercase tracking-wide">Search Bar</h3>
                <p className="text-white/70 leading-relaxed text-sm">
                  Pesquisa rapida por estruturas, materiais e conteudos.
                </p>
              </div>

              <div className="group p-6 bg-black/40 hover:bg-black/60 transition-all border border-white/10 hover:border-[#d4823b]/50">
                <div className="mb-3">
                  <BookOpen className="h-6 w-6 text-[#d4823b]" />
                </div>
                <h3 className="text-lg font-bold mb-2 uppercase tracking-wide">Guias Avancados</h3>
                <p className="text-white/70 leading-relaxed text-sm">
                  Sobrevivencia, personagens, bosses e estacoes num so lugar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offerings Section */}
      <section className="py-20 px-8 bg-black/20">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
              O Que o Site Oferece
            </h2>
            <p className="text-xl text-white/60">Planeamento, organizacao e performance para as tuas bases</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-8 bg-black/40 hover:bg-black/60 transition-all border border-white/10 hover:border-[#d4823b]/50">
              <div className="mb-4">
                <MapPin className="h-8 w-8 text-[#d4823b]" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Planeamento Visual</h3>
              <p className="text-white/70 leading-relaxed">
                Cria layouts claros e organiza a tua base com precisao.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-black/40 hover:bg-black/60 transition-all border border-white/10 hover:border-[#d4823b]/50">
              <div className="mb-4">
                <Sparkles className="h-8 w-8 text-[#d4823b]" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Organizacao Inteligente</h3>
              <p className="text-white/70 leading-relaxed">
                Mantem tudo categorizado para encontrares o que precisas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-black/40 hover:bg-black/60 transition-all border border-white/10 hover:border-[#d4823b]/50">
              <div className="mb-4">
                <Zap className="h-8 w-8 text-[#d4823b]" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Experiencia Rapida</h3>
              <p className="text-white/70 leading-relaxed">
                Interface leve e fluida mesmo com projetos grandes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            Pronto para começar?
          </h2>
          <p className="text-xl text-white/70 mb-10">
            Cria a tua conta gratuita e começa a planear a base perfeita agora.
          </p>
          <Button
            onClick={() => navigate(user ? "/planner" : "/auth")}
            size="lg"
            className="bg-[#d4823b] hover:bg-[#b56f2f] text-white border-none gap-2 text-lg h-14 px-10 font-bold uppercase tracking-wide"
          >
            {user ? "Abrir App" : "Começar Grátis"}
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
              <span>© 2026 DST Tools</span>
            </div>
            <div className="flex gap-6">
              <Link to="/community" className="hover:text-white transition-colors">
                Comunidade
              </Link>
              <Link to="/profile" className="hover:text-white transition-colors">
                Perfil
              </Link>
            </div>
          </div>
          <div className="text-center text-xs text-white/40 pt-6 border-t border-white/5">
            <p>Este projeto é uma ferramenta criada por fãs e não é afiliado oficialmente com Klei Entertainment.</p>
            <p className="mt-1">Don't Starve Together e todos os assets relacionados são propriedade de Klei Entertainment Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
