import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useHistorialPasajero = (userId) => {
  const [viajes, setViajes] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [taxistasMap, setTaxistasMap] = useState({});

  // Cargar datos del taxista
  const cargarNombreTaxista = useCallback(async (uidTaxista) => {
    if (taxistasMap[uidTaxista]) {
      return taxistasMap[uidTaxista];
    }

    try {
      const docRef = doc(db, "trabajadores", uidTaxista);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const taxista = docSnap.data();
        const nombre = taxista.perfil?.nombre || taxista.perfil?.name || taxista.nombre || taxista.name || "Sin nombre";
        setTaxistasMap(prev => ({
          ...prev,
          [uidTaxista]: nombre
        }));
        return nombre;
      }

      return "-";
    } catch (error) {
      console.error("Error cargando taxista:", error);
      return "-";
    }
  }, [taxistasMap]);

  // Formatear fecha
  const formatearFecha = useCallback((timestamp) => {
    if (!timestamp) return "-";
    try {
      let fecha;
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        fecha = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        fecha = timestamp;
      } else if (typeof timestamp === "string") {
        fecha = new Date(timestamp);
      } else if (typeof timestamp === "number") {
        fecha = new Date(timestamp);
      } else {
        return "-";
      }

      return fecha.toLocaleDateString("es-BO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      console.error("Error formateando fecha:", e);
      return "-";
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setViajes([]);
      setEnvios([]);
      setCargando(false);
      return;
    }

    let cancel = false;

    const loadHistorial = async () => {
      try {
        // Cargar todas las órdenes del pasajero
        const ordenesCollection = collection(db, "ordenes");
        const q = query(ordenesCollection, where("uidUser", "==", userId));
        const snapshot = await getDocs(q);

        if (snapshot.docs.length > 0) {
          const todasLasOrdenes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Separar viajes y envíos por categoría
          const viajesOrdenes = todasLasOrdenes.filter(o => o.orden?.categoria === "viajes");
          const enviosOrdenes = todasLasOrdenes.filter(o => o.orden?.categoria === "envios");

          // Procesar viajes
          const viajesConDatos = viajesOrdenes.map(viaje => ({
            id: viaje.id,
            tipo: "viaje",
            estado: viaje.estado || viaje.orden?.estado || "pendiente",
            fechaCreacion: viaje.orden?.createdAt || viaje.createdAt,
            origen: viaje.orden?.origen,
            destino: viaje.orden?.destino,
            servicio: viaje.orden?.servicio || "Viaje",
            precio: viaje.orden?.precio || viaje.precio || "0",
            conductorUID: viaje.orden?.conductorUID || viaje.uidTaxista,
            conductorNombre: viaje.orden?.conductorNombre || "-",
            conductorRating: viaje.orden?.conductorRating || "-",
            conductorFoto: viaje.orden?.conductorFoto || null,
            paradas: viaje.orden?.paradas || [],
            descuento: viaje.orden?.descuento || null,
            donacionSocial: viaje.orden?.donacionSocial || null,
            ...viaje
          })).sort((a, b) => {
            const dateA = a.fechaCreacion?.toDate?.() || new Date(a.fechaCreacion);
            const dateB = b.fechaCreacion?.toDate?.() || new Date(b.fechaCreacion);
            return dateB - dateA;
          });

          // Procesar envíos
          const enviosConDatos = enviosOrdenes.map(envio => ({
            id: envio.id,
            tipo: "envio",
            estado: envio.estado || "pendiente",
            fechaCreacion: envio.fechaCreacion || envio.orden?.fechaCreacion,
            origen: envio.orden?.origen,
            destino: envio.orden?.destino,
            remitente: envio.orden?.remitente,
            destinatario: envio.orden?.destinatario,
            paquete: envio.orden?.paquete,
            precio: envio.precio || envio.orden?.precio || "0",
            conductorUID: envio.uidTaxista || envio.orden?.uidTaxista,
            conductorNombre: envio.conductorNombre || envio.orden?.conductorNombre || "-",
            conductorRating: envio.conductorRating || envio.orden?.conductorRating || "-",
            conductorFoto: envio.conductorFoto || envio.orden?.conductorFoto || null,
            vehiculoInfo: envio.vehiculoInfo || envio.orden?.vehiculoInfo || null,
            servicio: envio.orden?.servicio || "Envío",
            ...envio
          })).sort((a, b) => {
            const dateA = a.fechaCreacion?.toDate?.() || new Date(a.fechaCreacion);
            const dateB = b.fechaCreacion?.toDate?.() || new Date(b.fechaCreacion);
            return dateB - dateA;
          });

          // Cargar nombres de conductores faltantes
          const viajesConConductores = await Promise.all(
            viajesConDatos.map(async (viaje) => {
              if (viaje.conductorUID && !viaje.conductorNombre) {
                const nombre = await cargarNombreTaxista(viaje.conductorUID);
                return { ...viaje, conductorNombre: nombre };
              }
              return viaje;
            })
          );

          const enviosConConductores = await Promise.all(
            enviosConDatos.map(async (envio) => {
              if (envio.conductorUID && !envio.conductorNombre) {
                const nombre = await cargarNombreTaxista(envio.conductorUID);
                return { ...envio, conductorNombre: nombre };
              }
              return envio;
            })
          );

          if (!cancel) {
            setViajes(viajesConConductores);
            setEnvios(enviosConConductores);
            setCargando(false);
          }
        } else {
          if (!cancel) {
            setViajes([]);
            setEnvios([]);
            setCargando(false);
          }
        }
      } catch (error) {
        console.error("Error cargando historial:", error);
        if (!cancel) {
          setViajes([]);
          setEnvios([]);
          setCargando(false);
        }
      }
    };

    loadHistorial();
    return () => { cancel = true; };
  }, [userId, cargarNombreTaxista]);

  return {
    viajes,
    envios,
    cargando,
    formatearFecha,
    totalOrdenes: viajes.length + envios.length
  };
};
