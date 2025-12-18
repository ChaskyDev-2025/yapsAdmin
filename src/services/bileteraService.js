import { 
  doc, 
  collection, 
  getDocs, 
  getDoc,
  getDocFromServer,
  updateDoc, 
  addDoc,
  serverTimestamp,
  query,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../data/firebase/firebase";

// ============================================
// CONSTANTES Y RUTAS
// ============================================
const FLOTAS_PATH = "flotas";

// Funciones helper para construir rutas correctamente
// Estructura: flotas/{uidFlota}/billetera/saldo (DOCUMENTO)
//                       - monto: number
//                       - createdAt, updatedAt: timestamps
//                       - transacciones/ (SUBCOLLECCIÓN dentro de saldo)
//                           - {transactionId}: { tipo, monto, ... }

const getBilleteraRef = (flotaId) => doc(db, "flotas", flotaId, "billetera", "saldo");
const getTransaccionesRef = (flotaId) => collection(doc(db, "flotas", flotaId, "billetera", "saldo"), "transacciones");

// ============================================
// FUNCIONES DE LECTURA
// ============================================

/**
 * Obtiene todas las flotas con su información de billetera
 * Estructura: flotas/{uidFlota}/billetera/saldo
 */
export const obtenerFlotas = async () => {
  try {
    const flotasRef = collection(db, FLOTAS_PATH);
    const snapshot = await getDocs(flotasRef);
    
    const flotas = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const flotaId = doc.id;
        const flotaData = doc.data();
        
        // Obtener información de billetera
        try {
          const billeteraRef = getBilleteraRef(flotaId);
          const billeteraSnapshot = await getDoc(billeteraRef);
          
          let saldoData = { monto: 0, createdAt: null, updatedAt: null };
          if (billeteraSnapshot.exists()) {
            saldoData = billeteraSnapshot.data();
          }

          return {
            id: flotaId,
            nombre: flotaData.nombre || "Sin nombre",
            email: flotaData.email || flotaData.contacto || "-",
            contacto: flotaData.contacto || "-",
            estado: flotaData.estado || "activa",
            saldo: saldoData.monto || 0,
            billeteraData: saldoData,
            ...flotaData,
          };
        } catch (err) {
          console.warn(`No se pudo obtener billetera para flota ${flotaId}:`, err);
          return {
            id: flotaId,
            nombre: flotaData.nombre || "Sin nombre",
            email: flotaData.email || flotaData.contacto || "-",
            contacto: flotaData.contacto || "-",
            estado: flotaData.estado || "activa",
            saldo: 0,
            billeteraData: { monto: 0, createdAt: null, updatedAt: null },
            ...flotaData,
          };
        }
      })
    );

    return flotas;
  } catch (error) {
    console.error("Error al obtener flotas:", error);
    throw error;
  }
};

/**
 * Obtiene una flota específica con su información de billetera
 */
export const obtenerFlota = async (flotaId) => {
  try {
    const flotaRef = doc(db, FLOTAS_PATH, flotaId);
    const flotaSnapshot = await getDoc(flotaRef);
    
    if (!flotaSnapshot.exists()) {
      throw new Error("Flota no encontrada");
    }

    const flotaData = flotaSnapshot.data();
    
    // Obtener información de billetera
    const billeteraRef = getBilleteraRef(flotaId);
    const billeteraSnapshot = await getDoc(billeteraRef);
    
    let saldoData = { monto: 0, createdAt: null, updatedAt: null };
    if (billeteraSnapshot.exists()) {
      saldoData = billeteraSnapshot.data();
    }

    return {
      id: flotaId,
      ...flotaData,
      saldo: saldoData.monto || 0,
      billeteraData: saldoData,
    };
  } catch (error) {
    console.error("Error al obtener flota:", error);
    throw error;
  }
};

/**
 * Obtiene el historial de transacciones de una flota
 * Estructura: flotas/{uidFlota}/billetera/saldo/transacciones/
 */
export const obtenerHistorialFlota = async (flotaId) => {
  try {
    const transaccionesRef = getTransaccionesRef(flotaId);
    
    // Primero intentar sin orderBy (sin requerir índice)
    const snapshot = await getDocs(transaccionesRef);
    
    console.log(`[DEBUG] Historial para flota ${flotaId}:`, {
      ruta: `flotas/${flotaId}/billetera/saldo/transacciones`,
      cantidad: snapshot.docs.length,
      datos: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    });
    
    // Ordenar en el cliente
    const transacciones = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })).sort((a, b) => {
      // Ordenar por timestamp descendente
      const timestampA = a.timestamp?.seconds || 0;
      const timestampB = b.timestamp?.seconds || 0;
      return timestampB - timestampA;
    });
    
    return transacciones;
  } catch (error) {
    console.error("Error al obtener historial:", error);
    console.error("[DEBUG] Error details:", {
      mensaje: error.message,
      codigo: error.code
    });
    throw error;
  }
};

/**
 * Obtiene todas las transacciones de todas las flotas (historial consolidado)
 * @returns {Array} Array con todas las transacciones ordenadas por fecha descendente
 */
/**
 * Obtiene todas las transacciones de todas las flotas enriquecidas con datos de solicitudes
 * Lee desde flotas/{flotaId}/billetera/saldo/transacciones
 * Para cada transacción, busca la solicitud relacionada y agrega comprobante
 */
export const obtenerTodasLasTransacciones = async () => {
  try {
    const flotasRef = collection(db, FLOTAS_PATH);
    const flotasSnapshot = await getDocs(flotasRef);
    
    let todasLasTransacciones = [];
    
    // Para cada flota, obtener sus transacciones
    await Promise.all(
      flotasSnapshot.docs.map(async (flotaDoc) => {
        try {
          const flotaId = flotaDoc.id;
          const flotaData = flotaDoc.data();
          
          // Obtener transacciones de este flota
          const transaccionesRef = getTransaccionesRef(flotaId);
          const transaccionesSnapshot = await getDocs(transaccionesRef);
          
          // Para cada transacción, buscar su solicitud relacionada
          await Promise.all(
            transaccionesSnapshot.docs.map(async (transDoc) => {
              try {
                const transaccionData = transDoc.data();
                const solicitudId = transaccionData.solicitudId;
                
                let comprobanteUrl = null;
                let estado = null;
                let nroComprobante = null;
                let razonRechazo = null;
                
                // Si tiene solicitudId, buscar la solicitud para obtener el comprobante
                if (solicitudId) {
                  try {
                    const solicitudRef = doc(db, FLOTAS_PATH, flotaId, "solicitudesRecarga", solicitudId);
                    const solicitudSnapshot = await getDoc(solicitudRef);
                    if (solicitudSnapshot.exists()) {
                      const solicitudData = solicitudSnapshot.data();
                      comprobanteUrl = solicitudData.comprobanteUrl || null;
                      estado = solicitudData.estado || null;
                      nroComprobante = solicitudData.nroComprobante || null;
                      razonRechazo = solicitudData.razonRechazo || null;
                    }
                  } catch (err) {
                    console.warn(`Error obteniendo solicitud ${solicitudId}:`, err);
                  }
                }
                
                todasLasTransacciones.push({
                  id: transDoc.id,
                  flotaId: flotaId,
                  flotaNombre: flotaData.nombre || "Sin nombre",
                  comprobanteUrl,
                  estado,
                  nroComprobante,
                  razonRechazo,
                  ...transaccionData,
                });
              } catch (err) {
                console.warn(`Error procesando transacción:`, err);
              }
            })
          );
        } catch (err) {
          console.warn(`Error obteniendo transacciones de flota ${flotaDoc.id}:`, err);
        }
      })
    );
    
    // Ordenar por timestamp descendente (más recientes primero)
    todasLasTransacciones.sort((a, b) => {
      const timestampA = a.timestamp?.seconds || 0;
      const timestampB = b.timestamp?.seconds || 0;
      return timestampB - timestampA;
    });
    
    console.log("[DEBUG] Todas las transacciones obtenidas:", {
      cantidad: todasLasTransacciones.length,
      datos: todasLasTransacciones
    });
    
    return todasLasTransacciones;
  } catch (error) {
    console.error("Error obteniendo transacciones:", error);
    throw error;
  }
};

/**
 * Obtiene el saldo total en el sistema
 */
export const obtenerSaldoTotal = async () => {
  try {
    const flotas = await obtenerFlotas();
    const total = flotas.reduce((sum, flota) => sum + (flota.saldo || 0), 0);
    return {
      saldoTotal: total,
      flotasActivas: flotas.filter(f => f.estado === "activa").length,
      totalFlotas: flotas.length,
    };
  } catch (error) {
    console.error("Error al calcular saldo total:", error);
    throw error;
  }
};

// ============================================
// FUNCIONES DE ESCRITURA
// ============================================

/**
 * Asigna saldo a una flota (depósito)
 * @param {string} flotaId - ID de la flota
 * @param {number} monto - Monto a asignar
 * @param {string} concepto - Concepto de la transacción
 * @param {string} notas - Notas adicionales
 */
export const asignarSaldo = async (flotaId, monto, concepto = "recarga", notas = "") => {
  try {
    if (monto <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }

    // Obtener saldo actual
    const billeteraRef = getBilleteraRef(flotaId);
    const billeteraSnapshot = await getDoc(billeteraRef);
    
    if (!billeteraSnapshot.exists()) {
      throw new Error("Billetera no encontrada para esta flota");
    }

    const saldoActual = billeteraSnapshot.data().monto || 0;
    const nuevoSaldo = saldoActual + monto;

    // Actualizar saldo en el documento billetera
    await updateDoc(billeteraRef, {
      monto: nuevoSaldo,
      updatedAt: serverTimestamp(),
    });

    // Crear registro de transacción en subcollección
    const transaccion = {
      tipo: "deposito",
      monto: monto,
      concepto: concepto,
      notas: notas,
      saldoAnterior: saldoActual,
      saldoNuevo: nuevoSaldo,
      timestamp: serverTimestamp(),
      fechaRegistro: new Date().toLocaleString("es-ES"),
    };

    const transaccionesRef = getTransaccionesRef(flotaId);
    const docRef = await addDoc(transaccionesRef, transaccion);

    return {
      flotaId,
      transaccionId: docRef.id,
      nuevoSaldo,
      ...transaccion,
    };
  } catch (error) {
    console.error("Error al asignar saldo:", error);
    throw error;
  }
};

/**
 * Retira saldo de una flota
 * @param {string} flotaId - ID de la flota
 * @param {number} monto - Monto a retirar
 * @param {string} concepto - Concepto de la transacción
 * @param {string} notas - Notas adicionales
 */
export const retirarSaldo = async (flotaId, monto, concepto = "retiro", notas = "") => {
  try {
    if (monto <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }

    // Obtener saldo actual
    const billeteraRef = getBilleteraRef(flotaId);
    const billeteraSnapshot = await getDoc(billeteraRef);
    
    if (!billeteraSnapshot.exists()) {
      throw new Error("Billetera no encontrada para esta flota");
    }

    const saldoActual = billeteraSnapshot.data().monto || 0;

    if (saldoActual < monto) {
      throw new Error(`Saldo insuficiente. Disponible: $${saldoActual.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`);
    }

    const nuevoSaldo = saldoActual - monto;

    // Actualizar saldo en el documento billetera
    await updateDoc(billeteraRef, {
      monto: nuevoSaldo,
      updatedAt: serverTimestamp(),
    });

    // Crear registro de transacción en subcollección
    const transaccion = {
      tipo: "retiro",
      monto: -monto,
      concepto: concepto,
      notas: notas,
      saldoAnterior: saldoActual,
      saldoNuevo: nuevoSaldo,
      timestamp: serverTimestamp(),
      fechaRegistro: new Date().toLocaleString("es-ES"),
    };

    const transaccionesRef = getTransaccionesRef(flotaId);
    const docRef = await addDoc(transaccionesRef, transaccion);

    return {
      flotaId,
      transaccionId: docRef.id,
      nuevoSaldo,
      ...transaccion,
    };
  } catch (error) {
    console.error("Error al retirar saldo:", error);
    throw error;
  }
};

// ============================================
// LISTENERS EN TIEMPO REAL
// ============================================

/**
 * Escucha cambios en tiempo real de todas las flotas y sus saldos
 * @param {function} callback - Función que se ejecuta cada vez que hay cambios
 * @returns {function} Función para desuscribirse del listener
 */
export const escucharFlotas = (callback) => {
  try {
    const flotasRef = collection(db, FLOTAS_PATH);

    const unsubscribe = onSnapshot(flotasRef, async (snapshot) => {
      const flotas = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const flotaId = doc.id;
          const flotaData = doc.data();

          try {
            const billeteraRef = getBilleteraRef(flotaId);
            const billeteraSnapshot = await getDoc(billeteraRef);

            let saldoData = { monto: 0, createdAt: null, updatedAt: null };
            if (billeteraSnapshot.exists()) {
              saldoData = billeteraSnapshot.data();
            }

            return {
              id: flotaId,
              nombre: flotaData.nombre || "Sin nombre",
              email: flotaData.email || flotaData.contacto || "-",
              contacto: flotaData.contacto || "-",
              estado: flotaData.estado || "activa",
              saldo: saldoData.monto || 0,
              billeteraData: saldoData,
              ...flotaData,
            };
          } catch (err) {
            console.warn(`No se pudo obtener billetera para flota ${flotaId}:`, err);
            return {
              id: flotaId,
              nombre: flotaData.nombre || "Sin nombre",
              email: flotaData.email || flotaData.contacto || "-",
              contacto: flotaData.contacto || "-",
              estado: flotaData.estado || "activa",
              saldo: 0,
              billeteraData: { monto: 0, createdAt: null, updatedAt: null },
              ...flotaData,
            };
          }
        })
      );

      callback(flotas);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error configurando listener de flotas:", error);
  }
};

/**
 * Escucha cambios en tiempo real del saldo total del sistema
 * Monitorea cambios en la colección de flotas y en sus documentos de billetera
 * @param {function} callback - Función que se ejecuta cada vez que hay cambios
 * @returns {function} Función para desuscribirse del listener
 */
export const escucharSaldoTotal = (callback) => {
  let unsubscribers = [];
  
  try {
    const flotasRef = collection(db, FLOTAS_PATH);

    // Listener principal en flotas (para cambios de estado)
    const unsubscribeFlotas = onSnapshot(flotasRef, async (snapshot) => {
      let saldoTotal = 0;
      let flotasActivas = 0;
      const flotaIds = [];

      // Recolectar IDs de flotas
      snapshot.docs.forEach(doc => {
        flotaIds.push(doc.id);
        if (doc.data().estado === "activa") {
          flotasActivas++;
        }
      });

      // Obtener saldos de todas las flotas
      await Promise.all(
        flotaIds.map(async (flotaId) => {
          try {
            const billeteraRef = getBilleteraRef(flotaId);
            // Usar getDocFromServer para forzar lectura del servidor sin caché
            const billeteraSnapshot = await getDocFromServer(billeteraRef);

            if (billeteraSnapshot.exists()) {
              saldoTotal += billeteraSnapshot.data().monto || 0;
            }
          } catch (err) {
            console.warn(`No se pudo obtener billetera para flota ${flotaId}:`, err);
          }
        })
      );

      callback({
        saldoTotal,
        flotasActivas,
        totalFlotas: snapshot.docs.length,
      });
    });

    unsubscribers.push(unsubscribeFlotas);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  } catch (error) {
    console.error("Error configurando listener de saldo total:", error);
    return () => {};
  }
};

