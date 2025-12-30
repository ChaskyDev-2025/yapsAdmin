import React, { useState, useEffect, useMemo, useContext, useRef } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Pagination,
} from "@mui/material";
import { collection, getDocs, updateDoc, doc, query, where, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { NotificationContext } from "../../../context/NotificationContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DetallesDialog from "../solicitudes/components/DetallesDialog";
import { TableToolbar } from "../usuarios/components/TableToolbar";
import DateFilterComponent from "../usuarios/components/DateFilterComponent";
import GenerarOfertaModal from "./components/GenerarOfertaModal";

const SolicitudesAsignadas = () => {
  const { userFlotaId } = useAuth();
  const { addNotification } = useContext(NotificationContext);
  
  // Refs para comparar cambios
  const prevSolicitudesRef = useRef([]);
  const initializedRef = useRef(false);
  
  const disabledTextFieldStyles = {
    "& .MuiInputBase-input.Mui-disabled": {
      color: "#000",
      WebkitTextFillColor: "#000"
    }
  };

  const [solicitudes, setSolicitudes] = useState([]);
  const [datosIniciales, setDatosIniciales] = useState(false);
  const [conductores, setConductores] = useState([]);
  const [pasajeros, setPasajeros] = useState([]);
  const [flotaServicios, setFlotaServicios] = useState(null);
  const [flotaId, setFlotaId] = useState(null);
  const [searchSolicitudes, setSearchSolicitudes] = useState("");
  const [filterEstado, setFilterEstado] = useState("todas");
  const [sortBySolicitudes, setSortBySolicitudes] = useState("fecha-desc");
  const [visibleColumnsSolicitudes, setVisibleColumnsSolicitudes] = useState({
    categoria: true,
    servicio: true,
    fechaCreacion: true,
    conductor: true,
    estado: true,
    acciones: true,
  });
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [asignadoConductor, setAsignadoConductor] = useState("");
  const [detallesDialogOpen, setDetallesDialogOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [ofertaModalOpen, setOfertaModalOpen] = useState(false);
  const [solicitudParaOferta, setSolicitudParaOferta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ofertaDialogOpen, setOfertaDialogOpen] = useState(false);
  const [solicitudOferta, setSolicitudOferta] = useState(null);
  const [pageSolicitudes, setPageSolicitudes] = useState(0);
  const [periodFilterSolicitudes, setPeriodFilterSolicitudes] = useState("todos");
  const [rechazarDialogOpen, setRechazarDialogOpen] = useState(false);
  const [solicitudParaRechazar, setSolicitudParaRechazar] = useState(null);
  const ITEMS_PER_PAGE = 10;

  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setPageSolicitudes(0);
  }, [searchSolicitudes]);
  const sortOptions = [
    { label: "Fecha más reciente", value: "fecha-desc" },
    { label: "Fecha más antigua", value: "fecha-asc" }
  ];

  const filterOptions = [
    {
      name: "estado",
      label: "Estado",
      defaultValue: "todas",
      options: [
        { label: "Todas", value: "todas" },
        { label: "Asignada", value: "asignada" },
        { label: "Ofertado", value: "ofertado" },
        { label: "Aceptado", value: "aceptado" },
        { label: "Conductor Asignado", value: "conductor_asignado" },
        { label: "En Curso", value: "en_curso" },
        { label: "Finalizado", value: "finalizado" },
        { label: "Rechazado", value: "rechazado" }
      ]
    }
  ];

  // Cargar solicitudes asignadas a esta flota específicamente en tiempo real
  useEffect(() => {
    if (!userFlotaId) {
      setSolicitudes([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    // Cargar datos de la flota del usuario para comparar servicios
    const cargarFlotaServicios = async () => {
      try {
        const flotaDoc = await getDoc(doc(db, "flotas", userFlotaId));
        if (flotaDoc.exists()) {
          setFlotaServicios(flotaDoc.data());
        } else {
          setFlotaServicios(null);
        }
      } catch (e) {
        console.error('Error cargando flota servicios', e);
        setFlotaServicios(null);
      }
    };
    cargarFlotaServicios();
    // Filtrar solo las solicitudes de la flota actual del usuario
    const q = query(
      collection(db, "solicitudes"),
      where("flota_asignada", "==", userFlotaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => {
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

      // Si no inicializado, solo cargar sin notificar
      if (!initializedRef.current) {
        setSolicitudes(data);
        setFlotaId(userFlotaId);
        setCargando(false);
        initializedRef.current = true;
        return;
      }

      // Procesar cambios incrementales para notificaciones (docChanges)
      try {
        const raw = localStorage.getItem('notifiedSolicitudes');
        const notified = raw ? new Set(JSON.parse(raw)) : new Set();

        const normalize = (str) => String(str || "").toLowerCase().replace(/[_\s-]+/g, "_").replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u").replace(/ñ/g, "n");

        const flotaMatchesSolicitud = (docData) => {
          try {
            if (!flotaServicios) return false;
            const catSol = normalize(docData.solicitud?.categoria || docData.categoria || "");
            const servSol = normalize(docData.solicitud?.servicio || docData.servicio || docData.solicitud?.servicioVisible || "");

            // flotaServicios expected structure: { servicios: { ciudad: { id: { categoria, servicio, nombre_visible } } } }
            const serviciosObj = flotaServicios.servicios || flotaServicios;
            for (const ciudad of Object.keys(serviciosObj || {})) {
              const serviciosCiudad = serviciosObj[ciudad];
              if (!serviciosCiudad) continue;
              for (const sKey of Object.keys(serviciosCiudad)) {
                const s = serviciosCiudad[sKey];
                const catFlota = normalize(s.categoria || s.categoria_servicio || "");
                const servFlota = normalize(s.servicio || s.nombre_visible || s.servicio_visible || "");

                if (catFlota && catSol && (catFlota === catSol || catFlota.includes(catSol) || catSol.includes(catFlota))) {
                  if (!servSol) return true;
                  if (servFlota && (servFlota === servSol || servFlota.includes(servSol) || servSol.includes(servFlota))) return true;
                }
              }
            }
          } catch (e) {
            return false;
          }
          return false;
        };

        snapshot.docChanges().forEach((change) => {
          const doc = change.doc;
          const docData = doc.data();

          // Estado actual y previo
          const prev = prevSolicitudesRef.current.find(s => s.id === doc.id);
          const prevEstado = prev?.estado;
          const nuevoEstado = docData.estado;

          const isSolicitadoNow = nuevoEstado === 'solicitado';

          const shouldNotify = () => {
            // If flota_asignada explicitly points to this flota and state is solicitado
            if (docData.flota_asignada === userFlotaId && isSolicitadoNow) return true;

            // If state changed to solicitado and the solicitud matches this flota's services
            if ((change.type === 'added' && isSolicitadoNow) || (change.type === 'modified' && prev && prevEstado !== 'solicitado' && isSolicitadoNow)) {
              return flotaMatchesSolicitud(docData);
            }

            return false;
          };

          if (shouldNotify() && !notified.has(doc.id)) {
            const origen = docData.solicitud?.origen?.nombre || "Nueva solicitud";
            addNotification({ message: `Solicitud solicitada: ${origen}`, type: "warning" });
            playNotificationSound();
            notified.add(doc.id);
          }
        });

        try {
          localStorage.setItem('notifiedSolicitudes', JSON.stringify(Array.from(notified)));
        } catch (e) {
          // ignore storage errors
        }
      } catch (e) {
        console.error('Error procesando docChanges para notificaciones', e);
      }

      // Finalmente actualizar el listado completo
      setSolicitudes(data);
      setFlotaId(userFlotaId);
      setCargando(false);
    }, (error) => {
      console.error("Error cargando solicitudes:", error);
      setCargando(false);
    });

    return () => unsubscribe();
  }, [userFlotaId]);

  // Marcar cuando se cargan los datos iniciales
  useEffect(() => {
    if (!cargando && !datosIniciales) {
      setDatosIniciales(true);
    }
  }, [cargando, datosIniciales]);

  // Actualizar ref cuando datosIniciales se vuelve true
  useEffect(() => {
    if (datosIniciales) {
      prevSolicitudesRef.current = solicitudes;
    }
  }, [datosIniciales, solicitudes]);

  // Detectar nuevas solicitudes asignadas
  useEffect(() => {
    if (!datosIniciales) return;

    const prevSolicitudesData = prevSolicitudesRef.current;
    
    // Solo procesar si cambió la cantidad
    if (prevSolicitudesData.length === solicitudes.length) {
      return;
    }

    // Si aumentó la cantidad, buscar cuáles son nuevas
    if (solicitudes.length > prevSolicitudesData.length) {
      const prevIds = new Set(prevSolicitudesData.map(s => s.id));
      const nuevosSolicitudes = solicitudes.filter(
        s => !prevIds.has(s.id)
      );

      // Enviar notificación para cada nueva solicitud
      nuevosSolicitudes.forEach((solicitud) => {
        const origen = solicitud.solicitud?.origen?.nombre || "Nueva solicitud";
        addNotification({
          message: `Solicitud asignada: ${origen}`,
          type: "warning",
        });
        playNotificationSound();
      });
    }

    // Actualizar ref
    prevSolicitudesRef.current = solicitudes;
  }, [solicitudes, datosIniciales, addNotification]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Error reproduciendo sonido
    }
  };

  // Cargar conductores de la flota
  useEffect(() => {
    const cargarConductores = async () => {
      if (!flotaId) return; // No cargar si no tenemos flotaId

      try {
        const snapshot = await getDocs(collection(db, "trabajadores"));
        const data = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(trabajador => trabajador.flotaId === flotaId); // Filtrar por flotaId
        
        setConductores(data);
      } catch (error) {
        console.error("Error cargando conductores:", error);
      }
    };

    cargarConductores();
  }, [flotaId]);

  // Cargar pasajeros
  useEffect(() => {
    const cargarPasajeros = async () => {
      try {
        const snapshot = await getDocs(collection(db, "pasajeros"));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPasajeros(data);
      } catch (error) {
        console.error("Error cargando pasajeros:", error);
      }
    };

    cargarPasajeros();
  }, []);

  // Funciones auxiliares
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      // Firestore Timestamp (.toDate())
      if (fecha?.toDate && typeof fecha.toDate === 'function') {
        fecha = fecha.toDate();
      } else if (typeof fecha === 'object' && typeof fecha.seconds === 'number') {
        // REST-like timestamp object { seconds, nanoseconds }
        fecha = new Date(fecha.seconds * 1000);
      } else if (typeof fecha === 'number') {
        // epoch ms
        fecha = new Date(fecha);
      } else {
        // try parsing strings or other representations
        fecha = new Date(fecha);
      }

      if (!(fecha instanceof Date) || isNaN(fecha.getTime())) return "-";

      return fecha.toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "-";
    }
  };

  const obtenerNombreConductor = (conductorId) => {
    if (!conductorId) return "Sin asignar";
    if (conductores.length === 0) return "Cargando...";
    const conductor = conductores.find(c => c.id === conductorId);
    if (!conductor) return "Conductor desconocido";
    
    // Intentar obtener el nombre de diferentes ubicaciones
    const nombre = 
      conductor?.nombre || 
      conductor?.perfil?.nombre || 
      conductor?.perfil?.displayName ||
      conductor?.displayName ||
      conductor?.email ||
      conductorId;
    
    return nombre;
  };

  // Obtener nombre del usuario que solicita
  const obtenerNombreUsuario = (uid) => {
    if (!uid) return "No disponible";
    
    // Buscar en pasajeros
    const pasajero = pasajeros.find(p => p.id === uid);
    if (pasajero) {
      return pasajero.perfil?.name || pasajero.name || pasajero.email || "Usuario desconocido";
    }
    
    return "Usuario desconocido";
  };

  // Filtrado y ordenamiento
  const solicitudesFiltradas = useMemo(() => {
    let resultado = solicitudes;

    // Filtro por período
    if (periodFilterSolicitudes !== "todos") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      resultado = resultado.filter((sol) => {
        if (!sol.solicitud?.fechaCreacion) return false;
        
        let fechaDate;
        const fecha = sol.solicitud.fechaCreacion;
        if (fecha?.toDate && typeof fecha.toDate === 'function') {
          fechaDate = fecha.toDate();
        } else if (typeof fecha === 'string') {
          fechaDate = new Date(fecha);
        } else if (fecha instanceof Date) {
          fechaDate = fecha;
        } else if (fecha?.seconds) {
          fechaDate = new Date(fecha.seconds * 1000);
        } else {
          return false;
        }
        
        // Obtener solo la fecha (ignorar hora)
        const registroDate = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate());
        
        switch (periodFilterSolicitudes) {
          case "hoy":
            return registroDate.getTime() === today.getTime();
          case "esta-semana": {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return registroDate >= startOfWeek && registroDate <= today;
          }
          case "este-mes": {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            return registroDate >= startOfMonth && registroDate <= today;
          }
          case "ultimos-7": {
            const hace7Dias = new Date(today);
            hace7Dias.setDate(hace7Dias.getDate() - 7);
            return registroDate >= hace7Dias && registroDate <= today;
          }
          case "ultimos-30": {
            const hace30Dias = new Date(today);
            hace30Dias.setDate(hace30Dias.getDate() - 30);
            return registroDate >= hace30Dias && registroDate <= today;
          }
          default:
            return true;
        }
      });
    }

    // Búsqueda
    if (searchSolicitudes) {
      const searchLower = searchSolicitudes.toLowerCase();
      resultado = resultado.filter(sol =>
        sol.solicitud?.detalles?.descripcion?.toLowerCase().includes(searchLower) ||
        sol.solicitud?.categoria?.toLowerCase().includes(searchLower) ||
        sol.uidUser?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (filterEstado !== "todas") {
      resultado = resultado.filter(sol => sol.estado === filterEstado);
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      if (sortBySolicitudes === "fecha-desc") {
        return new Date(b.solicitud?.fechaCreacion || 0) - new Date(a.solicitud?.fechaCreacion || 0);
      } else if (sortBySolicitudes === "fecha-asc") {
        return new Date(a.solicitud?.fechaCreacion || 0) - new Date(b.solicitud?.fechaCreacion || 0);
      }
      return 0;
    });

    return resultado;
  }, [solicitudes, searchSolicitudes, filterEstado, sortBySolicitudes, periodFilterSolicitudes]);

  // Paginación
  const solicitudesPaginadas = useMemo(() => {
    const start = pageSolicitudes * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return solicitudesFiltradas.slice(start, end);
  }, [solicitudesFiltradas, pageSolicitudes]);

  const totalPagesSolicitudes = Math.ceil(solicitudesFiltradas.length / ITEMS_PER_PAGE);

  // Manejadores de diálogos
  const handleOpenDialog = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setAsignadoConductor(solicitud.conductor_asignado || "");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSolicitud(null);
    setAsignadoConductor("");
  };

  const handleOpenDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setDetallesDialogOpen(true);
  };

  const handleCloseDetalles = () => {
    setDetallesDialogOpen(false);
    setSolicitudSeleccionada(null);
  };

  const handleOpenOfertaModal = (solicitud) => {
    setSolicitudParaOferta(solicitud);
    setOfertaModalOpen(true);
  };

  const handleCloseOfertaModal = () => {
    setOfertaModalOpen(false);
    setSolicitudParaOferta(null);
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

  const handleSaveOferta = async (ofertaData) => {
    if (!solicitudParaOferta) return;

    try {
      await updateDoc(doc(db, "solicitudes", solicitudParaOferta.id), {
        solicitud: {
          ...solicitudParaOferta.solicitud,
          oferta: {
            costo: ofertaData.costo, // Total a cobrar (costo base + campos)
            costoServicio: ofertaData.costoServicio || 0,
            campos: ofertaData.campos,
            fechaOferta: new Date()
          }
        },
        estado: "ofertado"
      });

      setSolicitudes(prevSolicitudes =>
        prevSolicitudes.map(sol =>
          sol.id === solicitudParaOferta.id
            ? {
                ...sol,
                solicitud: {
                  ...sol.solicitud,
                  oferta: {
                    costo: ofertaData.costo,
                    costoServicio: ofertaData.costoServicio || 0,
                    campos: ofertaData.campos,
                    fechaOferta: new Date()
                  }
                },
                estado: "ofertado"
              }
            : sol
        )
      );

      handleCloseOfertaModal();
      alert("Oferta guardada exitosamente");
    } catch (error) {
      console.error("Error guardando oferta:", error);
      alert("Error al guardar la oferta");
    }
  };

  // Asignar conductor
  const handleAsignarConductor = async () => {
    if (!selectedSolicitud || !asignadoConductor) {
      alert("Por favor selecciona un conductor");
      return;
    }

    try {
      await updateDoc(doc(db, "solicitudes", selectedSolicitud.id), {
        conductor_asignado: asignadoConductor,
        estado: "en_proceso"
      });

      setSolicitudes(prevSolicitudes =>
        prevSolicitudes.map(sol =>
          sol.id === selectedSolicitud.id
            ? { ...sol, conductor_asignado: asignadoConductor, estado: "en_proceso" }
            : sol
        )
      );

      handleCloseDialog();
      alert("Conductor asignado correctamente");
    } catch (error) {
      console.error("Error asignando conductor:", error);
      alert("Error al asignar conductor");
    }
  };

  // Rechazar solicitud
  const handleAbrirRechazarDialog = (solicitud) => {
    setSolicitudParaRechazar(solicitud);
    setRechazarDialogOpen(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!solicitudParaRechazar) return;

    try {
      await updateDoc(doc(db, "solicitudes", solicitudParaRechazar.id), {
        estado: "rechazada",
        motivo_rechazo: "Rechazada por la flota"
      });

      setSolicitudes(prevSolicitudes => prevSolicitudes.filter(sol => sol.id !== solicitudParaRechazar.id));
      setRechazarDialogOpen(false);
      setSolicitudParaRechazar(null);
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Hubo un error al rechazar la solicitud.",
        duration: 2000,
      });
    }
  };

  const handleCancelarRechazo = () => {
    setRechazarDialogOpen(false);
    setSolicitudParaRechazar(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#000000", fontFamily: "Mulish, sans-serif" }}>
          📋 Solicitudes Asignadas
        </Typography>
        <Typography variant="body2" sx={{ color: "#484848", mb: 3, fontFamily: "Mulish, sans-serif" }}>
          Gestiona las solicitudes de servicio asignadas a tu flota
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Box sx={{ flex: 1 }}>
            <TableToolbar
              searchValue={searchSolicitudes}
              onSearchChange={setSearchSolicitudes}
              sortOptions={sortOptions}
              sortValue={sortBySolicitudes}
              onSortChange={setSortBySolicitudes}
              filterOptions={filterOptions}
              filterValue={{ estado: filterEstado }}
              onFilterChange={(filterName, value) => {
                if (filterName === "estado") {
                  setFilterEstado(value);
                }
              }}
              visibleColumns={visibleColumnsSolicitudes}
              onColumnChange={(col, visible) => setVisibleColumnsSolicitudes(prev => ({ ...prev, [col]: visible }))}
              showClearButton={searchSolicitudes !== "" || filterEstado !== "todas"}
              onClear={() => {
                setSearchSolicitudes("");
                setFilterEstado("todas");
                setSortBySolicitudes("fecha-desc");
              }}
            />
          </Box>
          <DateFilterComponent
            onFilterChange={setPeriodFilterSolicitudes}
            currentDateFilter={periodFilterSolicitudes}
          />
        </Box>

        <TableContainer sx={{ mt: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#000000" }}>
              <TableRow>
                <TableCell sx={{ 
                  backgroundColor: "#000000", 
                  color: "white", 
                  fontWeight: 700, 
                  fontFamily: "Mulish, sans-serif", 
                  fontSize: "0.95rem"
                }}>Categoría</TableCell>
                <TableCell sx={{ 
                  backgroundColor: "#000000", 
                  color: "white", 
                  fontWeight: 700, 
                  fontFamily: "Mulish, sans-serif", 
                  fontSize: "0.95rem"
                }}>Servicio</TableCell>
                <TableCell sx={{ 
                  backgroundColor: "#000000", 
                  color: "white", 
                  fontWeight: 700, 
                  fontFamily: "Mulish, sans-serif", 
                  fontSize: "0.95rem"
                }}>Fecha Creación</TableCell>
                <TableCell sx={{ 
                  backgroundColor: "#000000", 
                  color: "white", 
                  fontWeight: 700, 
                  fontFamily: "Mulish, sans-serif", 
                  fontSize: "0.95rem"
                }}>Conductor</TableCell>
                <TableCell sx={{ 
                  backgroundColor: "#000000", 
                  color: "white", 
                  fontWeight: 700, 
                  fontFamily: "Mulish, sans-serif", 
                  fontSize: "0.95rem"
                }}>Estado</TableCell>
                <TableCell sx={{ 
                  backgroundColor: "#000000", 
                  color: "white", 
                  fontWeight: 700, 
                  fontFamily: "Mulish, sans-serif", 
                  fontSize: "0.95rem",
                  textAlign: "center" 
                }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 3 }}>
                    <Typography>Cargando solicitudes...</Typography>
                  </TableCell>
                </TableRow>
              ) : solicitudesFiltradas.length > 0 ? (
                solicitudesPaginadas.map((solicitud) => (
                  <TableRow 
                    key={solicitud.id} 
                    sx={{ 
                      borderBottom: "1px solid #d0d0d0",
                      "&:hover": { backgroundColor: "#f9f9f9" } 
                    }}
                  >
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>{solicitud.solicitud?.categoria || "-"}</TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>{solicitud.solicitud?.servicio || "-"}</TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>{formatearFecha(solicitud.solicitud?.fechaCreacion || solicitud.fechaCreacion)}</TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>{obtenerNombreConductor(solicitud.conductor_asignado)}</TableCell>
                    <TableCell>
                      <Chip
                        label={solicitud.estado}
                        sx={{
                          backgroundColor: 
                            solicitud.estado === "asignada" ? "#ffc107" :
                            solicitud.estado === "ofertado" ? "#2196f3" :
                            solicitud.estado === "aceptado" ? "#ff9800" :
                            solicitud.estado === "conductor_asignado" ? "#4caf50" :
                            solicitud.estado === "en_curso" ? "#2196f3" :
                            solicitud.estado === "finalizado" ? "#4caf50" :
                            solicitud.estado === "rechazado" ? "#f44336" :
                            "#d7171a",
                          color: "white",
                          fontWeight: 600,
                          fontFamily: "Mulish, sans-serif"
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDetalles(solicitud)}
                        title="Ver detalles"
                        sx={{ color: "#d7171a" }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {solicitud.solicitud?.oferta && (
                        <IconButton
                          size="small"
                          onClick={() => handleVerOferta(solicitud)}
                          sx={{ color: "#ff9800" }}
                          title="Ver oferta"
                        >
                          <AttachMoneyIcon />
                        </IconButton>
                      )}
                      {solicitud.estado === "asignada" && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenOfertaModal(solicitud)}
                            title="Generar oferta"
                            sx={{ color: "#d7171a" }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleAbrirRechazarDialog(solicitud)}
                            title="Rechazar"
                            sx={{ color: "#f44336" }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                      {solicitud.estado === "aceptado" && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(solicitud)}
                            title="Asignar conductor"
                            sx={{ color: "#4caf50" }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleAbrirRechazarDialog(solicitud)}
                            title="Rechazar"
                            color="error"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : !cargando ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 3 }}>
                    No hay solicitudes asignadas
                  </TableCell>
                </TableRow>
              ) : null
              }
            </TableBody>
          </Table>
        </TableContainer>
        {solicitudesFiltradas.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Mostrando {pageSolicitudes * ITEMS_PER_PAGE + 1} - {Math.min((pageSolicitudes + 1) * ITEMS_PER_PAGE, solicitudesFiltradas.length)} de {solicitudesFiltradas.length}
            </Typography>
            <Pagination
              count={totalPagesSolicitudes}
              page={pageSolicitudes + 1}
              onChange={(e, page) => setPageSolicitudes(page - 1)}
              sx={{
                "& .MuiButtonBase-root": {
                  fontFamily: "Mulish, sans-serif",
                  color: "#000",
                },
                "& .Mui-selected": {
                  backgroundColor: "#aaaaaa !important",
                  color: "white",
                },
              }}
            />
          </Box>
        )}
        {/* Diálogo para asignar conductor */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Conductor</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Categoría"
                fullWidth
                value={selectedSolicitud?.solicitud?.categoria || ""}
                disabled
                sx={disabledTextFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Conductor</InputLabel>
                <Select
                  value={asignadoConductor}
                  label="Seleccionar Conductor"
                  onChange={(e) => setAsignadoConductor(e.target.value)}
                >
                  {conductores.map((conductor) => {
                    const nombre = 
                      conductor?.nombre || 
                      conductor?.perfil?.name || 
                      conductor?.perfil?.displayName ||
                      conductor?.displayName ||
                      conductor?.email ||
                      conductor.id;
                    return (
                      <MenuItem key={conductor.id} value={conductor.id}>
                        {nombre}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleAsignarConductor} variant="contained" color="success">
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      <DetallesDialog
        open={detallesDialogOpen}
        onClose={handleCloseDetalles}
        solicitudSeleccionada={solicitudSeleccionada}
        formatearFecha={formatearFecha}
        disabledTextFieldStyles={disabledTextFieldStyles}
        obtenerNombreUsuario={obtenerNombreUsuario}
        obtenerNombreConductor={obtenerNombreConductor}
      />

      {/* Dialog para ver oferta */}
      <Dialog open={ofertaDialogOpen} onClose={handleCloseOfertaDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#ff9800", color: "white", fontWeight: "bold" }}>
          💰 Oferta
        </DialogTitle>
        <DialogContent sx={{ pt: 3, backgroundColor: "#fafafa" }}>
          {solicitudOferta && solicitudOferta.solicitud?.oferta ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#ff9800" }}>
                  Detalles de la Oferta
                </Typography>
                
                {/* Costo Base */}
                <Box sx={{ mb: 2, p: 1, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Costo del Servicio:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "#d7171a" }}>
                    Bs. {solicitudOferta.solicitud.oferta.costo?.toFixed(2) || "0.00"}
                  </Typography>
                </Box>

                {/* Campos Adicionales */}
                {solicitudOferta.solicitud.oferta.campos && Object.keys(solicitudOferta.solicitud.oferta.campos).length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1, color: "#333" }}>
                      Campos Adicionales:
                    </Typography>
                    {Object.entries(solicitudOferta.solicitud.oferta.campos).map(([key, value]) => (
                      <Box key={key} sx={{ display: "flex", justifyContent: "space-between", p: 0.5, backgroundColor: "#f5f5f5", mb: 0.5, borderRadius: 0.5 }}>
                        <Typography variant="body2">{key}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          Bs. {parseFloat(value)?.toFixed(2) || "0.00"}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Fecha de Oferta */}
                {solicitudOferta.solicitud.oferta.fechaOferta && (
                  <Box sx={{ p: 1, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Fecha Oferta:</strong> {new Date(solicitudOferta.solicitud.oferta.fechaOferta).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">
              No hay oferta disponible para esta solicitud
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseOfertaDialog} variant="contained" sx={{ backgroundColor: "#d7171a" }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para generar oferta */}
      <GenerarOfertaModal
        open={ofertaModalOpen}
        onClose={handleCloseOfertaModal}
        solicitud={solicitudParaOferta}
        onSave={handleSaveOferta}
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
            <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic" }}>
              Esta acción no se puede deshacer. La solicitud volverá a estado pendiente y podrá ser reasignada.
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
      </Paper>
    </Box>
  );
};

export default SolicitudesAsignadas;
