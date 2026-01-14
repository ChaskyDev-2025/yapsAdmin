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
  const { addNotification, deleteNotification } = useContext(NotificationContext);
  const prevSolicitudesRef = useRef([]);
  const persistentSolicitudesRef = useRef(null);
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

      // PRIMERA CARGA: mostrar notificación persistente si hay solicitudes
      if (!datosIniciales) {
        const solicitudesPendientes = solicitudesActuales.filter(s => 
          s.estado === "solicitado" || s.estado === "asignada"
        );
        
        // Si hay solicitudes asignadas, crear notificación persistente
        if (solicitudesPendientes.length > 0) {
          const message = `Tienes ${solicitudesPendientes.length} solicitud(es) asignada(s)`;
          const newId = addNotification({
            type: "solicitud_servicio",
            title: "Solicitudes Asignadas",
            message: message,
          });
          persistentSolicitudesRef.current = newId;
        }
        
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
            type: "solicitud_servicio",
            title: "¡Nueva Solicitud!",
            message: `${notif.categoria} - ${notif.origen}`,
          });
        } else if (notif.tipo === "reasignada") {
          addNotification({
            type: "solicitud_servicio",
            title: "¡Solicitud Reasignada!",
            message: `${notif.categoria} - ${notif.origen}`,
          });
        }
      });

      // Actualizar notificación persistente de conteo
      const solicitudesPendientes = solicitudesActuales.filter(s => 
        s.estado === "solicitado" || s.estado === "asignada"
      );
      
      if (solicitudesPendientes.length > 0) {
        const message = `Tienes ${solicitudesPendientes.length} solicitud(es) asignada(s)`;
        const existingId = persistentSolicitudesRef.current;
        
        if (existingId) {
          try { deleteNotification(existingId); } catch (e) {}
        }
        
        const newId = addNotification({
          type: "solicitud_servicio",
          title: "Solicitudes Asignadas",
          message: message,
        });
        persistentSolicitudesRef.current = newId;
      } else {
        if (persistentSolicitudesRef.current) {
          try { deleteNotification(persistentSolicitudesRef.current); } catch (e) {}
          persistentSolicitudesRef.current = null;
        }
      }

      // Actualizar ref
      prevSolicitudesRef.current = solicitudesActuales;
    }, (error) => {
      console.error("❌ Error en listener de solicitudes:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [userFlotaId, datosIniciales, addNotification, deleteNotification]);
};

const playNotificationSound = () => {
  // Función deshabilitada - sin sonidos
};


