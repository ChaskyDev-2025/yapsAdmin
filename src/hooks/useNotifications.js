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
    // Usar Web Audio API para crear un sonido más confiable
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Sonido de notificación (dos beeps)
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    // Segundo beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1000;
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.2);
    }, 250);
  } catch (error) {
    console.error("Error reproduciendo sonido:", error);
  }
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
              
              // Aceptamos "pendiente" o estados vacíos
              const isPending = data.estado === "pendiente" || !data.estado;
              if (isPending && (change.type === "added" || change.type === "modified")) {
                addNotification({
                  type: "solicitud_servicio",
                  title: "Nueva solicitud de servicio",
                  message: `Solicitud de ${data.solicitud?.detalles?.servicio || "servicio"} - ${data.solicitud?.detalles?.ciudad || ""}`,
                  data: { id: change.doc.id, ...data },
                });
                playNotificationSound();
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
                const data = change.doc.data();
                
                // Aceptamos cualquier documento con estado "pendiente" que cambie
                if (data.estado === "pendiente" && (change.type === "added" || change.type === "modified")) {
                  addNotification({
                    type: "solicitud_recarga",
                    title: "Nueva solicitud de recarga",
                    message: `${data.nombreFlota || "Flota"} - $${data.monto || "0"}`,
                    data: { 
                      id: change.doc.id, 
                      flotaId: flotaId,
                      ...data 
                    },
                  });
                  playNotificationSound();
                } else if (change.type === "modified" && data.estado === "pendiente") {
                  addNotification({
                    type: "solicitud_recarga",
                    title: "Solicitud de recarga actualizada",
                    message: `${data.nombreFlota || "Flota"} - $${data.monto || "0"}`,
                    data: { 
                      id: change.doc.id, 
                      flotaId: flotaId,
                      ...data 
                    },
                  });
                  playNotificationSound();
                }
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
