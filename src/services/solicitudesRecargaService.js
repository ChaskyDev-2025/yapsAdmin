import {
  doc,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../data/firebase/firebase";

// ============================================
// CONSTANTES Y RUTAS
// ============================================
const FLOTAS_PATH = "flotas";

const getSolicitudesRef = (flotaId) =>
  collection(doc(db, FLOTAS_PATH, flotaId), "solicitudesRecarga");

const getBilleteraRef = (flotaId) =>
  doc(db, FLOTAS_PATH, flotaId, "billetera", "saldo");

const getTransaccionesRef = (flotaId) =>
  collection(doc(db, FLOTAS_PATH, flotaId, "billetera", "saldo"), "transacciones");

// ============================================
// FUNCIONES DE LECTURA
// ============================================

/**
 * Obtiene todas las solicitudes de recarga de una flota
 */
export const obtenerSolicitudesFlota = async (flotaId) => {
  try {
    const solicitudesRef = getSolicitudesRef(flotaId);
    const q = query(solicitudesRef, orderBy("fechaSolicitud", "desc"));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    throw error;
  }
};

/**
 * Obtiene todas las solicitudes pendientes del sistema
 */
export const obtenerSolicitudesPendientes = async () => {
  try {
    const flotasRef = collection(db, FLOTAS_PATH);
    const flotasSnapshot = await getDocs(flotasRef);

    const todasLasSolicitudes = [];

    // Procesar cada flota de forma más robusta
    for (const flotaDoc of flotasSnapshot.docs) {
      try {
        const flotaId = flotaDoc.id;
        const flotaData = flotaDoc.data();
        const solicitudesRef = getSolicitudesRef(flotaId);
        const q = query(solicitudesRef, where("estado", "==", "pendiente"));

        const solicitudesSnapshot = await getDocs(q);

        solicitudesSnapshot.docs.forEach((solicitudDoc) => {
          todasLasSolicitudes.push({
            id: solicitudDoc.id,
            flotaId,
            flotaNombre: flotaData.nombre || "Sin nombre",
            ...solicitudDoc.data(),
          });
        });
      } catch (error) {
        console.error(`Error obteniendo solicitudes de flota ${flotaDoc.id}:`, error);
        // Continuar con la siguiente flota
      }
    }

    // Ordenar por fecha descendente
    return todasLasSolicitudes.sort(
      (a, b) => b.fechaSolicitud - a.fechaSolicitud
    );
  } catch (error) {
    console.error("Error al obtener solicitudes pendientes:", error);
    return []; // Retornar array vacío en lugar de lanzar error
  }
};

/**
 * Escucha cambios en tiempo real de solicitudes pendientes
 * @param {function} callback - Función que se ejecuta cada vez que hay cambios
 * @returns {function} Función para desuscribirse del listener
 */
export const escucharSolicitudesPendientes = (callback) => {
  let unsubscribers = [];
  
  try {
    const flotasRef = collection(db, FLOTAS_PATH);
    
    // Obtener flotas una sola vez y luego escuchar cada una
    getDocs(flotasRef).then((flotasSnapshot) => {
      flotasSnapshot.docs.forEach((flotaDoc) => {
        const flotaId = flotaDoc.id;
        const flotaData = flotaDoc.data();
        const solicitudesRef = getSolicitudesRef(flotaId);
        const q = query(solicitudesRef, where("estado", "==", "pendiente"));
        
        // Listener en tiempo real para cada flota
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const solicitudes = [];
          
          snapshot.docs.forEach((solicitudDoc) => {
            solicitudes.push({
              id: solicitudDoc.id,
              flotaId,
              flotaNombre: flotaData.nombre || "Sin nombre",
              ...solicitudDoc.data(),
            });
          });
          
          callback(solicitudes);
        }, (error) => {
          console.error(`Error escuchando solicitudes de flota ${flotaId}:`, error);
        });
        
        unsubscribers.push(unsubscribe);
      });
    }).catch((error) => {
      console.error("Error obteniendo flotas:", error);
    });
  } catch (error) {
    console.error("Error configurando listener de solicitudes:", error);
  }
  
  // Retornar función para desuscribirse de todos los listeners
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

/**
 * Escucha cambios en tiempo real de solicitudes de una flota específica
 * @param {string} flotaId - ID de la flota
 * @param {function} callback - Función que se ejecuta cada vez que hay cambios
 * @returns {function} Función para desuscribirse del listener
 */
export const escucharSolicitudesFlota = (flotaId, callback) => {
  try {
    const solicitudesRef = getSolicitudesRef(flotaId);
    const q = query(solicitudesRef, orderBy("fechaSolicitud", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudes = [];
      
      snapshot.docs.forEach((solicitudDoc) => {
        solicitudes.push({
          id: solicitudDoc.id,
          ...solicitudDoc.data(),
        });
      });
      
      callback(solicitudes);
    }, (error) => {
      console.error("Error escuchando solicitudes de flota:", error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Error configurando listener de solicitudes de flota:", error);
  }
};

/**
 * Obtiene el historial de transacciones de una flota
 */
export const obtenerHistorialTransacciones = async (flotaId) => {
  try {
    const transaccionesRef = getTransaccionesRef(flotaId);
    
    // Primero verificamos si existen transacciones
    const allSnapshot = await getDocs(transaccionesRef);
    
    if (allSnapshot.empty) {
      return [];
    }

    // Si hay transacciones, ordenamos
    const q = query(transaccionesRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error al obtener historial:", error);
    // Retornar array vacío en caso de error en lugar de fallar
    return [];
  }
};

// ============================================
// FUNCIONES DE ESCRITURA
// ============================================

/**
 * Crea una solicitud de recarga
 */
export const crearSolicitudRecarga = async (
  flotaId,
  monto,
  concepto = "recarga",
  notas = ""
) => {
  try {
    if (monto <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }

    const solicitud = {
      monto,
      concepto,
      notas,
      estado: "pendiente",
      fechaSolicitud: serverTimestamp(),
      fechaAprobacion: null,
      respondidoPor: null,
      razonRechazo: null,
    };

    const solicitudesRef = getSolicitudesRef(flotaId);
    const docRef = await addDoc(solicitudesRef, solicitud);

    return {
      id: docRef.id,
      ...solicitud,
    };
  } catch (error) {
    console.error("Error al crear solicitud:", error);
    throw error;
  }
};

/**
 * Aprueba una solicitud de recarga y actualiza el saldo
 */
export const aprobarSolicitud = async (
  flotaId,
  solicitudId,
  adminId
) => {
  try {
    const batch = writeBatch(db);

    // Obtener la solicitud
    const solicitudRef = doc(getSolicitudesRef(flotaId), solicitudId);
    const solicitudSnapshot = await getDoc(solicitudRef);

    if (!solicitudSnapshot.exists()) {
      throw new Error("Solicitud no encontrada");
    }

    const solicitud = solicitudSnapshot.data();

    if (solicitud.estado !== "pendiente") {
      throw new Error("La solicitud no está pendiente");
    }

    // Obtener saldo actual
    const billeteraRef = getBilleteraRef(flotaId);
    const billeteraSnapshot = await getDoc(billeteraRef);

    if (!billeteraSnapshot.exists()) {
      throw new Error("Billetera no encontrada");
    }

    const saldoActual = billeteraSnapshot.data().monto || 0;
    const nuevoSaldo = saldoActual + solicitud.monto;

    // Actualizar solicitud como aprobada
    batch.update(solicitudRef, {
      estado: "aprobada",
      fechaAprobacion: serverTimestamp(),
      respondidoPor: adminId,
    });

    // Actualizar saldo
    batch.update(billeteraRef, {
      monto: nuevoSaldo,
      updatedAt: serverTimestamp(),
    });

    // Crear transacción
    const transaccion = {
      tipo: "deposito",
      monto: solicitud.monto,
      concepto: solicitud.concepto,
      notas: solicitud.notas || "Recarga aprobada",
      saldoAnterior: saldoActual,
      saldoNuevo: nuevoSaldo,
      timestamp: serverTimestamp(),
      fechaRegistro: new Date().toLocaleString("es-ES"),
      solicitudId: solicitudId,
    };

    const transaccionesRef = getTransaccionesRef(flotaId);
    const transaccionDocRef = doc(transaccionesRef);
    batch.set(transaccionDocRef, transaccion);

    await batch.commit();

    return {
      solicitudId,
      nuevoSaldo,
      monto: solicitud.monto,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Rechaza una solicitud de recarga
 */
export const rechazarSolicitud = async (
  flotaId,
  solicitudId,
  adminId,
  razonRechazo = ""
) => {
  try {
    const solicitudRef = doc(getSolicitudesRef(flotaId), solicitudId);
    const solicitudSnapshot = await getDoc(solicitudRef);

    if (!solicitudSnapshot.exists()) {
      throw new Error("Solicitud no encontrada");
    }

    const solicitud = solicitudSnapshot.data();

    if (solicitud.estado !== "pendiente") {
      throw new Error("La solicitud no está pendiente");
    }

    await updateDoc(solicitudRef, {
      estado: "rechazada",
      fechaAprobacion: serverTimestamp(),
      respondidoPor: adminId,
      razonRechazo: razonRechazo,
    });

    return {
      solicitudId,
      estado: "rechazada",
    };
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    throw error;
  }
};

// ============================================
// LISTENERS EN TIEMPO REAL - FLOTA ADMIN
// ============================================

/**
 * Escucha cambios en tiempo real del historial de transacciones de una flota
 * @param {string} flotaId - ID de la flota
 * @param {function} callback - Función que se ejecuta cada vez que hay cambios
 * @returns {function} Función para desuscribirse del listener
 */
export const escucharHistorialTransacciones = (flotaId, callback) => {
  try {
    const transaccionesRef = getTransaccionesRef(flotaId);
    const q = query(transaccionesRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transacciones = [];

      snapshot.docs.forEach((doc) => {
        transacciones.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      callback(transacciones);
    }, (error) => {
      console.error("Error escuchando historial de transacciones:", error);
      callback([]); // Retornar array vacío en error
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error configurando listener de transacciones:", error);
  }
};

/**
 * Escucha cambios en tiempo real del saldo de una flota
 * @param {string} flotaId - ID de la flota
 * @param {function} callback - Función que se ejecuta cada vez que hay cambios
 * @returns {function} Función para desuscribirse del listener
 */
export const escucharSaldoFlota = (flotaId, callback) => {
  try {
    const saldoRef = doc(db, "flotas", flotaId, "billetera", "saldo");

    const unsubscribe = onSnapshot(saldoRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const saldo = docSnapshot.data().monto || 0;
        callback(saldo);
      } else {
        callback(0);
      }
    }, (error) => {
      callback(0);
    });

    return unsubscribe;
  } catch (error) {
    return () => {};
  }
};
