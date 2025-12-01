// src/pages/admin/flotas/hooks/useServicios.js
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useServicios = () => {
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServicios = async () => {
    try {
      setLoading(true);
      const serviciosCollection = collection(db, "servicios");
      const serviciosSnapshot = await getDocs(serviciosCollection);
      console.log('🚗 Total de servicios en Firebase:', serviciosSnapshot.size);
      
      const serviciosList = serviciosSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('🚗 Servicio:', doc.id, data);
        return {
          id: doc.id,
          ...data,
        };
      });
      
      console.log('🚗 Servicios cargados:', serviciosList);
      console.log('🚗 Primer servicio:', serviciosList[0]);
      setServiciosDisponibles(serviciosList);
    } catch (error) {
      console.error("Error al obtener servicios:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  return { serviciosDisponibles, loading, fetchServicios };
};
