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
    
    // Construir query - SIN filtro de "modo" para obtener TODOS los trabajadores
    let q;
    if (isSuperAdmin) {
      q = collection(db, "trabajadores");
    } else {
      q = query(
        collection(db, "trabajadores"),
        where("flotaId", "==", userFlotaId)
      );
    }

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trabajadores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Contar trabajadores por fecha (TODOS, sin filtro de rango)
      const trendMap = {};
      let minDate = new Date(); // Iniciar con hoy
      let maxDate = new Date();

      trabajadores.forEach((trabajador, index) => {
        if (!trabajador.createdAt) {
          return;
        }

        let createdDate;

        try {
          // Si tiene segundos (Timestamp de Firestore)
          if (trabajador.createdAt?.seconds !== undefined) {
            createdDate = new Date(trabajador.createdAt.seconds * 1000);
          }
          // Si tiene método toDate()
          else if (typeof trabajador.createdAt?.toDate === "function") {
            createdDate = trabajador.createdAt.toDate();
          }
          // Si es string
          else if (typeof trabajador.createdAt === "string") {
            createdDate = new Date(trabajador.createdAt);
          }
          // Si es Date
          else if (trabajador.createdAt instanceof Date) {
            createdDate = trabajador.createdAt;
          }
          else {
            return;
          }

          // Validar fecha
          if (!createdDate || isNaN(createdDate.getTime())) {
            return;
          }

          // Normalizar a medianoche
          createdDate.setHours(0, 0, 0, 0);

          // Actualizar min y max
          if (createdDate < minDate) {
            minDate = new Date(createdDate);
          }
          if (createdDate > maxDate) {
            maxDate = new Date(createdDate);
          }

          // Usar formato MM/DD como clave
          const dateStr = `${String(createdDate.getMonth() + 1).padStart(2, "0")}/${String(createdDate.getDate()).padStart(2, "0")}`;

          // Contar
          if (!trendMap[dateStr]) {
            trendMap[dateStr] = 0;
          }
          trendMap[dateStr]++;

        } catch (error) {
          // Silenciosamente ignorar errores
        }
      });

      // Generar todas las fechas entre minDate y maxDate (llenar huecos con 0)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      maxDate = maxDate > today ? maxDate : today; // No pasar de hoy

      const allDatesMap = {};
      const currentDate = new Date(minDate);

      while (currentDate <= maxDate) {
        const dateStr = `${String(currentDate.getMonth() + 1).padStart(2, "0")}/${String(currentDate.getDate()).padStart(2, "0")}`;
        allDatesMap[dateStr] = trendMap[dateStr] || 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Convertir a array y ordenar por fecha
      const newTrendData = Object.entries(allDatesMap)
        .map(([date, count]) => ({
          name: date,
          trabajadores: count,
        }));

      setTrendData(newTrendData);
      setLoading(false);
    }, (error) => {
      setTrendData([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userFlotaId, userRole]);

  return { trendData, loading };
};
