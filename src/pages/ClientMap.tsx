import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft, Navigation, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import L from "leaflet";
import { useAuth } from "../contexts/AuthContext";
import { db, handleFirestoreError } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";
import SidebarLayout from "../components/SidebarLayout";

// Fix for default Leaflet icon paths in Vite
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to dynamically update map center
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function ClientMap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const selectedService = location.state?.serviceName || "Socorro";
  const selectedServiceId = location.state?.serviceId || "mecanico";
  
  // Default to Brasília
  const [position, setPosition] = useState<[number, number]>([-15.7938, -47.8827]);
  const [locationFound, setLocationFound] = useState(false);
  const [requesting, setRequesting] = useState(false);
  
  // App State
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [activeCallData, setActiveCallData] = useState<any | null>(null);

  useEffect(() => {
    // If not logged in, boot back to home
    if (!user) {
      navigate("/");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setLocationFound(true);
        },
        (error) => {
          console.error("GPS error, falling back to Brasilia Center:", error);
          setPosition([-15.7938, -47.8827]); // Standard Brasilia coordinates
          setLocationFound(true);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      console.warn("Geolocation not supported by device, falling back to Brasilia Center.");
      setPosition([-15.7938, -47.8827]);
      setLocationFound(true);
    }
  }, [user, navigate]);

  // Listener for the active call
  useEffect(() => {
    if (!activeCallId) return;

    const unsubscribe = onSnapshot(doc(db, "serviceCalls", activeCallId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCallStatus(data.status);
        setActiveCallData({ id: snapshot.id, ...data });
      }
    }, (error) => {
      console.error("Error watching active service call:", error);
      handleFirestoreError(error, "get", `serviceCalls/${activeCallId}`);
    });

    return () => unsubscribe();
  }, [activeCallId]);

  const handleRequestClick = async () => {
    if (!user || !locationFound) return;
    
    setRequesting(true);
    
    try {
      const callsCol = collection(db, "serviceCalls");
      // Calculo baseado no prompt (Simples: 80~120) // Complexos (Mecanicos, socorro, guincho): (250~450)
      const isSimple = ['eletrica', 'pneu', 'chaveiro'].includes(selectedServiceId);
      const categoryBaseCost = isSimple 
           ? Math.floor(Math.random() * (120 - 80 + 1) + 80)
           : Math.floor(Math.random() * (450 - 250 + 1) + 250);

      const basePayload: any = {
        clientId: user.uid,
        serviceRequested: selectedServiceId, 
        baseCrCost: categoryBaseCost, // store the calculated base cost for logic
        lat: position[0],
        lng: position[1],
        status: 'pending',
        unlockedBy: [], // Array to store which mechanics bought this lead
        createdAt: serverTimestamp() 
      };

      // Append form data if present from Welcome form
      if (location.state?.formData) {
        basePayload.clientName = location.state.formData.clientName;
        basePayload.vehicle = location.state.formData.vehicle;
        basePayload.problemDescription = location.state.formData.problemDescription;
        basePayload.region = location.state.formData.region;
        basePayload.clientPhone = location.state.formData.clientPhone || "";
      }

      const docRef = await addDoc(callsCol, basePayload);

      setActiveCallId(docRef.id);
      setCallStatus('pending');
      setRequesting(false);
    } catch (error: any) {
      console.error(error);
      alert("Houve um erro de segurança ao tentar disparar o seu chamado: " + error.message);
      setRequesting(false);
    }
  };

  // Auto-start request if coming from the Welcome Page Form (after location is found)
  useEffect(() => {
    if (location.state?.autoStart && locationFound && !activeCallId && !requesting) {
       handleRequestClick();
       // remove autoStart flag so re-renders don't fire it again
       navigate(location.pathname, { replace: true, state: { ...location.state, autoStart: false } });
    }
  }, [locationFound, activeCallId, requesting, location.state]);

  const handleCancel = () => {
    // Basic cancel logic - in real life needs another DB write
    setActiveCallId(null);
    setCallStatus(null);
  }

  return (
    <SidebarLayout>
      <div className="relative h-[calc(100vh-56px)] lg:h-screen w-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          disabled={!!activeCallId}
          className={`pointer-events-auto p-3 rounded-full glass-panel text-white transition shadow-lg backdrop-blur-xl border border-white/10 active:scale-95 ${activeCallId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
        >
          <ArrowLeft size={24} />
        </button>
        <div className="pointer-events-auto px-4 py-2 rounded-full glass-panel border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
          <span className="text-neon-blue font-semibold tracking-wide text-sm flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-neon-blue ${callStatus === 'pending' ? 'animate-ping' : 'animate-pulse'}`} />
            {callStatus === 'pending' ? 'Buscando parceiros...' : 
             callStatus === 'accepted' ? 'Profissional a caminho!' : 
             `Buscando ${selectedService}`}
          </span>
        </div>
      </div>
      
      {/* Map */}
      <div className="flex-1 z-0 w-full h-full">
        <MapContainer 
          center={position} 
          zoom={13} 
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <ChangeView center={position} zoom={locationFound ? 16 : 13} />
          
          {locationFound && (
            <CircleMarker 
              center={position} 
              pathOptions={{ fillColor: '#00f3ff', color: '#00f3ff', fillOpacity: 0.4, weight: 2 }} 
              radius={12}
            >
              <Popup className="glass-popup">Você está aqui.</Popup>
            </CircleMarker>
          )}

          {/* If accepted, we would draw the professional's pin. Sticking to simple for now. */}
        </MapContainer>
      </div>

      {/* Bottom Action Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="pointer-events-auto bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl"
        >
          {activeCallId ? (
            <div className="text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-ping" />
                    Chamado Ativo no Mural
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Seu pedido de <b>{selectedService}</b> está visível para os mecânicos do DF
                  </p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Buscando
                </div>
              </div>

              {/* LIVE LEADS UNLOCKED LIST */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black text-[#00f3ff] uppercase tracking-wider flex items-center gap-1.5">
                    ⚡ Respostas de Profissionais (GetNinjas Flow):
                  </span>
                </div>
                
                {activeCallData && activeCallData.unlockedBy && activeCallData.unlockedBy.length > 0 ? (
                  <div className="space-y-3 mt-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Os seguintes parceiros pagaram para liberar seu contato e estão abrindo conversa direto no seu WhatsApp ({location.state?.formData?.clientPhone || "(61) 99999-9999"}):
                    </p>
                    {activeCallData.unlockedBy.map((uid: string, i: number) => (
                      <div key={uid} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left gap-2 animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-xs">
                            M{i + 1}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Mecânico Especialista #{i + 1}</span>
                            <span className="text-[10px] text-slate-500">Créditos de chaves consumidos</span>
                          </div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold self-start sm:self-auto flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Contato Liberado!
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-slate-400">Aguardando algum mecânico local comprar e liberar este contato...</p>
                    <p className="text-[10px] text-slate-500 mt-1">Conforme as diretrizes do GetNinjas, até 5 parceiros podem adquirir este lead.</p>
                  </div>
                )}
              </div>

              {/* QUICK BRIDGES FOR TESTING */}
              <div className="p-3.5 rounded-xl bg-yellow-450/10 border border-yellow-400/20 text-xs text-yellow-400 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="leading-normal font-medium">
                  💡 <b>Ambiente de Simulação:</b> Você pode abrir o <b>Mural de Oportunidades</b> em outra aba ou clicando no atalho ao lado para assumir a conta de mecânico, gastar créditos fictícios e "Desbloquear" o seu próprio contato para ver como funciona o Whatsapp direto!
                </span>
                <button
                  onClick={() => navigate("/radar")}
                  className="px-3.5 py-2 bg-yellow-450 text-slate-950 hover:bg-yellow-400 font-extrabold text-[10px] rounded-lg transition-transform active:scale-95 shrink-0 uppercase tracking-widest"
                >
                  Ir para o Mural ➡️
                </button>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={handleCancel}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Cancelar Chamado
                </button>
                <button 
                  onClick={() => navigate("/")}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Voltar para o Início
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-slate-800 p-3 rounded-full text-neon-blue">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Sua Localização</h3>
                  <p className="text-slate-400 text-sm">
                    {locationFound ? "Pronto para chamar socorro" : "Detectando GPS..."}
                  </p>
                </div>
              </div>

              <button 
                onClick={handleRequestClick}
                disabled={!locationFound || requesting}
                className={`w-full relative overflow-hidden rounded-2xl p-4 font-bold text-lg transition-all active:scale-95 ${
                  !locationFound 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-neon-blue text-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:bg-[#00e1ff]"
                }`}
              >
                <AnimatePresence mode="wait">
                  {requesting ? (
                    <motion.div
                      key="requesting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Navigation size={20} className="animate-spin" />
                      <span>Enviando para o servidor...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Confirmar Chamado {selectedService}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </>
          )}
        </motion.div>
      </div>
     </div>
    </SidebarLayout>
  );
}
