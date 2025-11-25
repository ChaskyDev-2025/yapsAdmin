// src/pages/admin/dashboard/hooks/useDashboardMetrics.js

import { useState, useEffect} from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useDashboardMetrics = () => {
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [cargando,  setCargando] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setCargando(true);

        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        const pasajerosRef = collection(db, "pasajeros");
        const pasajerosSnapshot = await getDocs(pasajerosRef);

        const total = usersSnapshot.size + pasajerosSnapshot.size;
        setTotalUsuarios(total);
      } catch (error) {
        console.error("Error al obtener usuarios", error);
      }finally {
        setCargando(false);
      }
    };

    fetchUsuarios();
  }, []);

  return { totalUsuarios, cargando};

};