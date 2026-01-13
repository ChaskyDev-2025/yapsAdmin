// Hook para obtener el historial de solicitudes de conductores desde Firebase
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useSolicitudesHistorial = (conductorId) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!conductorId) {
      setSolicitudes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar solicitudes donde uidUser coincida con el conductorId
      const solicitudesRef = collection(db, "solicitudes");
      const q = query(solicitudesRef, where("uidUser", "==", conductorId));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const solicitudesData = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          solicitudesData.push({
            id: doc.id,
            ...data,
          });
        });

        // Ordenar por fecha de creación descendente
        solicitudesData.sort((a, b) => {
          const dateA = a.fechaCreacion?.toDate?.() || new Date(a.fechaCreacion);
          const dateB = b.fechaCreacion?.toDate?.() || new Date(b.fechaCreacion);
          return dateB - dateA;
        });

        setSolicitudes(solicitudesData);
        setLoading(false);
      }, (err) => {
        console.error("Error al obtener solicitudes:", err);
        setError(err.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error al obtener solicitudes:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [conductorId]);

  return { solicitudes, loading, error };
};
