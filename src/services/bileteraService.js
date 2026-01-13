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
            habilitado: flotaData.habilitado !== undefined ? flotaData.habilitado : true,
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
            habilitado: flotaData.habilitado !== undefined ? flotaData.habilitado : true,
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
    
    // Obtener todas las solicitudes para buscar comprobantes
    let solicitudesMap = {};
    try {
      const solicitudesRef = collection(db, FLOTAS_PATH, flotaId, "solicitudesRecarga");
      const solicitudesSnapshot = await getDocs(solicitudesRef);
      solicitudesMap = {};
      solicitudesSnapshot.docs.forEach(doc => {
        solicitudesMap[doc.id] = doc.data();
      });
    } catch (err) {
      console.warn(`Error obteniendo solicitudes para flota ${flotaId}:`, err);
    }
    
    // Enriquecer transacciones con datos de solicitudes (comprobantes)
    const transacciones = snapshot.docs.map(doc => {
      const transaccionData = doc.data();
      const solicitudId = transaccionData.solicitudId;
      
      let comprobanteUrl = null;
      let estado = null;
      let nroComprobante = null;
      let razonRechazo = null;
      
      // Primero intentar con solicitudId exacto
      if (solicitudId && solicitudesMap[solicitudId]) {
        const solicitudData = solicitudesMap[solicitudId];
        comprobanteUrl = solicitudData.comprobanteUrl || null;
        estado = solicitudData.estado || null;
        nroComprobante = solicitudData.nroComprobante || null;
        razonRechazo = solicitudData.razonRechazo || null;
      } else if (!solicitudId) {
        // Si no tiene solicitudId, buscar por monto y timestamp similar
        for (const [solId, solicitud] of Object.entries(solicitudesMap)) {
          // Comparar monto y que los timestamps sean cercanos (dentro de 5 minutos)
          if (solicitud.monto === transaccionData.monto) {
            const solTimestamp = solicitud.fechaSolicitud?.seconds || 0;
            const transTimestamp = transaccionData.timestamp?.seconds || 0;
            const diferencia = Math.abs(solTimestamp - transTimestamp);
            
            if (diferencia < 300) { // 5 minutos
              comprobanteUrl = solicitud.comprobanteUrl || null;
              estado = solicitud.estado || null;
              nroComprobante = solicitud.nroComprobante || null;
              razonRechazo = solicitud.razonRechazo || null;
              break;
            }
          }
        }
      }
      
      return {
        id: doc.id,
        comprobanteUrl,
        estado,
        nroComprobante,
        razonRechazo,
        ...transaccionData,
      };
    });
    
    // Ordenar por timestamp descendente
    transacciones.sort((a, b) => {
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
      flotasActivas: flotas.filter(f => f.habilitado !== false).length,
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
              habilitado: flotaData.habilitado !== undefined ? flotaData.habilitado : true,
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
              habilitado: flotaData.habilitado !== undefined ? flotaData.habilitado : true,
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
  let flotaIds = [];
  let billeteraUnsubscribers = {};
  
  try {
    const flotasRef = collection(db, FLOTAS_PATH);

    // Listener principal en flotas (para detectar nuevas flotas o cambios de estado)
    const unsubscribeFlotas = onSnapshot(flotasRef, async (snapshot) => {
      let saldoTotal = 0;
      let flotasActivas = 0;
      const nuevasFlotaIds = [];

      // Recolectar IDs de flotas
      snapshot.docs.forEach(doc => {
        nuevasFlotaIds.push(doc.id);
        if (doc.data().habilitado !== false) {
          flotasActivas++;
        }
      });

      // Limpiar listeners de flotas eliminadas
      for (const flotaId of flotaIds) {
        if (!nuevasFlotaIds.includes(flotaId) && billeteraUnsubscribers[flotaId]) {
          billeteraUnsubscribers[flotaId]();
          delete billeteraUnsubscribers[flotaId];
        }
      }

      flotaIds = nuevasFlotaIds;

      // Configurar listeners para billeteras de flotas que no tienen
      const billet_promises = flotaIds.map((flotaId) => {
        return new Promise((resolve) => {
          // Si ya tiene listener, no crear otro
          if (billeteraUnsubscribers[flotaId]) {
            resolve();
            return;
          }

          try {
            const billeteraRef = getBilleteraRef(flotaId);
            
            // Crear listener para esta billetera específica
            billeteraUnsubscribers[flotaId] = onSnapshot(
              billeteraRef,
              () => {
                // Cuando cambia cualquier billetera, recalcular total
                recalcularSaldoTotal();
              },
              (err) => {
                console.warn(`Error en listener de billetera para flota ${flotaId}:`, err);
                resolve();
              }
            );
            resolve();
          } catch (err) {
            console.warn(`Error configurando listener de billetera para flota ${flotaId}:`, err);
            resolve();
          }
        });
      });

      await Promise.all(billet_promises);
      recalcularSaldoTotal();

      function recalcularSaldoTotal() {
        Promise.all(
          flotaIds.map(async (flotaId) => {
            try {
              const billeteraRef = getBilleteraRef(flotaId);
              const billeteraSnapshot = await getDoc(billeteraRef);
              return billeteraSnapshot.exists() ? billeteraSnapshot.data().monto || 0 : 0;
            } catch (err) {
              console.warn(`No se pudo obtener billetera para flota ${flotaId}:`, err);
              return 0;
            }
          })
        ).then((saldos) => {
          const total = saldos.reduce((sum, monto) => sum + monto, 0);
          const activas = snapshot.docs.filter(doc => doc.data().habilitado !== false).length;
          
          callback({
            saldoTotal: total,
            flotasActivas: activas,
            totalFlotas: snapshot.docs.length,
          });
        });
      }
    });

    unsubscribers.push(unsubscribeFlotas);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      Object.values(billeteraUnsubscribers).forEach(unsub => {
        if (unsub) unsub();
      });
    };
  } catch (error) {
    console.error("Error configurando listener de saldo total:", error);
    return () => {};
  }
};

// Obtener solo las solicitudes de recarga a flotas (aprobadas por superadmin)
export const obtenerSolicitudesRecargaFlotas = async () => {
  try {
    const flotasRef = collection(db, FLOTAS_PATH);
    const flotasSnapshot = await getDocs(flotasRef);
    
    let todasLasSolicitudes = [];
    
    // Procesando flotas
    
    // Para cada flota, obtener sus solicitudes de recarga
    await Promise.all(
      flotasSnapshot.docs.map(async (flotaDoc) => {
        try {
          const flotaId = flotaDoc.id;
          const flotaData = flotaDoc.data();
          
          // Obtener solicitudes de recarga de esta flota
          const solicitudesRef = collection(db, FLOTAS_PATH, flotaId, "solicitudesRecarga");
          const solicitudesSnapshot = await getDocs(solicitudesRef);
          
          // Procesando solicitudes de flota
          
          solicitudesSnapshot.docs.forEach((solicDoc) => {
            const solicitudData = solicDoc.data();
            
            todasLasSolicitudes.push({
              id: solicDoc.id,
              flotaId: flotaId,
              flotaNombre: flotaData.nombre || "Sin nombre",
              comprobanteUrl: solicitudData.comprobanteUrl || null,
              concepto: solicitudData.concepto || "recarga",
              estado: solicitudData.estado || null,
              nroComprobante: solicitudData.nroComprobante || null,
              monto: solicitudData.monto || 0,
              notas: solicitudData.notas || "",
              razonRechazo: solicitudData.razonRechazo || null,
              respondidoPor: solicitudData.respondidoPor || null,
              fechaSolicitud: solicitudData.fechaSolicitud || null,
              fechaAprobacion: solicitudData.fechaAprobacion || null,
              ...solicitudData, // Incluir todos los campos por si hay más
            });
          });
        } catch (err) {
          console.error(`Error obteniendo solicitudes de recarga de flota ${flotaDoc.id}:`, err);
        }
      })
    );
    
    // Total de solicitudes obtenidas
    return todasLasSolicitudes;
  } catch (error) {
    console.error("Error al obtener solicitudes de recarga de flotas:", error);
    return [];
  }
};


