import { useEffect, useRef, useContext, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../data/firebase/firebase";
import { NotificationContext } from "../context/NotificationContext";

/**
 * Hook personalizado que escucha nuevas solicitudes asignadas a la flota del usuario
 * Dispara notificaciones sin importar en qué página esté
 * También detecta reasignaciones (cuando una solicitud rechazada vuelve a ser asignada)
 */
export const useFlotaSolicitudesListener = (userFlotaId) => {
  const { addNotification } = useContext(NotificationContext);
  const prevSolicitudesRef = useRef([]);
  const [datosIniciales, setDatosIniciales] = useState(false);

  useEffect(() => {
    if (!userFlotaId) {
      setDatosIniciales(false);
      prevSolicitudesRef.current = [];
      return;
    }

    // Crear query para solicitudes asignadas a esta flota
    const q = query(
      collection(db, "solicitudes"),
      where("flota_asignada", "==", userFlotaId)
    );

    // Listener que se ejecuta siempre
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudesActuales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));


      // Marcar como datos iniciales en la primera carga
      if (!datosIniciales) {
        prevSolicitudesRef.current = solicitudesActuales;
        setDatosIniciales(true);
        return;
      }

      const prevMap = new Map(prevSolicitudesRef.current.map(s => [s.id, s]));
      const notificacionesPendientes = [];

      solicitudesActuales.forEach((solicitud) => {
        const prevSolicitud = prevMap.get(solicitud.id);

        // 1. NUEVA solicitud (no existía antes)
        if (!prevSolicitud) {
          notificacionesPendientes.push({
            tipo: "nueva",
            origen: solicitud.solicitud?.origen?.nombre || "Nueva solicitud",
            categoria: solicitud.solicitud?.categoria || "Sin categoría"
          });
        }
        // 2. REASIGNADA (estaba rechazada o en otro estado, ahora es asignada)
        else if (
          (prevSolicitud.estado === "rechazada" || prevSolicitud.estado === "pendiente") &&
          solicitud.estado === "asignada"
        ) {
          notificacionesPendientes.push({
            tipo: "reasignada",
            origen: solicitud.solicitud?.origen?.nombre || "Solicitud reasignada",
            categoria: solicitud.solicitud?.categoria || "Sin categoría"
          });
        }
      });

      // Enviar notificaciones
      notificacionesPendientes.forEach((notif) => {
        if (notif.tipo === "nueva") {
          addNotification({
            type: "success",
            title: "¡Nueva Solicitud!",
            message: `${notif.categoria} - ${notif.origen}`,
            duration: 6000,
          });
        } else if (notif.tipo === "reasignada") {
          addNotification({
            type: "success",
            title: "¡Solicitud Reasignada!",
            message: `${notif.categoria} - ${notif.origen}`,
            duration: 6000,
          });
        }
        playNotificationSound();
      });

      // Actualizar ref
      prevSolicitudesRef.current = solicitudesActuales;
    }, (error) => {
      console.error("❌ Error en listener de solicitudes:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [userFlotaId, datosIniciales, addNotification]);
};

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    // Error reproduciendo sonido
  }
};


