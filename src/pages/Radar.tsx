import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  arrayUnion,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, handleFirestoreError } from "../lib/firebase";
import Logo from "../components/Logo";
import {
  Siren,
  CheckCircle,
  ChevronLeft,
  MapPin,
  XCircle,
  LogOut,
  Wrench,
  Truck,
  X,
  Zap,
  Phone,
  AlertCircle,
  MessageCircle,
  QrCode,
  Copy,
  Clock,
  Check,
  RotateCcw,
  User,
  Coins,
  ShieldCheck,
  Search,
  Database,
  UserCheck,
  DollarSign,
  Calendar,
  Flame,
  Sparkles
} from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";

export default function Radar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, signOut, signIn } = useAuth();

  // Dynamic Tabs Synchronized with URL parameters: mural | cadastro | parceiros | creditos | admin
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab") || "mural";

  const setActiveTab = (tab: string) => {
    navigate(`/radar?tab=${tab}`);
  };

  // State Lists
  const [pendingCalls, setPendingCalls] = useState<any[]>([]);
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [partnerUsers, setPartnerUsers] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allSystemCalls, setAllSystemCalls] = useState<any[]>([]);

  // Simulation & Selection States
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedPlanForPix, setSelectedPlanForPix] = useState<{
    name: string;
    price: number;
    credits: number;
    color: string;
  } | null>(null);
  const [pixStatus, setPixStatus] = useState<"pending" | "processing" | "success">("pending");
  const [copiedPix, setCopiedPix] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  // Mechanic Registration Form States
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regWorkshop, setRegWorkshop] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regDescription, setRegDescription] = useState("");
  const [regSpecialties, setRegSpecialties] = useState<string[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile fields from login user
  useEffect(() => {
    if (userData) {
      setRegName(userData.name || "");
      setRegPhone(userData.phone || "");
      setRegWorkshop(userData.workshopName || "Autônomo");
      setRegLocation(userData.location || "Brasília - DF");
      setRegDescription(userData.description || "");
      setRegSpecialties(userData.specialties || ["mecanico"]);
    }
  }, [userData]);

  // Countdown timer for Pix expiration
  useEffect(() => {
    let timer: any;
    if (selectedPlanForPix && pixStatus === "pending") {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(300);
    }
    return () => clearInterval(timer);
  }, [selectedPlanForPix, pixStatus]);

  // Read data streams
  useEffect(() => {
    // 1) Query pending calls securely
    const pendingQuery = query(
      collection(db, "serviceCalls"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribePending = onSnapshot(
      pendingQuery,
      (snapshot) => {
        const pendingDocs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        const filtered = pendingDocs.filter(
          (c) => !c.unlockedBy || !c.unlockedBy.includes(user?.uid)
        );
        setPendingCalls(filtered);
      },
      (error) => {
        console.error("Error watching pending calls:", error);
      }
    );

    // 2) Query my unlocked leads
    let unsubscribeMyLeads = () => {};
    if (user?.uid) {
      const myLeadsQuery = query(
        collection(db, "serviceCalls"),
        where("unlockedBy", "array-contains", user.uid)
      );

      unsubscribeMyLeads = onSnapshot(
        myLeadsQuery,
        (snapshot) => {
          const docs = snapshot.docs
            .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
            .filter((c) => c.status !== "completed" && c.status !== "cancelled");
          setMyLeads(docs);
        },
        (error) => {
          console.error("Error watching unlocked leads:", error);
        }
      );
    } else {
      setMyLeads([]);
    }

    return () => {
      unsubscribePending();
      unsubscribeMyLeads();
    };
  }, [user, userData]);

  // Load partners and transaction logs inside administrative/directory tabs
  useEffect(() => {
    if (!user) return;

    // Fetch partners
    const partnersQuery = query(collection(db, "users"), where("role", "==", "profissional"));
    const unsubscribePartners = onSnapshot(partnersQuery, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPartnerUsers(list);
    });

    // Fetch payments log
    const paymentsQuery = query(collection(db, "payments"), orderBy("timestamp", "desc"));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllPayments(list);
    });

    // Fetch all service calls for administrative dashboard view
    const callsLogQuery = query(collection(db, "serviceCalls"), orderBy("createdAt", "desc"));
    const unsubscribeCalls = onSnapshot(callsLogQuery, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllSystemCalls(list);
    });

    return () => {
      unsubscribePartners();
      unsubscribePayments();
      unsubscribeCalls();
    };
  }, [user]);

  const getDynamicCost = (baseCost: number, unlockCount: number) => {
    if (unlockCount === 0) return baseCost;
    if (unlockCount === 1) return Math.floor(baseCost * 0.8);
    if (unlockCount === 2) return Math.floor(baseCost * 0.6);
    if (unlockCount === 3) return Math.floor(baseCost * 0.4);
    if (unlockCount >= 4) return Math.floor(baseCost * 0.2);
    return baseCost;
  };

  const handleSimulateClientCall = async () => {
    setIsSimulating(true);
    try {
      const mockNames = [
        "Marcos Souza",
        "Ana Julia Lima",
        "Ricardo Silveira",
        "Giselly Martins",
        "Paulo Albuquerque",
        "Breno Medeiros",
      ];
      const mockVehicles = [
        "Chevrolet Onix 2022",
        "Hyundai HB20 2021",
        "VW Polo TSI",
        "Fiat Argo 2020",
        "Honda Civic 2.0",
        "Toyota Corolla Hybrid",
      ];
      const mockRegioes = [
        "Asa Norte (Brasília)",
        "Taguatinga Centro",
        "Águas Claras Sul",
        "Guará II",
        "Sobradinho",
        "Sudoeste / Octogonal",
      ];
      const mockProblems = [
        "Carro parou de funcionar do nada e deu luz de injeção no painel",
        "Pneu furou após passar num buraco de pavimentação perto do shopping",
        "Chave travou totalmente no contato de partida da ignição",
        "Bateria descarregou totalmente, precisa de uma chupeta/carga auxiliar rápida",
        "Vazamento de aditivo/líquido rosa escorrendo muito pelo radiador",
        "Motor começou a falhar cilindro de ignição, perdeu força e treme muito",
      ];
      const mockPhones = [
        "61988451200",
        "61991234567",
        "61982111900",
        "61985554321",
        "61981188822",
        "61999123456",
      ];
      const mockServices = [
        "mecanicos",
        "socorro",
        "guincho",
        "eletrica",
        "pneu",
        "chaveiro",
      ];

      const randIndex = Math.floor(Math.random() * mockNames.length);
      const randService = mockServices[Math.floor(Math.random() * mockServices.length)];

      const randomLat = -15.7942 + (Math.random() - 0.5) * 0.15;
      const randomLng = -47.8822 + (Math.random() - 0.5) * 0.15;
      const randomCost = Math.floor(Math.random() * (220 - 80 + 1) + 80);

      const mockCall = {
        clientId: "simulated_client",
        clientName: mockNames[randIndex],
        clientPhone: mockPhones[randIndex],
        vehicle: mockVehicles[randIndex],
        region: mockRegioes[randIndex],
        problemDescription: mockProblems[randIndex],
        serviceRequested: randService,
        lat: randomLat,
        lng: randomLng,
        status: "pending",
        baseCrCost: randomCost,
        unlockedBy: [],
        createdAt: serverTimestamp(),
      };

      const callsCol = collection(db, "serviceCalls");
      await addDoc(callsCol, mockCall);
      alert("🎉 Sucesso! Um novo chamado de emergência simulado em tempo real foi lançado em Brasília!");
    } catch (err: any) {
      console.error("Simulation error:", err);
      alert("Erro ao simular: " + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleStartPixSimulation = (name: string, price: number, credits: number, color: string) => {
    setSelectedPlanForPix({ name, price, credits, color });
    setPixStatus("pending");
    setCopiedPix(false);
  };

  // Securely confirmed payment records with logged mechanic registration data
  const handleConfirmPixPayment = async () => {
    if (!user || !selectedPlanForPix) return;
    setPixStatus("processing");

    setTimeout(async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const currentCredits = userData?.credits !== undefined ? userData.credits : 0;
        
        // Target dynamic metadata fields
        const finalName = userData?.name || regName || "Mecânico Demo";
        const finalPhone = userData?.phone || regPhone || "(61) 99999-9999";
        const finalWorkshop = userData?.workshopName || regWorkshop || "Autônomo";

        const payload: any = {
          credits: currentCredits + selectedPlanForPix.credits,
        };
        if (selectedPlanForPix.color === "ouro") {
          payload.plan = "ouro";
        }

        const paymentRecord = {
          mechanicId: user.uid,
          mechanicName: finalName,
          mechanicPhone: finalPhone,
          mechanicWorkshop: finalWorkshop,
          planPurchased: selectedPlanForPix.name,
          price: selectedPlanForPix.price,
          creditsAdded: selectedPlanForPix.credits,
          timestamp: serverTimestamp(),
          status: "approved",
        };

        // Update database
        await updateDoc(userRef, payload);
        await addDoc(collection(db, "payments"), paymentRecord);

        setPixStatus("success");
      } catch (err: any) {
        console.error("Erro ao processar simulação de Pix:", err);
        alert("Erro ao confirmar Pix simulado: " + err.message);
        setPixStatus("pending");
      }
    }, 1800);
  };

  const handleUnlockContact = async (call: any) => {
    if (!user || !userData) {
      alert("Crie uma ficha de cadastro ou ative o Modo Mecânico para obter créditos fictícios e liberar chamados.");
      setActiveTab("cadastro");
      return;
    }

    const unlocks = call.unlockedBy ? call.unlockedBy.length : 0;
    if (unlocks >= 5) {
      alert("Este chamado já foi desbloqueado pelo limite máximo de 5 parceiros.");
      return;
    }

    const cost = getDynamicCost(call.baseCrCost || 100, unlocks);

    if (userData.credits < cost) {
      const confirmGo = window.confirm(
        `Saldo insuficiente! Você tem ${userData.credits} CR e este contato requer ${cost} CR.\n\nDeseja abrir a aba de Recargas para gerar um Pix teste agora mesmo?`
      );
      if (confirmGo) {
        setActiveTab("creditos");
      }
      return;
    }

    try {
      const callRef = doc(db, "serviceCalls", call.id);
      const userRef = doc(db, "users", user.uid);

      await updateDoc(callRef, {
        unlockedBy: arrayUnion(user.uid),
      });

      await updateDoc(userRef, {
        credits: userData.credits - cost,
      });

      const cleanPhone = (call.clientPhone || "").replace(/\D/g, "");
      let formattedPhone = cleanPhone;
      if (
        (formattedPhone.length === 10 || formattedPhone.length === 11) &&
        !formattedPhone.startsWith("55")
      ) {
        formattedPhone = "55" + formattedPhone;
      }

      const tipoServico =
        call.serviceRequested === "mecanicos" ? "mecânica geral"
        : call.serviceRequested === "socorro" ? "socorro rápido"
        : call.serviceRequested === "guincho" ? "guincho"
        : call.serviceRequested === "eletrica" ? "auto elétrica"
        : call.serviceRequested === "pneu" ? "borracharia"
        : call.serviceRequested === "chaveiro" ? "chaveiro"
        : call.serviceRequested;

      const messageText = encodeURIComponent(
        `Olá ${call.clientName || "Cliente"}, sou parceiro no Mecânico em Casa de Brasília. Vi seu chamado de ${tipoServico} para o seu ${call.vehicle || "veículo"} em ${call.region || "Geral"}. Estou disponível para te atender, podemos conversar por aqui?`
      );

      const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${messageText}`;
      
      try {
        window.open(waUrl, "_blank");
      } catch (err) {
        console.warn("Bloqueador de popup impediu abrir automaticamente.", err);
      }

      alert(
        `✅ Sucesso! O contato de ${call.clientName || "Cliente"} foi liberado!\n\nSe a janela do WhatsApp de envio direto não houver aberto por bloqueio de pop-up, clique no botão verde "Falar no WhatsApp" que apareceu na área de "Contatos Liberados" para conversar direto.`
      );
    } catch (err: any) {
      console.error("Erro ao aceitar:", err);
      alert("Erro ao liberar chamado de socorro.");
    }
  };

  const handleCompleteCall = async (leadId: string) => {
    try {
      const callRef = doc(db, "serviceCalls", leadId);
      await updateDoc(callRef, { status: "completed" });
      alert("✅ Excelente trabalho! Pedido marcado como fechado e concluído.");
    } catch (err) {
      console.error("Erro ao finalizar:", err);
    }
  };

  const handleCancelCall = async (leadId: string) => {
    try {
      const callRef = doc(db, "serviceCalls", leadId);
      const leadInfo = myLeads.find((l) => l.id === leadId);
      if (leadInfo) {
        await updateDoc(callRef, {
          unlockedBy: (leadInfo.unlockedBy || []).filter((id: string) => id !== user?.uid),
        });
      }
    } catch (err) {
      console.error("Erro ao remover:", err);
    }
  };

  const handleSaveProfileForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Faça login antes de salvar as informações.");
      return;
    }
    setIsSavingProfile(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: regName,
        phone: regPhone,
        workshopName: regWorkshop,
        location: regLocation,
        description: regDescription,
        specialties: regSpecialties,
      });
      alert("✅ Informações salvas com sucesso! Você agora é um parceiro visível no sistema.");
    } catch (err: any) {
      console.error("Erro ao atualizar cadastro:", err);
      alert("Erro ao salvar cadastro: " + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleSpecialtyCheckbox = (spec: string) => {
    setRegSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  return (
    <SidebarLayout onOpenCredits={() => setActiveTab("creditos")}>
      <div className="w-full text-slate-200 flex flex-col p-4 sm:p-6 pb-24 overflow-y-auto overflow-x-hidden min-h-screen">
        
        {/* Banner Bridge Toggle for Anon Demo */}
        {(!user || userData?.role !== "profissional") && (
          <div className="mb-6 p-5 rounded-3xl bg-gradient-to-r from-yellow-500/10 to-amber-500/15 border border-yellow-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-yellow-500/20 rounded-2xl mt-0.5">
                <Wrench className="text-yellow-400" size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  ⚠️ MODO MECÂNICO DESATIVADO
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                  Para conferir pedidos reais, cadastrar-se como parceiro na lista e testar recargas de saldo de créditos fictícios, ative a simulação profissional instantânea abaixo.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await signIn("profissional", true);
                  alert("Sucesso! Entrou instantaneamente com 1.000 créditos fictícios para testes rápidos.");
                } catch (e: any) {
                  alert("Erro ao entrar: " + e.message);
                }
              }}
              className="w-full lg:w-auto px-5 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.35)] flex items-center justify-center gap-1.5 shrink-0 uppercase tracking-wider"
            >
              <Zap size={14} className="fill-slate-950" />
              Ativar Modo Mecânico de Teste
            </button>
          </div>
        )}

        {/* Dynamic Navigation Indicator Tabs at Top */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("mural")}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === "mural" ? "bg-slate-800 text-white border border-[#39ff14]/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Flame size={14} className={activeTab === "mural" ? "text-[#39ff14]" : ""} />
            Mural de Oportunidades
          </button>

          <button
            onClick={() => setActiveTab("cadastro")}
            className={`flex-1 min-w-[125px] px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === "cadastro" ? "bg-slate-800 text-white border border-yellow-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <User size={14} className={activeTab === "cadastro" ? "text-yellow-400" : ""} />
            Minha Ficha (Cadastro)
          </button>

          <button
            onClick={() => setActiveTab("parceiros")}
            className={`flex-1 min-w-[125px] px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === "parceiros" ? "bg-slate-800 text-white border border-cyan-400/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={14} className={activeTab === "parceiros" ? "text-cyan-450" : ""} />
            Parceiros Cadastrados
          </button>

          <button
            onClick={() => setActiveTab("creditos")}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === "creditos" ? "bg-slate-800 text-white border border-amber-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <Coins size={14} className={activeTab === "creditos" ? "text-amber-400" : ""} />
            Comprar Créditos
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              activeTab === "admin" ? "bg-slate-800 text-white border border-red-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={14} className={activeTab === "admin" ? "text-red-400" : ""} />
            Meu Painel (Admin)
          </button>
        </div>

        {/* TAB WORKSPACE */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: MURAL DE CHAMADOS (OPORTUNIDADES) */}
          {activeTab === "mural" && (
            <motion.div
              key="mural"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Mural Header Card */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
                <div>
                  <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#39ff14] rounded-full animate-pulse" />
                    Oportunidades em Brasília
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Visualize chamados recentes em tempo real, libere o WhatsApp do cliente e obtenha serviços diretos.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
                  <button
                    onClick={handleSimulateClientCall}
                    disabled={isSimulating}
                    className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/30 transition active:scale-95 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Siren size={14} className="animate-pulse" />
                    {isSimulating ? "Simulando Chamado..." : "Simular Chamado"}
                  </button>
                  <button
                    onClick={() => setActiveTab("creditos")}
                    className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition hover:brightness-110"
                  >
                    <Coins size={14} />
                    Adquirir Créditos
                  </button>
                </div>
              </div>

              {/* Contatos Liberados / Unlocked Contacts List */}
              {myLeads && myLeads.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-500/10 rounded-lg">
                      <CheckCircle size={18} className="text-green-400" />
                    </div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wide">
                      Contatos que você liberou
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myLeads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layoutId={`lead-${lead.id}`}
                        className="bg-slate-900/90 border border-green-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-450 to-green-500" />
                        
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {lead.serviceRequested}
                            </span>
                            <h3 className="text-base font-black text-white mt-2 capitalize flex items-center gap-1.5">
                              {lead.clientName || "Cliente"}
                            </h3>
                          </div>
                          <a
                            href={`https://wa.me/${(lead.clientPhone || "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-[#25D366] hover:text-slate-950 transition"
                            title="Conversar direto no WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </a>
                        </div>

                        <ul className="text-xs text-slate-350 space-y-2 mb-4 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
                          <li className="flex items-center gap-2">
                            <MapPin size={13} className="text-slate-500" />
                            <span><b>Região:</b> {lead.region || "Não disponível"}</span>
                          </li>
                          {lead.vehicle && (
                            <li className="flex items-center gap-2">
                              <Truck size={13} className="text-slate-500" />
                              <span><b>Carro:</b> {lead.vehicle}</span>
                            </li>
                          )}
                          {lead.problemDescription && (
                            <li className="flex-col items-start gap-1 pt-1.5 border-t border-slate-800 block">
                              <span className="text-slate-500 block font-semibold mb-0.5">Problema Relatado:</span>
                              <p className="text-slate-300 italic mb-1">"{lead.problemDescription}"</p>
                            </li>
                          )}
                        </ul>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancelCall(lead.id)}
                            className="flex-1 bg-slate-850 hover:bg-slate-805 text-slate-400 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800 transition"
                          >
                            <XCircle size={14} />
                            Descartar
                          </button>
                          <button
                            onClick={() => handleCompleteCall(lead.id)}
                            className="flex-1 bg-green-500 hover:bg-green-400 text-slate-950 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition shadow-[0_0_10px_rgba(34,197,94,0.25)]"
                          >
                            <CheckCircle size={14} />
                            Fechado
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Oportunidades Pendentes / Pending Call Feed */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white uppercase tracking-wide">
                    Feed de Emergências (Disponíveis)
                  </h2>
                  <span className="text-xs text-[#39ff14] font-bold bg-[#39ff14]/10 px-2.5 py-1 rounded-full animate-pulse">
                    MURAL ATIVO ({pendingCalls.length})
                  </span>
                </div>

                {pendingCalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 p-10 rounded-3xl border border-slate-800 text-slate-500 text-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#00f3ff]/15 rounded-full blur-xl animate-ping" />
                      <div className="bg-slate-800 p-4 rounded-full relative z-10">
                        <Siren size={36} className="text-slate-600 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400 text-sm">Nenhum chamado de socorro aguardando liberação no momento.</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Tente simular um chamado de cliente clicando no botão acima para alimentar o mural de teste!</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingCalls.map((call) => {
                      const cost = getDynamicCost(call.baseCrCost || 100, call.unlockedBy ? call.unlockedBy.length : 0);
                      return (
                        <motion.div
                          key={call.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <span className="text-[10px] font-black uppercase bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20 px-2.5 py-1 rounded-full tracking-wide">
                                {call.serviceRequested === "mecanicos" ? "Mecânica Geral"
                                 : call.serviceRequested === "socorro" ? "Socorro Rápido"
                                 : call.serviceRequested === "guincho" ? "Guincho/Reboque"
                                 : call.serviceRequested === "eletrica" ? "Auto Elétrica"
                                 : call.serviceRequested === "pneu" ? "Troca de Pneu"
                                 : call.serviceRequested === "chaveiro" ? "Chaveiro"
                                 : call.serviceRequested}
                              </span>
                              <span className="text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-full">
                                Urgente
                              </span>
                            </div>

                            <h3 className="text-base font-black text-white mb-2">
                              {call.clientName || "Novo Chamado"} 
                            </h3>

                            <div className="space-y-1.5 text-xs text-slate-400 bg-black/30 p-3 rounded-2xl border border-slate-850/60 mb-4">
                              <p className="flex items-center gap-2">
                                <MapPin size={13} className="text-slate-500 shrink-0" />
                                <span className="truncate"><b>Localização:</b> {call.region || "Brasília - DF"}</span>
                              </p>
                              {call.vehicle && (
                                <p className="flex items-center gap-2">
                                  <Truck size={13} className="text-slate-500 shrink-0" />
                                  <span><b>Veículo:</b> {call.vehicle}</span>
                                </p>
                              )}
                              {call.problemDescription && (
                                <p className="text-slate-300 italic pt-1 border-t border-slate-850 mt-1">
                                  "{call.problemDescription}"
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleUnlockContact(call)}
                            className="w-full bg-[#39ff14] text-slate-950 font-black py-3 rounded-2xl hover:bg-[#2adb10] active:scale-95 transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.15)] text-xs uppercase"
                          >
                            <Zap size={14} className="fill-slate-950" />
                            Liberar WhatsApp ({cost} CR)
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: FICHA DE CADASTRO DO MECÂNICO/PARCEIRO */}
          {activeTab === "cadastro" && (
            <motion.div
              key="cadastro"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 to-amber-500" />
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-2xl border border-yellow-500/20">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Ficha Cadastral do Mecânico</h2>
                    <p className="text-xs text-slate-450 mt-0.5">As informações registradas aqui serão listadas no diretório geral de parceiros.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfileForm} className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nome Completo do Mecânico</label>
                    <input
                      required
                      type="text"
                      className="bg-slate-950 rounded-xl py-3 px-4 text-xs font-medium border border-slate-800 text-white outline-none focus:border-yellow-400/60 transition"
                      placeholder="Ex: João da Silva Santos"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nome Comercial / Oficina</label>
                    <input
                      required
                      type="text"
                      className="bg-slate-950 rounded-xl py-3 px-4 text-xs font-medium border border-slate-800 text-white outline-none focus:border-yellow-400/60 transition"
                      placeholder="Ex: Oficina Mecânica Estrela ou Autônomo"
                      value={regWorkshop}
                      onChange={(e) => setRegWorkshop(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider">WhatsApp de Contato</label>
                      <input
                        required
                        type="text"
                        className="bg-slate-950 rounded-xl py-3 px-4 text-xs font-medium border border-slate-800 text-white outline-none focus:border-yellow-400/60 transition font-mono"
                        placeholder="Ex: 5561999999999"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Cidade / Região Atendida</label>
                      <input
                        required
                        type="text"
                        className="bg-slate-950 rounded-xl py-3 px-4 text-xs font-medium border border-slate-800 text-white outline-none focus:border-yellow-400/60 transition"
                        placeholder="Ex: Taguatinga e Águas Claras"
                        value={regLocation}
                        onChange={(e) => setRegLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">Especialidades Mecânicas Atendidas</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "mecanicos", name: "Mecânica Geral" },
                        { id: "socorro", name: "Socorro Rápido" },
                        { id: "guincho", name: "Guincho & Reboque" },
                        { id: "eletrica", name: "Auto Elétrica" },
                        { id: "pneu", name: "Borracharia / Pneu" },
                        { id: "chaveiro", name: "Chaveiro Automotivo" },
                      ].map((spec) => {
                        const active = regSpecialties.includes(spec.id);
                        return (
                          <button
                            type="button"
                            key={spec.id}
                            onClick={() => toggleSpecialtyCheckbox(spec.id)}
                            className={`p-3 rounded-xl border text-xs font-semibold text-left transition ${
                              active
                                ? "bg-yellow-400/10 border-yellow-400 text-yellow-400"
                                : "bg-slate-950 border-slate-800 text-slate-400"
                            }`}
                          >
                            {spec.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Breve Apresentação Profissional</label>
                    <textarea
                      rows={3}
                      className="bg-slate-950 rounded-xl py-3 px-4 text-xs font-medium border border-slate-800 text-white outline-none focus:border-yellow-400/60 transition resize-none"
                      placeholder="Fale um pouco da sua experiência com automóveis..."
                      value={regDescription}
                      onChange={(e) => setRegDescription(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full mt-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50"
                  >
                    {isSavingProfile ? "Salvando informações..." : "Salvar Ficha de Cadastro"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 3: LISTA DE PARCEIROS (MECÂNICOS PARCEIROS) */}
          {activeTab === "parceiros" && (
            <motion.div
              key="parceiros"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-805/80 flex justify-between items-center flex-wrap gap-4 backdrop-blur">
                <div>
                  <h1 className="text-lg font-black text-white uppercase tracking-tight">Profissionais e Mecânicos Credenciados</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Veja a lista de mecânicos e parceiros que integram a nossa frota de socorros.</p>
                </div>
                <button
                  onClick={() => setActiveTab("cadastro")}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-xs"
                >
                  Ficha de Cadastro +
                </button>
              </div>

              {partnerUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-900/30 text-center text-slate-500 border border-slate-800 rounded-3xl">
                  <User size={30} className="mb-2 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-400">Nenhum mecânico cadastrado no banco de dados.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">Crie uma ficha cadastral na aba do lado para se cadastrar e figurar na pesquisa pública!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partnerUsers.map((partner) => (
                    <div
                      key={partner.id}
                      className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-slate-800 border border-slate-700/80 rounded-full flex items-center justify-center text-slate-300 font-black capitalize text-sm">
                            {(partner.name || "M").slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white capitalize leading-snug">{partner.name || "Parceiro Anônimo"}</h4>
                            <p className="text-[11px] text-slate-400">{partner.workshopName || "Profissional Autônomo"}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <MapPin size={12} className="text-slate-500" />
                            <span>Atende em: <b className="text-slate-200">{partner.location || "Brasília - DF"}</b></span>
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <Coins size={12} className="text-slate-500" />
                            <span>Saldo Restante: <b className="text-white">{partner.credits || 0} CR</b></span>
                          </p>
                          {partner.specialties && partner.specialties.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-1">
                              {partner.specialties.map((spec: string) => (
                                <span key={spec} className="text-[9px] font-bold bg-slate-800 border border-slate-700 text-slate-350 px-2.5 py-0.5 rounded-full uppercase">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {partner.description && (
                          <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl italic border border-slate-800 mb-4">
                            "{partner.description}"
                          </p>
                        )}
                      </div>

                      {partner.phone && (
                        <a
                          href={`https://wa.me/${partner.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-[#25D366] hover:bg-[#1eba5c] text-slate-950 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
                        >
                          <MessageCircle size={14} className="fill-slate-950" />
                          WhatsApp Contato
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: COMPRAR CRÉDITOS (AQUISIÇÃO / RECARGA FISCAL PIX) */}
          {activeTab === "creditos" && (
            <motion.div
              key="creditos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {selectedPlanForPix ? (
                // CHECKOUT PROCESS
                <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-500 animate-pulse" />
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-800 select-none">
                    <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                      <QrCode size={18} className="text-[#39ff14]" />
                      Simulador de Pix Automatizado
                    </h3>
                    <button
                      onClick={() => setSelectedPlanForPix(null)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {pixStatus === "pending" && (
                    <div className="space-y-5 text-center pt-4">
                      {/* Plan details info banner */}
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex justify-between items-center text-left">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Item</span>
                          <span className="text-xs font-black text-white uppercase">{selectedPlanForPix.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Preço</span>
                          <span className="text-xs font-black text-[#39ff14]">R$ {selectedPlanForPix.price.toFixed(2).replace(".", ",")}</span>
                        </div>
                      </div>

                      {/* QR Code graphics */}
                      <div className="bg-white p-3.5 rounded-3xl w-40 h-40 mx-auto flex items-center justify-center border border-slate-350 relative shadow-lg">
                        <QrCode size={135} className="text-slate-950" />
                        <span className="absolute bg-[#39ff14] text-slate-950 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-white">PIX</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-black text-yellow-500 flex items-center justify-center gap-1">
                          <Clock size={12} className="animate-spin" />
                          Aguardando confirmação do Pix simulado...
                        </p>
                        <p className="text-[11px] text-slate-450 leading-relaxed max-w-xs mx-auto">
                          Escaneie a imagem ou simule o webhook de pagamento instantâneo clicando no botão verde de recebimento automático abaixo.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={handleConfirmPixPayment}
                          className="w-full bg-[#39ff14] text-slate-950 font-black py-3.5 rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.3)] transition hover:bg-[#2ae010] active:scale-95 text-xs text-center uppercase tracking-wider"
                        >
                          ⚡ Simular Confirmação e Crédito instantâneo
                        </button>
                        <button
                          onClick={() => setSelectedPlanForPix(null)}
                          className="text-xs text-slate-500 hover:text-slate-400 font-semibold underline"
                        >
                          Voltar para os planos
                        </button>
                      </div>
                    </div>
                  )}

                  {pixStatus === "processing" && (
                    <div className="text-center py-10 space-y-4">
                      <div className="w-12 h-12 border-4 border-slate-800 border-t-[#39ff14] rounded-full animate-spin mx-auto" />
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Verificando recebimento...</h4>
                        <p className="text-[11px] text-slate-450 max-w-xs mx-auto mt-1 leading-relaxed">
                          Emitindo comprovante financeiro e creditando de forma segura as moedas do radar à banca do mecânico.
                        </p>
                      </div>
                    </div>
                  )}

                  {pixStatus === "success" && (
                    <div className="text-center py-6 space-y-4 text-slate-100">
                      <div className="w-14 h-14 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full flex items-center justify-center mx-auto shadow-md">
                        <Check size={28} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white uppercase tracking-tight">Recarga Confirmada</h4>
                        <p className="text-[11px] text-slate-400 mt-1 px-4 leading-relaxed">
                          O Pix simulado de <b>R$ {selectedPlanForPix.price.toFixed(2).replace(".", ",")}</b> foi processado com sucesso! Seus créditos extras de <b className="text-[#39ff14]">+{selectedPlanForPix.credits} CR</b> foram agregados de forma definitiva à sua conta.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPlanForPix(null);
                          setActiveTab("mural");
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-750 text-white font-bold py-3.5 rounded-xl text-xs uppercase transition tracking-wider"
                      >
                        Excelente! Retornar ao Mural de Oportunidades 🚀
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // PLAN LIST SELECTION
                <div className="space-y-6">
                  <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-808/80 flex items-center justify-between flex-wrap gap-4 backdrop-blur-md">
                    <div>
                      <h1 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        Planos de Crédito & Parceria
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">
                        Cada contato de cliente requer créditos para ser liberado. Recarregue no simulador para testar.
                      </p>
                    </div>
                    {user && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-450 font-black uppercase">Seu Saldo</p>
                        <p className="text-lg font-black text-amber-400">{userData?.credits !== undefined ? userData.credits : 0} CR</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Plano 1: Bronze */}
                    <div className="bg-[#cd7f32]/5 border border-[#cd7f32]/35 rounded-3xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-[#cd7f32] transition">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black uppercase bg-[#cd7f32]/20 text-[#dd8e43] border border-[#cd7f32]/40 px-2.5 py-1 rounded-full">
                            Bronze
                          </span>
                          <span className="text-base font-black text-white">R$ 159,00</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-100 uppercase tracking-tight">1.200 CR</h4>
                        <p className="text-[11px] text-slate-400 py-3 border-t border-slate-800/60 mt-3 leading-relaxed">
                          Receba 1.200 créditos fictícios para usar no radar de socorro rápido de Brasília. Permite liberar aproximadamente 10 contatos diretos.
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartPixSimulation("Plano Bronze", 159, 1200, "bronze")}
                        className="w-full mt-4 bg-[#cd7f32] hover:bg-[#dd8e43] text-white text-xs font-black py-3 rounded-xl transition"
                      >
                        Comprar Bronze (Pix)
                      </button>
                    </div>

                    {/* Plano 2: Prata */}
                    <div className="bg-slate-300/5 border border-slate-300/35 rounded-3xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-slate-3D0 transition">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black uppercase bg-slate-300/20 text-slate-200 border border-slate-300/40 px-2.5 py-1 rounded-full">
                            Prata
                          </span>
                          <span className="text-base font-black text-white">R$ 359,00</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-100 uppercase tracking-tight">3.500 CR</h4>
                        <p className="text-[11px] text-slate-400 py-3 border-t border-slate-800/60 mt-3 leading-relaxed">
                          Receba 3.500 créditos fictícios na carteira de parceiro. É a melhor opção intermediária para mecânicos ou auto elétricas de médio fluxo.
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartPixSimulation("Plano Prata", 359, 3500, "prata")}
                        className="w-full mt-4 bg-slate-300 hover:bg-white text-slate-950 text-xs font-black py-3 rounded-xl transition"
                      >
                        Comprar Prata (Pix)
                      </button>
                    </div>

                    {/* Plano 3: Ouro */}
                    <div className="bg-yellow-550/5 border border-yellow-450/45 rounded-3xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-yellow-400 transition bg-yellow-400/5">
                      <div className="absolute top-0 right-0 py-1 px-3 bg-yellow-450 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-bl-3xl">RECOMENDADO</div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-3 pt-2">
                          <span className="text-[10px] font-black uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-450/30 px-2.5 py-1 rounded-full">
                            Ouro VIP
                          </span>
                          <span className="text-base font-black text-yellow-400">R$ 749,00</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-100 uppercase tracking-tight">5.000 CR</h4>
                        <p className="text-[11px] text-slate-400 py-3 border-t border-slate-800/40 mt-3 leading-relaxed">
                          Receba 5.000 créditos fictícios com prioridade nas notificações do radar de leads. Destinado a empresas consolidadas de guinchos e oficinas de alta performance.
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartPixSimulation("Plano Ouro", 749, 5000, "ouro")}
                        className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-xs font-black py-3.5 rounded-xl transition hover:brightness-110 shadow-lg shadow-yellow-500/10"
                      >
                        Adquirir Ouro (Pix)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: MEU PAINEL (ADMINISTRATIVO / FINANCEIRO) */}
          {activeTab === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Bento Grid Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat 1: Total Partners */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-yellow-400/10 text-yellow-400 border border-yellow-450/20 rounded-2xl">
                    <Wrench size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-450 block">Mecânicos Cadastrados</span>
                    <span className="text-2xl font-black text-white">{partnerUsers.length}</span>
                  </div>
                </div>

                {/* Stat 2: Total Payments Approved */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/20 rounded-2xl">
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-450 block">Pagamentos Confirmados</span>
                    <span className="text-2xl font-black text-white">{allPayments.length}</span>
                  </div>
                </div>

                {/* Stat 3: Total Credits Revenue */}
                <div className="bg-slate-900 border border-slate-805 rounded-3xl p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-cyan-400/10 text-cyan-450 border border-cyan-400/25 rounded-2xl">
                    <Coins size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-450 block">Créditos Lançados</span>
                    <span className="text-2xl font-black text-white">
                      {allPayments.reduce((acc, pay) => acc + (pay.creditsAdded || 0), 0).toLocaleString()} CR
                    </span>
                  </div>
                </div>

                {/* Stat 4: Cash volume Simulated */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
                  <div className="p-3.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-2xl">
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-450 block">Receitas Simuladas</span>
                    <span className="text-2xl font-black text-[#39ff14]">
                      R$ {allPayments.reduce((acc, pay) => acc + (pay.price || 0), 0).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payments History Table: "saber quem foi o mecânico que fez o pagamento e chegar pro meu painel isso" */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850">
                  <Database size={18} className="text-[#39ff14]" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Histórico Geral de Recargas Pix</h3>
                </div>

                {allPayments.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <p className="text-xs font-semibold">Nenhuma transação simulação registrada ainda.</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Faça uma compra teste na aba de Créditos para ver esse histórico atualizar ao vivo!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-450 uppercase tracking-wider border-b border-slate-850">
                          <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Mecânico / Parceiro</th>
                          <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Oficina</th>
                          <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Plano Escolhido</th>
                          <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Créditos Adicionados</th>
                          <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Valor Pago</th>
                          <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {allPayments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-950/40 transition">
                            <td className="py-3.5 px-3 font-bold text-white capitalize">{pay.mechanicName || "Anônimo"}</td>
                            <td className="py-3.5 px-3 text-slate-350">{pay.mechanicWorkshop || "Autônomo"}</td>
                            <td className="py-3.5 px-3 font-medium">
                              <span className="text-[10px] font-bold text-slate-200 border border-slate-750 bg-slate-850 px-2.5 py-1 rounded-full uppercase">
                                {pay.planPurchased}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-amber-400 font-bold whitespace-nowrap">+{pay.creditsAdded || 0} CR</td>
                            <td className="py-3.5 px-3 font-bold text-[#39ff14] whitespace-nowrap">R$ {parseFloat(pay.price || 0).toFixed(2).replace(".", ",")}</td>
                            <td className="py-3.5 px-3">
                              <span className="text-[9px] font-black uppercase text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded">
                                {pay.status || "approved"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Users and Credit balances list */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850">
                  <UserCheck size={18} className="text-yellow-405 text-yellow-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Mecânicos e Saldo de Créditos Correntes</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-450 uppercase tracking-wider border-b border-slate-850">
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Mecânico</th>
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">WhatsApp</th>
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Plano no Perfil</th>
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Saldo de Créditos (Realtime)</th>
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Região Atendida</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {partnerUsers.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-950/40 transition">
                          <td className="py-3 px-3 font-bold text-white capitalize leading-snug">
                            {p.name || "Incompleto"}
                            <span className="text-[9px] font-medium text-slate-500 block">{p.workshopName || "Autônomo"}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-350">{p.phone || "Não cadastrado"}</td>
                          <td className="py-3 px-3 capitalize">
                            <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700/50">
                              {p.plan || "bronze"}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-amber-500 text-sm">{p.credits !== undefined ? p.credits : 1000} CR</td>
                          <td className="py-3 px-3 text-slate-400">{p.location || "Brasília - DF"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System Calls list */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850">
                  <Siren size={18} className="text-red-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Histórico de Todos os Chamados Registrados</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-450 uppercase tracking-wider border-b border-slate-850">
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Cliente</th>
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Telefone</th>
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Serviço / Carro</th>
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Região</th>
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Status do Chamado</th>
                        <th className="py-3 px-3 font-semibold pb-2 text-[10px]">Desbloqueado por (Contagem)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {allSystemCalls.map((call) => (
                        <tr key={call.id} className="hover:bg-slate-950/40 transition">
                          <td className="py-3 px-3 font-bold text-white leading-snug">
                            {call.clientName || "Cliente Simulado"}
                            <span className="text-[9px] font-medium text-slate-500 block truncate max-w-[150px]">{call.problemDescription || "Pane geral"}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-350">{call.clientPhone || "Incompleto"}</td>
                          <td className="py-3 px-3 leading-snug">
                            <span className="font-bold text-white capitalize block">{call.serviceRequested}</span>
                            <span className="text-[10px] text-slate-450 block">{call.vehicle || "Geral"}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-400">{call.region || "Geral"}</td>
                          <td className="py-3 px-3">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                              call.status === "pending" ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10"
                              : call.status === "completed" ? "text-green-400 border-green-500/20 bg-green-500/10"
                              : "text-slate-450 border-slate-700/20 bg-slate-900"
                            }`}>
                              {call.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-300">{(call.unlockedBy || []).length} Parceiros</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  );
}
