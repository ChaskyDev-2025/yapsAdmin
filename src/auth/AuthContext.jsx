// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../data/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Ctx = createContext({ user: null, userRole: null, userFlotaId: null, loading: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userFlotaId, setUserFlotaId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      
      if (u) {
        // Obtener el rol y flotaId del usuario desde Firestore
        console.log("🔍 AuthContext - Buscando datos del usuario:", u.uid);
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          console.log("📄 AuthContext - userDoc.exists():", userDoc.exists());
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("📊 AuthContext - userData completa:", userData);
            setUserRole(userData.role || "admin");
            setUserFlotaId(userData.flotaId || null);
            console.log("🔑 AuthContext - Usuario cargado:", {
              uid: u.uid,
              email: u.email,
              role: userData.role,
              flotaId: userData.flotaId,
              flotaIdType: typeof userData.flotaId
            });
          } else {
            console.warn("⚠️ AuthContext - Documento de usuario NO existe");
            setUserRole("admin"); // Rol por defecto
            setUserFlotaId(null);
          }
        } catch (error) {
          console.error("❌ AuthContext - Error obteniendo rol:", error);
          setUserRole("admin"); // Rol por defecto en caso de error
          setUserFlotaId(null);
        }
      } else {
        setUserRole(null);
        setUserFlotaId(null);
      }
      
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return <Ctx.Provider value={{ user, userRole, userFlotaId, loading }}>{children}</Ctx.Provider>;
}
