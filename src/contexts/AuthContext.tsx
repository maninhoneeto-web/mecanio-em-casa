import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "../lib/firebase";
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: any | null;
  loading: boolean;
  signIn: (role: "cliente" | "profissional", useDemo?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (e: any) {
           console.error("Error fetching user", e);
           // If they exist in auth but fail firestore load, they might just be uninitialized yet 
           // (this happens right after anonymous auth before the document is written).
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (role: "cliente" | "profissional", useDemo: boolean = false) => {
    setLoading(true);
    try {
      let result;
      if (role === "cliente" || useDemo) {
        // Silent anonymous login for clients or as a demo professional fallback
        result = await signInAnonymously(auth);
      } else {
        // Regular Google login for professionals
        const provider = new GoogleAuthProvider();
        result = await signInWithPopup(auth, provider);
      }

      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);

      // Create profile if it does not exist
      if (!userSnap.exists()) {
        const payload: any = {
          role,
          name: role === "cliente" 
            ? "Cliente de Socorro" 
            : (useDemo ? "Mecânico Demo (Sem Conta Google)" : (result.user.displayName || "Profissional")),
          email: result.user.email || "", // Anonymous doesn't have email
          createdAt: serverTimestamp()
        };

        if (role === "profissional") {
          payload.serviceType = "mecanico"; // default for now
          payload.plan = "bronze";
          payload.credits = 1000; // Give generous credits in demo mode to play around!
        }

        await setDoc(userRef, payload);
        setUserData(payload);
      } else {
        const existingData = userSnap.data();
        if (existingData && existingData.role !== role) {
          const updatedPayload: any = {
            ...existingData,
            role,
          };
          
          if (role === "profissional") {
            updatedPayload.serviceType = existingData.serviceType || "mecanico";
            updatedPayload.plan = existingData.plan || "bronze";
            updatedPayload.credits = existingData.credits !== undefined ? existingData.credits : 1000;
          }
          
          await setDoc(userRef, updatedPayload);
          setUserData(updatedPayload);
        } else {
          setUserData(existingData);
        }
      }
    } catch (error: any) {
      console.error("Error signing in", error);
      if (error.code === 'auth/operation-not-allowed') {
        alert("⚠️ ATENÇÃO DESENVOLVEDOR: Você precisa ir no Console do Firebase > Authentication > Sign-in Method e ATIVAR a opção 'Anônimo' (Anonymous) para que clientes possam pedir socorro sem e-mail/senha!");
      } else if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
        const confirmDemo = window.confirm(
          "⚠️ ERRO DE OUTRO DOMÍNIO / AUTORIZAÇÃO (Firebase):\n\n" +
          "O domínio de desenvolvimento atual não está na lista de autorizados do Firebase Console.\n\n" +
          "Deseja entrar no MODO DEMO/TESTE (Entrada Rápida) com 1000 CR de saldo de créditos para testar o radar, liberar contatos e simular a compra de créditos?"
        );
        if (confirmDemo) {
          // Retry automatically in demo mode
          await signIn(role, true);
        }
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        alert("O login foi cancelado ou a janela foi fechada. DICA: Se você estiver testando pela janela pequena do Google AI Studio, clique no ícone 'Open in new tab' lá em cima no canto direito e tente logar pelo site em tela cheia!");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Seu navegador bloqueou o pop-up de login do Google. Por favor, permita pop-ups neste site ou abra o aplicativo em uma nova aba.");
      } else {
        // Log literal Firebase response to make sure we don't swallow rule failures
        alert("Houve um erro de segurança/login: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
