import { doc, updateDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../data/firebase/firebase";

/**
 * Agrega un ticket a un usuario (trabajador o pasajero) cuando completa un viaje
 * @param {string} userId - ID del usuario (trabajador o pasajero)
 * @param {string} userType - Tipo de usuario: 'trabajador' o 'pasajero'
 * @param {string} viajeTipo - Tipo de viaje: 'General', 'Especial', etc.
 * @param {string} fuente - Fuente del ticket: 'viaje' o 'referido'
 * @returns {Promise<boolean>} true si se agregó exitosamente
 */
export const agregarTicketPorViaje = async (userId, userType, viajeTipo = 'General', fuente = 'viaje') => {
  try {
    const userRef = doc(db, userType === 'trabajador' ? 'trabajadores' : 'pasajeros', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error(`Usuario ${userId} no encontrado en ${userType}`);
      return false;
    }

    const userData = userSnap.data();
    const ticketsData = userData.tickets || {};

    // Inicializar tickets si no existen
    if (!ticketsData[viajeTipo]) {
      ticketsData[viajeTipo] = 0;
    }

    // Incrementar ticket por tipo de viaje
    ticketsData[viajeTipo] += 1;
    ticketsData.updatedAt = new Date().toISOString();

    // Actualizar en Firestore
    await updateDoc(userRef, {
      tickets: ticketsData
    });

    return true;
  } catch (error) {
    console.error('Error al agregar ticket:', error);
    return false;
  }
};

/**
 * Procesa una orden completada y agrega tickets a conductor y pasajero
 * @param {Object} orden - Datos de la orden
 * @returns {Promise<boolean>} true si se procesó exitosamente
 */
export const procesarOrdenCompletada = async (orden) => {
  try {
    if (!orden.uidTaxista || !orden.uidUser) {
      console.warn('Orden sin uidTaxista o uidUser:', orden.id);
      return false;
    }

    // Agregar tickets tanto al conductor como al pasajero con fuente='viaje'
    const resultadoConductor = await agregarTicketPorViaje(orden.uidTaxista, 'trabajador', 'General', 'viaje');
    const resultadoPasajero = await agregarTicketPorViaje(orden.uidUser, 'pasajero', 'General', 'viaje');

    if (resultadoConductor && resultadoPasajero) {
      console.log(`Tickets procesados para orden ${orden.id}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error al procesar orden completada:', error);
    return false;
  }
};

/**
 * Sincroniza tickets de órdenes completadas que aún no han sido procesadas
 * Busca todas las órdenes con estado "completado" y verifica si ya tienen tickets registrados
 * @returns {Promise<Object>} Resumen de órdenes procesadas
 */
export const sincronizarTicketsOrdenes = async () => {
  try {
    const resultado = {
      procesadas: 0,
      errores: 0,
      skipped: 0,
      detalles: []
    };

    // Buscar todas las órdenes completadas
    const ordenesRef = collection(db, 'ordenes');
    const q = query(ordenesRef, where('estado', '==', 'completado'));
    const snapshot = await getDocs(q);

    for (const ordenDoc of snapshot.docs) {
      try {
        const orden = { id: ordenDoc.id, ...ordenDoc.data() };
        console.log(`Procesando orden: ${orden.id}`, { uidTaxista: orden.uidTaxista, uidUser: orden.uidUser });

        if (!orden.uidTaxista || !orden.uidUser) {
          console.warn(`Orden ${orden.id} sin uidTaxista (${orden.uidTaxista}) o uidUser (${orden.uidUser})`);
          resultado.detalles.push(`Orden ${orden.id}: Sin UIDs completos`);
          resultado.skipped++;
          continue;
        }

        // Verificar si la orden ya tiene tickets registrados
        if (orden.ticketsProcesados) {
          console.log(`Orden ${orden.id} ya fue procesada`);
          resultado.skipped++;
          continue;
        }

        // Verificar que los usuarios existan
        const conductorRef = doc(db, 'trabajadores', orden.uidTaxista);
        const conductorSnap = await getDoc(conductorRef);
        
        if (!conductorSnap.exists()) {
          console.warn(`Conductor ${orden.uidTaxista} no encontrado`);
          resultado.detalles.push(`Orden ${orden.id}: Conductor no existe`);
          resultado.errores++;
          continue;
        }

        const pasajeroRef = doc(db, 'pasajeros', orden.uidUser);
        const pasajeroSnap = await getDoc(pasajeroRef);
        
        if (!pasajeroSnap.exists()) {
          console.warn(`Pasajero ${orden.uidUser} no encontrado`);
          resultado.detalles.push(`Orden ${orden.id}: Pasajero no existe`);
          resultado.errores++;
          continue;
        }

        // Procesar tickets para conductor
        const conductorData = conductorSnap.data();
        const ticketsConductor = conductorData.tickets || {};
        if (!ticketsConductor.General) ticketsConductor.General = 0;
        ticketsConductor.General += 1;
        ticketsConductor.updatedAt = new Date().toISOString();

        await updateDoc(conductorRef, { 
          tickets: ticketsConductor
        });
        console.log(`Ticket agregado a conductor ${orden.uidTaxista} (por viaje)`);

        // Procesar tickets para pasajero
        const pasajeroData = pasajeroSnap.data();
        const ticketsPasajero = pasajeroData.tickets || {};
        if (!ticketsPasajero.General) ticketsPasajero.General = 0;
        ticketsPasajero.General += 1;
        ticketsPasajero.updatedAt = new Date().toISOString();

        await updateDoc(pasajeroRef, { 
          tickets: ticketsPasajero
        });
        console.log(`Ticket agregado a pasajero ${orden.uidUser} (por viaje)`);

        // Marcar la orden como procesada
        await updateDoc(doc(db, 'ordenes', orden.id), {
          ticketsProcesados: true,
          fechaTicketsProcesados: new Date().toISOString()
        });

        resultado.procesadas++;
        resultado.detalles.push(`Orden ${orden.id}: OK`);
        console.log(`Orden ${orden.id} procesada exitosamente`);

      } catch (error) {
        console.error(`Error procesando orden:`, error);
        resultado.detalles.push(`Error: ${error.message}`);
        resultado.errores++;
      }
    }

    return resultado;
  } catch (error) {
    console.error('Error en sincronizarTicketsOrdenes:', error);
    return { procesadas: 0, errores: 1, skipped: 0, detalles: [error.message] };
  }
};

/**
 * Obtiene los tickets de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} userType - Tipo de usuario: 'trabajador' o 'pasajero'
 * @returns {Promise<number>} Total de tickets
 */
export const obtenerTotalTickets = async (userId, userType) => {
  try {
    const userRef = doc(db, userType === 'trabajador' ? 'trabajadores' : 'pasajeros', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return 0;
    }

    const ticketsData = userSnap.data().tickets || {};
    let total = 0;

    Object.keys(ticketsData).forEach(key => {
      if (key !== 'updatedAt' && typeof ticketsData[key] === 'number') {
        total += ticketsData[key];
      }
    });

    return total;
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    return 0;
  }
};

/**
 * DEBUG: Obtiene información de todas las órdenes para diagnosticar problemas
 * @returns {Promise<Object>} Resumen de órdenes en la base de datos
 */
export const debugOrdenes = async () => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const snapshot = await getDocs(ordenesRef);
    
    console.log(`Total de órdenes en BD: ${snapshot.docs.length}`);
    
    const estadoCounts = {};
    const issues = [];
    
    snapshot.docs.forEach(doc => {
      const orden = doc.data();
      const estado = orden.estado || 'sin_estado';
      estadoCounts[estado] = (estadoCounts[estado] || 0) + 1;
      
      // Detectar problemas
      if (!orden.uidTaxista || !orden.uidUser) {
        issues.push(`Orden ${doc.id}: Falta uidTaxista (${orden.uidTaxista}) o uidUser (${orden.uidUser})`);
      }
      if (!orden.estado) {
        issues.push(`Orden ${doc.id}: Sin campo 'estado'`);
      }
    });
    
    console.log('Órdenes por estado:', estadoCounts);
    if (issues.length > 0) {
      console.log('Problemas encontrados:', issues);
    }
    
    return {
      total: snapshot.docs.length,
      porEstado: estadoCounts,
      issues: issues
    };
  } catch (error) {
    console.error('Error en debugOrdenes:', error);
    return { total: 0, porEstado: {}, issues: [error.message] };
  }
};

/**
 * MANTENIMIENTO: Reinicia el procesamiento de tickets borrando el flag ticketsProcesados
 * Permite reprocesar órdenes completadas
 * @returns {Promise<Object>} Resumen de órdenes reiniciadas
 */
export const resetearTicketsOrdenes = async () => {
  try {
    const ordenesRef = collection(db, 'ordenes');
    const q = query(ordenesRef, where('estado', '==', 'completado'));
    const snapshot = await getDocs(q);

    let reiniciadas = 0;
    let errores = 0;

    for (const doc of snapshot.docs) {
      try {
        if (doc.data().ticketsProcesados) {
          await updateDoc(doc.ref, {
            ticketsProcesados: false
          });
          reiniciadas++;
        }
      } catch (error) {
        console.error(`Error reiniciando orden ${doc.id}:`, error);
        errores++;
      }
    }

    return { reiniciadas, errores, total: snapshot.docs.length };
  } catch (error) {
    console.error('Error en resetearTicketsOrdenes:', error);
    return { reiniciadas: 0, errores: 1, total: 0 };
  }
};
