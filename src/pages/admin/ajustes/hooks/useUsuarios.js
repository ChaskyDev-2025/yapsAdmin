// src/pages/admin/ajustes/hooks/useUsuarios.js
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useUsuarios = () => {
  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setCargando(true);
        setError(null);

        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        const data = snapshot.docs
          .map((doc, index) => {
            const usuario = doc.data();
            
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

            return {
              id: doc.id,
              nro: index + 1,
              firebaseId: doc.id,
              nombreEmpresa: usuario.nombreEmpresa || "Sin nombre",
              nombreUsuario: usuario.nombre || usuario.nombreUsuario || "Usuario sin nombre",
              telefono: usuario.telefono || "Sin teléfono",
              email: usuario.email || "Sin email",
              rol: usuario.rol || "Usuario",
              cargo: usuario.cargo || null,
              avatar: usuario.avatar || usuario.foto || null,
              fechaRegistro,
              logo: usuario.logo || null,
              direccion: usuario.direccion || "Sin dirección",
              ciudad: usuario.ciudad || "Sin ciudad",
              pais: usuario.pais || "Sin país",
            };
          })
          .filter(user => 
            user.email !== "adminyaaps@hotmail.com" && 
            user.email !== "rikurojas@hotmail.com"
          );

        setRows(data);
      } catch (err) {
        console.error("Error al obtener usuarios:", err);
        setError("Error al cargar los usuarios: " + err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchUsuarios();
  }, []);

  return { rows, cargando, error };
};
