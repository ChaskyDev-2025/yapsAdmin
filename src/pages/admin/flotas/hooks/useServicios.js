// src/pages/admin/flotas/hooks/useServicios.js
import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

const DEPARTAMENTOS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

export const useServicios = () => {
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [serviciosPorCiudad, setServiciosPorCiudad] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchServicios = async () => {
    try {
      setLoading(true);
      
      // Opción 1: Si los servicios están en colección "servicios" (legacy)
      const serviciosCollection = collection(db, "servicios");
      const serviciosSnapshot = await getDocs(serviciosCollection);
      const serviciosList = serviciosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setServiciosDisponibles(serviciosList);
      console.log('🚗 Servicios cargados (legacy):', serviciosList);
    } catch (error) {
      console.error("Error al obtener servicios:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para obtener servicios por departamento
  const fetchServiciosPorCiudad = async () => {
    try {
      setLoading(true);
      const serviciosPorDept = {};

      // Iterar sobre cada departamento
      for (const dept of DEPARTAMENTOS) {
        try {
          const deptRef = doc(db, "Tarifas", dept);
          const deptSnap = await getDoc(deptRef);

          if (deptSnap.exists()) {
            const data = deptSnap.data();
            // Filtrar solo los servicios (excluir "enabled" field)
            const servicios = Object.entries(data)
              .filter(([key]) => key !== "enabled")
              .map(([key, value]) => ({
                id: key,
                nombre: key,
                ...value,
              }));
            serviciosPorDept[dept] = servicios;
            console.log(`🏙️ Servicios en ${dept}:`, servicios);
          } else {
            serviciosPorDept[dept] = [];
          }
        } catch (err) {
          console.error(`Error obteniendo servicios de ${dept}:`, err);
          serviciosPorDept[dept] = [];
        }
      }

      setServiciosPorCiudad(serviciosPorDept);
      console.log('🏙️ Servicios por ciudad cargados:', serviciosPorDept);
    } catch (error) {
      console.error("Error al obtener servicios por ciudad:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
    fetchServiciosPorCiudad();
  }, []);

  return { 
    serviciosDisponibles, 
    serviciosPorCiudad,
    loading, 
    fetchServicios,
    fetchServiciosPorCiudad 
  };
};
