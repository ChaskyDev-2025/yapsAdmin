import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { useAuth } from "../../../../auth/AuthContext";

export const useTrendenciaTrabajadores = () => {
  const { userFlotaId, userRole } = useAuth();
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userFlotaId && userRole !== "superadmin") {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Determinar si es superadmin o admin de flota
    const isSuperAdmin = userRole === "superadmin";
    
    // Construir query
    let q;
    if (isSuperAdmin) {
      q = query(collection(db, "trabajadores"), where("modo", "==", "trabajador"));
    } else {
      q = query(
        collection(db, "trabajadores"),
        where("flotaId", "==", userFlotaId),
        where("modo", "==", "trabajador")
      );
    }

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trabajadores = snapshot.docs.map(doc => doc.data());

      // Calcular últimos 7 días
      const today = new Date();
      const trendMap = {};

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
        trendMap[dateStr] = 0;
      }

      // Contar trabajadores por día (según createdAt en la raíz)
      trabajadores.forEach(trabajador => {
        if (trabajador.createdAt) {
          let createdDate;
          
          // Convertir la fecha correctamente
          if (trabajador.createdAt?.seconds) {
            createdDate = new Date(trabajador.createdAt.seconds * 1000);
          } else if (typeof trabajador.createdAt === "string") {
            createdDate = new Date(trabajador.createdAt);
          } else if (trabajador.createdAt?.toDate) {
            createdDate = trabajador.createdAt.toDate();
          } else if (trabajador.createdAt instanceof Date) {
            createdDate = trabajador.createdAt;
          }
          
          if (createdDate && !isNaN(createdDate.getTime())) {
            const dateStr = `${String(createdDate.getMonth() + 1).padStart(2, "0")}/${String(createdDate.getDate()).padStart(2, "0")}`;
            if (trendMap.hasOwnProperty(dateStr)) {
              trendMap[dateStr]++;
            }
          }
        }
      });

      const newTrendData = Object.keys(trendMap).map(date => ({
        name: date,
        trabajadores: trendMap[date],
      }));

      setTrendData(newTrendData);
      setLoading(false);
    }, (error) => {
      console.error("Error obteniendo tendencia:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userFlotaId, userRole]);

  return { trendData, loading };
};
