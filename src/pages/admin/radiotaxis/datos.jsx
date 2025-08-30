// src/pages/admin/radiotaxis/datos.jsx
import { useEffect, useState } from "react";
import { db } from "../../../data/firebase/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

/**
 * Hook que trae los radiotaxis desde Firestore.
 * - Devuelve: rows, cargando, error
 * - Cada fila incluye:
 *   - id: doc.id            (requerido internamente por MUI; NO hay columna 'id')
 *   - nro: índice+1         (columna visible "ID" 1..N)
 *   - firebaseId: doc.id    (por si necesitas usarlo en acciones/modales)
 *   - nombreEmpresa
 */

// Convierte Firestore Timestamp → string legible en zona horaria BO (UTC-4)
const formatearFecha = (ts) => {
  let d = null;
  if (ts?.toDate) d = ts.toDate();                // Timestamp de Firestore
  else if (ts?.seconds) d = new Date(ts.seconds * 1000); // otra forma de TS
  else if (ts instanceof Date) d = ts;            // Date nativo
  else if (ts) d = new Date(ts);                  // número/ms o ISO
  if (!d || isNaN(d)) return "";
  return d.toLocaleString("es-BO", {
    timeZone: "America/La_Paz",
    day: "numeric",
    month: "long",
    year: "numeric",
    //hour: "numeric",
    //minute: "2-digit",
    //second: "2-digit",
    //hour12: true,
  });
};

// "Bs. 0.00" siempre con 2 decimales
const formatSaldo = (v) => `Bs. ${Number(v ?? 0).toFixed(2)}`;

const normalizarEstado = (e) => {
  const raw = `${e ?? ""}`.trim();
  if (!raw) return "Pendiente"; // fallback cuando no existe

  const map = {
    aprobado: "Aprobado",
    pendiente: "Pendiente",
    rechazado: "Rechazado",
    "sin imagen": "Sin imagen", // 👉 añade este caso
  };

  const lower = raw.toLowerCase();
  // si está en el mapa, usa el normalizado; si no, respeta lo que viene de la BD
  return map[lower] ?? raw;
};

export function useRadiotaxisRows() {
  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const colRef = collection(db, "users");
    const q = query(
      colRef,
      where("empresa.nombreEmpresa", ">", ""),
      orderBy("empresa.nombreEmpresa", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc, idx) => {
            const empresa = doc.data()?.empresa || {};
            const nombreEmpresa = empresa?.nombreEmpresa || "";
            const telefono = empresa?.telefono || "";
            const representante = empresa?.representante || "";
            const logoUrl = empresa?.logoUrl || "";
            const fecha = formatearFecha(empresa?.createdAt); // ← NUEVO

            // Si más adelante guardas el saldo en otro lugar, añade ese fallback aquí.
            const rawSaldo = empresa?.saldo ?? doc.data()?.saldo ?? 0;
            const saldo = formatSaldo(rawSaldo);

            const estado = normalizarEstado(empresa?.estado ?? doc.data()?.estado);

            if (!nombreEmpresa) return null;

            return {
              id: doc.id,        // requerido por MUI (interno; no hay columna 'id')
              nro: idx + 1,      // numeración visible
              firebaseId: doc.id, // para acciones/modales
              nombreEmpresa,
              telefono,
              fecha, // ← NUEVO
              representante,
              logoUrl,        // ← DISPONIBLE para el modal (no hay columna en la tabla)
              logo: logoUrl,  // ← opcional, alias por compatibilidad con modales antiguos
              saldo,
              estado, // ← NUEVO
            };
          })
          .filter(Boolean);

        setRows(data);
        setCargando(false);
      },
      async () => {
        try {
          // Fallback si onSnapshot falla (índice, permisos, etc.)
          const snap = await getDocs(colRef);
          const data = snap.docs
            .map((doc, idx) => {
              const empresa = doc.data()?.empresa || {};
              const nombreEmpresa = empresa?.nombreEmpresa || "";
              const telefono = empresa?.telefono || "";   // ← NUEVO
              const logoUrl = empresa?.logoUrl || "";
              const fecha = formatearFecha(empresa?.createdAt); // ← NUEVO
              const representante = empresa?.representante || "";
              
              // Si más adelante guardas el saldo en otro lugar, añade ese fallback aquí.
              const rawSaldo = empresa?.saldo ?? doc.data()?.saldo ?? 0;
              const saldo = formatSaldo(rawSaldo);

              const estado = normalizarEstado(empresa?.estado ?? doc.data()?.estado);

              if (!nombreEmpresa) return null;

              return {
                id: doc.id,
                nro: idx + 1,
                firebaseId: doc.id,
                nombreEmpresa,
                telefono,           // ← NUEVO
                fecha, // ← NUEVO
                representante,
                logoUrl,        // ← DISPONIBLE para el modal (no hay columna en la tabla)
                logo: logoUrl,  // ← opcional, alias por compatibilidad con modales antiguos
                saldo,
                estado, // ← NUEVO
              };
            })
            .filter(Boolean);

          setRows(data);
        } catch (e) {
          setError(e?.message || "Error cargando datos");
        } finally {
          setCargando(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return { rows, cargando, error };
}
