// src/pages/admin/flotas/hooks/useAdministradores.js
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useAdministradores = () => {
  const [administradores, setAdministradores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdministradores = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, "users");
      
      // Obtener TODOS los usuarios sin filtro
      const allUsersSnapshot = await getDocs(usersCollection);
      const usersList = allUsersSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));
      
      console.log('📊 Todos los usuarios cargados:', usersList);
      setAdministradores(usersList);
    } catch (error) {
      console.error("Error al obtener administradores:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdministradores();
  }, []);

  return { administradores, loading, fetchAdministradores };
};
