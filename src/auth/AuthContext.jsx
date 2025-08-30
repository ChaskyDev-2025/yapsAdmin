// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../data/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const Ctx = createContext({ user: null, loading: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return <Ctx.Provider value={{ user, loading }}>{children}</Ctx.Provider>;
}
