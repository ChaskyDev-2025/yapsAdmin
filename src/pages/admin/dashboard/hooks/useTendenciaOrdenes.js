import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { useAuth } from "../../../../auth/AuthContext";

export const useTendenciaOrdenes = () => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userRole, userFlotaId: adminFlotaId } = useAuth();
  const isSuperAdmin = userRole === "superadmin";

  useEffect(() => {
    setLoading(true);

    try {
      let unsubscribers = [];
      let trabajadoresData = [];
      let solicitudesData = [];

      // Definir función para calcular tendencia
      const calcularTendencia = () => {
        // Filtrar solicitudes según rol
        let solicitudesFiltered = solicitudesData;
        
        if (!isSuperAdmin && trabajadoresData.length > 0) {
          const trabajadorIds = trabajadoresData.map(t => t.id);
          solicitudesFiltered = solicitudesData.filter(solicitud => 
            trabajadorIds.includes(solicitud.conductor_asignado) || 
            trabajadorIds.includes(solicitud.uidTaxista)
          );
        }

        // Filtrar solo solicitudes completadas
        solicitudesFiltered = solicitudesFiltered.filter(solicitud => solicitud.estado === "completado");

        // Calcular últimos 7 días
        const today = new Date();
        const trendMap = {};

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
          trendMap[dateStr] = 0;
        }

        // Contar solicitudes completadas por día (según fechaCreacion)
        solicitudesFiltered.forEach(solicitud => {
          let fechaRef = solicitud.fechaCreacion || solicitud.solicitud?.fechaCreacion || solicitud.createdAt;
          
          if (fechaRef) {
            let date;
            
            // Manejar diferentes formatos de fecha
            if (typeof fechaRef.seconds === 'number') {
              // Firebase Timestamp
              date = new Date(fechaRef.seconds * 1000);
            } else if (fechaRef.toDate && typeof fechaRef.toDate === 'function') {
              // Timestamp object
              date = fechaRef.toDate();
            } else if (fechaRef instanceof Date) {
              date = fechaRef;
            } else if (typeof fechaRef === 'string') {
              date = new Date(fechaRef);
            } else if (typeof fechaRef === 'number') {
              date = new Date(fechaRef);
            } else {
              return;
            }

            const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
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
        setLoading(false);
      });
      unsubscribers.push(unsubTrabajadores);

      // Listener para solicitudes (no órdenes)
      const solicitudesQuery = collection(db, "solicitudes");

      const unsubSolicitudes = onSnapshot(solicitudesQuery, (snapshot) => {
        solicitudesData = snapshot.docs.map(doc => doc.data());
        calcularTendencia();
      }, (error) => {
        console.error("❌ Error en listener de solicitudes:", error);
        setLoading(false);
      });
      unsubscribers.push(unsubSolicitudes);

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
