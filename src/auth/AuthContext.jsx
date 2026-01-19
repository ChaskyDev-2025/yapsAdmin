// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../data/firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
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
      if (u) {
        // Obtener el rol, flotaId y datos adicionales del usuario desde Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Verificar si el usuario está activo
            if (userData.active === false) {
              // Usuario está inactivo, cerrar sesión automáticamente
              console.warn("⚠️ Usuario inactivo. Cerrando sesión...");
              await auth.signOut();
              setUser(null);
              setUserRole(null);
              setUserFlotaId(null);
              setLoading(false);
              return;
            }
            
            // Combinar datos de Auth con datos de Firestore
            setUser({
              ...u,
              ...userData,
              fotoUrl: userData.fotoUrl || null,
            });
            setUserRole(userData.role || "admin");
            setUserFlotaId(userData.flotaId || null);
          } else {
            console.warn("⚠️ AuthContext - Documento de usuario NO existe");
            setUser(u);
            setUserRole("admin"); // Rol por defecto
            setUserFlotaId(null);
          }
        } catch (error) {
          console.error("❌ AuthContext - Error obteniendo rol:", error);
          setUser(u);
          setUserRole("admin"); // Rol por defecto en caso de error
          setUserFlotaId(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserFlotaId(null);
      }
      
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return <Ctx.Provider value={{ user, userRole, userFlotaId, loading }}>{children}</Ctx.Provider>;
}
