import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Paper,
  Box,
} from "@mui/material";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { TableToolbar } from "../usuarios/components/TableToolbar";

// Componentes modulares
import SolicitudesHeader from "./components/SolicitudesHeader";
import SolicitudesTable from "./components/SolicitudesTable";
import AsignarFlotaDialog from "./components/AsignarFlotaDialog";
import DetallesDialog from "./components/DetallesDialog";
import OfertaDialog from "./components/OfertaDialog";

const Solicitudes = () => {
  // Estilos para campos deshabilitados
  const disabledTextFieldStyles = {
    "& .MuiInputBase-input.Mui-disabled": {
      color: "#000",
      WebkitTextFillColor: "#000"
    }
  };

  const [solicitudes, setSolicitudes] = useState([]);
  const [searchSolicitudes, setSearchSolicitudes] = useState("");
  const [filterEstado, setFilterEstado] = useState("todas");
  const [sortBySolicitudes, setSortBySolicitudes] = useState("fecha-desc");
  const [flotas, setFlotas] = useState([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [asignadaFlota, setAsignadaFlota] = useState("");
  const [detallesDialogOpen, setDetallesDialogOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [ofertaDialogOpen, setOfertaDialogOpen] = useState(false);
  const [solicitudOferta, setSolicitudOferta] = useState(null);

  // Cargar solicitudes
  useEffect(() => {
    const cargarSolicitudes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "solicitudes"));
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            fechaCreacion: docData.fechaCreacion?.toDate ? docData.fechaCreacion.toDate() : (docData.fechaCreacion instanceof Date ? docData.fechaCreacion : null),
            solicitud: {
              ...docData.solicitud,
              fechaCreacion: docData.solicitud?.fechaCreacion?.toDate ? docData.solicitud.fechaCreacion.toDate() : (docData.solicitud?.fechaCreacion instanceof Date ? docData.solicitud.fechaCreacion : null),
              detalles: {
                ...docData.solicitud?.detalles,
                fechaProgramada: docData.solicitud?.detalles?.fechaProgramada?.toDate ? docData.solicitud.detalles.fechaProgramada.toDate() : null,
                fechaInicio: docData.solicitud?.detalles?.fechaInicio?.toDate ? docData.solicitud.detalles.fechaInicio.toDate() : null,
              }
            }
          };
        });
        setSolicitudes(data);
      } catch (error) {
        console.error("Error cargando solicitudes:", error);
      }
    };

    cargarSolicitudes();
  }, []);

  // Cargar flotas para el dropdown
  useEffect(() => {
    const cargarFlotas = async () => {
      try {
        const snapshot = await getDocs(collection(db, "flotas"));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFlotas(data);
      } catch (error) {
        console.error("Error cargando flotas:", error);
      }
    };

    cargarFlotas();
  }, []);

  // Normalizar strings para comparación consistente
  const normalizarTexto = (texto) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_") // Reemplazar espacios por guiones bajos
      .replace(/[_-]+/g, "_") // Normalizar guiones múltiples
      .replace(/\s+y\s+/g, "_y_") // Normalizar " y " a "_y_"
      .replace(/á/g, "a")
      .replace(/é/g, "e")
      .replace(/í/g, "i")
      .replace(/ó/g, "o")
      .replace(/ú/g, "u")
      .replace(/ñ/g, "n");
  };

  // Obtener flotas disponibles para una categoría y servicio
  const obtenerFlotasDisponibles = (categoria, servicio) => {
    if (!categoria) return [];
    
    const categoriaNorm = normalizarTexto(categoria);
    
    const flotasDisponibles = flotas.filter(flota => {
      // Buscar en el array de servicios
      const servicios = flota.servicios;
      if (!Array.isArray(servicios)) return false;
      
      // Buscar servicios que contengan la categoría normalizada
      const encontrado = servicios.some(svc => {
        const svcNorm = normalizarTexto(svc);
        // Solo verificar que el servicio comience o contenga la categoría
        return svcNorm.includes(categoriaNorm);
      });
      
      return encontrado;
    });
    
    return flotasDisponibles;
  };


  // Filtrar y ordenar solicitudes
  const solicitudesFiltradas = useMemo(() => {
    let filtered = solicitudes;

    // Filtro por búsqueda
    if (searchSolicitudes) {
      const search = searchSolicitudes.toLowerCase();
      filtered = filtered.filter(s => {
        const cliente = s.solicitud?.cliente || s.nombre_cliente || "";
        const servicio = s.solicitud?.servicio || "";
        const categoria = s.solicitud?.categoria || "";
        return cliente.toLowerCase().includes(search) ||
               servicio.toLowerCase().includes(search) ||
               categoria.toLowerCase().includes(search);
      });
    }

    // Filtro por estado
    if (filterEstado !== "todas") {
      filtered = filtered.filter(s => s.estado === filterEstado);
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortBySolicitudes) {
      case "fecha-asc":
        sorted.sort((a, b) => {
          const fechaA = a.solicitud?.fechaCreacion || a.fechaCreacion;
          const fechaB = b.solicitud?.fechaCreacion || b.fechaCreacion;
          return new Date(fechaA) - new Date(fechaB);
        });
        break;
      case "fecha-desc":
        sorted.sort((a, b) => {
          const fechaA = a.solicitud?.fechaCreacion || a.fechaCreacion;
          const fechaB = b.solicitud?.fechaCreacion || b.fechaCreacion;
          return new Date(fechaB) - new Date(fechaA);
        });
        break;
      case "cliente-asc":
        sorted.sort((a, b) => {
          const clienteA = a.solicitud?.cliente || a.nombre_cliente || "";
          const clienteB = b.solicitud?.cliente || b.nombre_cliente || "";
          return clienteA.localeCompare(clienteB);
        });
        break;
      case "cliente-desc":
        sorted.sort((a, b) => {
          const clienteA = a.solicitud?.cliente || a.nombre_cliente || "";
          const clienteB = b.solicitud?.cliente || b.nombre_cliente || "";
          return clienteB.localeCompare(clienteA);
        });
        break;
      default:
        break;
    }

    return sorted;
  }, [solicitudes, searchSolicitudes, filterEstado, sortBySolicitudes]);

  // Abrir diálogo para asignar flota
  const handleOpenDialog = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setAsignadaFlota(solicitud.flota_asignada || "");
    setDialogOpen(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSolicitud(null);
    setAsignadaFlota("");
  };

  // Abrir diálogo de detalles
  const handleVerDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setDetallesDialogOpen(true);
  };

  // Cerrar diálogo de detalles
  const handleCloseDetallesDialog = () => {
    setDetallesDialogOpen(false);
    setSolicitudSeleccionada(null);
  };

  // Abrir diálogo de oferta
  const handleVerOferta = (solicitud) => {
    setSolicitudOferta(solicitud);
    setOfertaDialogOpen(true);
  };

  // Cerrar diálogo de oferta
  const handleCloseOfertaDialog = () => {
    setOfertaDialogOpen(false);
    setSolicitudOferta(null);
  };

  // Asignar flota a solicitud
  const handleAsignarFlota = async () => {
    if (!selectedSolicitud || !asignadaFlota) return;

    try {
      await updateDoc(doc(db, "solicitudes", selectedSolicitud.id), {
        flota_asignada: asignadaFlota,
        estado: "asignada",
        fecha_asignacion: new Date()
      });

      setSolicitudes(solicitudes.map(s =>
        s.id === selectedSolicitud.id
          ? { ...s, flota_asignada: asignadaFlota, estado: "asignada" }
          : s
      ));

      handleCloseDialog();
    } catch (error) {
      console.error("Error asignando flota:", error);
    }
  };

  // Rechazar solicitud
  const handleRechazarSolicitud = async (id) => {
    if (!window.confirm("¿Rechazar esta solicitud?")) return;

    try {
      await updateDoc(doc(db, "solicitudes", id), {
        estado: "rechazada",
        fecha_rechazo: new Date()
      });

      setSolicitudes(solicitudes.map(s =>
        s.id === id ? { ...s, estado: "rechazada" } : s
      ));
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      let d;
      // Si ya es una instancia de Date
      if (fecha instanceof Date) {
        d = fecha;
      } else if (typeof fecha === 'object' && fecha.toDate) {
        // Si es un Timestamp de Firebase
        d = fecha.toDate();
      } else {
        // Intentar crear una fecha
        d = new Date(fecha);
      }
      
      if (isNaN(d.getTime())) return "-";
      
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }) + " " + d.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "-";
    }
  };

  // Color del chip según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "solicitado":
      case "pendiente":
        return "warning";
      case "asignada":
        return "success";
      case "rechazada":
        return "error";
      case "completada":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        {/* Encabezado */}
        <SolicitudesHeader />

        {/* Toolbar */}
        <TableToolbar
          searchValue={searchSolicitudes}
          onSearchChange={setSearchSolicitudes}
          sortOptions={[
            { label: "↑ Fecha (Más antigua)", value: "fecha-asc" },
            { label: "↓ Fecha (Más reciente)", value: "fecha-desc" },
            { label: "↑ Cliente (A-Z)", value: "cliente-asc" },
            { label: "↓ Cliente (Z-A)", value: "cliente-desc" },
          ]}
          sortValue={sortBySolicitudes}
          onSortChange={setSortBySolicitudes}
          filterOptions={[
            {
              name: "estado",
              label: "Estado",
              defaultValue: "todas",
              options: [
                { label: "Todas", value: "todas" },
                { label: "Solicitado", value: "solicitado" },
                { label: "Asignada", value: "asignada" },
                { label: "Rechazada", value: "rechazada" },
                { label: "Completada", value: "completada" },
              ],
            },
          ]}
          filterValue={{ estado: filterEstado }}
          onFilterChange={(filterName, value) => {
            if (filterName === "estado") {
              setFilterEstado(value);
            }
          }}
          visibleColumns={{}}
          onVisibleColumnsChange={() => {}}
          showClearButton={true}
        />

        {/* Tabla de solicitudes */}
        <SolicitudesTable
          solicitudesFiltradas={solicitudesFiltradas}
          onVerDetalles={handleVerDetalles}
          onVerOferta={handleVerOferta}
          onAsignarFlota={handleOpenDialog}
          onRechazar={handleRechazarSolicitud}
          formatearFecha={formatearFecha}
          getEstadoColor={getEstadoColor}
        />
      </Paper>

      {/* Diálogos */}
      <AsignarFlotaDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        selectedSolicitud={selectedSolicitud}
        asignadaFlota={asignadaFlota}
        onFlotaChange={setAsignadaFlota}
        onAsignar={handleAsignarFlota}
        flotasDisponibles={obtenerFlotasDisponibles(selectedSolicitud?.solicitud?.categoria || "")}
      />

      <DetallesDialog
        open={detallesDialogOpen}
        onClose={handleCloseDetallesDialog}
        solicitudSeleccionada={solicitudSeleccionada}
        formatearFecha={formatearFecha}
        disabledTextFieldStyles={disabledTextFieldStyles}
      />

      <OfertaDialog
        open={ofertaDialogOpen}
        onClose={handleCloseOfertaDialog}
        solicitudOferta={solicitudOferta}
      />
    </Box>
  );
};

export default Solicitudes;
