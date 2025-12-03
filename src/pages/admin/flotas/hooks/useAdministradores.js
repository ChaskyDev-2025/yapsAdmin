// src/pages/admin/flotas/hooks/useAdministradores.js
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useAdministradores = (flotas = []) => {
  const [administradores, setAdministradores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdministradores = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, "users");
      
      // Obtener usuarios que tengan role de "admin" o "superadmin"
      const adminQuery = query(
        usersCollection,
        where("role", "in", ["admin", "superadmin"])
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      const adminsList = adminSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          nombre: data.nombre || data.email?.split('@')[0] || "Admin",
          email: data.email || "",
          role: data.role || "admin",
          flotaId: data.flotaId || null,
          ...data,
        };
      });
      
      console.log('📊 Administradores cargados:', adminsList);
      setAdministradores(adminsList);
    } catch (error) {
      console.error("Error al obtener administradores:", error);
      setAdministradores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdministradores();
  }, []);

  // Filtrar administradores que no tengan flota asignada o que ya estén en esta flota
  const getAvailableAdministradores = (currentFlotaId = null) => {
    return administradores.filter((admin) => {
      // Si el admin ya está asignado a esta flota, incluirlo (para edición)
      if (currentFlotaId && admin.uid === currentFlotaId) {
        return true;
      }
      // Si el admin no tiene flotaId asignado, está disponible
      if (!admin.flotaId) {
        return true;
      }
      // Si tiene flota pero es la misma que estamos editando, incluirlo
      return admin.flotaId === currentFlotaId;
    });
  };

  return { administradores, loading, fetchAdministradores, getAvailableAdministradores };
};
