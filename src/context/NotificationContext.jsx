// src/context/NotificationContext.jsx
import React, { createContext, useState, useCallback, useEffect, useRef } from "react";
import { onSnapshot, collection, query, where, doc } from "firebase/firestore";
import { db } from "../data/firebase/firebase";
import { useAuth } from "../auth/AuthContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userRole, userFlotaId } = useAuth();

  const persistentSolicitadoRef = useRef(null);
  const persistentDocumentosPendientesRef = useRef(null);
  const persistentSolicitudesPendientesRef = useRef(null);
  const documentosInitializedRef = useRef(false);
  const solicitudesInitializedRef = useRef(false);
  const initializedRef = useRef(false);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    return id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  // Helper para reproducir sonido de notificación
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(700, audioContext.currentTime);
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
      // ignore audio errors
    }
  }, []);

  // Listener global de solicitudes para SuperAdmin
  useEffect(() => {
    if (userRole !== 'superadmin') return; // solo para superadmin

    const unsub = onSnapshot(collection(db, 'solicitudes'), (snapshot) => {
      try {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Notificación persistente: conteo de solicitudes en 'solicitado'
        const countSolicitado = data.filter(s => String(s.estado).toLowerCase() === 'solicitado').length;
        const existingId = persistentSolicitadoRef.current;
        if (countSolicitado > 0) {
          const message = `Hay ${countSolicitado} solicitud(es) en estado 'solicitado'`;
          if (existingId) {
            try { deleteNotification(existingId); } catch (e) {}
            const newId = addNotification({ message, type: 'warning' });
            persistentSolicitadoRef.current = newId;
            playNotificationSound();
          } else {
            const newId = addNotification({ message, type: 'warning' });
            persistentSolicitadoRef.current = newId;
            playNotificationSound();
          }
        } else {
          if (existingId) {
            try { deleteNotification(existingId); } catch (e) {}
            persistentSolicitadoRef.current = null;
          }
        }

        // Notificaciones por docChanges: evitar duplicados con localStorage
        const raw = localStorage.getItem('notifiedSolicitudesSuperadmin');
        const notified = raw ? new Set(JSON.parse(raw)) : new Set();
        snapshot.docChanges().forEach((change) => {
          const doc = change.doc;
          const docData = doc.data();
          const nuevoEstado = docData.estado;
          const becameSolicitado = (change.type === 'added' && nuevoEstado === 'solicitado') || (change.type === 'modified' && nuevoEstado === 'solicitado');
          if (becameSolicitado && !notified.has(doc.id)) {
            const origen = docData.solicitud?.origen?.nombre || 'Nueva solicitud';
            addNotification({ message: `Nueva solicitud: ${origen}`, type: 'info' });
            playNotificationSound();
            notified.add(doc.id);
          }
        });
        try { localStorage.setItem('notifiedSolicitudesSuperadmin', JSON.stringify(Array.from(notified))); } catch (e) {}
      } catch (e) {
        console.error('NotificationProvider - error processing solicitudes snapshot', e);
      }
    }, (err) => {
      console.error('NotificationProvider - onSnapshot error', err);
    });

    return () => unsub();
  }, [userRole, addNotification, deleteNotification, playNotificationSound]);

  // Listener de documentos pendientes para AdminFlota (rol: admin con flotaId)
  useEffect(() => {
    if (userRole !== 'admin' || !userFlotaId) {
      documentosInitializedRef.current = false;
      return;
    }

    const unsubTrabajadores = onSnapshot(
      collection(db, 'trabajadores'),
      (snapshot) => {
        try {
          let totalDocumentosPendientes = 0;

          snapshot.docs.forEach((doc) => {
            const trabajador = doc.data();
            
            // Filtrar por flotaId (incluyendo trabajadores inactivos)
            if (trabajador.flotaId !== userFlotaId) {
              return;
            }
            
            const documentos = trabajador.documentos || {};
            
            Object.values(documentos).forEach((documento) => {
              if (documento && typeof documento === 'object' && documento.estado === 'pendiente') {
                totalDocumentosPendientes++;
              }
            });
          });

          // Notificación persistente: conteo de documentos pendientes
          const existingId = persistentDocumentosPendientesRef.current;
          if (totalDocumentosPendientes > 0) {
            const message = `Hay ${totalDocumentosPendientes} documento(s) pendiente(s) de aprobación`;
            
            // Siempre actualizar la notificación (en primera carga y en cambios)
            if (existingId) {
              try { deleteNotification(existingId); } catch (e) {}
            }
            
            const newId = addNotification({ message, type: 'warning' });
            persistentDocumentosPendientesRef.current = newId;
            
            // Solo reproducir sonido si no es la primera carga
            if (documentosInitializedRef.current) {
              playNotificationSound();
            }
            documentosInitializedRef.current = true;
          } else {
            if (existingId) {
              try { deleteNotification(existingId); } catch (e) {}
              persistentDocumentosPendientesRef.current = null;
            }
            documentosInitializedRef.current = true;
          }
        } catch (e) {
          console.error('❌ NotificationProvider - error processing documentos snapshot', e);
        }
      },
      (err) => {
        console.error('❌ NotificationProvider - onSnapshot error for trabajadores', err);
      }
    );

    return () => {
      unsubTrabajadores();
    };
  }, [userRole, userFlotaId, addNotification, deleteNotification, playNotificationSound]);

  // Listener de solicitudes pendientes para AdminFlota (rol: admin con flotaId)
  useEffect(() => {
    if (userRole !== 'admin' || !userFlotaId) {
      solicitudesInitializedRef.current = false;
      return;
    }

    const solicitudesRef = collection(doc(db, 'flotas', userFlotaId), 'solicitudesRecarga');
    
    const unsubSolicitudes = onSnapshot(
      solicitudesRef,
      (snapshot) => {
        try {
          let totalSolicitudesPendientes = 0;

          snapshot.docs.forEach((doc) => {
            const solicitud = doc.data();
            
            if (solicitud.estado === 'pendiente') {
              totalSolicitudesPendientes++;
            }
          });

          // Notificación persistente: conteo de solicitudes pendientes
          const existingId = persistentSolicitudesPendientesRef.current;
          if (totalSolicitudesPendientes > 0) {
            const message = `Hay ${totalSolicitudesPendientes} solicitud(es) de recarga pendiente(s)`;
            
            // Siempre actualizar la notificación
            if (existingId) {
              try { deleteNotification(existingId); } catch (e) {}
            }
            
            const newId = addNotification({ message, type: 'warning' });
            persistentSolicitudesPendientesRef.current = newId;
            
            // Solo reproducir sonido si no es la primera carga
            if (solicitudesInitializedRef.current) {
              playNotificationSound();
            }
            solicitudesInitializedRef.current = true;
          } else {
            if (existingId) {
              try { deleteNotification(existingId); } catch (e) {}
              persistentSolicitudesPendientesRef.current = null;
            }
            solicitudesInitializedRef.current = true;
          }
        } catch (e) {
          console.error('❌ NotificationProvider - error processing solicitudes snapshot', e);
        }
      },
      (err) => {
        console.error('❌ NotificationProvider - onSnapshot error for solicitudes', err);
      }
    );

    return () => {
      unsubSolicitudes();
    };
  }, [userRole, userFlotaId, addNotification, deleteNotification, playNotificationSound]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
