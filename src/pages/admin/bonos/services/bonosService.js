import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

// ============ REGLAS DE BONOS ============

export const obtenerReglasBonosConductores = async () => {
  try {
    const snapshot = await getDocs(collection(db, "reglasBonosConductores"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return data.sort((a, b) => a.viajes - b.viajes);
  } catch (error) {
    console.error("Error cargando reglas:", error);
    throw error;
  }
};

export const crearReglaBonosConductores = async (viajes, monto) => {
  try {
    const docRef = await addDoc(collection(db, "reglasBonosConductores"), {
      viajes: parseInt(viajes),
      monto: parseFloat(monto),
      activo: true,
      fechaCreacion: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creando regla:", error);
    throw error;
  }
};

export const actualizarReglaBonosConductores = async (reglaId, viajes, monto) => {
  try {
    await updateDoc(doc(db, "reglasBonosConductores", reglaId), {
      viajes: parseInt(viajes),
      monto: parseFloat(monto),
    });
  } catch (error) {
    console.error("Error actualizando regla:", error);
    throw error;
  }
};

export const eliminarReglaBonosConductores = async (reglaId) => {
  try {
    await deleteDoc(doc(db, "reglasBonosConductores", reglaId));
  } catch (error) {
    console.error("Error eliminando regla:", error);
    throw error;
  }
};

// ============ HISTORIAL DE BONOS ============

export const obtenerHistorialBonos = async () => {
  try {
    const viajesTrabajadores = await getDocs(collection(db, "viajes-trabajadores"));
    const todosLosBonos = [];

    for (const docViajesTrab of viajesTrabajadores.docs) {
      const conductorId = docViajesTrab.id;

      // Obtener nombre del conductor
      const conductorDoc = await getDoc(doc(db, "trabajadores", conductorId));
      const conductorNombre =
        conductorDoc.data()?.nombre ||
        conductorDoc.data()?.perfil?.nombre ||
        conductorDoc.data()?.email ||
        "Desconocido";

      // Obtener historialBonos de esta subccolección
      const historialBonosRef = collection(
        db,
        "viajes-trabajadores",
        conductorId,
        "historialBonos"
      );
      const bonosSnapshot = await getDocs(historialBonosRef);

      bonosSnapshot.docs.forEach((bonoDoc) => {
        todosLosBonos.push({
          id: bonoDoc.id,
          conductorId,
          conductorNombre,
          ...bonoDoc.data(),
        });
      });
    }

    // Ordenar por fecha descendente
    return todosLosBonos.sort((a, b) => {
      const fechaA = new Date(a.fechaAplicacion);
      const fechaB = new Date(b.fechaAplicacion);
      return fechaB - fechaA;
    });
  } catch (error) {
    console.error("Error cargando historial de bonos:", error);
    throw error;
  }
};

export const aplicarBonoConductor = async (conductorId, regla, totalViajes) => {
  try {
    // 1. Actualizar saldo en billetera
    const trabajadorRef = doc(db, "trabajadores", conductorId);
    const trabajadorDoc = await getDoc(trabajadorRef);
    const currentSaldo = trabajadorDoc.data().saldoBilletera || 0;
    
    await updateDoc(trabajadorRef, {
      saldoBilletera: currentSaldo + regla.monto,
    });

    // 2. Crear registro en historial de bonos
    const historialRef = collection(
      db,
      "viajes-trabajadores",
      conductorId,
      "historialBonos"
    );
    
    const bonoDoc = await addDoc(historialRef, {
      reglasBonosId: regla.id,
      viajesTotales: totalViajes,
      montoAplicado: regla.monto,
      fechaAplicacion: serverTimestamp(),
    });

    // 3. Resetear contador de viajes
    const viajesConductorRef = doc(db, "viajes-trabajadores", conductorId);
    await updateDoc(viajesConductorRef, {
      totalViajes: 0,
    });

    return bonoDoc.id;
  } catch (error) {
    console.error("Error aplicando bono:", error);
    throw error;
  }
};

// ============ CONDUCTORES Y VIAJES ============

export const obtenerConductoresConViajes = async () => {
  try {
    const conductoresSnapshot = await getDocs(collection(db, "trabajadores"));
    const conductores = conductoresSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Cargar viajes para cada conductor
    const viajesCond = {};
    for (const conductor of conductores) {
      const viajeDocRef = doc(db, "viajes-trabajadores", conductor.id);
      const viajeDoc = await getDoc(viajeDocRef);
      if (viajeDoc.exists()) {
        viajesCond[conductor.id] = viajeDoc.data().totalViajes || 0;
      } else {
        viajesCond[conductor.id] = 0;
      }
    }

    return { conductores, viajesCond };
  } catch (error) {
    console.error("Error cargando conductores:", error);
    throw error;
  }
};

export const obtenerTotalViajesConductor = async (conductorId) => {
  try {
    const viajeDocRef = doc(db, "viajes-trabajadores", conductorId);
    const viajeDoc = await getDoc(viajeDocRef);
    return viajeDoc.exists() ? viajeDoc.data().totalViajes || 0 : 0;
  } catch (error) {
    console.error("Error cargando viajes del conductor:", error);
    throw error;
  }
};

export const obtenerConductoresFlotaConViajes = async (flotaId) => {
  try {
    // Obtener todos los conductores de la flota
    const flotaRef = doc(db, "flotas", flotaId);
    const flotaDoc = await getDoc(flotaRef);
    
    if (!flotaDoc.exists()) {
      console.warn("Flota no encontrada");
      return { conductores: [], viajesCond: {} };
    }

    const flotaData = flotaDoc.data();
    const conductoresIds = flotaData.conductores || [];
    
    // Obtener información de cada conductor
    const conductores = [];
    const viajesCond = {};
    
    for (const conductorId of conductoresIds) {
      try {
        const conductorDoc = await getDoc(doc(db, "trabajadores", conductorId));
        if (conductorDoc.exists()) {
          conductores.push({
            id: conductorId,
            ...conductorDoc.data(),
          });

          // Cargar viajes para este conductor
          const viajeDocRef = doc(db, "viajes-trabajadores", conductorId);
          const viajeDoc = await getDoc(viajeDocRef);
          if (viajeDoc.exists()) {
            viajesCond[conductorId] = viajeDoc.data().totalViajes || 0;
          } else {
            viajesCond[conductorId] = 0;
          }
        }
      } catch (error) {
        console.error(`Error cargando conductor ${conductorId}:`, error);
      }
    }

    return { conductores, viajesCond };
  } catch (error) {
    console.error("Error cargando conductores de la flota:", error);
    throw error;
  }
};
