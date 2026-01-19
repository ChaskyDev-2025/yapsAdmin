import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useHistorialConductor = (userId) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Función para formatear fechas
  const formatearFecha = (timestamp) => {
    if (!timestamp) return "-";
    try {
      let fecha;
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        fecha = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        fecha = timestamp;
      } else if (typeof timestamp === "string") {
        fecha = new Date(timestamp);
      } else if (typeof timestamp === "number") {
        fecha = new Date(timestamp);
      } else {
        return "-";
      }

      if (isNaN(fecha.getTime())) {
        return "-";
      }

      return fecha.toLocaleString("es-BO");
    } catch (e) {
      return "-";
    }
  };

  useEffect(() => {
    if (!userId) {
      setSolicitudes([]);
      setCargando(false);
      return;
    }

    let cancel = false;

    const loadHistorial = async () => {
      try {
        // Cargar solicitudes donde conductorAsignado === userId
        const solicitudesCollection = collection(db, "solicitudes");
        const qSolicitudes = query(
          solicitudesCollection,
          where("conductorAsignado", "==", userId)
        );
        const snapshotSolicitudes = await getDocs(qSolicitudes);

        // Procesar solicitudes
        if (snapshotSolicitudes.docs.length > 0) {
          const solicitudesData = snapshotSolicitudes.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => {
              const dateA = a.fechaCreacion?.toDate?.() || new Date(a.fechaCreacion);
              const dateB = b.fechaCreacion?.toDate?.() || new Date(b.fechaCreacion);
              return dateB - dateA;
            });

          if (!cancel) {
            setSolicitudes(solicitudesData);
          }
        } else {
          if (!cancel) {
            setSolicitudes([]);
          }
        }

        if (!cancel) {
          setCargando(false);
        }
      } catch (error) {
        console.error("Error cargando historial de solicitudes:", error);
        if (!cancel) {
          setSolicitudes([]);
          setCargando(false);
        }
      }
    };

    loadHistorial();
    return () => {
      cancel = true;
    };
  }, [userId]);

  return {
    solicitudes,
    cargando,
    formatearFecha,
    totalSolicitudes: solicitudes.length,
  };
};
