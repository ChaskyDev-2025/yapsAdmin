// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../data/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Ctx = createContext({ user: null, userRole: null, loading: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      
      if (u) {
        // Obtener el rol del usuario desde Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || "admin");
          } else {
            setUserRole("admin"); // Rol por defecto
          }
        } catch (error) {
          console.error("Error obteniendo rol:", error);
          setUserRole("admin"); // Rol por defecto en caso de error
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return <Ctx.Provider value={{ user, userRole, loading }}>{children}</Ctx.Provider>;
}
