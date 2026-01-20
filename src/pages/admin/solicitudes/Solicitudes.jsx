import React, { useState, useEffect, useMemo, useContext, useRef } from "react";
import {
  Container,
  Paper,
  Box,
  Pagination,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { NotificationContext } from "../../../context/NotificationContext";
import { useAuth } from "../../../auth/AuthContext";
import { TableToolbar } from "../usuarios/components/TableToolbar";
import DateFilterComponent from "../usuarios/components/DateFilterComponent";

// Componentes modulares
import SolicitudesHeader from "./components/SolicitudesHeader";
import SolicitudesTable from "./components/SolicitudesTable";
import AsignarFlotaDialog from "./components/AsignarFlotaDialog";
import DetallesDialog from "./components/DetallesDialog";
import OfertaDialog from "./components/OfertaDialog";

const Solicitudes = () => {
  const { addNotification, deleteNotification } = useContext(NotificationContext);
  const { userRole } = useAuth();
  
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
  const [filterCategoria, setFilterCategoria] = useState("todas");
  const [flotas, setFlotas] = useState([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [asignadaFlota, setAsignadaFlota] = useState("");
  const [detallesDialogOpen, setDetallesDialogOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [ofertaDialogOpen, setOfertaDialogOpen] = useState(false);
  const [solicitudOferta, setSolicitudOferta] = useState(null);
  const [rechazarDialogOpen, setRechazarDialogOpen] = useState(false);
  const [solicitudParaRechazar, setSolicitudParaRechazar] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  // Estados para filtro de fecha
  const [dateFilterTypeSolicitudes, setDateFilterTypeSolicitudes] = useState("todos");
  const [customStartDateSolicitudes, setCustomStartDateSolicitudes] = useState("");
  const [customEndDateSolicitudes, setCustomEndDateSolicitudes] = useState("");

  // Estados para paginación
  const ITEMS_PER_PAGE = 10;
  const [pageSolicitudes, setPageSolicitudes] = useState(0);

  // Refs para comparar cambios entre snapshots (evita capturar estado stale)
  const prevSolicitudesRef = useRef([]);
  const initializedRef = useRef(false);

  // Resetear página al cambiar búsqueda o filtros
  useEffect(() => {
    setPageSolicitudes(0);
  }, [searchSolicitudes, filterEstado, filterCategoria]);

  // Cargar solicitudes en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "solicitudes"), (snapshot) => {
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

      // Detectar nuevas solicitudes de conductores
      if (prevSolicitudesRef.current && prevSolicitudesRef.current.length > 0) {
        data.forEach(nuevaSolicitud => {
          const yaExistia = prevSolicitudesRef.current.some(old => old.id === nuevaSolicitud.id);
          if (!yaExistia && nuevaSolicitud.solicitud?.tipo === 'conductor') {
            // Nueva solicitud de conductor detectada
            addNotification({
              message: `Nueva solicitud de conductor: ${nuevaSolicitud.solicitud?.detalles?.nombre || 'Sin nombre'}`,
              type: "info",
              duration: 6000
            });
          }
        });
      }

      setSolicitudes(data);
      // Guardar snapshot actual para comparaciones en la siguiente actualización
      try {
        prevSolicitudesRef.current = data;
      } catch (e) {}
    }, (error) => {
      console.error("Error cargando solicitudes:", error);
    });

    return () => unsubscribe();
  }, [addNotification]);

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
    const servicioNorm = normalizarTexto(servicio);
    
    const flotasDisponibles = flotas.filter(flota => {
      const servicios = flota.servicios;
      if (!servicios || typeof servicios !== 'object') {
        return false;
      }
      
      // Buscar en todas las ciudades
      for (const ciudad of Object.keys(servicios)) {
        const serviciosCiudad = servicios[ciudad];
        if (!serviciosCiudad || typeof serviciosCiudad !== 'object') continue;
        
        // Buscar servicios que coincidan con la categoría y servicio
        for (const servicioDato of Object.values(serviciosCiudad)) {
          if (!servicioDato || typeof servicioDato !== 'object') continue;
          
          const catFlota = normalizarTexto(servicioDato.categoria || "");
          // Buscar tanto en servicio como en nombre_visible
          const servFlota = normalizarTexto(servicioDato.servicio || servicioDato.nombre_visible || "");
          
          // Comparar: buscar si la categoría coincide (incluyendo variaciones de idioma)
          const categoriasCoinciden = 
            catFlota === categoriaNorm || 
            (categoriaNorm.includes("construction") && catFlota.includes("construccion")) ||
            (categoriaNorm.includes("construccion") && catFlota.includes("construccion")) ||
            (categoriaNorm.includes("maquinaria") && catFlota.includes("maquinaria"));
          
          // Si servicioNorm está vacío, solo verificar categoría
          const servicioCoincide = servicioNorm === "" || servFlota.includes(servicioNorm);
          
          if (categoriasCoinciden && servicioCoincide) {
            return true;
          }
        }
      }
      
      return false;
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
        const categoria = s.solicitud?.categoria || "";
        const servicio = s.solicitud?.servicio || "";
        return cliente.toLowerCase().includes(search) ||
               email.toLowerCase().includes(search) ||
               telefono.toLowerCase().includes(search) ||
               categoria.toLowerCase().includes(search) ||
               servicio.toLowerCase().includes(search);
      });
    }

    // Filtro por estado
    if (filterEstado !== "todas") {
      filtered = filtered.filter(s => {
        const estadoNormalizado = (s.estado || "").toLowerCase();
        const filtroNormalizado = filterEstado.toLowerCase();
        
        // Si es rechazada, incluir tanto "rechazada" como "cancelada"
        if (filtroNormalizado === "rechazada") {
          return estadoNormalizado === "rechazada" || estadoNormalizado === "cancelada";
        }
        // Si es cancelado, incluir tanto "cancelada" como "cancelado"
        if (filtroNormalizado === "cancelado") {
          return estadoNormalizado === "cancelada" || estadoNormalizado === "cancelado";
        }
        return estadoNormalizado === filtroNormalizado;
      });
    }

    // Filtro por categoría
    if (filterCategoria !== "todas") {
      filtered = filtered.filter(sol => sol.solicitud?.categoria === filterCategoria);
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
  }, [solicitudes, searchSolicitudes, filterEstado, sortBySolicitudes, dateFilterTypeSolicitudes, customStartDateSolicitudes, customEndDateSolicitudes, filterCategoria]);

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
      addNotification({
        type: "error",
        title: "Error",
        message: "Hubo un error al asignar la solicitud. Intenta de nuevo.",
        duration: 2000,
      });
    }
  };

  // Rechazar solicitud
  const handleAbrirRechazarDialog = (solicitud) => {
    setSolicitudParaRechazar(solicitud);
    setRechazarDialogOpen(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!solicitudParaRechazar || !motivoRechazo.trim()) {
      addNotification({
        type: "warning",
        title: "Motivo requerido",
        message: "Por favor ingresa un motivo para rechazar la solicitud.",
        duration: 2000,
      });
      return;
    }

    try {
      // Determinar el nuevo estado según el rol del usuario
      const nuevoEstado = userRole === "superadmin" ? "cancelado" : "pendiente";
      const updateData = {
        estado: nuevoEstado,
        fecha_rechazo: new Date(),
        motivo_rechazo: motivoRechazo,
      };

      // Si es un admin, limpiar la asignación anterior
      if (userRole !== "superadmin") {
        updateData.flota_asignada = null;
        updateData.fecha_asignacion = null;
      }

      await updateDoc(doc(db, "solicitudes", solicitudParaRechazar.id), updateData);

      setSolicitudes(solicitudes.map(s =>
        s.id === solicitudParaRechazar.id 
          ? { 
              ...s, 
              estado: nuevoEstado, 
              ...(userRole !== "superadmin" && { flota_asignada: null })
            } 
          : s
      ));

      // Agregar notificación según el rol
      const mensaje = userRole === "superadmin" 
        ? "La solicitud ha sido cancelada exitosamente."
        : "La solicitud ha sido rechazada y vuelve a pendiente para reasignación.";
      const titulo = userRole === "superadmin" ? "Solicitud Cancelada" : "Solicitud Rechazada";

      addNotification({
        type: "info",
        title: titulo,
        message: mensaje,
        duration: 2000,
      });

      setRechazarDialogOpen(false);
      setSolicitudParaRechazar(null);
      setMotivoRechazo("");
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Hubo un error al rechazar la solicitud. Intenta de nuevo.",
        duration: 2000,
      });
    }
  };

  const handleCancelarRechazo = () => {
    setRechazarDialogOpen(false);
    setSolicitudParaRechazar(null);
    setMotivoRechazo("");
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
    setSearchSolicitudes("");
    setFilterEstado("todas");
    setFilterCategoria("todas");
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
      } else if (typeof fecha === 'object' && typeof fecha.seconds === 'number') {
        // Objeto REST-like { seconds, nanoseconds }
        d = new Date(fecha.seconds * 1000);
      } else if (typeof fecha === 'number') {
        d = new Date(fecha);
      } else {
        // Intentar crear una fecha desde string u otro
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

  // Estilos del chip según estado (mismo que en solicitudes asignadas)
  const getEstadoStyles = (estado) => {
    const colorMap = {
      asignada: "#ffc107",
      ofertado: "#2196f3",
      aceptado: "#ff9800",
      conductor_asignado: "#4caf50",
      en_curso: "#2196f3",
      finalizado: "#4caf50",
      rechazada: "#f44336",
      solicitado: "#ffc107",
      pendiente: "#ffc107",
      completada: "#4caf50",
    };

    const color = colorMap[estado] || "#d7171a";
    
    return {
      backgroundColor: "transparent",
      color: color,
      fontWeight: 600,
      fontFamily: "Mulish, sans-serif",
      border: "1.5px solid",
      borderColor: color
    };
  };

  // Cache local para nombres de usuarios (pasajeros)
  const nombresPasajerosCacheRef = useRef({});
  const [, setForceRender] = useState(0);

  const obtenerNombreUsuario = (uid) => {
    if (!uid) return "No disponible";
    // Si lo tenemos en cache, devolverlo
    if (nombresPasajerosCacheRef.current[uid]) return nombresPasajerosCacheRef.current[uid];

    // Sino, iniciar fetch asíncrono y devolver 'Cargando...'
    (async () => {
      try {
        const snap = await getDoc(doc(db, "pasajeros", uid));
        if (snap && snap.exists && snap.exists()) {
          const data = snap.data();
          const nombre = data?.perfil?.name || data?.name || data?.email || "Usuario desconocido";
          nombresPasajerosCacheRef.current[uid] = nombre;
          setForceRender(f => f + 1);
          return;
        }

        // Si no existe, marcar como desconocido
        nombresPasajerosCacheRef.current[uid] = "Usuario desconocido";
        setForceRender(f => f + 1);
      } catch (e) {
        nombresPasajerosCacheRef.current[uid] = "Usuario desconocido";
        setForceRender(f => f + 1);
      }
    })();

    return "Cargando...";
  };

  // Enviar mensaje por WhatsApp al usuario
  const sendWhatsApp = (phone, name, servicio = "") => {
    try {
      if (!phone) {
        addNotification({
          type: "warning",
          title: "Validación",
          message: "No hay número de teléfono disponible para este usuario.",
          duration: 2000,
        });
        return;
      }

      const cleaned = String(phone).replace(/[^0-9+]/g, "");
      const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

      if (!digits || digits.length < 6) {
        addNotification({
          type: "warning",
          title: "Validación",
          message: `Número de teléfono inválido para WhatsApp: ${phone}`,
          duration: 2000,
        });
        return;
      }

      // Construir mensaje personalizado
      let mensaje = `Hola ${name || "amigo"}, te escribo desde la plataforma YAAPS`;
      
      if (servicio) {
        mensaje += ` del servicio de ${servicio}`;
      }
      
      mensaje += ` que solicitó.`;

      // Codificar el mensaje para URL
      const mensajeEncodificado = encodeURIComponent(mensaje);
      
      window.open(`https://wa.me/${digits}?text=${mensajeEncodificado}`, "_blank");
    } catch (error) {
      console.error("Error al abrir WhatsApp:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "No se pudo abrir WhatsApp.",
        duration: 2000,
      });
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
                    { label: "Ofertado", value: "ofertado" },
                    { label: "Aceptado", value: "aceptado" },
                    { label: "Conductor Asignado", value: "conductor_asignado" },
                    { label: "En Curso", value: "en_curso" },
                    { label: "Finalizado", value: "finalizado" },
                    { label: "Rechazada", value: "rechazada" },
                    { label: "Cancelado", value: "cancelado" },
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
          <Select
            value={filterCategoria}
            onChange={(e) => {
              setFilterCategoria(e.target.value);
              setPageSolicitudes(0);
            }}
            sx={{
              minWidth: 200,
              height: 40,
              fontFamily: "Mulish, sans-serif",
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#d7171a",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#d7171a",
                },
              },
            }}
          >
            <MenuItem value="todas">
              <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                Todas las Categorías
              </Typography>
            </MenuItem>
            {[...new Set(solicitudes.map(s => s.solicitud?.categoria).filter(Boolean))].sort().map((categoria) => (
              <MenuItem key={categoria} value={categoria}>
                <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                  {categoria?.replace(/_/g, " ")}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Tabla de solicitudes */}
        <SolicitudesTable
          solicitudesFiltradas={solicitudesPaginadas}
          onVerDetalles={handleVerDetalles}
          onVerOferta={handleVerOferta}
          onAsignarFlota={handleOpenDialog}
          onRechazar={handleAbrirRechazarDialog}
          formatearFecha={formatearFecha}
          getEstadoColor={getEstadoColor}
          getEstadoStyles={getEstadoStyles}
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
        flotasDisponibles={obtenerFlotasDisponibles(
          selectedSolicitud?.solicitud?.categoria || "",
          selectedSolicitud?.solicitud?.servicio || ""
        )}
      />

      <DetallesDialog
        open={detallesDialogOpen}
        onClose={handleCloseDetallesDialog}
        solicitudSeleccionada={solicitudSeleccionada}
        formatearFecha={formatearFecha}
        disabledTextFieldStyles={disabledTextFieldStyles}
        obtenerNombreUsuario={obtenerNombreUsuario}
        sendWhatsApp={sendWhatsApp}
        pasajeros={[]}
      />

      <OfertaDialog
        open={ofertaDialogOpen}
        onClose={handleCloseOfertaDialog}
        solicitudOferta={solicitudOferta}
      />

      {/* Diálogo para rechazar solicitud */}
      <Dialog 
        open={rechazarDialogOpen} 
        onClose={handleCancelarRechazo}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: "#d7171a", 
          color: "white",
          fontWeight: "bold",
          fontSize: "1.3rem"
        }}>
          ⚠️ Rechazar Solicitud
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body1" sx={{ color: "#333" }}>
              ¿Estás seguro de que deseas rechazar esta solicitud?
            </Typography>
            {solicitudParaRechazar && (
              <Box sx={{ 
                backgroundColor: "#fff3e0", 
                p: 2, 
                borderRadius: 1,
                border: "1px solid #ffe0b2"
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Detalles de la solicitud:
                </Typography>
                <Typography variant="body2">
                  <strong>Categoría:</strong> {solicitudParaRechazar.solicitud?.categoria || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Servicio:</strong> {solicitudParaRechazar.solicitud?.servicio || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Dirección:</strong> {solicitudParaRechazar.solicitud?.ubicacion?.direccion || "N/A"}
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              label="Motivo del rechazo"
              placeholder="Ingresa el motivo por el cual rechazas esta solicitud..."
              multiline
              rows={3}
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#d7171a',
                    borderWidth: 2
                  },
                  '&:hover fieldset': {
                    borderColor: '#d7171a',
                    borderWidth: 2
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d7171a',
                    borderWidth: 2
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#d7171a',
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: '#d7171a'
                  }
                }
              }}
            />
            <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic" }}>
              Esta acción no se puede deshacer.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleCancelarRechazo}
            variant="outlined"
            sx={{ 
              borderColor: "#999",
              color: "#999",
              "&:hover": {
                borderColor: "#666",
                backgroundColor: "#f5f5f5"
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmarRechazo}
            variant="contained" 
            sx={{ 
              backgroundColor: "#d7171a",
              "&:hover": {
                backgroundColor: "#b81315"
              }
            }}
          >
            Sí, Rechazar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Solicitudes;
