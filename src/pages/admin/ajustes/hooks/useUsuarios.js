// src/pages/admin/ajustes/hooks/useUsuarios.js
import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
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

        // Procesar usuarios y obtener nombre de empresa por flotaId
        const usuariosPromises = snapshot.docs.map(async (docSnapshot) => {
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
            rol: usuario.role || usuario.rol || "Usuario",
            cargo: usuario.cargo || null,
            avatar: usuario.avatar || usuario.foto || null,
            fechaRegistro,
            logo: usuario.logo || null,
            direccion: usuario.direccion || "Sin dirección",
            ciudad: usuario.ciudad || "Sin ciudad",
            pais: usuario.pais || "Sin país",
            flotaId: usuario.flotaId || null,
          };
        });

        const data = await Promise.all(usuariosPromises);
        
        // Filtrar usuarios no deseados y agregar número
        const filteredData = data
          .filter(user => 
            user.email !== "adminyaaps@hotmail.com" && 
            user.email !== "rikurojas@hotmail.com"
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
    };

    fetchUsuarios();
  }, []);

  return { rows, cargando, error };
};