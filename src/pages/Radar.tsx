import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, arrayUnion } from "firebase/firestore";
import { db, handleFirestoreError } from "../lib/firebase"; 
import Logo from "../components/Logo";
import { Siren, CheckCircle, ChevronLeft, MapPin, XCircle, LogOut, Wrench, Truck, X, Zap } from "lucide-react";
import SidebarLayout from "../components/SidebarLayout";

export default function Radar() {
  const navigate = useNavigate();
  const { user, userData, signOut, signIn } = useAuth();
  const [pendingCalls, setPendingCalls] = useState<any[]>([]);
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  // Redirect logic removed to let anyone view the radar.

  useEffect(() => {
    // 1) Query pending calls securely: status == pending allows unauth or auth listing.
    const pendingQuery = query(
      collection(db, "serviceCalls"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const pendingDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Filter out calls that the current professional has already unlocked
      const filtered = pendingDocs.filter(c => !c.unlockedBy || !c.unlockedBy.includes(user?.uid));
      setPendingCalls(filtered);
    }, (error) => {
      console.error("Error watching pending calls:", error);
      handleFirestoreError(error, "list", "serviceCalls");
    });

    // 2) Query my unlocked leads securely: unlockedBy contains my uid. Only if user is logged in.
    let unsubscribeMyLeads = () => {};

    if (user?.uid) {
      const myLeadsQuery = query(
        collection(db, "serviceCalls"),
        where("unlockedBy", "array-contains", user.uid)
      );

      unsubscribeMyLeads = onSnapshot(myLeadsQuery, (snapshot) => {
        const docs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() as any }))
          .filter(c => c.status !== "completed" && c.status !== "cancelled");
        setMyLeads(docs);
      }, (error) => {
        console.error("Error watching unlocked leads:", error);
        handleFirestoreError(error, "list", "serviceCalls");
      });
    } else {
      setMyLeads([]);
    }

    return () => {
      unsubscribePending();
      unsubscribeMyLeads();
    };
  }, [user, userData]);

  const getDynamicCost = (baseCost: number, unlockCount: number) => {
    if (unlockCount === 0) return baseCost;
    if (unlockCount === 1) return Math.floor(baseCost * 0.8);
    if (unlockCount === 2) return Math.floor(baseCost * 0.6);
    if (unlockCount === 3) return Math.floor(baseCost * 0.4);
    if (unlockCount >= 4) return Math.floor(baseCost * 0.2);
    return baseCost;
  };

  const handleUnlockContact = async (call: any) => {
    // Se for guest, pede login
    if (!user || !userData) {
       alert("Cadastre-se ou entre na sua conta de mecânico para adquirir créditos e receber contatos.");
       // Ideally we could open the credits modal or redirect to a register page. Let's redirect to a register prompt.
       setShowCreditsModal(true);
       return;
    }

    const unlocks = call.unlockedBy ? call.unlockedBy.length : 0;
    
    if (unlocks >= 5) {
      alert("Este chamado já foi desbloqueado pelo limite máximo de 5 mecânicos.");
      return;
    }

    const cost = getDynamicCost(call.baseCrCost || 100, unlocks);

    if (userData.credits < cost) {
      alert(`Você tem ${userData.credits} créditos. Este chamado custa ${cost} créditos para liberar.`);
      setShowCreditsModal(true);
      return;
    }

    try {
      const callRef = doc(db, "serviceCalls", call.id);
      const userRef = doc(db, "users", user!.uid);

      await updateDoc(callRef, {
        unlockedBy: arrayUnion(user?.uid)
        // Note: we don't change status to 'accepted' until they physically say 'I am fixing this' or we leave it as lead. Let's leave it as 'pending' so others can buy.
      });
      
      await updateDoc(userRef, {
        credits: userData.credits - cost
      });

      alert("Contato liberado! O cliente agora ligará para você, ou veja no chamado.");
    } catch (err: any) {
      console.error("Erro ao aceitar:", err);
      alert("Houve um erro ao liberar o chamado.");
    }
  };

  const handleCompleteCall = async (leadId: string) => {
    try {
      const callRef = doc(db, "serviceCalls", leadId);
      await updateDoc(callRef, {
        status: "completed"
      });
      alert("Sucesso! Negócio marcado como fechado/concluído.");
    } catch (err) {
      console.error("Erro ao finalizar:", err);
      alert("Erro ao remover chamado da lista.");
    }
  };

  const handleCancelCall = async (leadId: string) => {
     if(!window.confirm("Certeza que deseja remover este contato da sua lista?")) return;
    try {
      const callRef = doc(db, "serviceCalls", leadId);
      // Optional: Just mark as 'ignored' for this user or actually modify status.
      // For lead board, we probably shouldn't cancel it for EVERYONE. But since it's a demo... Let's just remove my ID from unlockedBy to drop it.
      const leadInfo = myLeads.find(l => l.id === leadId);
      if(leadInfo) {
         await updateDoc(callRef, {
            unlockedBy: (leadInfo.unlockedBy || []).filter((id: string) => id !== user?.uid)
         });
      }
    } catch (err) {
      console.error("Erro ao remover:", err);
      alert("Erro ao tirar chamado da lista.");
    }
  };

  // Removal of the professional block screen. Guests can see the UI now.

  return (
    <SidebarLayout onOpenCredits={() => setShowCreditsModal(true)}>
      <div className="w-full text-slate-200 flex flex-col p-4 sm:p-6 pb-24 overflow-y-auto overflow-x-hidden">
        
        {/* Helper bridge to open credits from sidebar */}
        <button id="open-credits-btn" onClick={() => setShowCreditsModal(true)} className="hidden" />

        {/* Dynamic Mural header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-slate-900/60 p-5 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
           <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#39ff14] rounded-full animate-pulse" />
                Mural de Oportunidades
              </h1>
              <p className="text-xs text-slate-400 mt-1">Desbloqueie os contatos dos clientes de Brasília e feche serviços diretos.</p>
           </div>
           
           <button 
             onClick={() => setShowCreditsModal(true)}
             className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 transition hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5"
           >
              <Zap size={14} className="fill-slate-950" />
              Adquirir Créditos
           </button>
        </div>

        {/* Main Content */}
        <main className="relative z-10 w-full">
        
        {myLeads && myLeads.length > 0 && (
          <div className="mb-10 space-y-4">
             <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                   <CheckCircle size={20} className="text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Contatos Liberados</h2>
             </div>
             {myLeads.map(lead => (
               <motion.div 
                 key={lead.id}
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-slate-900/80 border border-green-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
               >
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500" />
                 
                 <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-green-500/20 rounded-2xl">
                       <Siren size={32} className="text-green-400" />
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-white mb-1 capitalize">{lead.serviceRequested}</h3>
                       <p className="text-sm text-slate-400">{lead.clientName || 'Cliente'}</p>
                     </div>
                   </div>
                   <div className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                     Liberado
                   </div>
                 </div>
     
                 <div className="space-y-4 mb-8">
                   <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-2">
                      <div className="flex items-start gap-4">
                        <div className="mt-1"><MapPin size={20} className="text-slate-400" /></div>
                        <div>
                           <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Localização Aproximada</span>
                           <span className="text-sm font-medium text-slate-300">
                             {lead.region || `Coordenadas: ${lead.lat.toFixed(4)}, ${lead.lng.toFixed(4)}`}
                           </span>
                        </div>
                      </div>
                   </div>
     
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-3">
                      {lead.vehicle && (
                         <div className="flex items-start gap-4">
                          <div className="mt-1"><Truck size={20} className="text-slate-400" /></div>
                          <div>
                             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Veículo</span>
                             <span className="text-sm font-medium text-slate-300">{lead.vehicle}</span>
                          </div>
                        </div>
                      )}
     
                      {lead.problemDescription && (
                         <div className="flex items-start gap-4 pt-3 border-t border-slate-700/50">
                          <div className="mt-1"><Wrench size={20} className="text-slate-400" /></div>
                          <div>
                             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Problema Relatado</span>
                             <span className="text-sm font-medium text-slate-300">{lead.problemDescription}</span>
                          </div>
                        </div>
                      )}
                   </div>
                 </div>
     
                 <div className="flex gap-3">
                    <button 
                     onClick={() => handleCancelCall(lead.id)}
                     className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-slate-300 py-4 px-4 rounded-2xl font-semibold hover:bg-slate-700 active:scale-95 transition-all outline outline-1 outline-slate-700"
                   >
                     <XCircle size={18} />
                     Descartar Lead
                   </button>
     
                   <button 
                     onClick={() => handleCompleteCall(lead.id)}
                     className="flex-[2] flex items-center justify-center gap-2 bg-green-500 text-slate-950 py-4 px-4 rounded-2xl font-bold hover:bg-green-400 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                   >
                     <CheckCircle size={18} />
                     Negócio Fechado
                   </button>
                 </div>
                 
               </motion.div>
             ))}
          </div>
        )}

        <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Buscando Emergências...</h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Fique online e aguarde chamados perto de você. O radar está atualizando em tempo real.
              </p>
            </div>

            <div className="space-y-4">
              {pendingCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-neon-blue/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="bg-slate-800 p-4 rounded-full relative z-10">
                      <Siren size={32} className="text-slate-600" />
                    </div>
                  </div>
                  <span className="text-sm font-medium">Nenhum chamado próximo.</span>
                </div>
              ) : (
                <AnimatePresence>
                  {pendingCalls.map((call) => (
                    <motion.div 
                      key={call.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors shadow-lg relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-neon-blue" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-400/10 rounded-xl text-red-400">
                             <Siren size={20} />
                          </div>
                          <div>
                            <span className="text-base font-bold text-slate-100 block capitalize">{call.serviceRequested}</span>
                            <span className="text-xs text-slate-500 font-medium">{call.clientName || 'Novo chamado'} • Agora mesmo</span>
                          </div>
                        </div>
                         <div className="text-xs font-semibold bg-neon-blue/10 text-neon-blue px-3 py-1 rounded-full border border-neon-blue/20">
                           Urgente
                        </div>
                      </div>

                      {(call.vehicle || call.problemDescription) && (
                         <div className="mb-4 pl-14 text-sm text-slate-400">
                            {call.vehicle && <div className="font-medium text-slate-300">{call.vehicle}</div>}
                            {call.problemDescription && <div className="mt-1 line-clamp-2">{call.problemDescription}</div>}
                         </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 mt-6">
                         <div className="flex-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 flex items-center justify-center gap-2">
                            <MapPin size={16} className="text-slate-500" />
                            <span className="text-sm font-medium text-slate-400 line-clamp-1">{call.region || 'Aproximado'}</span>
                         </div>
                         <button 
                            onClick={() => handleUnlockContact(call)}
                            className="bg-neon-blue text-slate-950 font-bold py-3 px-6 rounded-xl hover:bg-[#00e1ff] transition-colors active:scale-95 flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={18} />
                            Desbloquear ({getDynamicCost(call.baseCrCost || 100, call.unlockedBy ? call.unlockedBy.length : 0)} Cr)
                          </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </>
      </main>

      {/* PLANOS / CREDITS MODAL */}
      {showCreditsModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#070B14]/90 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
           <div className="bg-[#111827] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300">
              
              <div className="flex justify-between items-center p-5 border-b border-slate-800/80">
                 <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-lg">
                       <Zap size={20} className="text-neon-blue" />
                    </div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">Planos & Créditos</h2>
                 </div>
                 <button onClick={() => setShowCreditsModal(false)} className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                 
                 <div className="text-center">
                    <p className="text-slate-400 text-sm mb-2">{user ? 'Seus Créditos Atuais' : 'Você precisa entrar para comprar créditos'}</p>
                    {user ? (
                      <div className="text-5xl font-black text-white">{userData?.credits || 0}</div>
                    ) : (
                      <button 
                         onClick={() => {
                           // Simple hook call to authenticate:
                           signIn("profissional").then(() => setShowCreditsModal(false));
                         }}
                         className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 w-full mx-auto max-w-xs mt-2"
                      >
                         <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                         Fazer Login com Google
                      </button>
                    )}
                 </div>

                 <div className="bg-[#cd7f32]/10 border border-[#cd7f32]/50 rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-[#cd7f32] uppercase tracking-widest text-xs">Plano Bronze</h3>
                       <span className="text-white font-bold">R$ 159,00</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 pb-4 border-b border-slate-700/50">Receba <b className="text-white">1.200 Créditos</b> na sua conta para desbloquear contatos.</p>
                    <button 
                       onClick={async () => {
                         if (!user) { alert("Faça login no botão acima para comprar."); return; }
                         try {
                           await updateDoc(doc(db, "users", user.uid), { credits: (userData?.credits || 0) + 1200 });
                           alert("Pagamento Simulado! 1200 Créditos adicionados.");
                           setShowCreditsModal(false);
                         } catch (e: any) { alert(e.message) }
                       }}
                       className="w-full bg-[#cd7f32] hover:brightness-110 text-white font-bold py-3 rounded-xl transition shadow-[0_0_15px_rgba(205,127,50,0.3)]"
                    >
                       Comprar Bronze
                    </button>
                 </div>

                 <div className="bg-slate-300/10 border border-slate-300/50 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-slate-300 uppercase tracking-widest text-xs">Plano Prata</h3>
                       <span className="text-white font-bold inline-flex items-center gap-1">R$ 359,00</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 pb-4 border-b border-slate-700/50">Receba <b className="text-white">3.500 Créditos</b> na sua conta.</p>
                    <button 
                       onClick={async () => {
                         if (!user) { alert("Faça login no botão acima para comprar."); return; }
                         try {
                           await updateDoc(doc(db, "users", user.uid), { credits: (userData?.credits || 0) + 3500 });
                           alert("Pagamento Simulado! 3500 Créditos adicionados na sua conta.");
                           setShowCreditsModal(false);
                         } catch (e: any) { alert(e.message) }
                       }}
                       className="w-full bg-slate-200 text-slate-900 shadow-[0_0_15px_rgba(226,232,240,0.3)] font-bold py-3 rounded-xl transition hover:brightness-110 active:scale-[0.98]"
                    >
                       Comprar Prata
                    </button>
                 </div>

                 <div className="bg-yellow-400/10 border border-yellow-400/50 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-yellow-500 uppercase tracking-widest text-xs flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                         Plano Ouro (Prioridade)
                       </h3>
                       <span className="text-yellow-500 font-bold inline-flex items-center gap-1">R$ 749,00</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-4 pb-4 border-b border-yellow-500/20">Receba <b className="text-yellow-400">5.000 Créditos</b>. Parceiros ouro recebem os melhores pedidos no topo da tela.</p>
                    <button 
                       onClick={async () => {
                         if (!user) { alert("Faça login no botão acima para comprar."); return; }
                         try {
                           await updateDoc(doc(db, "users", user.uid), { credits: (userData?.credits || 0) + 5000, plan: "ouro" });
                           alert("Pagamento Simulado! Você agora é Ouro e ganhou 5000 Créditos.");
                           setShowCreditsModal(false);
                         } catch (e: any) { alert(e.message) }
                       }}
                       className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(234,179,8,0.4)] font-black py-4 rounded-xl transition hover:brightness-110 active:scale-[0.98]"
                    >
                       TORNAR-SE PARCEIRO OURO
                    </button>
                 </div>

              </div>
           </div>
        </div>
      )}
      </div>
    </SidebarLayout>
  );
}
