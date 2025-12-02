// src/pages/admin/radiotaxis/hooks/useTrabajadoresPorFlota.js
import { useEffect, useState, useCallback } from "react";
import { db } from "../../../../data/firebase/firebase";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";

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
      const snapshot = await getDocs(q);

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
            nombreEmpresa: nombreUsuario, // Usar el nombre del trabajador en esta columna
            telefono,
            email,
            fecha,
            representante: email,
            logoUrl: fotoUrl,
            logo: fotoUrl,
            saldo: "Bs. 0.00",
            estado: "Trabajador",
          };
        })
        .filter(Boolean);

      setRows(data);
    } catch (err) {
      console.error("Error al obtener trabajadores:", err);
      setError(err?.message || "Error cargando trabajadores");
    } finally {
      setCargando(false);
    }
  }, [flotaId]);

  useEffect(() => {
    fetchTrabajadores();
  }, [fetchTrabajadores]);

  return { rows, cargando, error, refetch: fetchTrabajadores };
}
