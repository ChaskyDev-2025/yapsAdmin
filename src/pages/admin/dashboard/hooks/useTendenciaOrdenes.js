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
        // Filtrar órdenes según rol (solo órdenes completadas)
        let ordenesFiltered = solicitudesData.filter(orden => 
          orden.estado === "completado" || orden.estado === "completada"
        );
        
        if (!isSuperAdmin && trabajadoresData.length > 0) {
          const trabajadorIds = trabajadoresData.map(t => t.id);
          ordenesFiltered = ordenesFiltered.filter(orden => {
            // Obtener uidTaxista de la orden - puede estar en nivel raíz o dentro del submapa 'orden'
            const uidTaxista = orden.uidTaxista || (orden.orden && orden.orden.uidTaxista);
            return trabajadorIds.includes(uidTaxista);
          });
        }

        // Calcular últimos 7 días
        const today = new Date();
        const trendMap = {};

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
          trendMap[dateStr] = 0;
        }

        // Contar órdenes completadas por día
        ordenesFiltered.forEach(orden => {
          // Buscar fecha en diferentes ubicaciones posibles
          let fechaRef = orden.createdAt || orden.updatedAt || orden.orden?.createdAt;
          
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

      // Listener para órdenes
      const ordenesQuery = collection(db, "ordenes");

      const unsubOrdenes = onSnapshot(ordenesQuery, (snapshot) => {
        solicitudesData = snapshot.docs.map(doc => doc.data());
        calcularTendencia();
      }, (error) => {
        console.error("❌ Error en listener de órdenes:", error);
        setLoading(false);
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
