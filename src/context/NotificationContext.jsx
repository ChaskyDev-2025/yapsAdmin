// src/context/NotificationContext.jsx
import React, { createContext, useState, useCallback, useEffect, useRef } from "react";
import { onSnapshot, collection, query, where, doc, collectionGroup } from "firebase/firestore";
import { db } from "../data/firebase/firebase";
import { useAuth } from "../auth/AuthContext";

export const NotificationContext = createContext();

// Mapeo de tipos de notificación a rutas
const NOTIFICATION_ROUTES = {
  'solicitud_recarga': '/admin/billetera',
  'solicitud_recarga_conductores': '/admin/billetera-flota',
  'solicitud_conductor': '/admin/solicitudes',
  'documentos_pendientes': '/admin/documentos-pendientes',
  'solicitud_servicio': '/admin/solicitudes-asignadas',
  'comisiones': '/admin/servicios',
  'bonos': '/admin/bonos',
  'usuarios': '/admin/usuarios',
  'default': '/admin/dashboard'
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userRole, userFlotaId } = useAuth();

  const persistentSolicitadoRef = useRef(null);
  const persistentDocumentosPendientesRef = useRef(null);
  const persistentSolicitudesPendientesRef = useRef(null);
  const persistentRecargaFlotaRef = useRef(null);
  const persistentRecargaConductorRef = useRef(null);
  const documentosInitializedRef = useRef(false);
  const solicitudesInitializedRef = useRef(false);
  const recargasFlotaInitializedRef = useRef(false);
  const recargasInitializedRef = useRef(false);
  const initializedRef = useRef(false);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    // Obtener la ruta basada en el tipo de notificación
    const route = NOTIFICATION_ROUTES[notification.type] || NOTIFICATION_ROUTES['default'];
    
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      route,
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
            const newId = addNotification({ message, type: 'solicitud_conductor', title: 'Solicitudes Pendientes' });
            persistentSolicitadoRef.current = newId;
            playNotificationSound();
          } else {
            const newId = addNotification({ message, type: 'solicitud_conductor', title: 'Solicitudes Pendientes' });
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
            addNotification({ message: `Nueva solicitud: ${origen}`, type: 'solicitud_conductor', title: 'Nueva Solicitud' });
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
            
            const newId = addNotification({ message, type: 'documentos_pendientes', title: 'Documentos Pendientes' });
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
            
            const newId = addNotification({ message, type: 'solicitud_recarga', title: 'Recargas Pendientes' });
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

  const recargasFlotaCountRef = useRef({});

  // Listener de solicitudes de recarga de FLOTA para SuperAdmin y Admin
  useEffect(() => {
    if (!userRole || (userRole !== 'superadmin' && userRole !== 'admin')) return;

    let unsubscribers = [];

    try {
      // Para superadmin: escuchar TODAS las solicitudes de recarga de TODAS las flotas
      if (userRole === 'superadmin') {
        const unsubFlotasListener = onSnapshot(
          collection(db, 'flotas'),
          (flotasSnapshot) => {
            try {
              const nestedUnsubscribers = [];
              
              // Limpiar refs de flotas que ya no existen
              const flotaIdsActuales = new Set(flotasSnapshot.docs.map(doc => doc.id));
              Object.keys(recargasFlotaCountRef.current).forEach(id => {
                if (!flotaIdsActuales.has(id)) {
                  delete recargasFlotaCountRef.current[id];
                }
              });
              
              // Para cada flota, escuchar sus solicitudes de recarga
              flotasSnapshot.docs.forEach((flotaDoc) => {
                const flotaId = flotaDoc.id;
                const solicitudesRef = collection(doc(db, 'flotas', flotaId), 'solicitudesRecarga');
                
                const unsubSolicitudes = onSnapshot(solicitudesRef, (solicitudesSnapshot) => {
                  try {
                    let recargasFlota = 0;
                    solicitudesSnapshot.docs.forEach((doc) => {
                      const solicitud = doc.data();
                      if (solicitud && solicitud.estado === 'pendiente') {
                        recargasFlota++;
                      }
                    });
                    
                    // Actualizar el conteo para esta flota
                    recargasFlotaCountRef.current[flotaId] = recargasFlota;
                    
                    // Calcular total
                    const totalRecargasPendientes = Object.values(recargasFlotaCountRef.current).reduce((sum, count) => sum + count, 0);
                    
                    // Actualizar notificación inmediatamente
                    if (totalRecargasPendientes > 0) {
                      const message = `Hay ${totalRecargasPendientes} solicitud(es) de recarga pendiente(s)`;
                      
                      const existingId = persistentRecargaFlotaRef.current;
                      if (existingId) {
                        try { deleteNotification(existingId); } catch (e) {}
                      }
                      
                      const newId = addNotification({ message, type: 'solicitud_recarga', title: 'Recargas de Flota Pendientes' });
                      persistentRecargaFlotaRef.current = newId;
                      
                      if (recargasFlotaInitializedRef.current) {
                        playNotificationSound();
                      }
                      recargasFlotaInitializedRef.current = true;
                    } else {
                      const existingId = persistentRecargaFlotaRef.current;
                      if (existingId) {
                        try { deleteNotification(existingId); } catch (e) {}
                        persistentRecargaFlotaRef.current = null;
                      }
                      recargasFlotaInitializedRef.current = true;
                    }
                  } catch (e) {
                    console.error('❌ Error procesando solicitudes de flota:', e);
                  }
                });
                nestedUnsubscribers.push(unsubSolicitudes);
              });
              
              // Limpiar listeners anidados cuando cambien las flotas
              return () => {
                nestedUnsubscribers.forEach(unsub => unsub());
              };
            } catch (e) {
              console.error('❌ NotificationProvider - error processing flotas snapshot (superadmin)', e);
            }
          },
          (err) => {
            console.error('❌ NotificationProvider - onSnapshot error for flotas (superadmin)', err);
          }
        );
        unsubscribers.push(unsubFlotasListener);
      }
      // Para admin: escuchar solicitudes de recarga SOLO de su flota
      else if (userRole === 'admin' && userFlotaId) {
        const solicitudesRef = collection(doc(db, 'flotas', userFlotaId), 'solicitudesRecarga');
        
        const unsubRecargasFlota = onSnapshot(
          solicitudesRef,
          (snapshot) => {
            try {
              let totalRecargasPendientes = 0;
              
              snapshot.docs.forEach((doc) => {
                const solicitud = doc.data();
                if (solicitud && solicitud.estado === 'pendiente') {
                  totalRecargasPendientes++;
                }
              });

              // Notificación persistente: conteo de recargas pendientes
              const existingId = persistentRecargaFlotaRef.current;
              if (totalRecargasPendientes > 0) {
                const message = `Hay ${totalRecargasPendientes} solicitud(es) de recarga pendiente(s)`;
                
                if (existingId) {
                  try { deleteNotification(existingId); } catch (e) {}
                }
                
                const newId = addNotification({ message, type: 'solicitud_recarga', title: 'Recargas de Flota Pendientes' });
                persistentRecargaFlotaRef.current = newId;
                
                // Solo reproducir sonido si no es la primera carga
                if (recargasFlotaInitializedRef.current) {
                  playNotificationSound();
                }
                recargasFlotaInitializedRef.current = true;
              } else {
                if (existingId) {
                  try { deleteNotification(existingId); } catch (e) {}
                  persistentRecargaFlotaRef.current = null;
                }
                recargasFlotaInitializedRef.current = true;
              }
            } catch (e) {
              console.error('❌ NotificationProvider - error processing recargas snapshot (admin)', e);
            }
          },
          (err) => {
            console.error('❌ NotificationProvider - onSnapshot error for recargas (admin)', err);
          }
        );
        unsubscribers.push(unsubRecargasFlota);
      }
    } catch (error) {
      console.error('❌ NotificationProvider - error configurando listeners de recarga:', error);
    }

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [userRole, userFlotaId, addNotification, deleteNotification, playNotificationSound]);

  const recargasCountRef = useRef({});

  // Listener para solicitudes de recarga de CONDUCTORES (en trabajadores) SOLO para Admin
  useEffect(() => {
    if (!userRole || userRole !== 'admin' || !userFlotaId) return;

    let unsubscribers = [];

    try {
      // Para admin: escuchar trabajadores de SU flota y luego sus solicitudes en tiempo real
      const unsubTrabajadores = onSnapshot(
        query(collection(db, 'trabajadores'), where('flotaId', '==', userFlotaId)),
        (trabajadoresSnapshot) => {
          try {
            const nestedUnsubscribers = [];

            // Limpiar refs de trabajadores que ya no existen
            const trabajadorIdsActuales = new Set(trabajadoresSnapshot.docs.map(doc => doc.id));
            Object.keys(recargasCountRef.current).forEach(id => {
              if (!trabajadorIdsActuales.has(id)) {
                delete recargasCountRef.current[id];
              }
            });

            // Para cada trabajador de la flota, crear un listener de sus solicitudes
            trabajadoresSnapshot.docs.forEach((trabajadorDoc) => {
              const trabajadorId = trabajadorDoc.id;
              
              const unsubSolicitudes = onSnapshot(
                collection(db, 'trabajadores', trabajadorId, 'billetera', 'data', 'solicitudes_recarga'),
                (solicitudesSnapshot) => {
                  try {
                    let countPendientes = 0;
                    solicitudesSnapshot.docs.forEach((doc) => {
                      const solicitud = doc.data();
                      if (solicitud && solicitud.estado === 'pendiente') {
                        countPendientes++;
                      }
                    });
                    
                    // Actualizar el conteo para este trabajador
                    recargasCountRef.current[trabajadorId] = countPendientes;
                    
                    // Calcular total
                    const totalRecargasConductores = Object.values(recargasCountRef.current).reduce((sum, count) => sum + count, 0);
                    
                    // Actualizar notificación inmediatamente
                    if (totalRecargasConductores > 0) {
                      const message = `Hay ${totalRecargasConductores} solicitud(es) de recarga de conductor(es) pendiente(s)`;
                      
                      const existingId = persistentRecargaConductorRef.current;
                      if (existingId) {
                        try { deleteNotification(existingId); } catch (e) {}
                      }
                      
                      const newId = addNotification({ message, type: 'solicitud_recarga_conductores', title: 'Recargas de Conductores Pendientes' });
                      persistentRecargaConductorRef.current = newId;
                      
                      if (recargasInitializedRef.current) {
                        playNotificationSound();
                      }
                      recargasInitializedRef.current = true;
                    } else {
                      const existingId = persistentRecargaConductorRef.current;
                      if (existingId) {
                        try { deleteNotification(existingId); } catch (e) {}
                        persistentRecargaConductorRef.current = null;
                      }
                      recargasInitializedRef.current = true;
                    }
                  } catch (e) {
                    console.error('❌ Error procesando solicitudes de conductor:', e);
                  }
                }
              );
              nestedUnsubscribers.push(unsubSolicitudes);
            });

            // Limpiar listeners anidados cuando cambien los trabajadores
            return () => {
              nestedUnsubscribers.forEach(unsub => unsub());
            };
          } catch (e) {
            console.error('❌ Error procesando trabajadores (admin):', e);
          }
        }
      );
      unsubscribers.push(unsubTrabajadores);
    } catch (error) {
      console.error('❌ Error configurando listeners de recargas de conductores:', error);
    }

    return () => {
      unsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
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
