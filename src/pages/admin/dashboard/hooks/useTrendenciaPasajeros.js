import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { useAuth } from "../../../../auth/AuthContext";

export const useTrendenciaPasajeros = () => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();

  useEffect(() => {
    setLoading(true);

    try {
      // Query para pasajeros
      const pasajerosQuery = collection(db, "pasajeros");

      const unsubPasajeros = onSnapshot(pasajerosQuery, (snapshot) => {
        const pasajerosData = snapshot.docs.map(doc => doc.data());

        // Calcular últimos 7 días
        const today = new Date();
        const trendMap = {};

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
          trendMap[dateStr] = 0;
        }

        // Contar pasajeros por día (según perfil.createdAt)
        pasajerosData.forEach(pasajero => {
          if (pasajero.perfil?.createdAt) {
            const createdDate = new Date(pasajero.perfil.createdAt.seconds * 1000);
            const dateStr = `${String(createdDate.getMonth() + 1).padStart(2, "0")}/${String(createdDate.getDate()).padStart(2, "0")}`;
            if (trendMap.hasOwnProperty(dateStr)) {
              trendMap[dateStr]++;
            }
          }
        });

        const newTrendData = Object.keys(trendMap).map(date => ({
          name: date,
          pasajeros: trendMap[date],
        }));

        setTrendData(newTrendData);
        setLoading(false);
      }, (error) => {
        console.error("❌ Error en listener de pasajeros:", error);
        setLoading(false);
      });

      return () => unsubPasajeros();
    } catch (error) {
      console.error("❌ Error configurando listener:", error);
      setLoading(false);
    }
  }, []);

  return { trendData, loading };
};
