// src/pages/admin/flotas/hooks/useServicios.js
import { useState, useEffect, useRef } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

const DEPARTAMENTOS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

// Cache global para evitar múltiples cargas
const serviciosCache = { data: null, timestamp: null };
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useServicios = () => {
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [serviciosPorCiudad, setServiciosPorCiudad] = useState({});
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      
      if (isMountedRef.current) {
        setServiciosDisponibles(serviciosList);
      }
    } catch (error) {
      console.error("Error al obtener servicios:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Nueva función para obtener servicios por departamento - OPTIMIZADA
  const fetchServiciosPorCiudad = async () => {
    try {
      setLoading(true);

      // Verificar caché
      const now = Date.now();
      if (serviciosCache.data && serviciosCache.timestamp && 
          (now - serviciosCache.timestamp) < CACHE_DURATION) {
        if (isMountedRef.current) {
          setServiciosPorCiudad(serviciosCache.data);
          setLoading(false);
        }
        return;
      }

      // Cargar todos en PARALELO, no secuencial
      const promises = DEPARTAMENTOS.map(dept =>
        getDoc(doc(db, "Tarifas", dept))
          .then(deptSnap => {
            if (deptSnap.exists()) {
              const data = deptSnap.data();
              // Filtrar solo los servicios (excluir "enabled" field)
              const servicios = Object.entries(data)
                .filter(([key]) => key !== "enabled" && typeof data[key] === 'object')
                .map(([key, value]) => ({
                  id: key,
                  nombre: key,
                  ...value,
                  // Detectar qué campo de nombre usa este servicio
                  _nombreField: value.hasOwnProperty('servicio') ? 'servicio' : value.hasOwnProperty('nombre_visible') ? 'nombre_visible' : 'nombre',
                }));
              return { dept, servicios };
            } else {
              return { dept, servicios: [] };
            }
          })
          .catch(err => {
            console.error(`Error obteniendo servicios de ${dept}:`, err);
            return { dept, servicios: [] };
          })
      );

      // Esperar a que todas las promesas se resuelvan
      const resultados = await Promise.all(promises);
      
      // Construir objeto de servicios por ciudad
      const serviciosPorDept = {};
      resultados.forEach(({ dept, servicios }) => {
        serviciosPorDept[dept] = servicios;
      });

      // Guardar en caché
      serviciosCache.data = serviciosPorDept;
      serviciosCache.timestamp = Date.now();

      if (isMountedRef.current) {
        setServiciosPorCiudad(serviciosPorDept);
      }
    } catch (error) {
      console.error("Error al obtener servicios por ciudad:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
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
