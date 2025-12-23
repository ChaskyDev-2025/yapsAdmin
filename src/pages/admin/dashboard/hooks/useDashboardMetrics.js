// src/pages/admin/dashboard/hooks/useDashboardMetrics.js

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { useAuth } from "../../../../auth/AuthContext";

export const useDashboardMetrics = () => {
  const { userRole, userFlotaId } = useAuth();
  const [metricas, setMetricas] = useState({
    radiotaxis: { total: 0, activos: 0, inactivos: 0 },
    documentos: { pendientes: 0, aprobados: 0, rechazados: 0, total: 0 },
    solicitudes: { completadas: 0, canceladas: 0, total: 0, pendientes: 0 },
    usuarios: { totalPasajeros: 0, totalTrabajadores: 0, nuevosHoy: 0, nuevosEstaSemana: 0 },
    ordenes: { total: 0, completadas: 0, canceladas: 0, promedioCosto: 0 },
    donaciones: { totalAcumuladas: 0 },
    actividad: { nuevosHoy: 0, usuariosActivos: 0, alertas: 0 },
  });
  const [cargando, setCargando] = useState(true);

  // Función para calcular las métricas
  const calcularMetricas = (trabajadoresData, ordenesData, solicitudesData, pasajerosData) => {
    // Procesar trabajadores
    const totalTrabajadores = trabajadoresData.length;
    const activosTrabajadores = trabajadoresData.filter(
      doc => doc.estado === "activo" || doc.activo === true
    ).length;
    const inactivosTrabajadores = totalTrabajadores - activosTrabajadores;

    // Procesar documentos - Están anidados dentro de trabajadores
    let totalDocumentos = 0;
    let documentosPendientes = 0;
    let documentosAprobados = 0;
    let documentosRechazados = 0;

    trabajadoresData.forEach(trabajador => {
      const docs = trabajador.documentos || {};
      Object.values(docs).forEach(doc => {
        if (doc && typeof doc === 'object' && doc.estado) {
          totalDocumentos++;
          if (doc.estado === "aprobado") {
            documentosAprobados++;
          } else if (doc.estado === "pendiente") {
            documentosPendientes++;
          } else if (doc.estado === "rechazado") {
            documentosRechazados++;
          }
        }
      });
    });

    // Procesar solicitudes
    const completadas = solicitudesData.filter(doc => doc.estado === "completada" || doc.estado === "completado").length;
    const canceladas = solicitudesData.filter(doc => doc.estado === "cancelada" || doc.estado === "cancelado").length;
    const pendientesSolicitudes = solicitudesData.filter(doc => doc.estado === "pendiente").length;

    // Procesar pasajeros y fechas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - 7);

    const nuevosHoy = pasajerosData.filter(doc => {
      const fecha = doc.createdAt?.toDate?.();
      return fecha && fecha >= hoy;
    }).length;

    const nuevosEstaSemana = pasajerosData.filter(doc => {
      const fecha = doc.createdAt?.toDate?.();
      return fecha && fecha >= inicioSemana;
    }).length;

    // Procesar órdenes
    const completadasOrdenes = ordenesData.filter(
      doc => doc.estado === "completado" || doc.estado === "completada"
    ).length;
    const canceladasOrdenes = ordenesData.filter(
      doc => doc.estado === "cancelado" || doc.estado === "cancelada"
    ).length;

    const ordenesCompletadas = ordenesData.filter(
      doc => doc.estado === "completado" || doc.estado === "completada"
    );
    const promedioCosto = ordenesCompletadas.length > 0
      ? ordenesCompletadas.reduce((sum, doc) => sum + (parseFloat(doc.precio) || 0), 0) / ordenesCompletadas.length
      : 0;

    // Procesar donaciones acumuladas por departamento
    const donacionesPorDepartamento = {};
    pasajerosData.forEach(pasajero => {
      const departamento = pasajero.departamentoActual || "Sin departamento";
      const donaciones = parseFloat(pasajero.donacionesAcumuladas) || 0;
      
      if (!donacionesPorDepartamento[departamento]) {
        donacionesPorDepartamento[departamento] = 0;
      }
      donacionesPorDepartamento[departamento] += donaciones;
    });

    // Obtener el total de donaciones (suma de todos los departamentos)
    const totalDonacionesAcumuladas = Object.values(donacionesPorDepartamento).reduce((sum, val) => sum + val, 0);

    // Calcular alertas
    const alertas = pendientesSolicitudes + canceladas + documentosPendientes;

    return {
      radiotaxis: { total: totalTrabajadores, activos: activosTrabajadores, inactivos: inactivosTrabajadores },
      documentos: { pendientes: documentosPendientes, aprobados: documentosAprobados, rechazados: documentosRechazados, total: totalDocumentos },
      solicitudes: { completadas, canceladas, total: solicitudesData.length, pendientes: pendientesSolicitudes },
      usuarios: { totalPasajeros: pasajerosData.length, totalTrabajadores, nuevosHoy, nuevosEstaSemana },
      ordenes: { total: ordenesData.length, completadas: completadasOrdenes, canceladas: canceladasOrdenes, promedioCosto },
      donaciones: { totalAcumuladas: totalDonacionesAcumuladas, porDepartamento: donacionesPorDepartamento },
      actividad: { nuevosHoy, usuariosActivos: activosTrabajadores, alertas },
    };
  };

  useEffect(() => {
    if (!userRole) {
      console.warn("⚠️ Dashboard: userRole aún no está disponible");
      setCargando(false);
      return;
    }

    const isSuperAdmin = userRole === "superadmin";
    const adminFlotaId = userFlotaId;

    let unsubscribers = [];
    let trabajadoresData = [];
    let ordenesData = [];
    let solicitudesData = [];
    let pasajerosData = [];

    // Definir función actualizar ANTES de los listeners
    const actualizar = () => {
      try {
        // Para admin, filtrar órdenes por uidTaxista que pertenezcan a sus trabajadores
        let ordenesFiltered = ordenesData;
        if (!isSuperAdmin && trabajadoresData.length > 0) {
          const trabajadorIds = trabajadoresData.map(t => t.id);
          
          ordenesFiltered = ordenesData.filter(orden => {
            const match = trabajadorIds.includes(orden.uidTaxista);
            return match;
          });
          
        }

        const newMetricas = calcularMetricas(trabajadoresData, ordenesFiltered, solicitudesData, pasajerosData);
        setMetricas(newMetricas);
        setCargando(false);
      } catch (error) {
        console.error("❌ Error calculando métricas:", error);
      }
    };

    try {
      // Listener para trabajadores
      const trabajadoresQuery = isSuperAdmin 
        ? collection(db, "trabajadores")
        : query(collection(db, "trabajadores"), where("flotaId", "==", adminFlotaId));

      const unsubTrabajadores = onSnapshot(trabajadoresQuery, (snapshot) => {
        trabajadoresData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id  // Incluir el document ID como 'id'
        }));
        actualizar();
      }, (error) => {
        console.error("❌ Error en listener de trabajadores:", error);
      });
      unsubscribers.push(unsubTrabajadores);

      // Listener para órdenes - Cargar todas para ambos roles, filtrar en memoria para admin
      const ordenesQuery = collection(db, "ordenes");

      const unsubOrdenes = onSnapshot(ordenesQuery, (snapshot) => {
        ordenesData = snapshot.docs.map(doc => doc.data());
        actualizar();
      }, (error) => {
        console.error("❌ Error en listener de órdenes:", error);
      });
      unsubscribers.push(unsubOrdenes);

      // Listener para solicitudes
      const solicitudesQuery = isSuperAdmin
        ? collection(db, "solicitudes")
        : query(collection(db, "solicitudes"), where("flotaId", "==", adminFlotaId));

      const unsubSolicitudes = onSnapshot(solicitudesQuery, (snapshot) => {
        solicitudesData = snapshot.docs.map(doc => doc.data());
        actualizar();
      }, (error) => {
        console.error("❌ Error en listener de solicitudes:", error);
      });
      unsubscribers.push(unsubSolicitudes);

      // Listener para pasajeros
      const pasajerosQuery = isSuperAdmin
        ? collection(db, "pasajeros")
        : query(collection(db, "pasajeros"), where("flotaId", "==", adminFlotaId));

      const unsubPasajeros = onSnapshot(pasajerosQuery, (snapshot) => {
        pasajerosData = snapshot.docs.map(doc => doc.data());
        actualizar();
      }, (error) => {
        console.error("❌ Error en listener de pasajeros:", error);
      });
      unsubscribers.push(unsubPasajeros);

      // Actualización inicial
      actualizar();

    } catch (error) {
      console.error("❌ Error configurando listeners:", error);
      setCargando(false);
    }

    // Cleanup: Desuscribirse de todos los listeners al desmontar
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [userRole, userFlotaId]);

  return { metricas, cargando };
};