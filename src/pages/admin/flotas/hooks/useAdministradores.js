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
      
      // Primero, obtener TODOS los usuarios para ver qué hay
      const allUsersSnapshot = await getDocs(usersCollection);
      console.log('📊 TODOS los usuarios en Firebase:', allUsersSnapshot.size);
      allUsersSnapshot.docs.forEach((doc, index) => {
        if (index < 3) { // Mostrar solo los primeros 3
          console.log(`📊 Usuario ${index + 1}:`, doc.id, doc.data());
        }
      });
      
      // Intentar con "rol"
      const q = query(usersCollection, where("rol", "==", "Admin"));
      const usersSnapshot = await getDocs(q);
      let usersList = usersSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));
      
      // Si no hay resultados, intentar con "role"
      if (usersList.length === 0) {
        console.log('📊 No se encontraron usuarios con rol="Admin", intentando con role="Admin"...');
        const q2 = query(usersCollection, where("role", "==", "Admin"));
        const usersSnapshot2 = await getDocs(q2);
        usersList = usersSnapshot2.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));
      }
      
      console.log('📊 Administradores cargados:', usersList);
      console.log('📊 Primer admin:', usersList[0]);
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
