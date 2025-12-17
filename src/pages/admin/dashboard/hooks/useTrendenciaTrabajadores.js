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
      const trabajadores = snapshot.docs.map(doc => ({
        id: doc.id,
        createdAt: doc.data().perfil?.createdAt || new Date(),
      }));

      // Calcular tendencia de los últimos 7 días
      const trend = {};
      const today = new Date();

      // Inicializar últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("es-ES", { 
          month: "short", 
          day: "numeric" 
        });
        trend[dateStr] = 0;
      }

      // Contar trabajadores por día
      trabajadores.forEach(trabajador => {
        let createdDate = trabajador.createdAt;
        if (createdDate?.toDate) {
          createdDate = createdDate.toDate();
        } else if (createdDate?.seconds) {
          createdDate = new Date(createdDate.seconds * 1000);
        } else if (typeof createdDate === "string") {
          createdDate = new Date(createdDate);
        }

        if (createdDate instanceof Date && !isNaN(createdDate)) {
          // Normalizar fecha
          createdDate.setHours(0, 0, 0, 0);
          const dateStr = createdDate.toLocaleDateString("es-ES", { 
            month: "short", 
            day: "numeric" 
          });

          // Verificar si la fecha está dentro de los últimos 7 días
          const daysAgo = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
          if (daysAgo <= 6) {
            trend[dateStr] = (trend[dateStr] || 0) + 1;
          }
        }
      });

      // Convertir a array ordenado
      const trendArray = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("es-ES", { 
          month: "short", 
          day: "numeric" 
        });
        trendArray.push({
          name: dateStr,
          trabajadores: trend[dateStr] || 0,
        });
      }

      setTrendData(trendArray);
      setLoading(false);
    }, (error) => {
      console.error("Error obteniendo tendencia:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userFlotaId, userRole]);

  return { trendData, loading };
};
