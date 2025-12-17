import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { useAuth } from "../../../../auth/AuthContext";

export const useTendenciaOrdenes = () => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userRole, userFlotaId: adminFlotaId } = useAuth();
  const isSuperAdmin = userRole === "superAdmin";

  useEffect(() => {
    setLoading(true);

    try {
      let unsubscribers = [];
      let trabajadoresData = [];
      let ordenesData = [];

      // Definir función para calcular tendencia
      const calcularTendencia = () => {
        // Filtrar órdenes según rol
        let ordenesFiltered = ordenesData;
        
        if (!isSuperAdmin && trabajadoresData.length > 0) {
          const trabajadorIds = trabajadoresData.map(t => t.id);
          ordenesFiltered = ordenesData.filter(orden => 
            trabajadorIds.includes(orden.uidTaxista)
          );
        }

        // Filtrar solo órdenes completadas
        ordenesFiltered = ordenesFiltered.filter(orden => orden.estado === "completado");

        // Calcular últimos 7 días
        const today = new Date();
        const trendMap = {};

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
          trendMap[dateStr] = 0;
        }

        // Contar órdenes completadas por día (según updatedAt)
        ordenesFiltered.forEach(orden => {
          if (orden.updatedAt) {
            const updatedDate = new Date(orden.updatedAt.seconds * 1000);
            const dateStr = `${String(updatedDate.getMonth() + 1).padStart(2, "0")}/${String(updatedDate.getDate()).padStart(2, "0")}`;
            if (trendMap.hasOwnProperty(dateStr)) {
              trendMap[dateStr]++;
            }
          }
        });

        const newTrendData = Object.keys(trendMap).map(date => ({
          name: date,
          ordenes: trendMap[date],
        }));

        setTrendData(newTrendData);
        setLoading(false);
      };

      // Listener para trabajadores
      const trabajadoresQuery = isSuperAdmin 
        ? collection(db, "trabajadores")
        : query(collection(db, "trabajadores"), where("flotaId", "==", adminFlotaId));

      const unsubTrabajadores = onSnapshot(trabajadoresQuery, (snapshot) => {
        trabajadoresData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        calcularTendencia();
      }, (error) => {
        console.error("❌ Error en listener de trabajadores:", error);
      });
      unsubscribers.push(unsubTrabajadores);

      // Listener para órdenes
      const ordenesQuery = collection(db, "ordenes");

      const unsubOrdenes = onSnapshot(ordenesQuery, (snapshot) => {
        ordenesData = snapshot.docs.map(doc => doc.data());
        calcularTendencia();
      }, (error) => {
        console.error("❌ Error en listener de órdenes:", error);
      });
      unsubscribers.push(unsubOrdenes);

      // Cleanup
      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    } catch (error) {
      console.error("❌ Error configurando listeners:", error);
      setLoading(false);
    }
  }, [isSuperAdmin, adminFlotaId]);

  return { trendData, loading };
};
