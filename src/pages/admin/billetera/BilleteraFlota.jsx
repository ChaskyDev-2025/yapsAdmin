import React, { useState, useEffect, useMemo } from "react";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { TableToolbar } from "../usuarios/components/TableToolbar";
import { useAuth } from "../../../auth/AuthContext";
import {
  uploadImageToApi,
  saveFlotaQrImageUrl,
} from "../../../services/imageUploadService";
import {
  obtenerSolicitudesFlota,
  obtenerHistorialTransacciones,
  crearSolicitudRecarga,
  escucharSolicitudesFlota,
  escucharHistorialTransacciones,
  escucharSaldoFlota,
} from "../../../services/solicitudesRecargaService";
import {
  getDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";

const BilleteraFlota = () => {
  const { userFlotaId } = useAuth();
  const flotaId = userFlotaId;
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [saldoActual, setSaldoActual] = useState(0);
  const [pageSolicitudes, setPageSolicitudes] = useState(0);
  const [pageHistorial, setPageHistorial] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("recarga");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchSolicitudes, setSearchSolicitudes] = useState("");
  const [sortBySolicitudes, setSortBySolicitudes] = useState("fecha-desc");
  const [searchHistorial, setSearchHistorial] = useState("");
  const [sortByHistorial, setSortByHistorial] = useState("fecha-desc");

  // Estados para el modal QR
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [qrImagePreview, setQrImagePreview] = useState(null);
  const [currentQrUrl, setCurrentQrUrl] = useState(null);
  const [qrUpdatedAt, setQrUpdatedAt] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [superAdminQr, setSuperAdminQr] = useState(null);
  const [superAdminQrUpdatedAt, setSuperAdminQrUpdatedAt] = useState(null);
  const [qrExpandedOpen, setQrExpandedOpen] = useState(false);

  // Estados para comprobante de pago
  const [comprobanteImage, setComprobanteImage] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [nroComprobante, setNroComprobante] = useState("");

  useEffect(() => {
    if (!flotaId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Cargar datos iniciales
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const [solicitudesData, historialData] = await Promise.all([
          obtenerSolicitudesFlota(flotaId),
          obtenerHistorialTransacciones(flotaId),
        ]);

        if (isMounted) {
          setSolicitudes(solicitudesData);
          setHistorial(historialData);

          // También intentar cargar el saldo inicial
          try {
            const billeteraRef = doc(
              db,
              "flotas",
              flotaId,
              "billetera",
              "saldo"
            );
            const billeteraSnapshot = await getDoc(billeteraRef);
            if (billeteraSnapshot.exists()) {
              setSaldoActual(billeteraSnapshot.data().monto || 0);
            }
          } catch (err) {
            // Error silencioso
          }
        }
      } catch (error) {
        // Error silencioso
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();

    // Listener EN TIEMPO REAL para el saldo - punto único de verdad
    const unsubscribeSaldo = escucharSaldoFlota(flotaId, (saldoActualizado) => {
      if (isMounted) {
        setSaldoActual(saldoActualizado);
      }
    });

    // Listener para solicitudes
    const unsubscribeSolicitudes = escucharSolicitudesFlota(
      flotaId,
      (solicitudesActualizadas) => {
        if (isMounted) {
          setSolicitudes(solicitudesActualizadas);
        }
      }
    );

    // Listener para historial
    const unsubscribeHistorial = escucharHistorialTransacciones(
      flotaId,
      (historialActualizado) => {
        if (isMounted) {
          setHistorial(historialActualizado);
        }
      }
    );

    // Cleanup: desuscribir de todos los listeners
    return () => {
      isMounted = false;
      if (unsubscribeSaldo) unsubscribeSaldo();
      if (unsubscribeSolicitudes) unsubscribeSolicitudes();
      if (unsubscribeHistorial) unsubscribeHistorial();
    };
  }, [flotaId]);

  // Reset página de solicitudes al cambiar búsqueda
  useEffect(() => {
    setPageSolicitudes(0);
  }, [searchSolicitudes]);

  // Reset página de historial al cambiar búsqueda
  useEffect(() => {
    setPageHistorial(0);
  }, [searchHistorial]);

  const mostrarSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Cargar QR actual de la flota
  const cargarQrActual = async () => {
    if (!flotaId) return;
    try {
      const flotaDoc = await getDoc(doc(db, "flotas", flotaId));
      if (flotaDoc.exists()) {
        const flotaData = flotaDoc.data();
        setCurrentQrUrl(flotaData.qrImage || null);
        setQrUpdatedAt(flotaData.qrImageUpdatedAt || null);
      }
    } catch (error) {
      console.error("Error cargando QR actual:", error);
    }
  };

  // Cargar QR del SuperAdmin
  const cargarQrSuperAdmin = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "superadmin"));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const superAdminDoc = querySnapshot.docs[0];
        const superAdminData = superAdminDoc.data();
        setSuperAdminQr(superAdminData.qrImage || null);
        setSuperAdminQrUpdatedAt(superAdminData.qrImageUpdatedAt || null);
      }
    } catch (error) {
      console.error("Error cargando QR del SuperAdmin:", error);
    }
  };

  // Cargar QRs al montar el componente
  useEffect(() => {
    cargarQrActual();
    cargarQrSuperAdmin();
  }, [flotaId]);

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

    if (!flotaId) {
      mostrarSnackbar("No se pudo identificar la flota", "error");
      return;
    }

    try {
      setUploadingQr(true);

      // Subir imagen a la API con carpeta específica de la flota
      const imageUrl = await uploadImageToApi(qrImage, `Qryaaps/${flotaId}`);

      // Guardar URL en Firebase (documento de la flota)
      await saveFlotaQrImageUrl(flotaId, imageUrl);

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

  const handleAbrirModal = () => {
    setMonto("");
    setConcepto("recarga");
    setNotas("");
    setComprobanteImage(null);
    setComprobantePreview(null);
    setNroComprobante("");
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleComprobanteChange = (event) => {
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

      setComprobanteImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitSolicitud = async () => {
    try {
      if (!monto || parseFloat(monto) <= 0) {
        mostrarSnackbar("Ingresa un monto válido", "error");
        return;
      }

      setSubmitting(true);

      let comprobanteUrl = null;

      // Subir comprobante si existe
      if (comprobanteImage) {
        try {
          comprobanteUrl = await uploadImageToApi(
            comprobanteImage,
            `Comprobantes/${flotaId}`
          );
        } catch (error) {
          console.error("Error subiendo comprobante:", error);
          mostrarSnackbar(
            "Error al subir el comprobante, pero se creará la solicitud",
            "warning"
          );
        }
      }

      await crearSolicitudRecarga(
        flotaId,
        parseFloat(monto),
        concepto,
        notas,
        comprobanteUrl,
        nroComprobante
      );

      mostrarSnackbar("Solicitud enviada al superadmin", "success");
      handleModalClose();
    } catch (error) {
      mostrarSnackbar(error.message || "Error al crear solicitud", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "aprobada":
        return "Aprobada";
      case "rechazada":
        return "Rechazada";
      default:
        return estado;
    }
  };

  // Filtrado y ordenamiento para solicitudes
  const solicitudesFiltradas = useMemo(() => {
    let filtered = solicitudes;

    // Filtro por búsqueda
    if (searchSolicitudes) {
      const search = searchSolicitudes.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.concepto || "").toLowerCase().includes(search) ||
          (s.notas || "").toLowerCase().includes(search)
      );
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortBySolicitudes) {
      case "fecha-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.fechaSolicitud?.toDate?.() || 0) -
            new Date(b.fechaSolicitud?.toDate?.() || 0)
        );
        break;
      case "fecha-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.fechaSolicitud?.toDate?.() || 0) -
            new Date(a.fechaSolicitud?.toDate?.() || 0)
        );
        break;
      case "monto-asc":
        sorted.sort((a, b) => a.monto - b.monto);
        break;
      case "monto-desc":
        sorted.sort((a, b) => b.monto - a.monto);
        break;
      default:
        break;
    }

    return sorted;
  }, [solicitudes, searchSolicitudes, sortBySolicitudes]);

  // Paginación para solicitudes
  const solicitudesPaginadas = useMemo(() => {
    const start = pageSolicitudes * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return solicitudesFiltradas.slice(start, end);
  }, [solicitudesFiltradas, pageSolicitudes]);

  const totalPagesSolicitudes = Math.ceil(
    solicitudesFiltradas.length / ITEMS_PER_PAGE
  );

  // Filtrado y ordenamiento para historial
  const historialFiltrado = useMemo(() => {
    let filtered = historial;

    // Filtro por búsqueda
    if (searchHistorial) {
      const search = searchHistorial.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          (h.concepto || "").toLowerCase().includes(search) ||
          (h.tipo || "").toLowerCase().includes(search)
      );
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByHistorial) {
      case "fecha-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.fechaRegistro || 0) - new Date(b.fechaRegistro || 0)
        );
        break;
      case "fecha-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0)
        );
        break;
      case "monto-asc":
        sorted.sort((a, b) => a.monto - b.monto);
        break;
      case "monto-desc":
        sorted.sort((a, b) => b.monto - a.monto);
        break;
      default:
        break;
    }

    return sorted;
  }, [historial, searchHistorial, sortByHistorial]);

  // Paginación para historial
  const historialPaginado = useMemo(() => {
    const start = pageHistorial * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return historialFiltrado.slice(start, end);
  }, [historialFiltrado, pageHistorial]);

  const totalPagesHistorial = Math.ceil(
    historialFiltrado.length / ITEMS_PER_PAGE
  );

  if (!flotaId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes asociada una flota. Contacta al administrador.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={6}
        sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 1, fontWeight: 700, color: "#000000" }}
        >
          💳 Mi Billetera
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#666", mb: 3, fontFamily: "Mulish, sans-serif" }}
        >
          Gestiona tu saldo y solicitudes de recarga
        </Typography>

        {/* Tarjeta de Saldo Disponible */}
        <Paper
          key={`saldo-${saldoActual}`}
          elevation={3}
          sx={{
            mb: 4,
            p: 3,
            background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
            borderRadius: 2,
            color: "#fff",
          }}
        >
          <Typography
            variant="body2"
            sx={{ opacity: 0.9, mb: 1, fontFamily: "Mulish, sans-serif" }}
          >
            Saldo Disponible de la Flota
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, fontFamily: "Mulish, sans-serif" }}
          >
            ${saldoActual.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              opacity: 0.8,
              mt: 1,
              display: "block",
              fontFamily: "Mulish, sans-serif",
            }}
          >
            Se actualiza automáticamente con recargas y retiros
          </Typography>
        </Paper>

        {/* Botones para nueva solicitud y QR */}
        <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAbrirModal}
            sx={{
              backgroundColor: "#d7171a",
              color: "white",
              fontWeight: 600,
              fontFamily: "Mulish, sans-serif",
              "&:hover": { backgroundColor: "#b01217" },
            }}
          >
            Solicitar Recarga
          </Button>

          <Button
            variant="contained"
            startIcon={<QrCodeIcon />}
            onClick={handleOpenQrModal}
            sx={{
              background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
              color: "#fff",
              fontWeight: 600,
              fontFamily: "Mulish, sans-serif",
              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(76, 175, 80, 0.4)",
              },
            }}
          >
            Mi QR
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 2, borderColor: "divider", mb: 3 }}>
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
            <Tab label="📋 Mis Solicitudes" />
            <Tab label="📊 Historial de Transacciones" />
          </Tabs>
        </Box>

        {/* TAB 1: SOLICITUDES */}
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
                  searchValue={searchSolicitudes}
                  onSearchChange={setSearchSolicitudes}
                  sortValue={sortBySolicitudes}
                  onSortChange={setSortBySolicitudes}
                  sortOptions={[
                    { label: "↑ Fecha (Más antigua)", value: "fecha-asc" },
                    { label: "↓ Fecha (Más reciente)", value: "fecha-desc" },
                    { label: "↑ Monto (Menor)", value: "monto-asc" },
                    { label: "↓ Monto (Mayor)", value: "monto-desc" },
                  ]}
                />
              </Box>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table stickyHeader>
                <TableHead sx={{ backgroundColor: "#000000" }}>
                  <TableRow>
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
                    <TableCell
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
                  {solicitudesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography
                          sx={{
                            py: 3,
                            color: "#484848",
                            fontFamily: "Mulish, sans-serif",
                          }}
                        >
                          No hay solicitudes de recarga
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    solicitudesPaginadas.map((solicitud) => (
                      <TableRow
                        key={solicitud.id}
                        sx={{ borderBottom: "1px solid #d0d0d0" }}
                      >
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {solicitud.fechaSolicitud
                            ?.toDate?.()
                            .toLocaleDateString("es-ES") || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Mulish, sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          $
                          {solicitud.monto.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {solicitud.concepto}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          <Chip
                            label={getEstadoLabel(solicitud.estado)}
                            size="small"
                            sx={{
                              bgcolor:
                                solicitud.estado === "aprobada"
                                  ? "#d7171a"
                                  : solicitud.estado === "rechazada"
                                    ? "#ff5252"
                                    : "#ffc107",
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Mulish, sans-serif",
                            fontSize: "0.9rem",
                          }}
                        >
                          {solicitud.estado === "rechazada" &&
                          solicitud.razonRechazo
                            ? `Rechazada: ${solicitud.razonRechazo}`
                            : solicitud.notas || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {solicitudesFiltradas.length > 0 && (
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
                  Mostrando {pageSolicitudes * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(
                    (pageSolicitudes + 1) * ITEMS_PER_PAGE,
                    solicitudesFiltradas.length
                  )}{" "}
                  de {solicitudesFiltradas.length}
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
          </>
        )}

        {/* TAB 2: HISTORIAL */}
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
                  searchValue={searchHistorial}
                  onSearchChange={setSearchHistorial}
                  sortValue={sortByHistorial}
                  onSortChange={setSortByHistorial}
                  sortOptions={[
                    { label: "↑ Fecha (Más antigua)", value: "fecha-asc" },
                    { label: "↓ Fecha (Más reciente)", value: "fecha-desc" },
                    { label: "↑ Monto (Menor)", value: "monto-asc" },
                    { label: "↓ Monto (Mayor)", value: "monto-desc" },
                  ]}
                />
              </Box>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table stickyHeader>
                <TableHead sx={{ backgroundColor: "#000000" }}>
                  <TableRow>
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
                    <TableCell
                      sx={{
                        backgroundColor: "#000000",
                        color: "white",
                        fontWeight: 700,
                        fontFamily: "Mulish, sans-serif",
                        fontSize: "0.95rem",
                      }}
                    >
                      Tipo
                    </TableCell>
                    <TableCell
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
                      sx={{
                        backgroundColor: "#000000",
                        color: "white",
                        fontWeight: 700,
                        fontFamily: "Mulish, sans-serif",
                        fontSize: "0.95rem",
                      }}
                    >
                      Saldo Posterior
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialFiltrado.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography
                          sx={{
                            py: 3,
                            color: "#484848",
                            fontFamily: "Mulish, sans-serif",
                          }}
                        >
                          No hay transacciones registradas
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    historialPaginado.map((tx) => (
                      <TableRow
                        key={tx.id}
                        sx={{ borderBottom: "1px solid #d0d0d0" }}
                      >
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {tx.fechaRegistro}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          <Chip
                            label={
                              tx.tipo === "deposito" ? "Depósito" : "Retiro"
                            }
                            size="small"
                            sx={{
                              bgcolor:
                                tx.tipo === "deposito" ? "#d7171a" : "#ff5252",
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Mulish, sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          $
                          {Math.abs(tx.monto).toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {tx.concepto}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Mulish, sans-serif",
                            fontWeight: 600,
                            color: "#d7171a",
                          }}
                        >
                          $
                          {tx.saldoNuevo.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {historialFiltrado.length > 0 && (
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
                  Mostrando {pageHistorial * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(
                    (pageHistorial + 1) * ITEMS_PER_PAGE,
                    historialFiltrado.length
                  )}{" "}
                  de {historialFiltrado.length}
                </Typography>
                <Pagination
                  count={totalPagesHistorial}
                  page={pageHistorial + 1}
                  onChange={(e, page) => setPageHistorial(page - 1)}
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
          </>
        )}

        {/* MODAL NUEVA SOLICITUD */}
        <Dialog
          open={modalOpen}
          onClose={handleModalClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}
          >
            Solicitar Recarga
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {/* Mostrar QR del SuperAdmin si existe */}
            {superAdminQr && (
              <Box
                sx={{
                  mb: 3,
                  textAlign: "center",
                  p: 2,
                  bgcolor: "#f5f5f5",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: "#666",
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  📱 Realiza la transferencia escaneando este QR:
                </Typography>
                <Box
                  component="img"
                  src={superAdminQr}
                  alt="QR SuperAdmin"
                  onClick={() => setQrExpandedOpen(true)}
                  sx={{
                    maxWidth: "250px",
                    maxHeight: "250px",
                    border: "3px solid #d7171a",
                    borderRadius: 2,
                    objectFit: "contain",
                    boxShadow: "0 4px 12px rgba(215, 23, 26, 0.2)",
                    mx: "auto",
                    display: "block",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: "0 6px 20px rgba(215, 23, 26, 0.3)",
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1.5,
                    color: "#999",
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  Haz clic en el QR para expandir • Después de realizar la
                  transferencia, completa el formulario abajo
                </Typography>
                {superAdminQrUpdatedAt && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      color: "#999",
                      fontStyle: "italic",
                      fontFamily: "Mulish, sans-serif",
                    }}
                  >
                    Última edición:{" "}
                    {new Date(superAdminQrUpdatedAt).toLocaleString("es-ES", {
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

            <TextField
              fullWidth
              label="Monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              inputProps={{ step: "0.01", min: "0" }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              sx={{ mb: 2 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="recarga">Recarga General</option>
              <option value="comisiones">Pago de Comisiones</option>
              <option value="incentivo">Incentivo</option>
              <option value="bonus">Bonus</option>
              <option value="otro">Otro</option>
            </TextField>
            <TextField
              fullWidth
              label="Notas (opcional)"
              multiline
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Transferencia realizada desde cuenta xxx-xxx"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Nro de Comprobante"
              value={nroComprobante}
              onChange={(e) => setNroComprobante(e.target.value)}
              placeholder="Ej: 123456789"
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 50 }}
            />

            {/* Sección de comprobante */}
            <Box
              sx={{
                p: 2,
                bgcolor: "#f5f5f5",
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: "#666",
                  fontWeight: 600,
                  fontFamily: "Mulish, sans-serif",
                }}
              >
                Comprobante de Pago
              </Typography>

              {comprobantePreview && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    component="img"
                    src={comprobantePreview}
                    alt="Preview Comprobante"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      border: "2px solid #d7171a",
                      borderRadius: 2,
                      objectFit: "contain",
                      boxShadow: "0 4px 12px rgba(215, 23, 26, 0.2)",
                    }}
                  />
                </Box>
              )}

              <input
                accept="image/*"
                style={{ display: "none" }}
                id="comprobante-upload"
                type="file"
                onChange={handleComprobanteChange}
              />
              <label htmlFor="comprobante-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    borderColor: "#d7171a",
                    color: "#d7171a",
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
                    px: 3,
                    py: 1,
                    "&:hover": {
                      borderColor: "#b01217",
                      backgroundColor: "rgba(215, 23, 26, 0.04)",
                    },
                  }}
                >
                  {comprobanteImage
                    ? "Cambiar Comprobante"
                    : "Subir Comprobante"}
                </Button>
              </label>

              {comprobanteImage && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    color: "#666",
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  {comprobanteImage.name} (
                  {(comprobanteImage.size / 1024).toFixed(2)} KB)
                </Typography>
              )}

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1,
                  color: "#999",
                  fontFamily: "Mulish, sans-serif",
                }}
              >
                Formatos: JPG, PNG, GIF (Máx. 5MB)
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleModalClose}
              sx={{ fontFamily: "Mulish, sans-serif" }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitSolicitud}
              variant="contained"
              disabled={submitting}
              sx={{
                backgroundColor: "#d7171a",
                fontFamily: "Mulish, sans-serif",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#b01217" },
              }}
            >
              {submitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL QR DE LA FLOTA */}
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
              fontFamily: "Mulish, sans-serif",
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
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: "#666",
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
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
                      fontFamily: "Mulish, sans-serif",
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
                  sx={{
                    mb: 2,
                    color: "#666",
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
                  }}
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

            {/* Botón de selección de archivo */}
            <Box sx={{ textAlign: "center" }}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="qr-image-upload-flota"
                type="file"
                onChange={handleQrImageChange}
              />
              <label htmlFor="qr-image-upload-flota">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    borderColor: "#4caf50",
                    color: "#4caf50",
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
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
                  sx={{
                    display: "block",
                    mt: 1,
                    color: "#666",
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  {qrImage.name} ({(qrImage.size / 1024).toFixed(2)} KB)
                </Typography>
              )}
            </Box>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 2,
                color: "#999",
                textAlign: "center",
                fontFamily: "Mulish, sans-serif",
              }}
            >
              Formatos aceptados: JPG, PNG, GIF (Máx. 5MB)
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={handleCloseQrModal}
              sx={{ color: "#666", fontFamily: "Mulish, sans-serif" }}
            >
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
                fontFamily: "Mulish, sans-serif",
                px: 3,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)",
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

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>

        {/* MODAL QR EXPANDIDO */}
        <Dialog
          open={qrExpandedOpen}
          onClose={() => setQrExpandedOpen(false)}
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
              src={superAdminQr}
              alt="QR SuperAdmin Expandido"
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
            {superAdminQrUpdatedAt && (
              <Typography
                variant="caption"
                sx={{
                  color: "#fff",
                  mt: 1,
                  fontStyle: "italic",
                  fontFamily: "Mulish, sans-serif",
                  opacity: 0.8,
                }}
              >
                Última edición:{" "}
                {new Date(superAdminQrUpdatedAt).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            )}
          </DialogContent>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default BilleteraFlota;
