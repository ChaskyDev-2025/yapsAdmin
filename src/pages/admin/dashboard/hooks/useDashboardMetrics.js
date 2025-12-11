// src/pages/admin/dashboard/hooks/useDashboardMetrics.js

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

// Cache simple para evitar llamadas repetidas
let metricsCache = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useDashboardMetrics = () => {
  const [metricas, setMetricas] = useState({
    radiotaxis: { total: 0, activos: 0, inactivos: 0 },
    documentos: { pendientes: 0, aprobados: 0, rechazados: 0, total: 0 },
    solicitudes: { completadas: 0, canceladas: 0, total: 0, pendientes: 0 },
    usuarios: { totalPasajeros: 0, totalTrabajadores: 0, nuevosHoy: 0, nuevosEstaSemana: 0 },
    ordenes: { total: 0, completadas: 0, canceladas: 0, promedioCosto: 0 },
    actividad: { nuevosHoy: 0, usuariosActivos: 0, alertas: 0 },
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        // Verificar caché
        const now = Date.now();
        if (metricsCache && cacheTime && (now - cacheTime) < CACHE_DURATION) {
          setMetricas(metricsCache);
          setCargando(false);
          return;
        }

        setCargando(true);

        // Hacer todas las llamadas en paralelo
        const [trabajadoresSnapshot, documentosSnapshot, solicitudesSnapshot, pasajerosSnapshot, ordenesSnapshot] = await Promise.all([
          getDocs(collection(db, "trabajadores")),
          getDocs(collection(db, "documentos")),
          getDocs(collection(db, "solicitudes")),
          getDocs(collection(db, "pasajeros")),
          getDocs(collection(db, "ordenes")),
        ]);

        // Procesar trabajadores
        const totalTrabajadores = trabajadoresSnapshot.size;
        const activosTrabajadores = trabajadoresSnapshot.docs.filter(
          doc => doc.data().estado === "activo" || doc.data().activo === true
        ).length;
        const inactivosTrabajadores = totalTrabajadores - activosTrabajadores;

        // Procesar documentos
        const docsData = documentosSnapshot.docs.map(doc => doc.data());
        const pendientes = docsData.filter(doc => doc.estado === "pendiente").length;
        const aprobados = docsData.filter(doc => doc.estado === "aprobado").length;
        const rechazados = docsData.filter(doc => doc.estado === "rechazado").length;

        // Procesar solicitudes
        const solData = solicitudesSnapshot.docs.map(doc => doc.data());
        const completadas = solData.filter(doc => doc.estado === "completada" || doc.estado === "completado").length;
        const canceladas = solData.filter(doc => doc.estado === "cancelada" || doc.estado === "cancelado").length;
        const pendientesSolicitudes = solData.filter(doc => doc.estado === "pendiente").length;

        // Procesar pasajeros y fechas
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - 7);

        const nuevosHoy = pasajerosSnapshot.docs.filter(doc => {
          const fecha = doc.data().createdAt?.toDate?.();
          return fecha && fecha >= hoy;
        }).length;

        const nuevosEstaSemana = pasajerosSnapshot.docs.filter(doc => {
          const fecha = doc.data().createdAt?.toDate?.();
          return fecha && fecha >= inicioSemana;
        }).length;

        // Procesar órdenes
        const ordData = ordenesSnapshot.docs.map(doc => doc.data());
        const completadasOrdenes = ordData.filter(
          doc => doc.orden?.estado === "completado" || doc.orden?.estado === "completada"
        ).length;
        const canceladasOrdenes = ordData.filter(
          doc => doc.orden?.estado === "cancelado" || doc.orden?.estado === "cancelada"
        ).length;

        // Calcular promedio de costo
        const ordenesCompletadas = ordData.filter(
          doc => doc.orden?.estado === "completado" || doc.orden?.estado === "completada"
        );
        const promedioCosto = ordenesCompletadas.length > 0
          ? ordenesCompletadas.reduce((sum, doc) => sum + (parseFloat(doc.orden?.precio) || 0), 0) / ordenesCompletadas.length
          : 0;

        // Calcular alertas
        const alertas = pendientesSolicitudes + canceladas + pendientes;

        // Construir objeto de métricas
        const newMetricas = {
          radiotaxis: { total: totalTrabajadores, activos: activosTrabajadores, inactivos: inactivosTrabajadores },
          documentos: { pendientes, aprobados, rechazados, total: documentosSnapshot.size },
          solicitudes: { completadas, canceladas, total: solicitudesSnapshot.size, pendientes: pendientesSolicitudes },
          usuarios: { totalPasajeros: pasajerosSnapshot.size, totalTrabajadores, nuevosHoy, nuevosEstaSemana },
          ordenes: { total: ordenesSnapshot.size, completadas: completadasOrdenes, canceladas: canceladasOrdenes, promedioCosto },
          actividad: { nuevosHoy, usuariosActivos: activosTrabajadores, alertas },
        };

        // Guardar en caché
        metricsCache = newMetricas;
        cacheTime = now;

        setMetricas(newMetricas);
        setCargando(false);
      } catch (error) {
        console.error("Error cargando métricas:", error);
        setCargando(false);
      }
    };

    fetchMetricas();
  }, []);

  return { metricas, cargando };
};