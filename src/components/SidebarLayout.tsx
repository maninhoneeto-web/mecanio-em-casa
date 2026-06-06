import { useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import Logo from "./Logo";
import { 
  Wrench, 
  MapPin, 
  Zap, 
  Menu, 
  X, 
  Flame, 
  Sparkles, 
  Home, 
  Coins, 
  ShieldCheck, 
  Compass,
  ArrowUpRight
} from "lucide-react";

interface SidebarLayoutProps {
  children: ReactNode;
  onOpenCredits?: () => void;
}

export default function SidebarLayout({ children, onOpenCredits }: SidebarLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, signOut, signIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const stats = [
    { label: "Bronze", cr: "1.200 CR", value: "R$ 159", color: "from-amber-600 to-amber-700" },
    { label: "Prata", cr: "3.500 CR", value: "R$ 359", color: "from-slate-400 to-slate-500" },
    { label: "Ouro", cr: "5.000 CR", value: "R$ 749", color: "from-yellow-400 via-amber-400 to-yellow-600" },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative min-h-screen w-full flex bg-gradient-to-tr from-[#0b1b3d] via-[#02313f] to-[#122e1b] text-slate-100 overflow-x-hidden">
      {/* Dynamic Fluorescent Lighting Background Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-400/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="fixed top-[40%] left-[20%] w-[400px] h-[400px] bg-cyan-400/15 rounded-full blur-[130px] pointer-events-none animate-pulse" />

      {/* MOBILE HEADER BAR */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-40 bg-slate-900/90 backdrop-blur-xl border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between shadow-[0_4px_30px_rgba(0,243,255,0.1)]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav("/")}>
          <Logo size="xs" />
          <span className="font-extrabold text-sm tracking-tighter text-white uppercase flex items-center gap-1">
            Mecânico <span className="text-[#00f3ff]">em Casa</span>
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-cyan-400 hover:bg-[#00f3ff]/10 rounded-xl transition"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* PERSISTENT SIDEBAR FOR DESKTOP & MOBILE DRAWER */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 lg:bg-slate-900/80 backdrop-blur-2xl border-r border-[#00f3ff]/20 
        flex flex-col transform transition-transform duration-300 shadow-[4px_0_30px_rgba(0,10,20,0.4)]
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo area */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav("/")}>
            <Logo size="sm" />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-lg tracking-tight text-white leading-tight uppercase">Mecânico</span>
              <span className="text-xs font-black tracking-widest text-[#00f3ff] uppercase bg-cyan-950/50 border border-cyan-800/50 px-1.5 py-0.5 rounded-md mt-0.5 inline-block text-center">EM CASA</span>
            </div>
          </div>
          <button className="lg:hidden p-1.5 text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User Card / Auth section */}
        <div className="p-4 mx-4 my-2 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-900/60 border border-cyan-500/30 flex flex-col gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#39ff14] to-[#00f3ff] p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-black text-[#00f3ff] text-xs uppercase">
                    {userData?.name?.slice(0, 2) || "MC"}
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h4 className="text-sm font-bold text-white truncate capitalize">{userData?.name || "Mecânico Parceiro"}</h4>
                  <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {userData?.role === "profissional" ? "Mecânico Ativo" : "Cliente"}
                  </p>
                </div>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Coins className="text-yellow-400 w-4 h-4" />
                  <span className="text-xs text-slate-400 font-bold">Créditos:</span>
                </div>
                <span className="text-base font-black text-cyan-400">{userData?.credits || 0} CR</span>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-slate-300 font-bold mb-3 leading-relaxed">Você está navegando como mecânico visitante.</p>
              <button 
                onClick={async () => {
                  await signIn("profissional");
                  setIsOpen(false);
                }}
                className="w-full bg-gradient-to-r from-[#00f3ff] to-[#39ff14] text-slate-950 font-black text-xs py-3 rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.4)] transition hover:brightness-110 active:scale-95"
              >
                ENTRAR / CADASTRAR-SE
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Promo Banner / Propaganda de Créditos */}
        <div className="px-4 py-2 mt-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-yellow-400/10 via-amber-400/5 to-[#39ff14]/10 border-2 border-yellow-400/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(234,179,8,0.15)] flex flex-col gap-3 group">
            <div className="absolute top-0 right-0 p-1 bg-yellow-400 text-slate-950 rounded-bl-xl text-[9px] font-black tracking-widest uppercase">
              RECOMENDADO
            </div>
            <div className="flex items-center gap-2">
              <Zap className="text-yellow-400 fill-yellow-400 animate-bounce" size={18} />
              <span className="text-xs font-black text-yellow-400 uppercase tracking-widest">PROPAGANDA DE PARCERIA</span>
            </div>
            <div>
              <h5 className="text-xs font-bold text-white mb-1">Dobre Seus Lucros Hoje!</h5>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Adquira créditos e garanta acesso imediato às melhores ordens de suspensão, elétrica e guincho de Brasília!
              </p>
            </div>
            
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
               {stats.map(plan => (
                 <div key={plan.label} className="flex justify-between items-center text-[10px] font-semibold bg-slate-950/50 px-2 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-300">{plan.label}:</span>
                    <span className="text-[#39ff14] font-bold">{plan.cr}</span>
                    <span className="text-slate-400">{plan.value}</span>
                 </div>
               ))}
            </div>

            <button
              onClick={() => {
                if (onOpenCredits) {
                  onOpenCredits();
                } else {
                  navigate("/radar");
                  setTimeout(() => {
                    // Quick state bridge fallback or direct alert instructions
                    const el = document.getElementById("open-credits-btn");
                    if (el) el.click();
                  }, 100);
                }
                setIsOpen(false);
              }}
              className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-600 hover:brightness-110 text-slate-950 font-black text-[11px] py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Sparkles size={12} />
              COMPRAR CRÉDITOS AGORA
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <button 
            onClick={() => handleNav("/")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-left transition-all ${
              location.pathname === "/" ? "bg-slate-800 text-white border-l-4 border-[#00f3ff]" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <Home size={18} />
            Início / Pedir Socorro
          </button>

          <button 
            onClick={() => handleNav("/radar")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-left transition-all ${
              location.pathname === "/radar" ? "bg-slate-800 text-white border-l-4 border-[#00f3ff]" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <Compass size={18} />
            Mural de Oportunidades
          </button>

          <button 
            onClick={() => handleNav("/mapa")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-left transition-all ${
              location.pathname === "/mapa" ? "bg-slate-800 text-white border-l-4 border-[#00f3ff]" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <MapPin size={18} />
            Mapa do Cliente
          </button>
        </nav>

        {/* Footer / Info panel */}
        {user && (
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between">
            <button 
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-red-400 transition"
            >
              Sair da Conta (Zerar)
            </button>
            <span className="text-[9px] text-slate-600 font-mono">v1.4.0</span>
          </div>
        )}
      </aside>

      {/* OVERLAY FOR CONTAINER CLICK WHEN SIDEBAR IS OPEN ON MOBILE */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* MAIN RENDER WINDOW */}
      <div className="flex-1 flex flex-col pt-14 lg:pt-0 lg:pl-72 w-full animate-fade-in">
        {children}
      </div>
    </div>
  );
}
