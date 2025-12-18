import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Paper,
  Box,
  Pagination,
  Typography,
} from "@mui/material";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { TableToolbar } from "../usuarios/components/TableToolbar";
import DateFilterComponent from "../usuarios/components/DateFilterComponent";

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
  const [sortBySolicitudes, setSortBySolicitudes] = useState("recientes");
  const [flotas, setFlotas] = useState([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [asignadaFlota, setAsignadaFlota] = useState("");
  const [detallesDialogOpen, setDetallesDialogOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [ofertaDialogOpen, setOfertaDialogOpen] = useState(false);
  const [solicitudOferta, setSolicitudOferta] = useState(null);

  // Estados para filtro de fecha
  const [dateFilterTypeSolicitudes, setDateFilterTypeSolicitudes] = useState("todos");
  const [customStartDateSolicitudes, setCustomStartDateSolicitudes] = useState("");
  const [customEndDateSolicitudes, setCustomEndDateSolicitudes] = useState("");

  // Estados para paginación
  const ITEMS_PER_PAGE = 10;
  const [pageSolicitudes, setPageSolicitudes] = useState(0);

  // Resetear página al cambiar búsqueda o filtros
  useEffect(() => {
    setPageSolicitudes(0);
  }, [searchSolicitudes, filterEstado]);

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
        const email = s.solicitud?.email || s.email || "";
        const telefono = s.solicitud?.telefono || s.telefono || "";
        return cliente.toLowerCase().includes(search) ||
               email.toLowerCase().includes(search) ||
               telefono.toLowerCase().includes(search);
      });
    }

    // Filtro por estado
    if (filterEstado !== "todas") {
      filtered = filtered.filter(s => s.estado === filterEstado);
    }

    // Filtro por período de fecha
    if (dateFilterTypeSolicitudes !== "todos") {
      const now = new Date();
      
      filtered = filtered.filter((s) => {
        // Obtener la fecha - intentar múltiples ubicaciones
        let dateField = s.solicitud?.fechaCreacion || s.fechaCreacion || s.createdAt;
        if (!dateField) return false;

        let date;
        // Convertir a Date según el tipo
        if (dateField instanceof Date) {
          date = new Date(dateField);
        } else if (typeof dateField === "object" && dateField.seconds) {
          date = new Date(dateField.seconds * 1000);
        } else if (typeof dateField === "object" && dateField.toDate) {
          date = dateField.toDate();
        } else if (typeof dateField === "number") {
          date = new Date(dateField);
        } else if (typeof dateField === "string") {
          date = new Date(dateField);
        } else {
          return false;
        }

        if (isNaN(date.getTime())) return false;

        // Normalizar fecha a medianoche para comparación consistente
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (dateFilterTypeSolicitudes) {
          case "hoy":
            return dateOnly.getTime() === today.getTime();
          
          case "esta-semana": {
            const startOfWeek = new Date(today);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day;
            startOfWeek.setDate(diff);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);
            
            return dateOnly >= startOfWeek && dateOnly < endOfWeek;
          }
          
          case "este-mes": {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            return dateOnly >= startOfMonth && dateOnly < endOfMonth;
          }
          
          case "ultimos-7": {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return dateOnly >= sevenDaysAgo && dateOnly <= today;
          }
          
          case "ultimos-30": {
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return dateOnly >= thirtyDaysAgo && dateOnly <= today;
          }
          
          case "custom": {
            if (customStartDateSolicitudes && customEndDateSolicitudes) {
              const start = new Date(customStartDateSolicitudes);
              const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
              
              const end = new Date(customEndDateSolicitudes);
              const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
              const endDateNextDay = new Date(endDate);
              endDateNextDay.setDate(endDateNextDay.getDate() + 1);
              
              return dateOnly >= startDate && dateOnly < endDateNextDay;
            }
            return true;
          }
          
          default:
            return true;
        }
      });
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortBySolicitudes) {
      case "recientes":
        sorted.sort((a, b) => {
          const fechaA = a.solicitud?.fechaCreacion || a.fechaCreacion;
          const fechaB = b.solicitud?.fechaCreacion || b.fechaCreacion;
          return new Date(fechaB) - new Date(fechaA);
        });
        break;
      case "antiguos":
        sorted.sort((a, b) => {
          const fechaA = a.solicitud?.fechaCreacion || a.fechaCreacion;
          const fechaB = b.solicitud?.fechaCreacion || b.fechaCreacion;
          return new Date(fechaA) - new Date(fechaB);
        });
        break;
      case "categoria-asc":
        sorted.sort((a, b) => {
          const categoriaA = (a.solicitud?.categoria || "").toLowerCase();
          const categoriaB = (b.solicitud?.categoria || "").toLowerCase();
          return categoriaA.localeCompare(categoriaB);
        });
        break;
      case "categoria-desc":
        sorted.sort((a, b) => {
          const categoriaA = (a.solicitud?.categoria || "").toLowerCase();
          const categoriaB = (b.solicitud?.categoria || "").toLowerCase();
          return categoriaB.localeCompare(categoriaA);
        });
        break;
      case "servicio-asc":
        sorted.sort((a, b) => {
          const servicioA = (a.solicitud?.servicio || "").toLowerCase();
          const servicioB = (b.solicitud?.servicio || "").toLowerCase();
          return servicioA.localeCompare(servicioB);
        });
        break;
      case "servicio-desc":
        sorted.sort((a, b) => {
          const servicioA = (a.solicitud?.servicio || "").toLowerCase();
          const servicioB = (b.solicitud?.servicio || "").toLowerCase();
          return servicioB.localeCompare(servicioA);
        });
        break;
      case "estado-asc":
        sorted.sort((a, b) => {
          const estadoA = (a.estado || "").toLowerCase();
          const estadoB = (b.estado || "").toLowerCase();
          return estadoA.localeCompare(estadoB);
        });
        break;
      case "estado-desc":
        sorted.sort((a, b) => {
          const estadoA = (a.estado || "").toLowerCase();
          const estadoB = (b.estado || "").toLowerCase();
          return estadoB.localeCompare(estadoA);
        });
        break;
      default:
        break;
    }

    return sorted;
  }, [solicitudes, searchSolicitudes, filterEstado, sortBySolicitudes, dateFilterTypeSolicitudes, customStartDateSolicitudes, customEndDateSolicitudes]);

  // Datos paginados para Solicitudes
  const solicitudesPaginadas = useMemo(() => {
    const start = pageSolicitudes * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return solicitudesFiltradas.slice(start, end);
  }, [solicitudesFiltradas, pageSolicitudes]);

  const totalPagesSolicitudes = Math.ceil(solicitudesFiltradas.length / ITEMS_PER_PAGE);

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

  // Manejadores para filtro de fecha
  const handleDateFilterChangeSolicitudes = (dateType, startDate, endDate) => {
    setDateFilterTypeSolicitudes(dateType);
    if (dateType === "custom") {
      setCustomStartDateSolicitudes(startDate || "");
      setCustomEndDateSolicitudes(endDate || "");
    } else {
      setCustomStartDateSolicitudes("");
      setCustomEndDateSolicitudes("");
    }
    setPageSolicitudes(0);
  };

  const handleClearAllSolicitudes = () => {
    setDateFilterTypeSolicitudes("todos");
    setCustomStartDateSolicitudes("");
    setCustomEndDateSolicitudes("");
    setPageSolicitudes(0);
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

        {/* Toolbar y Filtros Alineados */}
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end", mb: 2, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <TableToolbar
              searchValue={searchSolicitudes}
              onSearchChange={setSearchSolicitudes}
              searchPlaceholder="Cliente, Email, Teléfono"
              sortOptions={[
                { label: "↑ Más Recientes", value: "recientes" },
                { label: "↓ Más Antiguos", value: "antiguos" },
                { label: "↑ Categoría A-Z", value: "categoria-asc" },
                { label: "↓ Categoría Z-A", value: "categoria-desc" },
                { label: "↑ Servicio A-Z", value: "servicio-asc" },
                { label: "↓ Servicio Z-A", value: "servicio-desc" },
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
              onColumnChange={() => {}}
              showClearButton={true}
              onClearAll={handleClearAllSolicitudes}
              dateFilter={dateFilterTypeSolicitudes}
            />
          </Box>
          
          {/* Filtro de Fecha para Solicitudes */}
          <DateFilterComponent
            onFilterChange={handleDateFilterChangeSolicitudes}
            currentDateFilter={dateFilterTypeSolicitudes}
          />
        </Box>

        {/* Tabla de solicitudes */}
        <SolicitudesTable
          solicitudesFiltradas={solicitudesPaginadas}
          onVerDetalles={handleVerDetalles}
          onVerOferta={handleVerOferta}
          onAsignarFlota={handleOpenDialog}
          onRechazar={handleRechazarSolicitud}
          formatearFecha={formatearFecha}
          getEstadoColor={getEstadoColor}
        />

        {/* Controles de paginación */}
        {solicitudesFiltradas.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Mostrando {solicitudesPaginadas.length > 0 ? (pageSolicitudes * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pageSolicitudes + 1) * ITEMS_PER_PAGE, solicitudesFiltradas.length)} de {solicitudesFiltradas.length}
            </Typography>
            <Pagination 
              count={totalPagesSolicitudes}
              page={pageSolicitudes + 1}
              onChange={(e, page) => setPageSolicitudes(page - 1)}
              sx={{
                "& .MuiPaginationItem-root": {
                  fontFamily: "Mulish, sans-serif",
                  color: "#000",
                }
              }}
            />
          </Box>
        )}
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
