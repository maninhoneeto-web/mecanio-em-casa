import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router";
import Logo from "../components/Logo";
import { Wrench, Zap, Key, Siren, Truck, Circle, X, Flame } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, handleFirestoreError } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import SidebarLayout from "../components/SidebarLayout";

const CATEGORY_TAGS = [
  { id: "mecanicos", label: "Mecânicas", icon: Wrench, color: "text-blue-400" },
  { id: "socorro", label: "Socorro", icon: Siren, color: "text-red-400" },
  { id: "guincho", label: "Guincho", icon: Truck, color: "text-orange-400" },
  { id: "eletrica", label: "Elétrica", icon: Zap, color: "text-yellow-400" },
  { id: "pneu", label: "Pneu", icon: Circle, color: "text-slate-400" },
  { id: "chaveiro", label: "Chaveiro", icon: Key, color: "text-emerald-400" },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user, userData, signIn, signOut } = useAuth();

  // Vitrine de Pedidos State
  const [liveCalls, setLiveCalls] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "serviceCalls"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(5),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const calls = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        setLiveCalls(calls);
      },
      (error) => {
        console.error("Vitrine/Mural listing error:", error);
        handleFirestoreError(error, "list", "serviceCalls");
      },
    );

    return () => unsubscribe();
  }, []);

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

  const handleProfessionalAccess = async () => {
    navigate("/radar");
  };

  const isAnonymousClient = user && userData?.role === "cliente";

  return (
    <SidebarLayout>
      <div className="w-full text-slate-200 overflow-y-auto pb-20 font-sans selection:bg-neon-blue/30 overflow-x-hidden">
        {/* Hero Section */}
        <section className="px-6 pt-12 pb-8 flex flex-col items-center text-center relative max-w-2xl mx-auto">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-cyan-400/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
            Brasília & Região – Online Agora
          </div>

          <Logo size="lg" className="mb-8" showText={true} />

          <h1 className="text-5xl font-black tracking-tighter text-white leading-none mb-2">
            MECÂNICO
            <br />
            <span className="text-neon-blue">EM CASA</span>
          </h1>

          <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 border-b border-slate-700/50 pb-4">
            O Especialista no seu Endereço
          </p>

          <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed mb-10">
            Conectamos você ao mecânico mais próximo em minutos.
          </p>

          <div className="w-full max-w-sm flex flex-col gap-3 z-10">
            <button
              onClick={() =>
                document
                  .getElementById("categorias")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg group"
            >
              <Siren
                size={20}
                className="text-red-400 group-hover:scale-110 transition-transform"
              />
              Preciso de um Mecânico
            </button>

            <button
              onClick={handleProfessionalAccess}
              className="w-full bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/50 text-neon-blue font-black tracking-wide py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all group shadow-[0_0_20px_rgba(0,225,255,0.15)] hover:shadow-[0_0_30px_rgba(0,225,255,0.25)]"
            >
              <Wrench
                size={20}
                className="text-neon-blue group-hover:rotate-12 transition-transform"
              />
              SOU PARCEIRO (VER RADAR)
            </button>
          </div>
        </section>

        {/* LIVE CALLS SHOWCASE (VITRINE) */}
        <section className="py-12 border-y border-neon-blue/20 bg-gradient-to-b from-slate-900/50 to-black/50 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent" />

          <div className="max-w-3xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 text-center sm:text-left gap-4">
              <div>
                <h2 className="text-sm font-bold text-neon-blue tracking-[0.2em] uppercase flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <Flame size={16} className="text-neon-blue animate-pulse" />
                  Oportunidades em Tempo Real
                </h2>
                <p className="text-slate-400 text-xs">
                  Seja rápido, dezenas de mecânicos estão de olho nestes
                  contatos.
                </p>
              </div>
              <button
                onClick={handleProfessionalAccess}
                className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 px-5 py-2.5 rounded-full text-xs font-bold hover:bg-neon-blue hover:text-black transition-all active:scale-95"
              >
                Ver Todas as Chamadas
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {liveCalls.length > 0 ? (
                  liveCalls.map((call, index) => (
                    <motion.div
                      key={call.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[#0B101A] border border-slate-800 p-4 w-full rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-neon-blue/40 transition-colors shadow-lg shadow-black/40 group relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue/30 group-hover:bg-neon-blue transition-colors" />
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
                          <Siren size={16} className="text-red-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-slate-200 capitalize text-sm">
                            {call.serviceRequested}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            {call.vehicle ? `${call.vehicle} • ` : ""}
                            {call.region || "Brasília"}
                          </div>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex shrink-0">
                        <button
                          onClick={handleProfessionalAccess}
                          className="w-full sm:w-auto bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-neon-blue hover:text-black transition-all"
                        >
                          Eu Quero Atender
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-[#0B101A] rounded-2xl border border-slate-800/50">
                    <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse inline-block mb-3" />
                    <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">
                      Aguardando novos chamados...
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* TABS CONSOLIDATED SECTION */}
        <section id="categorias" className="px-6 pt-12 pb-12 max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
              Categorias de Serviço
            </h2>
            <h3 className="text-2xl font-black text-white leading-tight">
              O QUE PRECISAR, A GENTE ENCONTRA
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CATEGORY_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => openForm(tag.id, tag.label, tag.icon)}
                className="bg-[#111827] border border-slate-800 hover:border-slate-600 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all active:scale-[0.98] group shadow-lg"
              >
                <tag.icon
                  size={32}
                  className={`${tag.color} group-hover:scale-110 transition-transform`}
                />
                <span className="font-bold text-slate-200 uppercase tracking-widest text-xs">
                  {tag.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* REQUEST FORM MODAL */}
        {selectedServiceForForm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#070B14]/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[#111827] w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center p-5 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                    Novo Pedido
                  </h2>
                </div>
                <button
                  onClick={closeForm}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto">
                <div className="mb-6 flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-lg text-sm font-semibold text-white">
                  {selectedServiceForForm.icon && (
                    <selectedServiceForForm.icon size={18} />
                  )}
                  {selectedServiceForForm.name}
                </div>

                <form
                  id="requestForm"
                  onSubmit={submitRequest}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Seu Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-[#0A0A0B] border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Seu WhatsApp / Telefone
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ex: (61) 99999-9999"
                      className="w-full bg-[#0A0A0B] border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Veículo
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      placeholder="Ex: VW Polo 2021"
                      className="w-full bg-[#0A0A0B] border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Descreva o Problema
                    </label>
                    <textarea
                      required
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      placeholder="Explique o que está acontecendo com seu veículo..."
                      rows={3}
                      className="w-full bg-[#0A0A0B] border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Sua Região em Brasília
                    </label>
                    <input
                      type="text"
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="Ex: Asa Norte, Taguatinga..."
                      className="w-full bg-[#0A0A0B] border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                    />
                  </div>
                </form>
              </div>

              <div className="p-5 border-t border-slate-800/80 mt-auto">
                <button
                  type="submit"
                  form="requestForm"
                  className="w-full py-4 rounded-xl font-bold bg-neon-blue text-slate-900 border border-transparent hover:bg-transparent hover:border-neon-blue hover:text-neon-blue transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  🚀 Enviar Pedido Agora
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
