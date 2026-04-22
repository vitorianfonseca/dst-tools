import { useState, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import {
  ArrowLeft, ArrowRight, Heart, Brain, Utensils,
  Snowflake, Sun, Cloud, Leaf, Skull, Home, Swords, ChefHat,
  BookOpen, Zap, Shield, Star, ChevronRight,
  AlertTriangle, Check, X, Users, Flame, Map, Award, Clock, Target,
  TrendingUp,
} from "lucide-react";

// ─── Portrait imports ─────────────────────────────────────────────────────────
import wilsonPortrait    from "@/assets/bigportraits/Wilson/wilson.png";
import willowPortrait    from "@/assets/bigportraits/Willow/willow.png";
import wolfgangPortrait  from "@/assets/bigportraits/Wolfgang/wolfgang.png";
import wendyPortrait     from "@/assets/bigportraits/Wendy/wendy.png";
import wx78Portrait      from "@/assets/bigportraits/Wx78/wx78.png";
import wickerPortrait    from "@/assets/bigportraits/Wickerbottom/wickerbottom.png";
import woodiePortrait    from "@/assets/bigportraits/Woodie/woodie.png";
import maxwellPortrait   from "@/assets/bigportraits/Maxwell/waxwell.png";
import wigfridPortrait   from "@/assets/bigportraits/Wigfrid/wathgrithr.png";
import webberPortrait    from "@/assets/bigportraits/Webber/webber.png";
import warlyPortrait     from "@/assets/bigportraits/Warly/warly.png";
import wormwoodPortrait  from "@/assets/bigportraits/Wormwood/wormwood.png";
import wortoxPortrait    from "@/assets/bigportraits/Wortox/wortox.png";
import wurtPortrait      from "@/assets/bigportraits/Wurt/wurt.png";
import walterPortrait    from "@/assets/bigportraits/Walter/walter.png";
import wandaPortrait     from "@/assets/bigportraits/Wanda/wanda.png";
import winonaPortrait    from "@/assets/bigportraits/Winona/winona.png";
import wesPortrait       from "@/assets/bigportraits/Wes/wes.png";

// ─── Structure imports ────────────────────────────────────────────────────────
import scienceMachine   from "@/assets/structures/science-machine.png";
import alchemyEngine    from "@/assets/structures/alchemy-engine.png";
import shadowManip      from "@/assets/structures/shadow-manipulator.png";
import crockPot         from "@/assets/structures/crock-pot.png";
import iceBox           from "@/assets/structures/ice-box.png";
import firePit          from "@/assets/structures/fire-pit.png";
import chest            from "@/assets/structures/chest.png";
import lightningRod     from "@/assets/structures/lightning-rod.png";
import iceFling         from "@/assets/structures/ice-flingomatic.png";
import tentImg          from "@/assets/structures/tent.png";
import beeBox           from "@/assets/structures/bee-box.png";
import toothTrap        from "@/assets/structures/tooth-trap.png";
import dryingRack       from "@/assets/structures/drying-rack.png";
import endoFire         from "@/assets/structures/endothermic-fire-pit.png";
import meatEffigy       from "@/assets/structures/meat-effigy.png";
import prestihat        from "@/assets/structures/prestihatitator.png";
import houndius         from "@/assets/structures/houndius-shootius.png";
import pigHouse         from "@/assets/structures/pig-house.png";

// ─── Constants ────────────────────────────────────────────────────────────────
const IMPACT = 'Impact, "Arial Black", sans-serif';
const ORANGE = "#d4823b";

// ─── Data ─────────────────────────────────────────────────────────────────────

type Difficulty = "Fácil" | "Médio" | "Difícil" | "Especial";

interface Char {
  name: string; portrait: string; hp: number; hunger: number; sanity: number;
  difficulty: Difficulty; desc: string; perks: string[]; cons: string[]; tip: string;
}

const CHARS: Char[] = [
  { name:"Wilson",       portrait:wilsonPortrait,   hp:150,hunger:150,sanity:200, difficulty:"Fácil",
    desc:"O cientista clássico. Equilibrado e ideal para começar. A barba cresce dando isolamento no Inverno e Nightmare Fuel ao barbear.",
    perks:["Barba cresce: isolação no Inverno","Barba dá Nightmare Fuel ao cortar","Stats equilibrados para qualquer situação"],
    cons:["Sem vantagem especial de combate","Boring para jogadores experientes"],
    tip:"Deixa a barba crescer até ao nível máximo antes do dia 20 para máxima isolação no Inverno." },
  { name:"Willow",       portrait:willowPortrait,   hp:150,hunger:150,sanity:120, difficulty:"Fácil",
    desc:"A piromaníaca. Imune ao fogo, ganha sanidade perto de chamas. Isqueiro eterno e Bernie feroz contra sombras.",
    perks:["Imune ao fogo e sobreaquecimento","Isqueiro eterno no inventário","Bernie ataca Shadow Creatures automaticamente"],
    cons:["Sanidade base muito baixa (120)","Perde sanidade mais rápido no escuro"],
    tip:"Usa o Bernie contra The Twins — ataca Shadow Creatures sem intervenção." },
  { name:"Wolfgang",     portrait:wolfgangPortrait, hp:200,hunger:300,sanity:200, difficulty:"Médio",
    desc:"O lutador mais forte do jogo. Com estômago cheio transforma-se em Mighty Wolfgang com dano dobrado e 150% de velocidade.",
    perks:["Mighty Form: 2× dano, +50% velocidade","200 HP base, o mais tanky","Stats de combate inigualáveis"],
    cons:["Come 3× mais rápido que outros","Wimpy Form penaliza dano e velocidade"],
    tip:"Come Pierogi antes de qualquer boss para garantir Mighty Form total." },
  { name:"Wendy",        portrait:wendyPortrait,    hp:150,hunger:150,sanity:200, difficulty:"Fácil",
    desc:"A irmã de Abigail. O fantasma combate automaticamente e pode ser melhorado com Elixires para curar toda a equipa.",
    perks:["Abigail combate sozinha","Elixires: buffs poderosos para a equipa","Boa sanidade base"],
    cons:["Dano base inferior","Abigail morre se receber dano suficiente"],
    tip:"Elixir Special da Abigail dá 40% life steal a toda a equipa durante boss fights." },
  { name:"WX-78",        portrait:wx78Portrait,     hp:150,hunger:200,sanity:200, difficulty:"Médio",
    desc:"O robô. Upgradeable com Circuit Chips até 400 HP. Relâmpagos dão Supercharge temporário com luz e velocidade.",
    perks:["Chips: HP até 400, speed, sanidade","Imune a veneno e doenças","Supercharge com relâmpago"],
    cons:["Dano com chuva até instalar chip","Precisa de Gears para upgrades rápidos"],
    tip:"Prioriza o chip de HP nos primeiros dias. Fica perto de Lightning Rods na Primavera." },
  { name:"Wickerbottom", portrait:wickerPortrait,   hp:150,hunger:150,sanity:250, difficulty:"Difícil",
    desc:"A bibliotecária. Livros com poderes devastadores — spawna tentáculos, cria relâmpagos, faz crescer plantas. Não precisa dormir.",
    perks:["Livros: On Tentacles, Birds of the World","Alta sanidade base (250)","Não precisa dormir (insônia natural)"],
    cons:["Não pode comer comida estragada","Perde sanidade com livros de magia básicos"],
    tip:"On Tentacles é o feitiço de grupo mais poderoso do jogo. Indispensável em raids." },
  { name:"Woodie",       portrait:woodiePortrait,   hp:175,hunger:175,sanity:175, difficulty:"Médio",
    desc:"O lenhador com três formas Were. Werebeaver para madeira, Weregoose para exploração, Weremoose para combate.",
    perks:["Werebeaver: corta árvores ultra-rápido","Weregoose: velocidade e visão noturna","Weremoose: poderoso em combate"],
    cons:["Transformações drenam fome rapidamente","Deve gerir o meter de transformação cuidadosamente"],
    tip:"Usa Werebeaver para limpar florestas inteiras em segundos. Combina com Magiluminescence." },
  { name:"Maxwell",      portrait:maxwellPortrait,  hp:75, hunger:150,sanity:200, difficulty:"Difícil",
    desc:"O Mestre das Sombras. Puppets que trabalham e combatem por ti. Começa com Dark Sword mas tem apenas 75 HP.",
    perks:["Shadow Puppets: Miner, Logger, Duelist","Começa com Codex Umbra e Dark Sword","-25% custo de sanidade para sombras"],
    cons:["HP ridiculamente baixo (75)","Puppets drenam sanidade continuamente"],
    tip:"Nunca combatas diretamente — usa Duelists. Mantém HP alto com Pierogi." },
  { name:"Wigfrid",      portrait:wigfridPortrait,  hp:200,hunger:200,sanity:120, difficulty:"Fácil",
    desc:"A guerreira Valquíria. Alta HP, 25% life steal em combate, e spawna com Battle Helm e Battle Spear. Só come carne.",
    perks:["25% life steal em combate","25% menos dano recebido","Spawna com Helm e Spear mágicos"],
    cons:["Só pode comer carne","Sanidade baixa (120)"],
    tip:"Farm Beefalo cedo para garantir carne. Song of the Valkyrie dá buffs a toda a equipa." },
  { name:"Webber",       portrait:webberPortrait,   hp:175,hunger:175,sanity:100, difficulty:"Fácil",
    desc:"O rapaz aranha. Faz amizade com spiders, pede ajuda em combate, e come Monster Meat sem penalização.",
    perks:["Spiders são amigas e combatem por ti","Pode construir Spider Dens","Come Monster Meat sem penalização de sanidade"],
    cons:["Pigs e Guards atacam à vista","Sanidade base muito baixa (100)"],
    tip:"Coloca Spider Dens perto da base para silk, glands e exército de combate infinito." },
  { name:"Warly",        portrait:warlyPortrait,    hp:100,hunger:200,sanity:200, difficulty:"Difícil",
    desc:"O chef profissional. Portable Crock Pot, receitas exclusivas com buffs únicos, mas enjoa de comida repetida.",
    perks:["Portable Crock Pot sempre disponível","Receitas exclusivas: Volt Goat Chaud-Froid, Grim Galette","Portable Seasoning Station no spawn"],
    cons:["Enjoa de comida repetida (perde buffs)","HP muito baixo (100)"],
    tip:"Roda as receitas constantemente. Volt Goat Chaud-Froid dá +50% dano elétrico por 4 minutos." },
  { name:"Wormwood",     portrait:wormwoodPortrait, hp:150,hunger:150,sanity:175, difficulty:"Difícil",
    desc:"A planta viva. Não cura com comida normal. Cria Bramble Armor de graça e planta seeds diretamente na terra.",
    perks:["Bramble Armor grátis a partir de plantas","Planta seeds diretamente na terra","Bloom na Primavera acelera cultivos"],
    cons:["Não cura com comida (só Healing Salve)","Chuva drena sanidade rapidamente"],
    tip:"Mantém sempre Healing Salves no inventário. Em co-op, Wormwood é o melhor farmer de seeds." },
  { name:"Wortox",       portrait:wortoxPortrait,   hp:150,hunger:150,sanity:200, difficulty:"Médio",
    desc:"O demônio caçador de almas. Teleporta curtas distâncias com Souls, cura a equipa inteira com Soul Hop.",
    perks:["Teleporte curto por Soul","Cura toda a equipa com Soul Hop","Vê e apanha Souls de criaturas mortas"],
    cons:["Não pode comer carne diretamente","Cada teleporte consome uma Soul"],
    tip:"Em boss fights, Wortox é o melhor healer do jogo. Stockpila 20+ Souls antes de raids." },
  { name:"Wurt",         portrait:wurtPortrait,     hp:175,hunger:150,sanity:150, difficulty:"Médio",
    desc:"A Merm. Constrói Merm Houses e comanda exércitos. Merms são guerreiros poderosos sob a sua liderança.",
    perks:["Pode construir Merm Houses","Merms seguem e lutam por ela","Merms defendem a base automaticamente"],
    cons:["Não pode comer carne","Merms podem atacar outros jogadores sem Wurt presente"],
    tip:"10+ Merms alimentados com peixe matam qualquer boss sem equipamento especial." },
  { name:"Walter",       portrait:walterPortrait,   hp:150,hunger:150,sanity:200, difficulty:"Médio",
    desc:"O escuteiro. Woby como montada e inventário extra. Slingshot com ammo especial para combat à distância.",
    perks:["Woby como montada (velocidade extra)","Slingshot com ammo: sleep, fire, frost","Sem sanidade loss de monstros (cap 6)"],
    cons:["Woby fica assustado e foge com dano elevado","Dano corpo-a-corpo reduzido"],
    tip:"Usa Moon Shroom ammo no Slingshot para por monstros a dormir durante boss fights." },
  { name:"Wanda",        portrait:wandaPortrait,    hp:100,hunger:150,sanity:150, difficulty:"Difícil",
    desc:"A relojoeira. Relógios com poderes temporais — teleporte, slowdown, cura. Fica mais forte mas envelhece com dano.",
    perks:["Backstep Watch: teleporte de longa distância","Alarming Clock: slow de inimigos","Ageless Watch: pára envelhecimento"],
    cons:["HP base muito baixo (100)","Morre quando Age chega a 0"],
    tip:"A Ageless Watch é obrigatória para longevidade. Usa Backstep Watch para escapar de situações perigosas." },
  { name:"Winona",       portrait:winonaPortrait,   hp:150,hunger:150,sanity:200, difficulty:"Médio",
    desc:"A engenheira. Catapults automáticas e Spotlights com geradores. Base defensiva sem necessidade de estar presente.",
    perks:["Catapults: dano automático a inimigos","Tape repara estruturas e itens","Constrói mais rápido e barato"],
    cons:["Geradores precisam de combustível constante","Catapults têm range limitado"],
    tip:"6 Catapults alimentadas por generators matam qualquer boss automaticamente — incluindo Dragonfly." },
  { name:"Wes",          portrait:wesPortrait,      hp:113,hunger:113,sanity:150, difficulty:"Especial",
    desc:"O mime. Modo hardcore — todos os stats reduzidos, sem vantagens especiais. Desafio de prestige para veteranos.",
    perks:["Balões para distração","Satisfação máxima de sobreviver"],
    cons:["Todos os stats ~75% do normal","Come mais lentamente, sem habilidades"],
    tip:"Joga todos os outros personagens primeiro. Wes é o verdadeiro teste de domínio do jogo." },
];

type TabId = "inicio" | "personagens" | "estacoes" | "combate" | "chefes" | "base" | "avancado";

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id:"inicio",      label:"Início",      icon:<Star className="w-4 h-4" /> },
  { id:"personagens", label:"Personagens", icon:<Users className="w-4 h-4" /> },
  { id:"estacoes",    label:"Estações",    icon:<Cloud className="w-4 h-4" /> },
  { id:"combate",     label:"Combate",     icon:<Swords className="w-4 h-4" /> },
  { id:"chefes",      label:"Bosses",      icon:<Skull className="w-4 h-4" /> },
  { id:"base",        label:"Base",        icon:<Home className="w-4 h-4" /> },
  { id:"avancado",    label:"Avançado",    icon:<Zap className="w-4 h-4" /> },
];

// ─── Reusable animated components ─────────────────────────────────────────────

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedBar({ value, max, color = ORANGE }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-80, 80], [6, -6]);
  const rotateY = useTransform(x, [-80, 80], [-6, 6]);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 25 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 25 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      style={{ rotateX: springX, rotateY: springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// CSS 3D rotating lantern decoration
function SpinningLantern({ size = 100 }: { size?: number }) {
  const half = size / 2;
  const faces = [
    { rotateY: 0,   rotateX: 0 },
    { rotateY: 90,  rotateX: 0 },
    { rotateY: 180, rotateX: 0 },
    { rotateY: 270, rotateX: 0 },
    { rotateY: 0,   rotateX: 90 },
    { rotateY: 0,   rotateX: -90 },
  ];
  return (
    <div style={{ perspective: 800, width: size, height: size, position: "relative" }}>
      <div
        className="absolute inset-[-40%] blur-2xl rounded-full"
        style={{ background: `radial-gradient(circle, rgba(212,130,59,0.4) 0%, transparent 70%)` }}
      />
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        style={{ width: size, height: size, position: "relative", transformStyle: "preserve-3d" }}
      >
        {faces.map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute", inset: 0,
              border: `1px solid rgba(212,130,59,${i < 4 ? 0.5 : 0.3})`,
              background: i === 4
                ? `rgba(212,130,59,0.25)`
                : i === 5
                ? `rgba(212,130,59,0.1)`
                : `linear-gradient(135deg, rgba(212,130,59,0.18), rgba(212,130,59,0.04))`,
              transform: `rotateY(${f.rotateY}deg) rotateX(${f.rotateX}deg) translateZ(${half}px)`,
              backdropFilter: "blur(2px)",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Tab: Início ──────────────────────────────────────────────────────────────

function TabInicio() {
  const stats = [
    { icon: <Heart className="w-5 h-5" />, name: "HP", color: "#e05555",
      desc: "Reduz com ataques, fome a zero, overheating ou congelação. Recupera com Pierogi, Healing Salve e estruturas de ressurreição." },
    { icon: <Utensils className="w-5 h-5" />, name: "Fome", color: ORANGE,
      desc: "Cai continuamente. A zero, começa a perder HP. O Crock Pot maximiza a eficiência de cada ingredient que recolhes." },
    { icon: <Brain className="w-5 h-5" />, name: "Sanidade", color: "#9b7fd4",
      desc: "Cai no escuro, perto de Shadow Creatures ou com certas ações. Baixa demais e sombras materializam-se para te atacar." },
  ];
  const days = [
    { range:"Dia 1", color:"#3a8a4a",
      steps:["Apanha tudo: Cut Grass, Twigs, Flint, Rocks","Cria Axe + Pickaxe imediatamente","Corta árvores para Logs, apanha Berries e Carrots","Marca no mapa: Savannah (gold), Pig Village, Boulders","Faz Campfire antes do anoitecer — a noite mata"] },
    { range:"Dias 2–5", color:ORANGE,
      steps:["Constrói Science Machine (1 Gold + 4 Logs + 4 Rocks)","Desbloqueia Crock Pot, Ice Box, Fire Pit","Faz Log Suit + Football Helmet antes do primeiro combate","Explora o mapa e marca recursos raros","Começa a stockpilar comida e materiais"] },
    { range:"Dias 6–20", color:"#7a5a9a",
      steps:["Constrói Alchemy Engine (Tier 2 recipes)","Faz Thermal Stone para o Inverno que se aproxima","Planta e cultiva antes das culturas pararem","Prepara armadura e arma para o Deerclops (dia ~30)","Considera fazer Meat Effigy com barba do Wilson"] },
  ];
  const mistakes = [
    { bad:"Não fazer fogo antes da noite", fix:"A noite mata em segundos pela sanidade. Carrega sempre uma Torch ou Campfire no inventário." },
    { bad:"Não recolher Gold no dia 1", fix:"Gold é necessário para Science Machine. Vai ao Savannah (campo aberto) onde há Boulders com Gold." },
    { bad:"Ignorar o Inverno", fix:"Verifica o calendário de estações. Tens ~20 dias para preparar aquecimento e stockpilar comida." },
    { bad:"Lutar sem armor", fix:"Log Suit (80% absorção) é craft simples. Nunca combatas sem armor equipada." },
    { bad:"Comer comida podre", fix:"Comida podre dá -3 HP e -50 sanidade. Usa Ice Box para preservar 2× mais tempo." },
    { bad:"Base em sítio aleatório", fix:"Constrói perto de Savannah (gold), Pine Forest (madeira), Lago (peixe) e Pig Village (aliados)." },
  ];

  return (
    <div className="space-y-14">
      <Reveal>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-1" style={{ fontFamily: IMPACT }}>
          Sobreviver ao Primeiro Dia
        </h2>
        <p className="text-white/50 text-sm">
          Don't Starve Together é implacável com novos jogadores. Dominar os fundamentos é a diferença entre morrer no dia 2 e prosperar.
        </p>
      </Reveal>

      {/* The 3 core stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Reveal key={s.name} delay={i * 0.08}>
            <div className="group border border-white/8 bg-black/30 p-6 hover:border-white/20 hover:bg-black/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,130,59,0.08)]">
              <div className="mb-4 flex items-center gap-3">
                <div style={{ color: s.color }}>{s.icon}</div>
                <span className="text-lg font-black uppercase tracking-widest" style={{ color: s.color, fontFamily: IMPACT }}>{s.name}</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Day guide */}
      <div>
        <Reveal>
          <h3 className="text-xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: IMPACT }}>
            Guia Dia-a-Dia
          </h3>
        </Reveal>
        <div className="space-y-3">
          {days.map((d, i) => (
            <Reveal key={d.range} delay={i * 0.07}>
              <div className="border border-white/8 bg-black/30 hover:border-white/16 transition-colors">
                <div className="flex items-center gap-4 px-6 py-4 border-b border-white/6">
                  <div className="w-px h-6 self-stretch" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: d.color }}>{d.range}</span>
                </div>
                <ul className="px-6 py-4 space-y-2">
                  {d.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-white/65">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: d.color }} />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Mistakes */}
      <div>
        <Reveal>
          <h3 className="text-xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: IMPACT }}>
            Erros Mais Comuns
          </h3>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mistakes.map((m, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="border border-white/8 bg-black/30 p-5 hover:border-white/16 transition-colors">
                <div className="flex items-start gap-3 mb-2">
                  <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/40" />
                  <span className="text-sm font-semibold text-white/80">{m.bad}</span>
                </div>
                <p className="text-white/45 text-sm leading-relaxed ml-7">{m.fix}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Personagens ─────────────────────────────────────────────────────────

function TabPersonagens() {
  const [selected, setSelected] = useState<Char>(CHARS[0]);
  const [filter, setFilter] = useState<Difficulty | "Todos">("Todos");
  const filtered = filter === "Todos" ? CHARS : CHARS.filter(c => c.difficulty === filter);
  const difficultyLabel: Record<Difficulty, string> = {
    "Fácil":"I","Médio":"II","Difícil":"III","Especial":"S",
  };

  return (
    <div className="space-y-8">
      {/* Filter */}
      <Reveal>
        <div className="flex items-center gap-2 flex-wrap">
          {(["Todos","Fácil","Médio","Difícil","Especial"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="relative px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors"
              style={{ color: filter === f ? "#fff" : "rgba(255,255,255,0.4)" }}
            >
              {filter === f && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0"
                  style={{ backgroundColor: ORANGE }}
                  transition={{ type:"spring", stiffness:400, damping:30 }}
                />
              )}
              <span className="relative">{f}</span>
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Left: portrait grid */}
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((char) => (
                <motion.button
                  key={char.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelected(char)}
                  className="group relative border bg-black/40 overflow-hidden transition-all duration-200"
                  style={{
                    borderColor: selected.name === char.name ? ORANGE : "rgba(255,255,255,0.08)",
                    boxShadow: selected.name === char.name ? `0 0 20px rgba(212,130,59,0.2)` : "none",
                  }}
                >
                  <img
                    src={char.portrait}
                    alt={char.name}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-white">{char.name}</div>
                    <div className="text-[9px] text-white/40">{difficultyLabel[char.difficulty]}</div>
                  </div>
                  {selected.name === char.name && (
                    <div className="absolute inset-0 border-2 pointer-events-none" style={{ borderColor: ORANGE }} />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: detail panel */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="border border-white/10 bg-black/40 overflow-hidden"
            >
              {/* Portrait with 3D tilt */}
              <TiltCard>
                <div className="relative overflow-hidden" style={{ perspective: "600px" }}>
                  <img
                    src={selected.portrait}
                    alt={selected.name}
                    className="w-full h-64 object-cover object-top"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">
                      {selected.difficulty}
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white" style={{ fontFamily: IMPACT }}>
                      {selected.name}
                    </h3>
                  </div>
                </div>
              </TiltCard>

              <div className="p-5 space-y-5">
                <p className="text-white/60 text-sm leading-relaxed">{selected.desc}</p>

                {/* Stats */}
                <div className="space-y-3">
                  {[
                    { label:"HP", value:selected.hp, max:400, icon:<Heart className="w-3 h-3" />, color:"#e05555" },
                    { label:"Fome", value:selected.hunger, max:300, icon:<Utensils className="w-3 h-3" />, color:ORANGE },
                    { label:"Sanidade", value:selected.sanity, max:300, icon:<Brain className="w-3 h-3" />, color:"#9b7fd4" },
                  ].map(s => (
                    <div key={s.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5" style={{ color: s.color }}>
                          {s.icon}
                          <span className="font-bold uppercase tracking-widest">{s.label}</span>
                        </div>
                        <span className="text-white/40 font-mono">{s.value}</span>
                      </div>
                      <AnimatedBar value={s.value} max={s.max} color={s.color} />
                    </div>
                  ))}
                </div>

                {/* Perks & Cons */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-white/30 mb-2">Vantagens</div>
                    <ul className="space-y-1.5">
                      {selected.perks.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                          <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/30" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-white/30 mb-2">Desvantagens</div>
                    <ul className="space-y-1.5">
                      {selected.cons.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                          <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/30" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tip */}
                <div className="border-l-2 pl-4" style={{ borderColor: ORANGE }}>
                  <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: ORANGE }}>Dica Pro</div>
                  <p className="text-white/60 text-sm leading-relaxed">{selected.tip}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Estações ────────────────────────────────────────────────────────────

function TabEstacoes() {
  const seasons = [
    { id:"outono",  name:"Outono",   days:"Dias 1–20",  Icon:Leaf,      color:"#c47c3a",
      desc:"A estação mais gentil. Clima estável, recursos abundantes, sem ameaças sazonais. Usa este tempo para construir a base.",
      priorities:["Explorar o mapa e marcar recursos essenciais","Science Machine + Alchemy Engine + Crock Pot + Ice Box","Stockpilar 30+ unidades de comida antes do dia 20","Fazer armor e arma antes do Inverno","Marcar localizações de Pig Village e Boulders"],
      threats:["Hounds em ondas nos dias 5, 10, 15...","MacTusk e WX78 no final do Outono","Deerclops aproxima-se no Inverno"] },
    { id:"inverno", name:"Inverno",  days:"Dias 21–35", Icon:Snowflake, color:"#7ecef4",
      desc:"O maior desafio para iniciantes. Temperatura desce, culturas param, Deerclops aparece. Aquecimento é vida.",
      priorities:["Thermal Stone aquecida permanentemente equipada","Manter Fire Pit acesa ou usar Walking Cane","Comer comida quente (soups do Crock Pot)","Evitar neve por longos períodos","Preparar Dark Sword + armor para Deerclops (dia ~30)"],
      threats:["Deerclops aparece no início da noite do dia ~30","Congelação mata rapidamente sem proteção","MacTusk Hunters com WX78 ranged"] },
    { id:"primavera",name:"Primavera",days:"Dias 36–55",Icon:Cloud,     color:"#5ba87a",
      desc:"Chuva constante. A humidade danifica itens e drena sanidade. Moose/Goose aparece perto de lagos.",
      priorities:["Rain Coat ou Umbrella para proteção da chuva","Eyebrella (drop do Deerclops) é a melhor solução","Aproveitar crescimento rápido de cultivos","Matar Moose/Goose para recursos raros","Relâmpagos: mantém Lightning Rods ativos"],
      threats:["Moose/Goose spawna perto de lagos","Chuva dana equipamento continuamente","Relâmpagos frequentes e Moslings"] },
    { id:"verao",   name:"Verão",    days:"Dias 56–70", Icon:Sun,       color:"#e05555",
      desc:"Calor extremo. Coisas pegam fogo espontaneamente. Antlion ataca com sinkholes. Ice Flingomatic é obrigatório.",
      priorities:["Ice Flingomatic ligado para proteger a base","Endothermic Fire Pit (arrefece) para as noites","Summer Frest ou Floral Shirt para overheating","Passar tempo em cavernas que ficam sempre frescas","Thermal Stone fria para arrefecer em campo"],
      threats:["Incêndios espontâneos na base sem Flingomatic","Antlion causa sinkholes com tremores","Overheating mata em segundos"] },
  ];
  const [active, setActive] = useState(seasons[0].id);
  const season = seasons.find(s => s.id === active)!;

  return (
    <div className="space-y-8">
      <Reveal>
        <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: IMPACT }}>Guia de Estações</h2>
        <p className="text-white/50 text-sm mt-1">Cada ano em DST tem 4 estações de ~20 dias. Cada uma exige uma estratégia completamente diferente.</p>
      </Reveal>

      {/* Season selector */}
      <div className="grid grid-cols-4 gap-2">
        {seasons.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className="relative p-4 border transition-all duration-200 text-left overflow-hidden"
            style={{
              borderColor: active === s.id ? s.color : "rgba(255,255,255,0.08)",
              background: active === s.id ? `rgba(${s.id === "outono" ? "196,124,58" : s.id === "inverno" ? "126,206,244" : s.id === "primavera" ? "91,168,122" : "224,85,85"},0.1)` : "rgba(0,0,0,0.3)",
            }}
          >
            <s.Icon className="w-5 h-5 mb-2" style={{ color: active === s.id ? s.color : "rgba(255,255,255,0.3)" }} />
            <div className="text-xs font-black uppercase tracking-widest" style={{ color: active === s.id ? s.color : "rgba(255,255,255,0.5)" }}>{s.name}</div>
            <div className="text-[10px] text-white/30">{s.days}</div>
          </button>
        ))}
      </div>

      {/* Season content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <div>
            <div className="border border-white/8 bg-black/40 p-6">
              <p className="text-white/60 text-sm leading-relaxed mb-6">{season.desc}</p>
              <div className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Prioridades</div>
              <ul className="space-y-2.5">
                {season.priorities.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/65">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[10px] font-black" style={{ color: season.color }}>
                      {i + 1}
                    </div>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border border-white/8 bg-black/40 p-6">
            <div className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Ameaças</div>
            <ul className="space-y-3">
              {season.threats.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/65">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/30" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-white/8">
              <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: season.color }}>Estrutura Essencial</div>
              <p className="text-white/50 text-sm">
                {season.id === "outono" && "Fire Pit + Crock Pot + Ice Box — a tríade fundamental de qualquer base."}
                {season.id === "inverno" && "Thermal Stone + Walking Cane + Warm Clothing — mobilidade e calor são vitais."}
                {season.id === "primavera" && "Eyebrella ou Rain Coat + Lightning Rods por toda a base."}
                {season.id === "verao" && "Ice Flingomatic (OBRIGATÓRIO) + Endothermic Fire Pit para noites quentes."}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Cycle visual */}
      <Reveal>
        <div className="border border-white/8 bg-black/30 p-6">
          <div className="text-xs font-black uppercase tracking-widest text-white/30 mb-5">Ciclo Anual</div>
          <div className="flex items-center gap-0">
            {seasons.map((s, i) => (
              <div key={s.id} className="flex-1 flex items-center">
                <div
                  className="flex-1 h-1.5 cursor-pointer transition-all"
                  style={{ backgroundColor: active === s.id ? s.color : "rgba(255,255,255,0.1)" }}
                  onClick={() => setActive(s.id)}
                />
                <div className="w-3 h-3 rounded-full border-2 cursor-pointer transition-all flex-shrink-0"
                  style={{
                    borderColor: active === s.id ? s.color : "rgba(255,255,255,0.15)",
                    backgroundColor: active === s.id ? s.color : "transparent",
                  }}
                  onClick={() => setActive(s.id)}
                />
                {i < seasons.length - 1 && (
                  <div className="flex-1 h-1.5" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                )}
              </div>
            ))}
          </div>
          <div className="flex mt-2 text-[10px] text-white/30 uppercase tracking-widest">
            {seasons.map(s => <div key={s.id} className="flex-1 text-center">{s.name}</div>)}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

// ─── Tab: Combate ─────────────────────────────────────────────────────────────

function TabCombate() {
  const weapons = [
    { tier:"S", name:"Dark Sword",        dmg:68,   dur:"100 usos",   note:"Máximo dano do jogo. -20 sanidade/min" },
    { tier:"S", name:"Hambat",            dmg:59.5, dur:"Infinita*",   note:"*Enquanto fresca. Hambat = Ham fresco" },
    { tier:"A", name:"Tentacle Spike",    dmg:51,   dur:"200 usos",   note:"Enorme durabilidade, sem penalidades" },
    { tier:"A", name:"Battle Spear",      dmg:59.5, dur:"225 usos",   note:"Wigfrid apenas. Inclui life steal" },
    { tier:"B", name:"Obsidian Spear",    dmg:55,   dur:"150 usos",   note:"Causa burn. Boa para monstros normais" },
    { tier:"B", name:"Spear",             dmg:34,   dur:"150 usos",   note:"Melhor arma early game por custo" },
    { tier:"C", name:"Pickaxe",           dmg:27.2, dur:"50 usos",    note:"Ferramenta usada como arma de emergência" },
  ];
  const armor = [
    { slot:"Cabeça", name:"Football Helmet",    absorb:"80%", dur:"450", note:"Melhor capacete. Indispensável em bosses." },
    { slot:"Cabeça", name:"Thulecite Crown",    absorb:"70%", dur:"750", note:"Ruins drop. Alta durabilidade." },
    { slot:"Corpo",  name:"Marble Suit",        absorb:"95%", dur:"750", note:"Máxima proteção. -30% velocidade." },
    { slot:"Corpo",  name:"Log Suit",           absorb:"80%", dur:"350", note:"Fácil craft. Combo com Football = 96% redução." },
    { slot:"Corpo",  name:"Thulecite Suit",     absorb:"90%", dur:"750", note:"Spawna tentáculos ao ser atingido." },
    { slot:"Corpo",  name:"Night Armor",        absorb:"95%", dur:"750", note:"Igual Marble. -4 sanidade/min contínuo." },
  ];
  const tierColor: Record<string,string> = { S:"#d4823b", A:"#7e9fd4", B:"#6aaa77", C:"rgba(255,255,255,0.3)" };

  return (
    <div className="space-y-12">
      <Reveal>
        <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: IMPACT }}>Sistema de Combate</h2>
      </Reveal>

      {/* Kiting */}
      <Reveal>
        <div className="border border-white/8 bg-black/40 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5" style={{ color: ORANGE }} />
            <h3 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: IMPACT }}>O Sistema de Kiting</h3>
          </div>
          <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-2xl">
            Kiting é a técnica fundamental de DST — ataca durante a animação de ataque do inimigo, depois recua para fora do alcance antes do próximo. Cada inimigo tem um ritmo diferente que podes aprender.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { n:1, title:"Aproxima-te",   desc:"Vai para perto do inimigo. Observa o início da animação de ataque dele." },
              { n:2, title:"Ataca 1–3×",    desc:"Durante o wind-up do inimigo, dá 1 a 3 hits rápidos dependendo do inimigo." },
              { n:3, title:"Recua",          desc:"Sai do alcance antes do hit conectar. Repete o ciclo indefinidamente." },
            ].map(s => (
              <div key={s.n} className="border border-white/8 p-5">
                <div className="text-4xl font-black mb-3 tabular-nums" style={{ fontFamily: IMPACT, color: "rgba(212,130,59,0.3)" }}>0{s.n}</div>
                <div className="text-sm font-bold text-white mb-2 uppercase tracking-wide">{s.title}</div>
                <p className="text-xs text-white/45 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Weapons */}
      <div>
        <Reveal><h3 className="text-lg font-black uppercase tracking-tight mb-4" style={{ fontFamily: IMPACT }}>Tier List de Armas</h3></Reveal>
        <div className="border border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-black/40">
                <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-white/30">Tier</th>
                <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-white/30">Arma</th>
                <th className="text-center px-5 py-3 text-xs font-black uppercase tracking-widest text-white/30">Dano</th>
                <th className="text-center px-5 py-3 text-xs font-black uppercase tracking-widest text-white/30">Durabilidade</th>
                <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-white/30 hidden md:table-cell">Nota</th>
              </tr>
            </thead>
            <tbody>
              {weapons.map((w, i) => (
                <motion.tr
                  key={w.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 bg-black/20 hover:bg-black/40 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-black" style={{ color: tierColor[w.tier] }}>{w.tier}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-white/85">{w.name}</td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold" style={{ color: ORANGE }}>{w.dmg}</td>
                  <td className="px-5 py-3.5 text-center text-white/40 text-xs">{w.dur}</td>
                  <td className="px-5 py-3.5 text-white/40 text-xs hidden md:table-cell">{w.note}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Armor */}
      <div>
        <Reveal><h3 className="text-lg font-black uppercase tracking-tight mb-4" style={{ fontFamily: IMPACT }}>Armadura</h3></Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {armor.map((a, i) => (
            <Reveal key={a.name} delay={i * 0.04}>
              <div className="border border-white/8 bg-black/30 p-5 hover:border-white/16 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">{a.slot}</div>
                    <div className="font-bold text-sm text-white">{a.name}</div>
                  </div>
                  <div className="text-2xl font-black" style={{ fontFamily: IMPACT, color: ORANGE }}>{a.absorb}</div>
                </div>
                <div className="text-[10px] text-white/25 mb-2">Durabilidade: {a.dur} usos</div>
                <p className="text-xs text-white/45">{a.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div>
        <Reveal><h3 className="text-lg font-black uppercase tracking-tight mb-4" style={{ fontFamily: IMPACT }}>Táticas Essenciais</h3></Reveal>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { icon:<Shield className="w-4 h-4"/>, title:"Armor Combo", body:"Football Helmet (80%) + Log Suit (80%) = 96% redução de dano. Esta combinação é suficiente para a maioria dos bosses do jogo." },
            { icon:<Target className="w-4 h-4"/>, title:"Tooth Traps", body:"20-30 traps numa linha. Cada trap faz 60 dano. Leva inimigos por cima durante hound waves para dano massivo passivo." },
            { icon:<Heart className="w-4 h-4"/>, title:"Healing em Combate", body:"Pierogi (+40 HP), Healing Salve (+20 HP), Honey Poultice (+30 HP). Mantém sempre 10 Pierogi no inventário para emergências." },
            { icon:<AlertTriangle className="w-4 h-4"/>, title:"Inimigos Perigosos", body:"Splumonkeys soltam itens do inventário. Clockwork Knights fazem imenso dano. Depth Worms spawnam das paredes das caves." },
          ].map((tip, i) => (
            <Reveal key={tip.title} delay={i * 0.06}>
              <div className="border border-white/8 bg-black/30 p-5 flex gap-4 hover:border-white/16 transition-colors">
                <div className="flex-shrink-0 mt-0.5" style={{ color: ORANGE }}>{tip.icon}</div>
                <div>
                  <div className="font-bold text-sm text-white mb-1">{tip.title}</div>
                  <p className="text-white/50 text-sm leading-relaxed">{tip.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Chefes ──────────────────────────────────────────────────────────────

function TabChefes() {
  const bosses = [
    { name:"Deerclops",          hp:4000,  season:"Inverno · dia ~30", diff:"Médio",
      drops:["Deerclops Eyeball → Eyebrella (melhor chuva)"],
      strategy:["Kite com 2-3 hits — ritmo lento e previsível","Mantém árvores entre vós para dificultar o pathfind","Hambat ou Dark Sword para dano máximo","Football Helmet + Log Suit suficiente"],
      tip:"O Eyebrella é o melhor item para a Primavera — imunidade total à chuva e relâmpago." },
    { name:"Moose/Goose",        hp:6000,  season:"Primavera", diff:"Médio",
      drops:["Goose Feather ×6","Moose/Goose Egg"],
      strategy:["Mata os Moslings primeiro — causam raios imparáveis","Kite com 2-3 hits depois de cada spawn","Usa estruturas de pedra como barreira","Thunder Hat protege dos raios dos Moslings"],
      tip:"Matar os Moslings antes de atacar o Moose é obrigatório. Ignorá-los é morte garantida." },
    { name:"Bearger",            hp:6750,  season:"Outono", diff:"Médio",
      drops:["Bearger Fur → Hibearnation Vest","Thick Fat"],
      strategy:["Kite com 3 hits durante o slam (fica parado 2s)","Leva-o para floresta — destrói árvores no processo","Pode adormecer com Mandrake ou Sleep Darts","Cuidado com o roar — stun por 1-2s"],
      tip:"Usa o Bearger como madeireiro — posiciona-o em florestas para farm de madeira passivo gratuito." },
    { name:"Dragonfly",          hp:27500, season:"Verão", diff:"Difícil",
      drops:["Dragonfly Scales → Scaled Furnace, Scaled Chest"],
      strategy:["Tooth Trap cheese: 30+ traps matam sem equipamento","Catapults da Winona (6x) matam automaticamente","Tem Sleep mode — alimenta-a com Rocks para acordar","Imune a fogo. Usa Log Suit + Football Helmet"],
      tip:"Tooth Trap cheese é a estratégia mais acessível. Instala 30 traps e leva-a por cima." },
    { name:"Ancient Guardian",   hp:4500,  season:"Caves (qualquer)", diff:"Médio",
      drops:["Guardian's Horn → Lazy Explorer (teleporte)","Thulecite ×15"],
      strategy:["Kite charges em diagonal — nunca em linha reta","Ataca pelo lado após cada charge (fica parado 2s)","Marble Suit para máxima proteção de tank","Dark Sword ou Tentacle Spike para dano eficiente"],
      tip:"A Lazy Explorer (dada pelo horn) teleporta para onde apontas — um dos melhores itens do jogo." },
    { name:"Klaus",              hp:13500, season:"Inverno (Winterfeast)", diff:"Difícil",
      drops:["Klaus Sack (Christmas loot)","Deer Antler"],
      strategy:["Invoca dois Deer — mata-os antes de atacar Klaus","Alterna fases Fire e Ice — muda tipos de dano","Kite simples de 3 hits + recuo","Usa armor resistente a ambos os elementos"],
      tip:"Abre o Klaus Sack com uma Key of Klaus para loot exclusivo de Natal." },
    { name:"Celestial Champion", hp:32000, season:"Lunar Island (Endgame)", diff:"Boss Final",
      drops:["Celestial Crown","Enlightened Crown","Moon Shards"],
      strategy:["Três fases com mecânicas únicas cada","Fase 1: projéteis lunares — mantém-te em movimento","Fase 2: fragmentos do chão — nunca pares","Fase 3: todas as mecânicas combinadas em simultâneo"],
      tip:"Recomendado 3+ jogadores. Wortox para heal, Wolfgang para dano, WX-78 para Supercharge de suporte." },
  ];
  const diffColor: Record<string,string> = { "Médio":ORANGE, "Difícil":"#e05555", "Boss Final":"#9b7fd4" };

  return (
    <div className="space-y-8">
      <Reveal>
        <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: IMPACT }}>Guia de Bosses</h2>
        <p className="text-white/50 text-sm mt-1">Prepara sempre Football Helmet + Log Suit + 10 Pierogi antes de qualquer boss.</p>
      </Reveal>

      <div className="space-y-3">
        {bosses.map((boss, i) => (
          <Reveal key={boss.name} delay={i * 0.05}>
            <BossCard boss={boss} diffColor={diffColor} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function BossCard({ boss, diffColor }: { boss: { name:string; hp:number; season:string; diff:string; drops:string[]; strategy:string[]; tip:string }; diffColor: Record<string,string> }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border bg-black/40 overflow-hidden transition-all duration-200 cursor-pointer hover:bg-black/60"
      style={{ borderColor: open ? "rgba(212,130,59,0.3)" : "rgba(255,255,255,0.08)" }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center gap-5 px-6 py-4">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-white/10">
          <Skull className="w-5 h-5 text-white/30" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-black text-white uppercase tracking-tight" style={{ fontFamily: IMPACT }}>{boss.name}</h3>
            <span className="text-xs font-bold px-2 py-0.5 border" style={{ color: diffColor[boss.diff], borderColor: `${diffColor[boss.diff]}40` }}>{boss.diff}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-white/35">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{boss.season}</span>
            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{boss.hp.toLocaleString()} HP</span>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="w-4 h-4 text-white/30 rotate-90" />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-white/6">
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-white/25 mb-3">Estratégia</div>
                  <ul className="space-y-2">
                    {boss.strategy.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: ORANGE }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-white/25 mb-3">Drops</div>
                  <ul className="space-y-1.5 mb-5">
                    {boss.drops.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                        <Award className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ORANGE }} />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <div className="border-l-2 pl-4" style={{ borderColor: ORANGE }}>
                    <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: ORANGE }}>Dica</div>
                    <p className="text-white/50 text-sm leading-relaxed">{boss.tip}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab: Base ────────────────────────────────────────────────────────────────

function TabBase() {
  type Priority = 1 | 2 | 3;
  const structures: { img:string; name:string; pri:Priority; desc:string; recipe:string }[] = [
    { img:scienceMachine, name:"Science Machine",     pri:1, desc:"Craft Tier 1. Primeiro a construir.",                   recipe:"1 Gold + 4 Logs + 4 Rocks" },
    { img:alchemyEngine,  name:"Alchemy Engine",      pri:1, desc:"Craft Tier 2. Essencial para progressão.",              recipe:"4 Boards + 2 Cut Stone + 6 Gold" },
    { img:firePit,        name:"Fire Pit",            pri:1, desc:"Fogo permanente, não apaga com chuva.",                 recipe:"2 Logs + 12 Rocks" },
    { img:crockPot,       name:"Crock Pot",           pri:1, desc:"Receitas complexas para healing e buffs.",              recipe:"6 Rocks + 6 Charcoal + 6 Twigs" },
    { img:iceBox,         name:"Ice Box",             pri:1, desc:"Conserva comida 2× mais tempo.",                       recipe:"2 Boards + 2 Cut Stone + 2 Gears" },
    { img:chest,          name:"Chest",               pri:1, desc:"Armazenamento base. Faz dezenas.",                     recipe:"3 Boards" },
    { img:lightningRod,   name:"Lightning Rod",       pri:2, desc:"Protege base de relâmpagos. Essencial na Primavera.",  recipe:"1 Gold + 4 Rocks" },
    { img:iceFling,       name:"Ice Flingomatic",     pri:2, desc:"Apaga incêndios automaticamente. Obrigatório Verão.",  recipe:"2 Gears + 15 Ice + 2 Elec. Doodad" },
    { img:tentImg,        name:"Tent",                pri:2, desc:"Dorme para restaurar sanidade e HP.",                   recipe:"6 Silk + 4 Twigs + 4 Rope" },
    { img:toothTrap,      name:"Tooth Trap",          pri:2, desc:"Defesa passiva. Faz 30+ para hound waves.",            recipe:"4 Logs + 1 Hound Tooth" },
    { img:endoFire,       name:"Endothermic Fire Pit",pri:2, desc:"Arrefece em vez de aquecer. Essencial Verão.",         recipe:"2 Nitre + 4 Green Gems" },
    { img:meatEffigy,     name:"Meat Effigy",         pri:3, desc:"Ressuscita sem penalty de sanidade.",                  recipe:"4 Boards + 4 Beard Hair + 40 HP" },
    { img:beeBox,         name:"Bee Box",             pri:3, desc:"Produz mel passivamente. Farm de mel.",                recipe:"4 Boards + 1 Honeycomb + 1 Bee" },
    { img:dryingRack,     name:"Drying Rack",         pri:3, desc:"Transforma carne em Jerky duradouro.",                 recipe:"3 Twigs + 3 Rope" },
    { img:prestihat,      name:"Prestihatitator",     pri:3, desc:"Magic Tier 1. Receitas mágicas básicas.",              recipe:"4 Boards + 4 Rabbit + 1 Top Hat" },
    { img:shadowManip,    name:"Shadow Manipulator",  pri:3, desc:"Magic Tier 2. Nightmare Fuel e sombras.",              recipe:"3 Purple Gem + 7 NF + 3 Liv. Log" },
    { img:pigHouse,       name:"Pig House",           pri:3, desc:"Aliados de combate. Seguem se alimentados.",           recipe:"4 Boards + 3 Cut Stone + 4 Pig Skin" },
    { img:houndius,       name:"Houndius Shootius",   pri:3, desc:"Defesa automática. Ataca inimigos próximos.",         recipe:"1 Guardian's Horn + 1 Living Log" },
  ];

  const groups: { pri: Priority; label: string }[] = [
    { pri: 1, label: "Prioridade 1 — Dias 1–5" },
    { pri: 2, label: "Prioridade 2 — Antes do Inverno" },
    { pri: 3, label: "Prioridade 3 — Mid/Late Game" },
  ];

  return (
    <div className="space-y-12">
      <Reveal>
        <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: IMPACT }}>Construção de Base</h2>
      </Reveal>

      {/* Location */}
      <Reveal>
        <div className="border border-white/8 bg-black/40 p-6">
          <div className="flex items-center gap-3 mb-5">
            <Map className="w-4 h-4" style={{ color: ORANGE }} />
            <h3 className="font-black uppercase tracking-tight text-sm" style={{ fontFamily: IMPACT }}>Localização Ideal</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon:<Leaf className="w-4 h-4"/>, name:"Savannah", why:"Gold Nuggets acessíveis" },
              { icon:<TrendingUp className="w-4 h-4"/>, name:"Pine Forest", why:"Madeira infinita próxima" },
              { icon:<Users className="w-4 h-4"/>, name:"Pig Village", why:"Aliados de combate" },
              { icon:<Flame className="w-4 h-4"/>, name:"Perto de Lago", why:"Pesca para comida extra" },
            ].map(l => (
              <div key={l.name} className="border border-white/6 p-4">
                <div className="mb-2" style={{ color: ORANGE }}>{l.icon}</div>
                <div className="text-sm font-bold text-white mb-0.5">{l.name}</div>
                <div className="text-xs text-white/35">{l.why}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {groups.map(g => (
        <div key={g.pri}>
          <Reveal>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-white/6" />
              <span className="text-xs font-black uppercase tracking-widest text-white/30">{g.label}</span>
              <div className="h-px flex-1 bg-white/6" />
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {structures.filter(s => s.pri === g.pri).map((s, i) => (
              <Reveal key={s.name} delay={i * 0.04}>
                <div className="border border-white/8 bg-black/30 p-4 flex gap-4 hover:border-white/18 hover:bg-black/50 transition-all duration-200 group">
                  <img
                    src={s.img} alt={s.name}
                    className="w-14 h-14 object-contain flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white mb-1">{s.name}</div>
                    <p className="text-xs text-white/45 mb-2 leading-relaxed">{s.desc}</p>
                    <div className="text-[10px] font-mono text-white/25">{s.recipe}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Avançado ────────────────────────────────────────────────────────────

function TabAvancado() {
  const phases = [
    { label:"Early Game", range:"Dias 1–30", color:"#4a8a5a",
      goals:["Science Machine + Alchemy Engine operacionais","Base com Fire Pit, Crock Pot e Ice Box","Sobreviver ao primeiro Inverno e matar o Deerclops"] },
    { label:"Mid Game", range:"Dias 31–100", color:ORANGE,
      goals:["Prestihatitator + Shadow Manipulator","Explorar cavernas e coletar recursos raros","Matar os Giants sazonais: Bearger, Moose/Goose, Dragonfly"] },
    { label:"Late Game", range:"Dias 100+", color:"#9b7fd4",
      goals:["Ruins — Thulecite e Ancient equipment","Celestial Portal — Lunar Island (novo bioma)","Celestial Champion — boss final e mais difícil"] },
    { label:"Endgame", range:"Dias 200+", color:"#7ecef4",
      goals:["Ancient Fuelweaver — boss secreto das Ruins","Full Ancient + Celestial equipment completo","Megabase sustentável por centenas de dias"] },
  ];
  const sections = [
    { Icon:TrendingUp, title:"Caves e Ruins",
      items:["Cavernas: sem sazonalidade, temperatura constante","Ruins: Thulecite, Ancient Gateways e receitas únicas","Magiluminescence — o melhor item de mobilidade do jogo","Depth Worms spawnam das paredes — mantém-te em movimento","Batilisks atacam no escuro — carrega sempre uma luz"] },
    { Icon:Brain, title:"Nightmare Cycle",
      items:["Nas Ruins existe um ciclo Day/Night de Nightmare","Durante Nightmare: monstros mais fortes, itens únicos","Usa o ciclo para farmar os Ancient Pseudoscience Stations","Nightmare Fuel é fundamental para quase todos os itens mágicos","Clockwork monsters reappear após reset do Nightmare cycle"] },
    { Icon:Users, title:"Multiplayer Synergies",
      items:["WX-78 + Lightning Rods: Supercharge passivo na Primavera","Wickerbottom: On Tentacles é suporte de grupo incontornável","Wortox: o melhor healer do jogo em boss fights de grupo","Winona: Catapults protegem base sem intervenção humana","Wolfgang: líder de DPS em qualquer confronto do jogo"] },
    { Icon:Zap, title:"Gestão Avançada de Recursos",
      items:["Thulecite: Ruins apenas — armadura e ferramentas top tier","Guardian's Horn: Lazy Explorer — o melhor item de mobilidade","Dragonfly Scales: Scaled Furnace (melhor caldeira) + Scaled Chest","Gears: drop de Clockworks (3 kills garantem gears suficientes)","Purple Gems: drop de Treeguards e Ruins — raros e valiosos"] },
  ];

  return (
    <div className="space-y-12">
      <Reveal>
        <h2 className="text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: IMPACT }}>Guia Avançado</h2>
        <p className="text-white/50 text-sm mt-1">Para jogadores que dominam o básico e querem explorar o conteúdo profundo de DST.</p>
      </Reveal>

      {/* Progression timeline */}
      <Reveal>
        <div className="border border-white/8 bg-black/40 p-7">
          <div className="flex items-center gap-3 mb-7">
            <TrendingUp className="w-4 h-4" style={{ color: ORANGE }} />
            <h3 className="font-black uppercase tracking-tight text-sm" style={{ fontFamily: IMPACT }}>Caminho de Progressão</h3>
          </div>
          <div className="space-y-0">
            {phases.map((phase, i) => (
              <div key={phase.label} className="flex gap-6">
                <div className="flex flex-col items-center flex-shrink-0 w-4">
                  <div className="w-3 h-3 rounded-full border-2 mt-1" style={{ borderColor: phase.color, backgroundColor: `${phase.color}30` }} />
                  {i < phases.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: `${phase.color}30` }} />}
                </div>
                <div className="pb-7">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: phase.color }}>{phase.label}</span>
                    <span className="text-xs text-white/25">{phase.range}</span>
                  </div>
                  <ul className="space-y-1">
                    {phase.goals.map((g, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-white/55">
                        <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/20" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.07}>
            <div className="border border-white/8 bg-black/40 p-6 h-full hover:border-white/16 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <s.Icon className="w-4 h-4" style={{ color: ORANGE }} />
                <h3 className="font-black uppercase tracking-tight text-sm" style={{ fontFamily: IMPACT }}>{s.title}</h3>
              </div>
              <ul className="space-y-2">
                {s.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-white/55">
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/20" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Guides() {
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const constraintsRef = useRef(null);

  const renderTab = () => {
    switch (activeTab) {
      case "inicio":      return <TabInicio />;
      case "personagens": return <TabPersonagens />;
      case "estacoes":    return <TabEstacoes />;
      case "combate":     return <TabCombate />;
      case "chefes":      return <TabChefes />;
      case "base":        return <TabBase />;
      case "avancado":    return <TabAvancado />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1410] text-white" ref={constraintsRef}>
      {/* Nav */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <FontAwesomeIcon icon={faScrewdriverWrench} className="h-6 w-6" style={{ color: ORANGE }} />
            <span className="text-lg font-black uppercase tracking-tight" style={{ fontFamily: IMPACT }}>DST Tools</span>
          </Link>
          <Link to="/">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors border border-white/10 hover:border-white/30">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/8">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] blur-[120px] opacity-20 rounded-full" style={{ background: ORANGE }} />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-8 py-16">
          <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-5 h-5" style={{ color: ORANGE }} />
                  <span className="text-xs font-black uppercase tracking-widest text-white/40">Guia Completo</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4 whitespace-nowrap" style={{ fontFamily: IMPACT }}>
                  DON'T <span style={{ color: ORANGE }}>STARVE</span> TOGETHER
                </h1>
                <p className="text-white/50 text-sm leading-relaxed max-w-md">
                  Do primeiro dia até ao Celestial Champion — tudo o que precisas para sobreviver, prosperar e dominar DST.
                </p>
              </motion.div>
          </div>

        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-white/8 bg-[#1a1410] sticky top-16 z-40 overflow-x-auto">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors"
                style={{ color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.35)" }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: ORANGE }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-[1200px] mx-auto px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
