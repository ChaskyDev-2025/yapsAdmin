import React, { useState, useEffect, useCallback } from "react";
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
    <Box>
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
          <Card sx={{ background: "linear-gradient(135deg, #00897b 0%, #00695c 100%)" }}>
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
          <Card sx={{ background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)" }}>
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
          <Card sx={{ background: "linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)" }}>
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
          <Card sx={{ background: "linear-gradient(135deg, #d32f2f 0%, #c62828 100%)" }}>
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
            },
          }}
        >
          <Tab label={`📋 Solicitudes Pendientes (${solicitudes.length})`} />
          <Tab label="💰 Gestión de Flotas" />
        </Tabs>
      </Box>

      {/* Contenido de Solicitudes */}
      {tabValue === 0 && (
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}>
          {solicitudes.length > 0 ? (
            <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "1rem" }}>Flota</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1rem" }}>
                      Monto
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "1rem" }}>Concepto</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "1rem" }}>Notas</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "1rem" }}>Fecha</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "1rem" }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solicitudes.map((solicitud) => (
                    <TableRow
                      key={solicitud.id}
                      sx={{
                        "&:hover": { bgcolor: "#f9f9f9" },
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{solicitud.flotaNombre}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                        <span style={{ color: "#00897b" }}>
                          ${solicitud.monto.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip label={solicitud.concepto} size="small" />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem", color: "#666" }}>
                        {solicitud.notas || "-"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.9rem" }}>
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
                                bgcolor: "#e8f5e9",
                                color: "#00897b",
                                "&:hover": { bgcolor: "#c8e6c9" },
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
                                color: "#d32f2f",
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
      )}

      {/* Contenido de Gestión de Flotas */}
      {tabValue === 1 && (
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
            <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: "1rem" }}>Flota</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "1rem" }}>Contacto</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1rem" }}>
                  Saldo Actual
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "1rem" }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: "1rem" }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flotas.map((flota) => (
                <TableRow
                  key={flota.id}
                  sx={{
                    "&:hover": { bgcolor: "#f9f9f9" },
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{flota.nombre}</TableCell>
                  <TableCell sx={{ fontSize: "0.9rem", color: "#666" }}>
                    {flota.contacto || flota.email || "-"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                    <span style={{ color: "#00897b" }}>
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
                        bgcolor: flota.estado === "activa" ? "#4caf50" : "#bdbdbd",
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
                            bgcolor: "#e8f5e9",
                            color: "#00897b",
                            "&:hover": { bgcolor: "#c8e6c9" },
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
                            color: "#d32f2f",
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
                            bgcolor: "#e3f2fd",
                            color: "#1976d2",
                            "&:hover": { bgcolor: "#bbdefb" },
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
      )}

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
