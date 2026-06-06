import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import Logo from "../components/Logo";
import { Wrench, Zap, Key, Siren, Truck, Circle, X, Check, HelpCircle, User, Star, MapPin } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = [
  { 
    id: "mecanicos", 
    label: "Mecânica Geral", 
    description: "Diagnóstico de motor, freios, suspensão e preventiva", 
    icon: Wrench, 
    color: "from-blue-500/10 to-blue-600/10 border-blue-500/30 text-blue-400" 
  },
  { 
    id: "socorro", 
    label: "Socorro Rápido", 
    description: "Pane mecânica ou emergência mecânica na rodovia/rua", 
    icon: Siren, 
    color: "from-red-500/10 to-red-600/10 border-red-500/30 text-red-400" 
  },
  { 
    id: "guincho", 
    label: "Guincho & Reboque", 
    description: "Remoção e transporte de veículos com segurança", 
    icon: Truck, 
    color: "from-orange-500/10 to-orange-600/10 border-orange-500/30 text-orange-400" 
  },
  { 
    id: "eletrica", 
    label: "Auto Elétrica", 
    description: "Pane elétrica, chupeta em bateria arriada e alternador", 
    icon: Zap, 
    color: "from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 text-yellow-400" 
  },
  { 
    id: "pneu", 
    label: "Troca de Pneu / Borracharia", 
    description: "Reparo de pneu furado, troca rápida e macaco hidráulico", 
    icon: Circle, 
    color: "from-slate-500/10 to-slate-600/10 border-slate-500/30 text-slate-400" 
  },
  { 
    id: "chaveiro", 
    label: "Chaveiro Automotivo", 
    description: "Abertura de portas, cópias de chaves, travas de ignição", 
    icon: Key, 
    color: "from-emerald-500/10 to-emerald-600/10 border-emerald-500/30 text-emerald-400" 
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user, userData, signIn, signOut } = useAuth();

  // Form Modal State
  const [selectedServiceForForm, setSelectedServiceForForm] = useState<{
    id: string;
    name: string;
    icon: any;
  } | null>(null);

  const [clientName, setClientName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [region, setRegion] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const openForm = (serviceId: string, serviceName: string, icon: any) => {
    setSelectedServiceForForm({ id: serviceId, name: serviceName, icon });
  };

  const closeForm = () => {
    setSelectedServiceForForm(null);
  };

  const submitRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForForm) return;

    if (!user) {
      await signIn("cliente");
    }

    navigate("/mapa", {
      state: {
        serviceId: selectedServiceForForm.id,
        serviceName: selectedServiceForForm.name,
        formData: {
          clientName,
          vehicle,
          problemDescription,
          region,
          clientPhone,
        },
        autoStart: true,
      },
    });
  };

  return (
    <div className="w-full min-h-screen text-slate-200 font-sans selection:bg-cyan-500/35 overflow-y-auto overflow-x-hidden bg-slate-950">
      
      {/* HEADER NAVBAR (GetNinjas Style) */}
      <header className="sticky top-0 z-[80] w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Logo size="sm" />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight uppercase">
                Mecânico <span className="text-cyan-400 font-black">em Casa</span>
              </span>
              <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                Inspirado em GetNinjas
              </span>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-semibold text-slate-400 hover:text-white transition hidden md:block"
            >
              Como funciona?
            </button>
            
            <button
              onClick={() => navigate("/radar")}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-black text-cyan-400 border border-cyan-400/30 hover:border-cyan-400 rounded-xl transition bg-cyan-950/20"
            >
              🛠️ Área do Mecânico (Mural)
            </button>

            {user ? (
              <div className="flex items-center gap-2 border-l border-slate-800 pl-2 sm:pl-4">
                <span className="text-xs text-slate-300 font-medium capitalize hidden sm:inline">
                  {userData?.name?.split(" ")[0] || "Cliente"}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-slate-500 hover:text-red-400 text-[10px] font-bold uppercase transition"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  await signIn("profissional", true);
                  navigate("/radar");
                }}
                className="bg-white hover:bg-slate-200 text-slate-950 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-black rounded-xl transition active:scale-95"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO BANNER SECTION (Clean, Beautiful, Light / Medium contrast slate style) */}
      <section className="relative w-full pt-16 pb-20 px-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-900">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Brasília e Cidades Satélites
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4 select-none">
            Mais de <span className="text-yellow-400 font-extrabold">120 mecânicos</span>
            <br />
            em um só lugar.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed mb-10 font-normal">
            Anuncie seu problema automotivo e receba orçamentos de profissionais locais no seu WhatsApp em minutos, sem complicação.
          </p>

          <button
            onClick={() => {
              document.getElementById("servicos")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-350 text-slate-950 text-sm font-black uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.25)] transition-all duration-200 active:scale-95 flex items-center gap-2"
          >
            🔌 Solicitar Mecânico / Guincho Agora
          </button>
        </div>
      </section>

      {/* DETAILED CATEGORIES SECTION */}
      <section id="servicos" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-[#00f3ff] text-xs font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
            <User size={14} /> Contrate em 1 Clique
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Qual serviço automotivo você precisa?
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Selecione uma das especialidades registradas abaixo para começar a sua simulação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => openForm(cat.id, cat.label, cat.icon)}
              className={`p-6 border rounded-2xl bg-slate-900/40 hover:bg-slate-900 flex flex-col text-left transition-all duration-250 hover:-translate-y-1 active:translate-y-0 group relative overflow-hidden`}
              style={{ contentVisibility: "auto" }}
            >
              <div className="absolute top-0 right-0 p-1.5 bg-slate-800 text-slate-600 rounded-bl-xl text-[9px] font-bold uppercase tracking-wider group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                Contratar
              </div>

              <div className="p-3.5 bg-slate-800/80 rounded-xl self-start mb-4 border border-slate-700/50 group-hover:border-cyan-500/50 transition-colors">
                <cat.icon size={28} className="text-white group-hover:scale-110 transition-transform" />
              </div>

              <h4 className="text-lg font-black text-white mb-2 leading-none">
                {cat.label}
              </h4>
              
              <p className="text-xs text-slate-400 leading-relaxed font-light mb-2">
                {cat.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS (GetNinjas Flow Description) */}
      <section id="como-funciona" className="py-20 px-6 border-y border-slate-900 bg-slate-900/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-2">
              Praticidade Total
            </h2>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">
              Como funciona o Mecânico em Casa?
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto leading-relaxed">
              Pegamos todo o fluxo confuso e dividimos no autêntico modelo GetNinjas, sem ruídos e direto ao ponto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-slate-900/50 border border-slate-850 p-8 rounded-3xl relative">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-yellow-400 text-slate-950 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                1
              </div>
              <h4 className="text-lg font-bold text-white mt-4 mb-2">Peça o seu serviço</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Escolha a categoria e preencha um formulário simples detalhando seu veículo, o defeito apresentado e sua região em Brasília.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/50 border border-slate-850 p-8 rounded-3xl relative">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-cyan-400 text-slate-950 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                2
              </div>
              <h4 className="text-lg font-bold text-white mt-4 mb-2">Mecânicos disputam seu lead</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                O chamado aparece no Mural de Oportunidades. Parceiros qualificados utilizam créditos fictícios para desbloquear o seu número.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/50 border border-slate-850 p-8 rounded-3xl relative">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-emerald-400 text-slate-900 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                3
              </div>
              <h4 className="text-lg font-bold text-white mt-4 mb-2">Combine os detalhes</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Até 5 mecânicos autorizados liberam seu contato. Você recebe as propostas de orçamento diretamente no seu Whatsapp e telefone!
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* JOIN AS A PARTNER FOOTER SECTION */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-slate-900/40 to-slate-950 border border-slate-800 p-8 sm:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#39ff14]/5 rounded-full blur-xl" />
          
          <div className="space-y-4 max-w-md text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest rounded-md">
              Para Profissionais
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Você é Mecânico, Borraceiro ou Guincheiro?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Ganhe mais clientes em Brasília. Acesse o Mural de Oportunidades, faça login instantâneo e desbloqueie leads em tempo real para fechar serviços lucrativos!
            </p>
          </div>

          <button
            onClick={() => navigate("/radar")}
            className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-transform shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Ir para o Mural do Profissional ➡️
          </button>
        </div>
      </section>

      {/* REQUEST FORM MODAL (GetNinjas multi-step style, high visual precision) */}
      <AnimatePresence>
        {selectedServiceForForm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#070B14]/85 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#111827] w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-yellow-400 uppercase tracking-wider">
                    📋 GetNinjas Formulário
                  </span>
                </div>
                <button
                  onClick={closeForm}
                  className="p-1.5 bg-slate-800/50 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                  {selectedServiceForForm.icon && <selectedServiceForForm.icon size={16} className="text-cyan-400" />}
                  <span>{selectedServiceForForm.name}</span>
                </div>

                <form id="landingRequestForm" onSubmit={submitRequest} className="space-y-4 text-left">
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Seu Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Seu WhatsApp / Telefone (Contato Real)
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ex: (61) 99123-4567"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                    <span className="text-[9px] text-slate-500 mt-1 block leading-normal">
                      🛡️ Os mecânicos que desbloquearem este contato verão esse WhatsApp para iniciar a conversa direta.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Veículo (Marca e Modelo)
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      placeholder="Ex: Fiat Palio 1.4"
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Qual problema o carro apresenta?
                    </label>
                    <textarea
                      required
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      placeholder="Explique se o carro faz barulho, não liga, vazamento..."
                      rows={3}
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Sua Região / Cidade Satélite
                    </label>
                    <input
                      type="text"
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="Ex: Taguatinga, Sobradinho, Águas Claras..."
                      className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>

                </form>
              </div>

              <div className="p-5 border-t border-slate-800/80 mt-auto">
                <button
                  type="submit"
                  form="landingRequestForm"
                  className="w-full py-4 rounded-xl font-bold bg-[#39ff14] text-slate-950 hover:bg-[#2adb10] text-sm tracking-wider uppercase transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  🚀 Publicar Pedido no Mural
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Minimal Footer */}
      <footer className="py-10 border-t border-slate-900 bg-slate-950 text-center text-slate-600 text-xs">
        <p>© 2026 Mecânico em Casa. Inspirado no GetNinjas com fluxo de orçamentos e compra de leads.</p>
      </footer>

    </div>
  );
}
