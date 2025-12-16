// src/pages/admin/radiotaxis/hooks/useTrabajadoresPorFlota.js
import { useEffect, useState, useCallback } from "react";
import { db } from "../../../../data/firebase/firebase";
import { collection, doc, getDoc, query, where, onSnapshot } from "firebase/firestore";

const formatearFecha = (ts) => {
  let d = null;
  if (ts?.toDate) d = ts.toDate();
  else if (ts?.seconds) d = new Date(ts.seconds * 1000);
  else if (ts instanceof Date) d = ts;
  else if (ts) d = new Date(ts);
  if (!d || isNaN(d)) return "";
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export function useTrabajadoresPorFlota(flotaId) {
  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrabajadores = useCallback(async () => {
    if (!flotaId) {
      setCargando(false);
      setRows([]);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      // Obtener trabajadores de la colección "trabajadores" que pertenecen a la flota
      const trabajadoresRef = collection(db, "trabajadores");
      const q = query(trabajadoresRef, where("flotaId", "==", flotaId));
      
      // Usar onSnapshot para escuchar cambios en tiempo real
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs
          .map((doc, idx) => {
            const trabajador = doc.data();
            const nombreUsuario = trabajador.perfil?.name || "Trabajador sin nombre";
            const telefono = trabajador.telefono || "Sin teléfono";
            const email = trabajador.perfil?.email || trabajador.email || "Sin email";
            const fecha = formatearFecha(trabajador.perfil?.createdAt);
            const fotoUrl = trabajador.perfil?.photoUrl || "";

            return {
              id: doc.id,
              nro: idx + 1,
              firebaseId: doc.id,
              nombreEmpresa: nombreUsuario,
              telefono,
              email,
              fecha,
              representante: email,
              logoUrl: fotoUrl,
              logo: fotoUrl,
              saldo: "Bs. 0.00",
              estado: "Trabajador",
              activo: trabajador.activo !== false,
              documentos: trabajador.documentos || {},
              documentos_aprobados: trabajador.documentos_aprobados || false,
              deletedByFlotaId: trabajador.deletedByFlotaId || null,
            };
          })
          .filter(item => {
            // Filtrar: no mostrar si fue eliminado por esta flota
            return item.deletedByFlotaId !== flotaId;
          })
          .filter(Boolean);

        setRows(data);
        setCargando(false);
      }, (err) => {
        console.error("Error al obtener trabajadores:", err);
        setError(err?.message || "Error cargando trabajadores");
        setCargando(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error("Error al obtener trabajadores:", err);
      setError(err?.message || "Error cargando trabajadores");
      setCargando(false);
    }
  }, [flotaId]);

  useEffect(() => {
    const unsubscribe = fetchTrabajadores();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchTrabajadores]);

  return { rows, cargando, error, refetch: fetchTrabajadores };
}
