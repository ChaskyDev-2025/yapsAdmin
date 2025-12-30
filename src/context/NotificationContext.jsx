// src/context/NotificationContext.jsx
import React, { createContext, useState, useCallback, useEffect, useRef } from "react";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "../data/firebase/firebase";
import { useAuth } from "../auth/AuthContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userRole } = useAuth();

  const persistentSolicitadoRef = useRef(null);
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
