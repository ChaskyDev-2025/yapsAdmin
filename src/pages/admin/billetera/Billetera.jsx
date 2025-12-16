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
import {
  obtenerFlotas,
  obtenerSaldoTotal,
  obtenerHistorialFlota,
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

const Billetera = () => {
  const [tabValue, setTabValue] = useState(0);
  const [flotas, setFlotas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
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

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Estados para búsqueda y filtros
  const [searchFlotas, setSearchFlotas] = useState("");
  const [sortByFlotas, setSortByFlotas] = useState("nombre-asc");
  const [searchSolicitudes, setSearchSolicitudes] = useState("");
  const [sortBySolicitudes, setSortBySolicitudes] = useState("fecha-desc");

  // Estados para paginación
  const ITEMS_PER_PAGE = 10;
  const [pageFlotas, setPageFlotas] = useState(0);
  const [pageSolicitudes, setPageSolicitudes] = useState(0);

  // Resetear página al cambiar búsqueda o filtros
  useEffect(() => {
    setPageFlotas(0);
  }, [searchFlotas]);

  useEffect(() => {
    setPageSolicitudes(0);
  }, [searchSolicitudes]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [flotasData, estadisticasData, solicitudesData] = await Promise.all([
        obtenerFlotas(),
        obtenerSaldoTotal(),
        obtenerSolicitudesPendientes(),
      ]);

      setFlotas(flotasData);
      setEstadisticas(estadisticasData);
      setSolicitudes(solicitudesData);
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
    const unsubscribeSolicitudes = escucharSolicitudesPendientes((solicitudesActualizadas) => {
      setSolicitudes(solicitudesActualizadas);
    });
    
    // Cleanup: desuscribirse de todos los listeners
    return () => {
      if (unsubscribeFlotas) unsubscribeFlotas();
      if (unsubscribeSaldo) unsubscribeSaldo();
      if (unsubscribeSolicitudes) unsubscribeSolicitudes();
    };
  }, [cargarDatos]);

  const mostrarSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Filtrar y ordenar flotas
  const filteredFlotas = useMemo(() => {
    let result = [...flotas];
    
    // Filtrar por búsqueda
    if (searchFlotas.trim()) {
      const search = searchFlotas.toLowerCase();
      result = result.filter(flota =>
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
      result = result.filter(sol =>
        (sol.flotaNombre || "").toLowerCase().includes(search) ||
        (sol.concepto || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenar
    if (sortBySolicitudes === "fecha-asc") {
      result.sort((a, b) => 
        new Date(a.fechaSolicitud?.toDate?.() || a.fechaSolicitud || 0) - 
        new Date(b.fechaSolicitud?.toDate?.() || b.fechaSolicitud || 0)
      );
    } else if (sortBySolicitudes === "fecha-desc") {
      result.sort((a, b) => 
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

  const totalPagesSolicitudes = Math.ceil(filteredSolicitudes.length / ITEMS_PER_PAGE);

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
    mostrarSnackbar(`Transacción completada. Nuevo saldo: $${resultado.nuevoSaldo.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`, "success");
    
    // Actualizar solo la flota en el estado local sin recargar todo
    setFlotas(prevFlotas => 
      prevFlotas.map(flota =>
        flota.id === selectedFlota.id
          ? { ...flota, saldo: resultado.nuevoSaldo }
          : flota
      )
    );

    // Actualizar estadísticas
    setEstadisticas(prev => ({
      ...prev,
      saldoTotal: prev.saldoTotal + (resultado.nuevoSaldo - selectedFlota.saldo)
    }));
  };

  const handleAbrirHistorial = async (flota) => {
    try {
      const transacciones = await obtenerHistorialFlota(flota.id);
      setHistorialFlota(flota);
      setHistorial(transacciones);
      setHistorialOpen(true);
    } catch (error) {
      mostrarSnackbar("Error al cargar historial", "error");
      console.error(error);
    }
  };

  const handleCloseHistorial = () => {
    setHistorialOpen(false);
    setHistorialFlota(null);
    setHistorial([]);
  };

  const handleAprobarSolicitud = async (solicitud) => {
    try {
      setProcessingId(solicitud.id);
      await aprobarSolicitud(solicitud.flotaId, solicitud.id, "superadmin");
      
      // Remover la solicitud de la lista (listener en tiempo real actualizará luego)
      setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id));
      
      // Recargar solo flotas y estadísticas (solicitudes se actualizan vía listener)
      const [flotasData, estadisticasData] = await Promise.all([
        obtenerFlotas(),
        obtenerSaldoTotal(),
      ]);
      setFlotas(flotasData);
      setEstadisticas(estadisticasData);

      mostrarSnackbar("Solicitud aprobada correctamente", "success");
    } catch (error) {
      mostrarSnackbar(error.message || "Error al aprobar solicitud", "error");
    } finally {
      setProcessingId(null);
    }
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
      setSolicitudes(prev => prev.filter(s => s.id !== selectedSolicitud.id));

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
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        {/* Encabezado */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              💳 Billetera - Gestión de Saldo
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Control centralizado de recarga de saldo para las flotas
            </Typography>
          </div>
          <Tooltip title="Recargar datos">
            <IconButton
              onClick={cargarDatos}
              disabled={loading}
              sx={{ bgcolor: "#f5f5f5" }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Estadísticas */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)" }}>
              <CardContent>
                <Typography color="textSecondary" sx={{ color: "#fff", opacity: 0.8 }}>
                  Saldo Total
                </Typography>
                <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mt: 1 }}>
                  ${saldoTotalFormato}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: "linear-gradient(135deg, #484848 0%, #2c2c2c 100%)" }}>
              <CardContent>
                <Typography color="textSecondary" sx={{ color: "#fff", opacity: 0.8 }}>
                  Flotas Activas
                </Typography>
                <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mt: 1 }}>
                  {estadisticas.flotasActivas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)" }}>
              <CardContent>
                <Typography color="textSecondary" sx={{ color: "#fff", opacity: 0.8 }}>
                  Total de Flotas
                </Typography>
                <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mt: 1 }}>
                  {estadisticas.totalFlotas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: "linear-gradient(135deg, #a01012 0%, #7a0c0e 100%)" }}>
              <CardContent>
                <Typography color="textSecondary" sx={{ color: "#fff", opacity: 0.8 }}>
                  Flotas Inactivas
                </Typography>
                <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mt: 1 }}>
                  {estadisticas.totalFlotas - estadisticas.flotasActivas}
                </Typography>
              </CardContent>
            </Card>
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
          </Tabs>
        </Box>

        {/* Contenido de Solicitudes Pendientes */}
        {tabValue === 1 && (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
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
                  visibleColumns={{}}
                  onColumnChange={() => {}}
                  showClearButton={true}
                />
              </Box>
            </Box>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}>
            {solicitudes.length > 0 ? (
              <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
                <Table stickyHeader>
                  <TableHead sx={{ backgroundColor: "#000000" }}>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Flota</TableCell>
                      <TableCell align="right" sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                        Monto
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Concepto</TableCell>
                      <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Notas</TableCell>
                      <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Fecha</TableCell>
                      <TableCell align="center" sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {solicitudesPaginadas.map((solicitud) => (
                      <TableRow
                        key={solicitud.id}
                        hover
                        sx={{ borderBottom: "1px solid #d0d0d0" }}
                      >
                        <TableCell sx={{ fontWeight: 600, fontFamily: "Mulish, sans-serif" }}>{solicitud.flotaNombre}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1.05rem", fontFamily: "Mulish, sans-serif" }}>
                          <span style={{ color: "#d7171a" }}>
                            ${solicitud.monto.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          <Chip label={solicitud.concepto} size="small" sx={{ bgcolor: "#ffe0e0", color: "#b01217", fontWeight: 600 }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.9rem", color: "#666", fontFamily: "Mulish, sans-serif" }}>
                          {solicitud.notas || "-"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.9rem", fontFamily: "Mulish, sans-serif" }}>
                          {new Date(solicitud.fechaSolicitud?.toDate?.() || solicitud.fechaSolicitud).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                            <Tooltip title="Aprobar">
                              <IconButton
                                size="small"
                                onClick={() => handleAprobarSolicitud(solicitud)}
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
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 3, gap: 2, flexWrap: "wrap" }}>
                <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                  Mostrando {solicitudesPaginadas.length > 0 ? (pageSolicitudes * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pageSolicitudes + 1) * ITEMS_PER_PAGE, filteredSolicitudes.length)} de {filteredSolicitudes.length}
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

        {/* Contenido de Gestión de Flotas */}
        {tabValue === 0 && (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
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
                  filterOptions={[]}adfsdfsfsdfsfff
                  visibleColumns={{}}
                  onColumnChange={() => {}}
                  showClearButton={true}
                />
              </Box>
            </Box>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
              <Table stickyHeader>
                <TableHead sx={{ backgroundColor: "#000000" }}>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Flota</TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Contacto</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Saldo Actual
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Estado</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {flotasPaginadas.map((flota) => (
                  <TableRow
                    key={flota.id}
                    hover
                    sx={{ borderBottom: "1px solid #d0d0d0" }}
                  >
                    <TableCell sx={{ fontWeight: 600, fontFamily: "Mulish, sans-serif" }}>{flota.nombre}</TableCell>
                    <TableCell sx={{ fontSize: "0.9rem", color: "#666", fontFamily: "Mulish, sans-serif" }}>
                      {flota.contacto || flota.email || "-"}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1.05rem", fontFamily: "Mulish, sans-serif" }}>
                      <span style={{ color: "#d7171a" }}>
                        ${(flota.saldo || 0).toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={flota.estado === "activa" ? "Activa" : "Inactiva"}
                        size="small"
                        sx={{
                          bgcolor: flota.estado === "activa" ? "#d7171a" : "#bdbdbd",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <Tooltip title="Asignar Saldo (+)">
                          <IconButton
                            size="small"
                            onClick={() => handleAbrirModal(flota, "deposito")}
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
                            onClick={() => handleAbrirModal(flota, "retiro")}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Paper>
          
          {/* Paginación Flotas */}
          {filteredFlotas.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
              <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                Mostrando {flotasPaginadas.length > 0 ? (pageFlotas * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pageFlotas + 1) * ITEMS_PER_PAGE, filteredFlotas.length)} de {filteredFlotas.length}
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

      {/* Dialog para rechazar */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Rechazar Solicitud</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Flota:</strong> {selectedSolicitud?.flotaNombre}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Monto:</strong> ${selectedSolicitud?.monto.toLocaleString("es-ES", {
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
