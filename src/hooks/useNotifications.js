// src/hooks/useNotifications.js
import { useContext, useEffect, useRef } from "react";
import { NotificationContext } from "../context/NotificationContext";
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
} from "firebase/firestore";
import { db } from "../data/firebase/firebase";
import { useAuth } from "../auth/AuthContext";


const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    // Triada Musical: Do, La, Sol, Fa
    const frequencies = [262, 220, 196, 175];
    
    frequencies.forEach((freq, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.14, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.25);
      
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.25);
    });
  } catch (error) {
    console.error("❌ Error reproduciendo sonido:", error);
  }
};

const lastNotificationSoundTimeRef = { current: 0 };

const playNotificationSoundWithDebounce = () => {
  const now = Date.now();
  // Si ha pasado menos de 500ms desde el último sonido, no reproducir
  if (now - lastNotificationSoundTimeRef.current < 500) {
    return;
  }
  lastNotificationSoundTimeRef.current = now;
  playNotificationSound();
};

export const useNotifications = () => {
  const { addNotification } = useContext(NotificationContext);
  const { userRole } = useAuth();
  const unsubscribersRef = useRef([]);
  const setupDoneRef = useRef(false);

  useEffect(() => {
    if (userRole !== "superadmin") {
      return;
    }

    if (setupDoneRef.current) {
      return;
    }

    setupDoneRef.current = true;

    const setupListeners = async () => {
      try {
        // Limpiar listeners previos
        unsubscribersRef.current.forEach((unsubscribe) => {
          if (typeof unsubscribe === "function") {
            unsubscribe();
          }
        });
        unsubscribersRef.current = [];

        // Listener 1: Solicitudes de servicios (colección global)
        const solicitudesRef = collection(db, "solicitudes");
        
        // Primero obtenemos TODOS los documentos
        const allSnapshot = await getDocs(solicitudesRef);
        allSnapshot.forEach((doc) => {
          // Documentos existentes
        });

        // Luego escuchamos TODOS los cambios en la colección
        const unsubscribeSolicitudes = onSnapshot(
          solicitudesRef,
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              const data = change.doc.data();
              
              // Notificar cuando llega una NUEVA solicitud pendiente
              const isPending = data.estado === "pendiente" || !data.estado;
              if (isPending && (change.type === "added" || change.type === "modified")) {
                addNotification({
                  type: "solicitud_servicio",
                  title: "Nueva solicitud de servicio",
                  message: `Solicitud de ${data.solicitud?.detalles?.servicio || "servicio"} - ${data.solicitud?.detalles?.ciudad || ""}`,
                  data: { id: change.doc.id, ...data },
                });
                // playNotificationSoundWithDebounce(); // DESACTIVADO
                // playNotificationSound(); // DESACTIVADO
              }
              
              // Notificar cuando una solicitud es RECHAZADA
              if (data.estado === "rechazada" && change.type === "modified") {
                addNotification({
                  type: "solicitud_rechazada",
                  title: "Solicitud Rechazada",
                  message: `${data.solicitud?.detalles?.servicio || "Solicitud"} - ${data.solicitud?.detalles?.ciudad || ""} fue rechazada por la flota`,
                  data: { id: change.doc.id, ...data },
                });
              }
            });
          },
          (error) => {
            console.error("❌ Error en listener de solicitudes servicios:", error);
          }
        );
        unsubscribersRef.current.push(unsubscribeSolicitudes);

        // Listener 2: Solicitudes de recarga de billetera
        const flotasRef = collection(db, "flotas");
        
        const flotasSnapshot = await getDocs(flotasRef);

        flotasSnapshot.forEach((flotaDoc) => {
          const flotaId = flotaDoc.id;
          const flotaNombre = flotaDoc.data().nombre || flotaId;

          const solicitudesRecargaRef = collection(
            doc(db, "flotas", flotaId),
            "solicitudesRecarga"
          );

          // Primero obtenemos TODOS los documentos para ver qué estados tienen
          getDocs(solicitudesRecargaRef)
            .then((existentes) => {
              existentes.forEach((d) => {
                // Documentos existentes
              });
            });

          // Luego escuchamos TODOS los cambios en la subcollección
          const unsubscribeRecarga = onSnapshot(
            solicitudesRecargaRef,
            (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                // No generar notificaciones individuales aquí
                // Las notificaciones se manejan desde NotificationContext
              });
            },
            (error) => {
              console.error(`❌ Error en listener de recarga flota ${flotaId}:`, error);
            }
          );
          unsubscribersRef.current.push(unsubscribeRecarga);
        });

        // POLLING adicional para detectar cambios que el listener no capturó
        // (a veces un documento se crea pero el listener lo ve como "modified" después)
        const pollInterval = setInterval(async () => {
          try {
            const flotasRef = collection(db, "flotas");
            const flotasSnap = await getDocs(flotasRef);
            
            flotasSnap.forEach((flotaDoc) => {
              const flotaId = flotaDoc.id;
              const solicitudesRef = collection(
                doc(db, "flotas", flotaId),
                "solicitudesRecarga"
              );
              
              getDocs(solicitudesRef).then((snap) => {
                snap.forEach((docSnap) => {
                  const data = docSnap.data();
                  if (data.estado === "pendiente") {
                    // Ya fue capturado por el listener
                  }
                });
              });
            });
          } catch (error) {
            console.error("Error en polling:", error);
          }
        }, 3000);

        const pollingUnsubscribe = () => {
          clearInterval(pollInterval);
        };
        unsubscribersRef.current.push(pollingUnsubscribe);
      } catch (error) {
        console.error("❌ Error configurando listeners:", error);
        setupDoneRef.current = false;
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      unsubscribersRef.current.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
      unsubscribersRef.current = [];
    };
  }, [userRole, addNotification]);
};
