import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import QrCodeIcon from "@mui/icons-material/QrCode";
import ImageIcon from "@mui/icons-material/Image";
import {
  obtenerFlotas,
  obtenerSaldoTotal,
  obtenerHistorialFlota,
  obtenerTodasLasTransacciones,
  obtenerSolicitudesRecargaFlotas,
  escucharFlotas,
  escucharSaldoTotal,
} from "../../../services/bileteraService";
import {
  obtenerSolicitudesPendientes,
  escucharSolicitudesPendientes,
  aprobarSolicitud,
  rechazarSolicitud,
} from "../../../services/solicitudesRecargaService";
import ModalAsignarSaldo from "./components/ModalAsignarSaldo";
import HistorialTransacciones from "./components/HistorialTransacciones";
import { TableToolbar } from "../usuarios/components/TableToolbar";
import DateFilterComponent from "../usuarios/components/DateFilterComponent";
import { useAuth } from "../../../auth/AuthContext";
import {
  uploadImageToApi,
  saveQrImageUrl,
  uploadQrSuperAdminToStorage,
} from "../../../services/imageUploadService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const Billetera = () => {
  const [tabValue, setTabValue] = useState(0);
  const [subtabHistorialValue, setSubtabHistorialValue] = useState(0); // 0 = Conductores, 1 = Flotas
  const [flotas, setFlotas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [historialSolicitudes, setHistorialSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    saldoTotal: 0,
    flotasActivas: 0,
    totalFlotas: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState("deposito");
  const [selectedFlota, setSelectedFlota] = useState(null);

  const [historialOpen, setHistorialOpen] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [historialFlota, setHistorialFlota] = useState(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [solicitudToApprove, setSolicitudToApprove] = useState(null);

  // Estado para modal de comprobante
  const [comprobanteExpandidoOpen, setComprobanteExpandidoOpen] =
    useState(false);
  const [comprobanteExpandidoUrl, setComprobanteExpandidoUrl] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Estados para el modal QR
  const { user } = useAuth();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [qrImagePreview, setQrImagePreview] = useState(null);
  const [currentQrUrl, setCurrentQrUrl] = useState(null);
  const [qrUpdatedAt, setQrUpdatedAt] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Estados para búsqueda y filtros
  const [searchFlotas, setSearchFlotas] = useState("");
  const [sortByFlotas, setSortByFlotas] = useState("nombre-asc");
  const [searchSolicitudes, setSearchSolicitudes] = useState("");
  const [sortBySolicitudes, setSortBySolicitudes] = useState("fecha-desc");
  const [searchHistorial, setSearchHistorial] = useState("");
  const [sortByHistorial, setSortByHistorial] = useState("fecha-desc");
  const [periodFilterHistorial, setPeriodFilterHistorial] = useState("todos");
  
  // Estados para columnas visibles en Flotas
  const [visibleColumnsFlotas, setVisibleColumnsFlotas] = useState({
    flota: true,
    contacto: true,
    saldo: true,
    estado: true,
    acciones: true,
  });

  // Estados para columnas visibles en Solicitudes
  const [visibleColumnsSolicitudes, setVisibleColumnsSolicitudes] = useState({
    flota: true,
    monto: true,
    fecha: true,
    concepto: true,
    comprobante: true,
    acciones: true,
  });

  // Estados para columnas visibles en Historial
  const [visibleColumnsHistorial, setVisibleColumnsHistorial] = useState({
    flota: true,
    tipo: true,
    monto: true,
    fecha: true,
    comprobante: true,
    estado: true,
  });

  // Estados para paginación
  const ITEMS_PER_PAGE = 10;
  const [pageFlotas, setPageFlotas] = useState(0);
  const [pageSolicitudes, setPageSolicitudes] = useState(0);
  const [pageHistorial, setPageHistorial] = useState(0);

  // Resetear página al cambiar búsqueda o filtros
  useEffect(() => {
    setPageFlotas(0);
  }, [searchFlotas]);

  useEffect(() => {
    setPageSolicitudes(0);
  }, [searchSolicitudes]);

  useEffect(() => {
    setPageHistorial(0);
  }, [searchHistorial]);

  // Recargar historial cuando se accede a la pestaña
  useEffect(() => {
    if (tabValue === 2) {
      const recargarHistorial = async () => {
        try {
          const historialData = await obtenerSolicitudesRecargaFlotas();
          setHistorialSolicitudes(historialData);
        } catch (error) {
          console.error("Error al recargar historial:", error);
        }
      };
      recargarHistorial();
    }
  }, [tabValue]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [flotasData, estadisticasData, solicitudesData, historialData] =
        await Promise.all([
          obtenerFlotas(),
          obtenerSaldoTotal(),
          obtenerSolicitudesPendientes(),
          obtenerSolicitudesRecargaFlotas(),
        ]);

      setFlotas(flotasData);
      setEstadisticas(estadisticasData);
      setSolicitudes(solicitudesData);
      setHistorialSolicitudes(historialData);
    } catch (error) {
      mostrarSnackbar("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();

    // Configurar listeners en tiempo real
    // Listener para flotas
    const unsubscribeFlotas = escucharFlotas((flotasActualizadas) => {
      setFlotas(flotasActualizadas);
    });

    // Listener para saldo total
    const unsubscribeSaldo = escucharSaldoTotal((estadisticasActualizadas) => {
      setEstadisticas(estadisticasActualizadas);
    });

    // Listener para solicitudes
    const unsubscribeSolicitudes = escucharSolicitudesPendientes(
      (solicitudesActualizadas) => {
        setSolicitudes(solicitudesActualizadas);
      }
    );

    // Listener para historial - deshabilitado, se carga con cargarDatos()
    // const unsubscribeHistorial = escucharHistorialSolicitudes(
    //   (historialActualizado) => {
    //     setHistorialSolicitudes(historialActualizado);
    //   }
    // );

    // Cleanup: desuscribirse de todos los listeners
    return () => {
      if (unsubscribeFlotas) unsubscribeFlotas();
      if (unsubscribeSaldo) unsubscribeSaldo();
      if (unsubscribeSolicitudes) unsubscribeSolicitudes();
      // if (unsubscribeHistorial) unsubscribeHistorial();
    };
  }, [cargarDatos]);

  const mostrarSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Cargar QR actual del usuario
  const cargarQrActual = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentQrUrl(userData.qrImage || null);
        setQrUpdatedAt(userData.qrImageUpdatedAt || null);
      }
    } catch (error) {
      console.error("Error cargando QR actual:", error);
    }
  }, [user]);

  useEffect(() => {
    cargarQrActual();
  }, [cargarQrActual]);

  const handleOpenQrModal = () => {
    setQrImage(null);
    setQrImagePreview(null);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = () => {
    setQrModalOpen(false);
    setQrImage(null);
    setQrImagePreview(null);
  };

  const handleQrImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        mostrarSnackbar("Por favor selecciona un archivo de imagen", "error");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        mostrarSnackbar("La imagen no debe superar los 5MB", "error");
        return;
      }

      setQrImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitQr = async () => {
    if (!qrImage) {
      mostrarSnackbar("Por favor selecciona una imagen", "error");
      return;
    }

    if (!user?.uid) {
      mostrarSnackbar("No se pudo identificar el usuario", "error");
      return;
    }

    try {
      setUploadingQr(true);

      // Subir imagen a Firebase Storage en carpeta qr/superadmin/{userId}
      const uploadResult = await uploadQrSuperAdminToStorage(qrImage, user.uid);
      const imageUrl = uploadResult.url;

      // Guardar URL en Firebase (documento del usuario)
      await saveQrImageUrl(user.uid, imageUrl);

      // Actualizar estado local
      setCurrentQrUrl(imageUrl);
      setQrUpdatedAt(new Date().toISOString());

      mostrarSnackbar("QR actualizado exitosamente", "success");
      handleCloseQrModal();
    } catch (error) {
      console.error("Error subiendo QR:", error);
      mostrarSnackbar(error.message || "Error al subir la imagen", "error");
    } finally {
      setUploadingQr(false);
    }
  };

  // Filtrar y ordenar flotas
  const filteredFlotas = useMemo(() => {
    let result = [...flotas];

    // Filtrar por búsqueda
    if (searchFlotas.trim()) {
      const search = searchFlotas.toLowerCase();
      result = result.filter(
        (flota) =>
          (flota.nombre || "").toLowerCase().includes(search) ||
          (flota.email || "").toLowerCase().includes(search) ||
          (flota.contacto || "").toLowerCase().includes(search)
      );
    }

    // Ordenar
    if (sortByFlotas === "nombre-asc") {
      result.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
    } else if (sortByFlotas === "nombre-desc") {
      result.sort((a, b) => (b.nombre || "").localeCompare(a.nombre || ""));
    } else if (sortByFlotas === "saldo-asc") {
      result.sort((a, b) => (a.saldo || 0) - (b.saldo || 0));
    } else if (sortByFlotas === "saldo-desc") {
      result.sort((a, b) => (b.saldo || 0) - (a.saldo || 0));
    }

    return result;
  }, [flotas, searchFlotas, sortByFlotas]);

  // Filtrar y ordenar solicitudes
  const filteredSolicitudes = useMemo(() => {
    let result = [...solicitudes];

    // Filtrar por búsqueda
    if (searchSolicitudes.trim()) {
      const search = searchSolicitudes.toLowerCase();
      result = result.filter(
        (sol) =>
          (sol.flotaNombre || "").toLowerCase().includes(search) ||
          (sol.concepto || "").toLowerCase().includes(search)
      );
    }

    // Ordenar
    if (sortBySolicitudes === "fecha-asc") {
      result.sort(
        (a, b) =>
          new Date(a.fechaSolicitud?.toDate?.() || a.fechaSolicitud || 0) -
          new Date(b.fechaSolicitud?.toDate?.() || b.fechaSolicitud || 0)
      );
    } else if (sortBySolicitudes === "fecha-desc") {
      result.sort(
        (a, b) =>
          new Date(b.fechaSolicitud?.toDate?.() || b.fechaSolicitud || 0) -
          new Date(a.fechaSolicitud?.toDate?.() || a.fechaSolicitud || 0)
      );
    } else if (sortBySolicitudes === "monto-asc") {
      result.sort((a, b) => (a.monto || 0) - (b.monto || 0));
    } else if (sortBySolicitudes === "monto-desc") {
      result.sort((a, b) => (b.monto || 0) - (a.monto || 0));
    }

    return result;
  }, [solicitudes, searchSolicitudes, sortBySolicitudes]);

  // Datos paginados para Flotas
  const flotasPaginadas = useMemo(() => {
    const start = pageFlotas * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredFlotas.slice(start, end);
  }, [filteredFlotas, pageFlotas]);

  const totalPagesFlotas = Math.ceil(filteredFlotas.length / ITEMS_PER_PAGE);

  // Datos paginados para Solicitudes
  const solicitudesPaginadas = useMemo(() => {
    const start = pageSolicitudes * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredSolicitudes.slice(start, end);
  }, [filteredSolicitudes, pageSolicitudes]);

  const totalPagesSolicitudes = Math.ceil(
    filteredSolicitudes.length / ITEMS_PER_PAGE
  );

  // Filtrar y ordenar historial
  const filteredHistorial = useMemo(() => {
    let result = [...historialSolicitudes];

    // Filtrar por período
    if (periodFilterHistorial !== "todos") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfThisWeek = new Date(startOfToday);
      startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      result = result.filter((transaccion) => {
        const fecha = transaccion.timestamp?.toDate?.() || transaccion.timestamp;
        if (!fecha) return false;
        const fechaDate = new Date(fecha);
        
        switch (periodFilterHistorial) {
          case "hoy":
            return fechaDate >= startOfToday;
          case "esta-semana":
            return fechaDate >= startOfThisWeek;
          case "este-mes":
            return fechaDate >= startOfThisMonth;
          case "ultimos-7":
            const hace7Dias = new Date(now);
            hace7Dias.setDate(hace7Dias.getDate() - 7);
            return fechaDate >= hace7Dias;
          case "ultimos-30":
            const hace30Dias = new Date(now);
            hace30Dias.setDate(hace30Dias.getDate() - 30);
            return fechaDate >= hace30Dias;
          default:
            return true;
        }
      });
    }

    // Filtrar por búsqueda
    if (searchHistorial.trim()) {
      const search = searchHistorial.toLowerCase();
      result = result.filter(
        (transaccion) =>
          (transaccion.flotaNombre || "").toLowerCase().includes(search) ||
          (transaccion.concepto || "").toLowerCase().includes(search) ||
          (transaccion.nroComprobante || "").toLowerCase().includes(search)
      );
    }

    // Ordenar
    if (sortByHistorial === "fecha-asc") {
      result.sort(
        (a, b) => {
          const fechaA = a.fechaAprobacion?.toDate?.() || a.fechaAprobacion || a.fechaSolicitud?.toDate?.() || a.fechaSolicitud || a.timestamp?.toDate?.() || a.timestamp || 0;
          const fechaB = b.fechaAprobacion?.toDate?.() || b.fechaAprobacion || b.fechaSolicitud?.toDate?.() || b.fechaSolicitud || b.timestamp?.toDate?.() || b.timestamp || 0;
          return new Date(fechaA) - new Date(fechaB);
        }
      );
    } else if (sortByHistorial === "fecha-desc") {
      result.sort(
        (a, b) => {
          const fechaA = a.fechaAprobacion?.toDate?.() || a.fechaAprobacion || a.fechaSolicitud?.toDate?.() || a.fechaSolicitud || a.timestamp?.toDate?.() || a.timestamp || 0;
          const fechaB = b.fechaAprobacion?.toDate?.() || b.fechaAprobacion || b.fechaSolicitud?.toDate?.() || b.fechaSolicitud || b.timestamp?.toDate?.() || b.timestamp || 0;
          return new Date(fechaB) - new Date(fechaA);
        }
      );
    } else if (sortByHistorial === "monto-asc") {
      result.sort((a, b) => (a.monto || 0) - (b.monto || 0));
    } else if (sortByHistorial === "monto-desc") {
      result.sort((a, b) => (b.monto || 0) - (a.monto || 0));
    }

    return result;
  }, [historialSolicitudes, searchHistorial, sortByHistorial, periodFilterHistorial, tabValue, subtabHistorialValue]);

  // Datos paginados para Historial
  const historialPaginado = useMemo(() => {
    const start = pageHistorial * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredHistorial.slice(start, end);
  }, [filteredHistorial, pageHistorial]);

  const totalPagesHistorial = Math.ceil(
    filteredHistorial.length / ITEMS_PER_PAGE
  );

  // Filtrar historial por tipo de recarga (conductores vs flotas)
  const historialConductores = historialSolicitudes.filter(
    transaccion => transaccion.concepto && transaccion.concepto.toLowerCase().includes("conductor")
  );

  const historialFlotas = historialSolicitudes.filter(
    transaccion => !transaccion.concepto || !transaccion.concepto.toLowerCase().includes("conductor")
  );

  const historialPorSubtab = historialFlotas;

  const handleAbrirModal = (flota, tipo) => {
    setSelectedFlota(flota);
    setModalTipo(tipo);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedFlota(null);
  };

  const handleModalSuccess = (resultado) => {
    mostrarSnackbar(
      `Transacción completada. Nuevo saldo: $${resultado.nuevoSaldo.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`,
      "success"
    );

    // Actualizar solo la flota en el estado local sin recargar todo
    setFlotas((prevFlotas) =>
      prevFlotas.map((flota) =>
        flota.id === selectedFlota.id
          ? { ...flota, saldo: resultado.nuevoSaldo }
          : flota
      )
    );

    // Actualizar estadísticas
    setEstadisticas((prev) => ({
      ...prev,
      saldoTotal:
        prev.saldoTotal + (resultado.nuevoSaldo - selectedFlota.saldo),
    }));
  };

  const handleAbrirHistorial = async (flota) => {
    try {
      // Usar uidFlota si existe, si no usar el ID del documento
      const flotaId = flota.uidFlota || flota.id;
      const transacciones = await obtenerHistorialFlota(flotaId);
      setHistorialFlota(flota);
      setHistorial(transacciones);
      setHistorialOpen(true);
    } catch (error) {
      mostrarSnackbar("Error al cargar historial", "error");
      console.error("[DEBUG] Error en handleAbrirHistorial:", error);
    }
  };

  const handleCloseHistorial = () => {
    setHistorialOpen(false);
    setHistorialFlota(null);
    setHistorial([]);
  };

  const handleAbrirAprobacion = (solicitud) => {
    setSolicitudToApprove(solicitud);
    setApproveDialogOpen(true);
  };

  const handleConfirmarAprobacion = async () => {
    if (!solicitudToApprove) return;

    try {
      setProcessingId(solicitudToApprove.id);
      await aprobarSolicitud(
        solicitudToApprove.flotaId,
        solicitudToApprove.id,
        "superadmin"
      );

      // Remover la solicitud de la lista (listener en tiempo real actualizará luego)
      setSolicitudes((prev) => prev.filter((s) => s.id !== solicitudToApprove.id));

      // Recargar solo flotas y estadísticas (solicitudes se actualizan vía listener)
      const [flotasData, estadisticasData] = await Promise.all([
        obtenerFlotas(),
        obtenerSaldoTotal(),
      ]);
      setFlotas(flotasData);
      setEstadisticas(estadisticasData);

      setApproveDialogOpen(false);
      setSolicitudToApprove(null);
      mostrarSnackbar("Solicitud aprobada correctamente", "success");
    } catch (error) {
      mostrarSnackbar(error.message || "Error al aprobar solicitud", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAprobarSolicitud = async (solicitud) => {
    handleAbrirAprobacion(solicitud);
  };

  const handleRechazarSolicitud = async () => {
    if (!rejectReason.trim()) {
      mostrarSnackbar("Debes ingresar una razón para rechazar", "error");
      return;
    }

    try {
      setProcessingId(selectedSolicitud.id);
      await rechazarSolicitud(
        selectedSolicitud.flotaId,
        selectedSolicitud.id,
        "superadmin",
        rejectReason
      );

      // Remover la solicitud de la lista
      setSolicitudes((prev) =>
        prev.filter((s) => s.id !== selectedSolicitud.id)
      );

      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedSolicitud(null);

      mostrarSnackbar("Solicitud rechazada", "success");
    } catch (error) {
      mostrarSnackbar(error.message || "Error al rechazar solicitud", "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const saldoTotalFormato = estadisticas.saldoTotal.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Contenedor Principal */}
      <Paper
        elevation={6}
        sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}
      >
        {/* Encabezado */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              💳 Billetera - Gestión de Saldo
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Control centralizado de recarga de saldo para las flotas
            </Typography>
          </div>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<QrCodeIcon />}
              onClick={handleOpenQrModal}
              sx={{
                background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                color: "#fff",
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(76, 175, 80, 0.4)",
                },
              }}
            >
              Mi QR
            </Button>
          </Box>
        </Box>

        {/* Estadísticas */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
              }}
            >
              <CardContent>
                <Typography
                  color="textSecondary"
                  sx={{ color: "#fff", opacity: 0.8 }}
                >
                  Saldo Total
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "#fff", fontWeight: 700, mt: 1 }}
                >
                  Bs. {saldoTotalFormato}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #484848 0%, #2c2c2c 100%)",
              }}
            >
              <CardContent>
                <Typography
                  color="textSecondary"
                  sx={{ color: "#fff", opacity: 0.8 }}
                >
                  Flotas Activas
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "#fff", fontWeight: 700, mt: 1 }}
                >
                  {estadisticas.flotasActivas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
              }}
            >
              <CardContent>
                <Typography
                  color="textSecondary"
                  sx={{ color: "#fff", opacity: 0.8 }}
                >
                  Total de Flotas
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "#fff", fontWeight: 700, mt: 1 }}
                >
                  {estadisticas.totalFlotas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #a01012 0%, #7a0c0e 100%)",
              }}
            >
              <CardContent>
                <Typography
                  color="textSecondary"
                  sx={{ color: "#fff", opacity: 0.8 }}
                >
                  Flotas Inactivas
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: "#fff", fontWeight: 700, mt: 1 }}
                >
                  {estadisticas.totalFlotas - estadisticas.flotasActivas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 16px rgba(76, 175, 80, 0.3)",
                },
              }}
              onClick={() => {
                // Acción del botón QR
              }}
            ></Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 2, borderColor: "divider", mt: 4, mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                color: "#484848",
                "&.Mui-selected": {
                  color: "#d7171a",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#d7171a",
              },
            }}
          >
            <Tab label="💰 Gestión de Flotas" />
            <Tab label={`📋 Solicitudes Pendientes (${solicitudes.length})`} />
            <Tab
              label={`📄 Historial de Solicitudes (${historialSolicitudes.length})`}
            />
          </Tabs>
        </Box>

        {/* Contenido de Solicitudes Pendientes */}
        {tabValue === 1 && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <TableToolbar
                  searchValue={searchSolicitudes}
                  onSearchChange={setSearchSolicitudes}
                  sortOptions={[
                    { label: "↑ Fecha (Más antigua)", value: "fecha-asc" },
                    { label: "↓ Fecha (Más reciente)", value: "fecha-desc" },
                    { label: "↑ Monto (Menor)", value: "monto-asc" },
                    { label: "↓ Monto (Mayor)", value: "monto-desc" },
                  ]}
                  sortValue={sortBySolicitudes}
                  onSortChange={setSortBySolicitudes}
                  filterOptions={[]}
                  visibleColumns={visibleColumnsSolicitudes}
                  onColumnChange={(col, visible) => setVisibleColumnsSolicitudes(prev => ({ ...prev, [col]: visible }))}
                  showClearButton={true}
                />
              </Box>
            </Box>
            <Paper
              elevation={3}
              sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}
            >
              {solicitudes.length > 0 ? (
                <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
                  <Table stickyHeader>
                    <TableHead sx={{ backgroundColor: "#000000" }}>
                      <TableRow>
                        {visibleColumnsSolicitudes.flota && (
                        <TableCell
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Flota
                        </TableCell>
                        )}
                        {visibleColumnsSolicitudes.monto && (
                        <TableCell
                          align="right"
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Monto
                        </TableCell>
                        )}
                        {visibleColumnsSolicitudes.concepto && (
                        <TableCell
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Concepto
                        </TableCell>
                        )}
                        <TableCell
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Notas
                        </TableCell>
                        {visibleColumnsSolicitudes.fecha && (
                        <TableCell
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Fecha
                        </TableCell>
                        )}
                        {visibleColumnsSolicitudes.comprobante && (
                        <TableCell
                          align="center"
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Comprobante
                        </TableCell>
                        )}
                        {visibleColumnsSolicitudes.acciones && (
                        <TableCell
                          align="center"
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Acciones
                        </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {solicitudesPaginadas.map((solicitud) => (
                        <TableRow
                          key={solicitud.id}
                          hover
                          sx={{ borderBottom: "1px solid #d0d0d0" }}
                        >
                          {visibleColumnsSolicitudes.flota && (
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                            }}
                          >
                            {solicitud.flotaNombre}
                          </TableCell>
                          )}
                          {visibleColumnsSolicitudes.monto && (
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              fontSize: "1.05rem",
                              fontFamily: "Mulish, sans-serif",
                            }}
                          >
                            <span style={{ color: "#d7171a" }}>
                              $
                              {solicitud.monto.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </TableCell>
                          )}
                          {visibleColumnsSolicitudes.concepto && (
                          <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                            <Chip
                              label={solicitud.concepto}
                              size="small"
                              sx={{
                                bgcolor: "#ffe0e0",
                                color: "#b01217",
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          )}
                          <TableCell
                            sx={{
                              fontSize: "0.9rem",
                              color: "#666",
                              fontFamily: "Mulish, sans-serif",
                            }}
                          >
                            {solicitud.notas || "-"}
                          </TableCell>
                          {visibleColumnsSolicitudes.fecha && (
                          <TableCell
                            sx={{
                              fontSize: "0.9rem",
                              fontFamily: "Mulish, sans-serif",
                            }}
                          >
                            {new Date(
                              solicitud.fechaSolicitud?.toDate?.() ||
                                solicitud.fechaSolicitud
                            ).toLocaleDateString("es-ES")}
                          </TableCell>
                          )}
                          {visibleColumnsSolicitudes.comprobante && (
                          <TableCell align="center">
                            {solicitud.comprobanteUrl ? (
                              <Tooltip title="Ver comprobante">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setComprobanteExpandidoUrl(
                                      solicitud.comprobanteUrl
                                    );
                                    setComprobanteExpandidoOpen(true);
                                  }}
                                  sx={{
                                    bgcolor: "#e3f2fd",
                                    color: "#1976d2",
                                    "&:hover": { bgcolor: "#bbdefb" },
                                  }}
                                >
                                  <ImageIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#999",
                                  fontFamily: "Mulish, sans-serif",
                                }}
                              >
                                {solicitud.nroComprobante || "-"}
                              </Typography>
                            )}
                          </TableCell>
                          )}
                          {visibleColumnsSolicitudes.acciones && (
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                justifyContent: "center",
                              }}
                            >
                              <Tooltip title="Aprobar">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleAprobarSolicitud(solicitud)
                                  }
                                  disabled={processingId === solicitud.id}
                                  sx={{
                                    bgcolor: "#ffe0e0",
                                    color: "#d7171a",
                                    "&:hover": { bgcolor: "#ffb3b8" },
                                  }}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Rechazar">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedSolicitud(solicitud);
                                    setRejectDialogOpen(true);
                                  }}
                                  disabled={processingId === solicitud.id}
                                  sx={{
                                    bgcolor: "#ffebee",
                                    color: "#d7171a",
                                    "&:hover": { bgcolor: "#ffcdd2" },
                                  }}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary">
                    ✅ No hay solicitudes pendientes
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Paginación Solicitudes */}
            {filteredSolicitudes.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 3,
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "Mulish, sans-serif" }}
                >
                  Mostrando{" "}
                  {solicitudesPaginadas.length > 0
                    ? pageSolicitudes * ITEMS_PER_PAGE + 1
                    : 0}{" "}
                  -{" "}
                  {Math.min(
                    (pageSolicitudes + 1) * ITEMS_PER_PAGE,
                    filteredSolicitudes.length
                  )}{" "}
                  de {filteredSolicitudes.length}
                </Typography>
                <Pagination
                  count={totalPagesSolicitudes}
                  page={pageSolicitudes + 1}
                  onChange={(e, page) => setPageSolicitudes(page - 1)}
                  sx={{
                    "& .MuiPaginationItem-root": {
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
          </>
        )}

        {/* Contenido de Historial de Solicitudes */}
        {tabValue === 2 && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <TableToolbar
                  searchValue={searchHistorial}
                  onSearchChange={setSearchHistorial}
                  sortOptions={[
                    { label: "↑ Fecha (Más antigua)", value: "fecha-asc" },
                    { label: "↓ Fecha (Más reciente)", value: "fecha-desc" },
                    { label: "↑ Monto (Menor)", value: "monto-asc" },
                    { label: "↓ Monto (Mayor)", value: "monto-desc" },
                  ]}
                  sortValue={sortByHistorial}
                  onSortChange={setSortByHistorial}
                  filterOptions={[]}
                  visibleColumns={visibleColumnsHistorial}
                  onColumnChange={(col, visible) => setVisibleColumnsHistorial(prev => ({ ...prev, [col]: visible }))}
                  showClearButton={true}
                />
              </Box>
              <DateFilterComponent
                onFilterChange={setPeriodFilterHistorial}
                currentDateFilter={periodFilterHistorial}
              />
            </Box>
            <Paper
              elevation={3}
              sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}
            >
              {historialPorSubtab.length > 0 ? (
                <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
                  <Table stickyHeader>
                    <TableHead sx={{ backgroundColor: "#000000" }}>
                      <TableRow>
                        {visibleColumnsHistorial.flota && (
                          <TableCell
                            sx={{
                              backgroundColor: "#000000",
                              color: "white",
                              fontWeight: 700,
                              fontFamily: "Mulish, sans-serif",
                              fontSize: "0.95rem",
                            }}
                          >
                            Flota
                          </TableCell>
                        )}
                        {visibleColumnsHistorial.monto && (
                          <TableCell
                            align="right"
                            sx={{
                              backgroundColor: "#000000",
                              color: "white",
                              fontWeight: 700,
                              fontFamily: "Mulish, sans-serif",
                              fontSize: "0.95rem",
                            }}
                          >
                            Monto
                          </TableCell>
                        )}
                        <TableCell
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Concepto
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Saldo Anterior
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Saldo Nuevo
                        </TableCell>
                        {visibleColumnsHistorial.comprobante && (
                          <TableCell
                            sx={{
                              backgroundColor: "#000000",
                              color: "white",
                              fontWeight: 700,
                              fontFamily: "Mulish, sans-serif",
                              fontSize: "0.95rem",
                            }}
                          >
                            Comprobante
                          </TableCell>
                        )}
                        {visibleColumnsHistorial.fecha && (
                          <TableCell
                            sx={{
                              backgroundColor: "#000000",
                              color: "white",
                              fontWeight: 700,
                              fontFamily: "Mulish, sans-serif",
                              fontSize: "0.95rem",
                            }}
                          >
                            Fecha
                          </TableCell>
                        )}
                        <TableCell
                          sx={{
                            backgroundColor: "#000000",
                            color: "white",
                            fontWeight: 700,
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          Notas
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historialPaginado.map((transaccion) => (
                        <TableRow
                          key={transaccion.id}
                          hover
                          sx={{ borderBottom: "1px solid #d0d0d0" }}
                        >
                          {visibleColumnsHistorial.flota && (
                            <TableCell
                              sx={{
                                fontWeight: 600,
                                fontFamily: "Mulish, sans-serif",
                              }}
                            >
                              {transaccion.flotaNombre || "-"}
                            </TableCell>
                          )}
                          {visibleColumnsHistorial.monto && (
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 700,
                                fontSize: "1.05rem",
                                fontFamily: "Mulish, sans-serif",
                              }}
                            >
                              <span
                                style={{
                                  color:
                                    transaccion.tipo === "deposito"
                                      ? "#2e7d32"
                                      : "#c62828",
                                }}
                              >
                                {transaccion.tipo === "deposito" ? "+" : "-"}$
                                {Math.abs(transaccion.monto).toLocaleString(
                                  "es-ES",
                                  { minimumFractionDigits: 2 }
                                )}
                              </span>
                            </TableCell>
                          )}
                          <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                            {transaccion.concepto || "-"}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontFamily: "Mulish, sans-serif",
                            }}
                          >
                            ${(transaccion.saldoActual || 0).toLocaleString(
                              "es-ES",
                              { minimumFractionDigits: 2 }
                            )}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                            }}
                          >
                            ${(transaccion.saldoNuevo || 0).toLocaleString(
                              "es-ES",
                              { minimumFractionDigits: 2 }
                            )}
                          </TableCell>
                          {visibleColumnsHistorial.comprobante && (
                            <TableCell align="center">
                              {transaccion.comprobanteUrl ? (
                                <Tooltip title="Ver comprobante">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setComprobanteExpandidoUrl(
                                        transaccion.comprobanteUrl
                                      );
                                      setComprobanteExpandidoOpen(true);
                                    }}
                                    sx={{
                                      bgcolor: "#e3f2fd",
                                      color: "#1976d2",
                                      "&:hover": { bgcolor: "#bbdefb" },
                                    }}
                                  >
                                    <ImageIcon />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#999",
                                    fontFamily: "Mulish, sans-serif",
                                  }}
                                >
                                  {transaccion.nroComprobante || "-"}
                                </Typography>
                              )}
                            </TableCell>
                          )}
                          {visibleColumnsHistorial.fecha && (
                            <TableCell
                              sx={{
                                fontSize: "0.85rem",
                                fontFamily: "Mulish, sans-serif",
                              }}
                            >
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  Solicitado:
                                </Typography>
                                <Typography variant="caption">
                                  {transaccion.fechaSolicitud
                                    ? new Date(
                                        transaccion.fechaSolicitud?.toDate?.() ||
                                          transaccion.fechaSolicitud
                                      ).toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : transaccion.fechaRegistro || "-"}
                                </Typography>
                                {transaccion.fechaAprobacion && (
                                  <>
                                    <Typography variant="caption" sx={{ fontWeight: 600, mt: 1 }}>
                                      Aprobado:
                                    </Typography>
                                    <Typography variant="caption">
                                      {new Date(
                                        transaccion.fechaAprobacion?.toDate?.() ||
                                          transaccion.fechaAprobacion
                                      ).toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          )}
                          <TableCell
                            sx={{
                              fontSize: "0.9rem",
                              color: "#666",
                              fontFamily: "Mulish, sans-serif",
                            }}
                          >
                            {transaccion.notas || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  <Typography color="textSecondary">
                    No hay transacciones registradas
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Paginación Historial */}
            {filteredHistorial.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 3,
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "Mulish, sans-serif" }}
                >
                  Mostrando{" "}
                  {historialPaginado.length > 0
                    ? pageHistorial * ITEMS_PER_PAGE + 1
                    : 0}{" "}
                  -{" "}
                  {Math.min(
                    (pageHistorial + 1) * ITEMS_PER_PAGE,
                    filteredHistorial.length
                  )}{" "}
                  de {filteredHistorial.length}
                </Typography>
                <Pagination
                  count={totalPagesHistorial}
                  page={pageHistorial + 1}
                  onChange={(e, page) => setPageHistorial(page - 1)}
                  sx={{
                    "& .MuiPaginationItem-root": {
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
          </>
        )}

        {/* Contenido de Gestión de Flotas */}
        {tabValue === 0 && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <TableToolbar
                  searchValue={searchFlotas}
                  onSearchChange={setSearchFlotas}
                  sortOptions={[
                    { label: "↑ Nombre (A-Z)", value: "nombre-asc" },
                    { label: "↓ Nombre (Z-A)", value: "nombre-desc" },
                    { label: "↑ Saldo (Menor)", value: "saldo-asc" },
                    { label: "↓ Saldo (Mayor)", value: "saldo-desc" },
                  ]}
                  sortValue={sortByFlotas}
                  onSortChange={setSortByFlotas}
                  filterOptions={[]}
                  visibleColumns={visibleColumnsFlotas}
                  onColumnChange={(col, visible) => setVisibleColumnsFlotas(prev => ({ ...prev, [col]: visible }))}
                  showClearButton={true}
                />
              </Box>
            </Box>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
              <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
                <Table stickyHeader>
                  <TableHead sx={{ backgroundColor: "#000000" }}>
                    <TableRow>
                      {visibleColumnsFlotas.flota && (
                      <TableCell
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Flota
                      </TableCell>
                      )}
                      {visibleColumnsFlotas.contacto && (
                      <TableCell
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Contacto
                      </TableCell>
                      )}
                      {visibleColumnsFlotas.saldo && (
                      <TableCell
                        align="right"
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Saldo Actual
                      </TableCell>
                      )}
                      {visibleColumnsFlotas.estado && (
                      <TableCell
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Estado
                      </TableCell>
                      )}
                      {visibleColumnsFlotas.acciones && (
                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Acciones
                      </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {flotasPaginadas.map((flota) => (
                      <TableRow
                        key={flota.id}
                        hover
                        sx={{ borderBottom: "1px solid #d0d0d0" }}
                      >
                        {visibleColumnsFlotas.flota && (
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            fontFamily: "Mulish, sans-serif",
                          }}
                        >
                          {flota.nombre}
                        </TableCell>
                        )}
                        {visibleColumnsFlotas.contacto && (
                        <TableCell
                          sx={{
                            fontSize: "0.9rem",
                            color: "#666",
                            fontFamily: "Mulish, sans-serif",
                          }}
                        >
                          {flota.perfilFlota?.telefono || flota.contacto || flota.email || "-"}
                        </TableCell>
                        )}
                        {visibleColumnsFlotas.saldo && (
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 700,
                            fontSize: "1.05rem",
                            fontFamily: "Mulish, sans-serif",
                          }}
                        >
                          <span style={{ color: "#d7171a" }}>
                            $
                            {(flota.saldo || 0).toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>
                        )}
                        {visibleColumnsFlotas.estado && (
                        <TableCell>
                          <Chip
                            label={
                              flota.habilitado !== false ? "Activa" : "Inactiva"
                            }
                            size="small"
                            sx={{
                              bgcolor:
                                flota.habilitado !== false
                                  ? "#d7171a"
                                  : "#bdbdbd",
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        )}
                        {visibleColumnsFlotas.acciones && (
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              justifyContent: "center",
                            }}
                          >
                            <Tooltip title="Asignar Saldo (+)">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleAbrirModal(flota, "deposito")
                                }
                                sx={{
                                  bgcolor: "#ffe0e0",
                                  color: "#d7171a",
                                  "&:hover": { bgcolor: "#ffb3b8" },
                                }}
                              >
                                <AddIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Retirar Saldo (-)">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleAbrirModal(flota, "retiro")
                                }
                                sx={{
                                  bgcolor: "#ffebee",
                                  color: "#d7171a",
                                  "&:hover": { bgcolor: "#ffcdd2" },
                                }}
                              >
                                <RemoveIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Ver Historial">
                              <IconButton
                                size="small"
                                onClick={() => handleAbrirHistorial(flota)}
                                sx={{
                                  bgcolor: "#f5f5f5",
                                  color: "#d7171a",
                                  "&:hover": { bgcolor: "#e0e0e0" },
                                }}
                              >
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Paginación Flotas */}
            {filteredFlotas.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 2,
                  gap: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "Mulish, sans-serif" }}
                >
                  Mostrando{" "}
                  {flotasPaginadas.length > 0
                    ? pageFlotas * ITEMS_PER_PAGE + 1
                    : 0}{" "}
                  -{" "}
                  {Math.min(
                    (pageFlotas + 1) * ITEMS_PER_PAGE,
                    filteredFlotas.length
                  )}{" "}
                  de {filteredFlotas.length}
                </Typography>
                <Pagination
                  count={totalPagesFlotas}
                  page={pageFlotas + 1}
                  onChange={(e, page) => setPageFlotas(page - 1)}
                  sx={{
                    "& .MuiPaginationItem-root": {
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
          </>
        )}
      </Paper>

      {/* Dialog para aprobar */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Confirmar Aprobación de Solicitud</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Flota:</strong> {solicitudToApprove?.flotaNombre}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Monto:</strong> $
              {solicitudToApprove?.monto.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
              })}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Concepto:</strong> {solicitudToApprove?.concepto}
            </Typography>
            <Typography variant="body2" sx={{ color: "orange" }}>
              ⚠️ Asegúrate de que los datos sean correctos antes de aprobar.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmarAprobacion}
            variant="contained"
            color="success"
            disabled={processingId === solicitudToApprove?.id}
          >
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para rechazar */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
      >
        <DialogTitle>Rechazar Solicitud</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Flota:</strong> {selectedSolicitud?.flotaNombre}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Monto:</strong> $
              {selectedSolicitud?.monto.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
              })}
            </Typography>
            <TextField
              label="Razón del rechazo"
              multiline
              rows={4}
              fullWidth
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explica por qué se rechaza esta solicitud..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleRechazarSolicitud}
            variant="contained"
            color="error"
            disabled={processingId === selectedSolicitud?.id}
          >
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modales */}
      <ModalAsignarSaldo
        open={modalOpen}
        onClose={handleModalClose}
        flota={selectedFlota}
        onSuccess={handleModalSuccess}
        tipo={modalTipo}
      />

      <HistorialTransacciones
        open={historialOpen}
        onClose={handleCloseHistorial}
        flota={historialFlota}
        transacciones={historial}
      />

      {/* Modal QR */}
      <Dialog
        open={qrModalOpen}
        onClose={handleCloseQrModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
            color: "#fff",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <QrCodeIcon />
          Mi Código QR
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Mostrar QR actual si existe */}
          {currentQrUrl && !qrImagePreview && (
            <Box sx={{ mb: 3, textAlign: "center" }}>
              <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
                QR Actual:
              </Typography>
              <Box
                component="img"
                src={currentQrUrl}
                alt="QR Actual"
                sx={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  border: "2px solid #e0e0e0",
                  borderRadius: 2,
                  objectFit: "contain",
                }}
              />
              {qrUpdatedAt && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    color: "#999",
                    fontStyle: "italic",
                  }}
                >
                  Última edición:{" "}
                  {new Date(qrUpdatedAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              )}
            </Box>
          )}

          {/* Preview de nueva imagen */}
          {qrImagePreview && (
            <Box sx={{ mb: 3, textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ mb: 2, color: "#666", fontWeight: 600 }}
              >
                Vista Previa:
              </Typography>
              <Box
                component="img"
                src={qrImagePreview}
                alt="Preview"
                sx={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  border: "2px solid #4caf50",
                  borderRadius: 2,
                  objectFit: "contain",
                  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)",
                }}
              />
            </Box>
          )}

          {/* Bot\u00f3n de selecci\u00f3n de archivo */}
          <Box sx={{ textAlign: "center" }}>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="qr-image-upload"
              type="file"
              onChange={handleQrImageChange}
            />
            <label htmlFor="qr-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                sx={{
                  borderColor: "#4caf50",
                  color: "#4caf50",
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  "&:hover": {
                    borderColor: "#388e3c",
                    backgroundColor: "rgba(76, 175, 80, 0.04)",
                  },
                }}
              >
                {qrImage ? "Cambiar Imagen" : "Seleccionar Imagen"}
              </Button>
            </label>

            {qrImage && (
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 1, color: "#666" }}
              >
                {qrImage.name} ({(qrImage.size / 1024).toFixed(2)} KB)
              </Typography>
            )}
          </Box>

          <Typography
            variant="caption"
            sx={{ display: "block", mt: 2, color: "#999", textAlign: "center" }}
          >
            Formatos aceptados: JPG, PNG, GIF (M\u00e1x. 5MB)
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseQrModal} sx={{ color: "#666" }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitQr}
            variant="contained"
            disabled={!qrImage || uploadingQr}
            sx={{
              background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
              color: "#fff",
              fontWeight: 600,
              px: 3,
              "&:hover": {
                background: "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)",
              },
              "&:disabled": {
                background: "#e0e0e0",
                color: "#999",
              },
            }}
          >
            {uploadingQr ? "Subiendo..." : "Guardar QR"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Comprobante Expandido */}
      <Dialog
        open={comprobanteExpandidoOpen}
        onClose={() => setComprobanteExpandidoOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.9)",
            boxShadow: "none",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            component="img"
            src={comprobanteExpandidoUrl}
            alt="Comprobante Expandido"
            sx={{
              maxWidth: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
              borderRadius: 2,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "#fff",
              mt: 2,
              fontFamily: "Mulish, sans-serif",
            }}
          >
            Haz clic fuera de la imagen para cerrar
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Billetera;
