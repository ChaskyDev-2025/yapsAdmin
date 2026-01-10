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
            // Nueva estructura: datos en la raíz del documento
            const nombreUsuario = trabajador.nombre || trabajador.perfil?.nombre || trabajador.perfil?.name || trabajador.name || trabajador.email || "Trabajador sin nombre";
            const telefono = trabajador.telefono || trabajador.phoneNumber || "Sin teléfono";
            const email = trabajador.perfil?.email || trabajador.email || "Sin email";
            const fotoUrl = trabajador.perfil?.fotoUrl || trabajador.perfil?.photoUrl || trabajador.fotoUrl || trabajador.photoURL || "";
            const createdAt = trabajador.createdAt || null;

            return {
              id: doc.id,
              nro: idx + 1,
              firebaseId: doc.id,
              nombreEmpresa: nombreUsuario,
              telefono,
              phoneVerified: trabajador.phoneVerified || false,
              email,
              representante: email,
              logoUrl: fotoUrl,
              logo: fotoUrl,
              saldo: "Bs. 0.00",
              estado: "Trabajador",
              activo: trabajador.activo !== false,
              online: trabajador.online === true,
              documentos: trabajador.documentos || {},
              documentos_aprobados: trabajador.documentos_aprobados || false,
              deletedByFlotaId: trabajador.deletedByFlotaId || null,
              departamento: trabajador.departamento || "-",
              categorias: trabajador.categorias || [],
              servicios: trabajador.servicios || {},
              flotaId: trabajador.flotaId || "-",
              flotaNombre: trabajador.flotaNombre || "-",
              createdAt: createdAt,
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
