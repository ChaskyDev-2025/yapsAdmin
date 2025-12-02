// src/pages/admin/ajustes/hooks/useUsuarios.js
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useUsuarios = (flotaId = null) => {
  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsuarios = useCallback(async () => {
    try {
      // Si no hay flotaId, no cargar nada
      if (!flotaId) {
        setRows([]);
        setCargando(false);
        return;
      }

      setCargando(true);
      setError(null);
      setRows([]); // Limpiar datos anteriores

      // Filtrar directamente en Firestore por flotaId
      const q = query(collection(db, "users"), where("flotaId", "==", flotaId));
      const usersSnapshot = await getDocs(q);

      const usuariosPromises = usersSnapshot.docs.map(async (docSnapshot) => {
        const usuario = docSnapshot.data();
        
        // Formatear fecha si existe
        let fechaRegistro = "Sin fecha";
        if (usuario.createdAt) {
          const date = usuario.createdAt.toDate?.() || new Date(usuario.createdAt);
          fechaRegistro = date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
        }

        // Obtener nombre de empresa usando flotaId
        let nombreEmpresa = "Sin empresa";
        if (usuario.flotaId) {
          try {
            const flotaDoc = await getDoc(doc(db, "flotas", usuario.flotaId));
            if (flotaDoc.exists()) {
              nombreEmpresa = flotaDoc.data().nombre || flotaDoc.data().nombreEmpresa || "Sin nombre";
            }
          } catch (error) {
            console.error("Error al obtener flota:", error);
          }
        }

        return {
          id: docSnapshot.id,
          firebaseId: docSnapshot.id,
          nombreEmpresa,
          nombreUsuario: usuario.nombre || usuario.nombreUsuario || "Usuario sin nombre",
          telefono: usuario.telefono || "Sin teléfono",
          email: usuario.email || "Sin email",
          rol: usuario.role || usuario.rol || "Admin",
          cargo: usuario.cargo || null,
          avatar: usuario.avatar || usuario.foto || null,
          fechaRegistro,
          logo: usuario.logo || null,
          direccion: usuario.direccion || "Sin dirección",
          ciudad: usuario.ciudad || "Sin ciudad",
          pais: usuario.pais || "Sin país",
          flotaId: usuario.flotaId || null,
          tipo: "admin",
        };
      });

      const admins = await Promise.all(usuariosPromises);

      // Filtrar usuarios no deseados y agregar número
      const filteredData = admins
        .filter(user => 
          user.email !== "adminyaaps@hotmail.com"
        )
        .map((user, index) => ({
          ...user,
          nro: index + 1,
        }));

      setRows(filteredData);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
      setError("Error al cargar los usuarios: " + err.message);
    } finally {
      setCargando(false);
    }
  }, [flotaId]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  return { rows, cargando, error, refetch: fetchUsuarios };
};