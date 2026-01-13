import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  query,
  where,
  onSnapshot,
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

export const obtenerHistorialBonosPorFlota = async (flotaId) => {
  try {
    if (!flotaId) {
      console.warn("No se proporcionó flotaId");
      return [];
    }

    // Obtener todos los conductores de la flota
    const q = query(
      collection(db, "trabajadores"),
      where("flotaId", "==", flotaId)
    );
    
    const conductoresSnapshot = await getDocs(q);
    const todosLosBonos = [];

    // Para cada conductor de la flota, obtener su historial de bonos
    for (const conductorDoc of conductoresSnapshot.docs) {
      const conductorId = conductorDoc.id;
      const conductorData = conductorDoc.data();
      
      // Obtener nombre del conductor
      const conductorNombre = 
        conductorData.nombre || 
        conductorData.perfil?.nombre || 
        conductorData.perfil?.name || 
        conductorData.name || 
        conductorData.email || 
        "Sin nombre";

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
    console.error("Error cargando historial de bonos de la flota:", error);
    throw error;
  }
};

export const aplicarBonoConductor = async (conductorId, regla, totalViajes, flotaId) => {
  try {
    // 1. Descontar de la billetera de la flota
    if (flotaId) {
      const flotaBileteraRef = doc(db, "flotas", flotaId, "billetera", "saldo");
      const flotaBileteraDoc = await getDoc(flotaBileteraRef);
      const flotaSaldoActual = flotaBileteraDoc.exists() ? parseFloat(flotaBileteraDoc.data().monto || 0) : 0;
      
      // Saldo flota actual
      
      const nuevoSaldoFlota = flotaSaldoActual - parseFloat(regla.monto);
      
      await updateDoc(flotaBileteraRef, {
        monto: nuevoSaldoFlota,
        updatedAt: serverTimestamp(),
      });
      
      // Saldo flota actualizado
    }

    // 2. Asignar a la billetera del trabajador
    const trabajadorBileteraRef = doc(db, "trabajadores", conductorId, "billetera", "data");
    const trabajadorBileteraDoc = await getDoc(trabajadorBileteraRef);
    const trabajadorSaldoActual = trabajadorBileteraDoc.exists() ? parseFloat(trabajadorBileteraDoc.data().saldo || 0) : 0;
    
    // Saldo trabajador actual
    
    const nuevoSaldoTrabajador = trabajadorSaldoActual + parseFloat(regla.monto);
    
    await updateDoc(trabajadorBileteraRef, {
      saldo: nuevoSaldoTrabajador,
      updatedAt: serverTimestamp(),
    });
    
    // Saldo trabajador actualizado

    // 3. Crear registro en historial de bonos
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
      flotaId: flotaId,
    });

    // 4. Resetear contador de viajes
    const viajesConductorRef = doc(db, "viajes-trabajadores", conductorId);
    await updateDoc(viajesConductorRef, {
      totalViajes: 0,
    });

    // Bono aplicado exitosamente
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

export const obtenerTrabajadoresActivosConViajes = async () => {
  try {
    // Obtener todos los trabajadores activos
    const q = query(
      collection(db, "trabajadores"),
      where("activo", "==", true)
    );
    
    const trabajadoresSnapshot = await getDocs(q);
    const trabajadores = [];

    // Para cada trabajador, obtener sus viajes y datos
    for (const trabajadorDoc of trabajadoresSnapshot.docs) {
      const trabajadorId = trabajadorDoc.id;
      const trabajadorData = trabajadorDoc.data();
      
      // Obtener nombre y foto
      const nombre = 
        trabajadorData.nombre || 
        trabajadorData.perfil?.nombre || 
        trabajadorData.perfil?.name || 
        trabajadorData.name || 
        trabajadorData.email || 
        "Sin nombre";

      const foto = 
        trabajadorData.perfil?.fotoUrl || 
        trabajadorData.perfil?.photoUrl || 
        trabajadorData.fotoUrl || 
        trabajadorData.photoURL || 
        "";

      const flota = trabajadorData.flotaNombre || "Sin flota";
      const flotaId = trabajadorData.flotaId || "";

      // Obtener total de viajes
      let totalViajes = 0;
      try {
        const viajeDocRef = doc(db, "viajes-trabajadores", trabajadorId);
        const viajeDoc = await getDoc(viajeDocRef);
        if (viajeDoc.exists()) {
          totalViajes = viajeDoc.data().totalViajes || 0;
        }
      } catch (error) {
        console.error(`Error cargando viajes del trabajador ${trabajadorId}:`, error);
      }

      trabajadores.push({
        id: trabajadorId,
        nombre,
        foto,
        flota,
        flotaId,
        totalViajes,
        email: trabajadorData.email || "",
      });
    }

    // Ordenar por total de viajes descendente
    return trabajadores.sort((a, b) => b.totalViajes - a.totalViajes);
  } catch (error) {
    console.error("Error cargando trabajadores activos con viajes:", error);
    throw error;
  }
};

export const obtenerConductoresFlotaConViajes = async (flotaId) => {
  try {
    if (!flotaId) {
      console.warn("No se proporcionó flotaId");
      return { conductores: [], viajesCond: {} };
    }

    // Buscando conductores para flotaId

    // Obtener todos los conductores que pertenecen a esta flota
    // Buscar en la colección trabajadores donde flotaId === el id de la flota
    const q = query(
      collection(db, "trabajadores"),
      where("flotaId", "==", flotaId)
    );
    
    const conductoresSnapshot = await getDocs(q);
    // Conductores encontrados

    const conductores = conductoresSnapshot.docs.map((doc) => {
      const data = doc.data();
      // Obtener nombre de la misma forma que en radiotaxis
      const nombre = data.nombre || data.perfil?.nombre || data.perfil?.name || data.name || data.email || "Sin nombre";
      
      return {
        id: doc.id,
        nombre,
        email: data.perfil?.email || data.email || "Sin email",
        ...data,
      };
    });

    // Datos de conductores procesados

    // Cargar viajes para cada conductor
    const viajesCond = {};
    for (const conductor of conductores) {
      try {
        const viajeDocRef = doc(db, "viajes-trabajadores", conductor.id);
        const viajeDoc = await getDoc(viajeDocRef);
        if (viajeDoc.exists()) {
          viajesCond[conductor.id] = viajeDoc.data().totalViajes || 0;
        } else {
          viajesCond[conductor.id] = 0;
        }
      } catch (error) {
        console.error(`Error cargando viajes del conductor ${conductor.id}:`, error);
        viajesCond[conductor.id] = 0;
      }
    }

    // Viajes de conductores procesados
    return { conductores, viajesCond };
  } catch (error) {
    console.error("Error cargando conductores de la flota:", error);
    throw error;
  }
};

// Nueva función con snapshot para tiempo real (más rápido para el hook)
export const onConductoresFlotaConViajes = (flotaId, callback) => {
  try {
    if (!flotaId) {
      console.warn("No se proporcionó flotaId");
      callback({ conductores: [], viajesCond: {} });
      return () => {};
    }

    // Escuchando conductores para flotaId

    const q = query(
      collection(db, "trabajadores"),
      where("flotaId", "==", flotaId)
    );

    // Usar onSnapshot para obtener datos en tiempo real
    const unsubscribe = onSnapshot(
      q,
      async (conductoresSnapshot) => {
        // Conductores encontrados

        const conductores = conductoresSnapshot.docs.map((doc) => {
          const data = doc.data();
          const nombre = data.nombre || data.perfil?.nombre || data.perfil?.name || data.name || data.email || "Sin nombre";
          
          return {
            id: doc.id,
            nombre,
            email: data.perfil?.email || data.email || "Sin email",
            ...data,
          };
        });

        // Cargar viajes para cada conductor en paralelo
        const viajsPromises = conductores.map(async (conductor) => {
          try {
            const viajeDocRef = doc(db, "viajes-trabajadores", conductor.id);
            const viajeDoc = await getDoc(viajeDocRef);
            return {
              id: conductor.id,
              viajes: viajeDoc.exists() ? viajeDoc.data().totalViajes || 0 : 0,
            };
          } catch (error) {
            console.error(`Error cargando viajes del conductor ${conductor.id}:`, error);
            return { id: conductor.id, viajes: 0 };
          }
        });

        const viajsResults = await Promise.all(viajsPromises);
        const viajesCond = viajsResults.reduce((acc, item) => {
          acc[item.id] = item.viajes;
          return acc;
        }, {});

        // Viajes de conductores procesados
        callback({ conductores, viajesCond });
      },
      (error) => {
        console.error("Error escuchando conductores:", error);
        callback({ conductores: [], viajesCond: {} });
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error configurando listener de conductores:", error);
    callback({ conductores: [], viajesCond: {} });
    return () => {};
  }
};
