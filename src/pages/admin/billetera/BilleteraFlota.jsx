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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../auth/AuthContext";
import {
  obtenerSolicitudesFlota,
  obtenerHistorialTransacciones,
  crearSolicitudRecarga,
  escucharSolicitudesFlota,
  escucharHistorialTransacciones,
  escucharSaldoFlota,
} from "../../../services/solicitudesRecargaService";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";

const BilleteraFlota = () => {
  const { userFlotaId } = useAuth();
  const flotaId = userFlotaId;
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [saldoActual, setSaldoActual] = useState(0);

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

  const cargarDatos = useCallback(async () => {
    if (!flotaId) {
      setLoading(false);
      return;
    }

    const getSaldo = async () => {
      try {
        const billeteraRef = doc(db, "flotas", flotaId, "billetera", "saldo");
        const docSnapshot = await getDoc(billeteraRef);

        if (docSnapshot.exists()) {
          return docSnapshot.data().monto || 0;
        }
        return 0;
      } catch (error) {
        console.error("Error al obtener saldo:", error);
        return 0;
      }
    };

    try {
      setLoading(true);

      const [solicitudesData, historialData, saldoData] = await Promise.all([
        obtenerSolicitudesFlota(flotaId),
        obtenerHistorialTransacciones(flotaId),
        getSaldo(),
      ]);

      setSolicitudes(solicitudesData);
      setHistorial(historialData);
      setSaldoActual(saldoData);
    } catch (error) {
      mostrarSnackbar("Error al cargar datos", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [flotaId]);

  useEffect(() => {
    if (!flotaId) {
      setLoading(false);
      return;
    }

    cargarDatos();

    // Listener en tiempo real para solicitudes
    const unsubscribeSolicitudes = escucharSolicitudesFlota(flotaId, (solicitudesActualizadas) => {
      setSolicitudes(solicitudesActualizadas);
    });

    // Listener en tiempo real para historial de transacciones
    const unsubscribeHistorial = escucharHistorialTransacciones(flotaId, (historialActualizado) => {
      setHistorial(historialActualizado);
      
      // Cuando el historial se actualiza, también actualizar el saldo
      const refrescarSaldo = async () => {
        try {
          const billeteraRef = doc(db, "flotas", flotaId, "billetera", "saldo");
          const docSnapshot = await getDoc(billeteraRef);
          if (docSnapshot.exists()) {
            setSaldoActual(docSnapshot.data().monto || 0);
          }
        } catch (error) {
          console.error("Error refrescando saldo:", error);
        }
      };
      refrescarSaldo();
    });

    // Listener en tiempo real para saldo
    const unsubscribeSaldo = escucharSaldoFlota(flotaId, (saldoActualizado) => {
      setSaldoActual(saldoActualizado);
    });

    // Cleanup
    return () => {
      if (unsubscribeSolicitudes) unsubscribeSolicitudes();
      if (unsubscribeHistorial) unsubscribeHistorial();
      if (unsubscribeSaldo) unsubscribeSaldo();
    };
  }, [cargarDatos, flotaId]);

  const mostrarSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAbrirModal = () => {
    setMonto("");
    setConcepto("recarga");
    setNotas("");
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleSubmitSolicitud = async () => {
    try {
      if (!monto || parseFloat(monto) <= 0) {
        mostrarSnackbar("Ingresa un monto válido", "error");
        return;
      }

      setSubmitting(true);

      await crearSolicitudRecarga(
        flotaId,
        parseFloat(monto),
        concepto,
        notas
      );

      mostrarSnackbar("Solicitud enviada al superadmin", "success");
      handleModalClose();
      // NO recargar - el listener actualizará automáticamente
    } catch (error) {
      mostrarSnackbar(error.message || "Error al crear solicitud", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "warning";
      case "aprobada":
        return "success";
      case "rechazada":
        return "error";
      default:
        return "default";
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

  if (!flotaId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tienes asociada una flota. Contacta al administrador.</Alert>
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
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Mi Billetera
      </Typography>

      {/* Tarjeta de Saldo */}
      <Card sx={{ mb: 3, background: "linear-gradient(135deg, #00897b 0%, #00695c 100%)" }}>
        <CardContent>
          <Typography color="white" variant="subtitle2" sx={{ mb: 1 }}>
            Saldo Disponible
          </Typography>
          <Typography color="white" variant="h3" sx={{ fontWeight: "bold" }}>
            ${saldoActual.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
          </Typography>
        </CardContent>
      </Card>

      {/* Botón para nueva solicitud */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAbrirModal}
          sx={{ background: "#00897b" }}
        >
          Solicitar Recarga
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
        >
          <Tab label="Solicitudes" />
          <Tab label="Historial de Transacciones" />
        </Tabs>
      </Paper>

      {/* TAB 1: SOLICITUDES */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ background: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Concepto</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Notas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {solicitudes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No hay solicitudes de recarga
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                solicitudes.map((solicitud) => (
                  <TableRow key={solicitud.id}>
                    <TableCell>
                      {solicitud.fechaSolicitud?.toDate?.().toLocaleDateString("es-ES") ||
                        "N/A"}
                    </TableCell>
                    <TableCell>
                      ${solicitud.monto.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>{solicitud.concepto}</TableCell>
                    <TableCell>
                      <Chip
                        label={getEstadoLabel(solicitud.estado)}
                        color={getEstadoColor(solicitud.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {solicitud.estado === "rechazada" && solicitud.razonRechazo
                        ? `Rechazada: ${solicitud.razonRechazo}`
                        : solicitud.notas || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 2: HISTORIAL */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ background: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Concepto</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Saldo Posterior</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No hay transacciones registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                historial.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.fechaRegistro}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          tx.tipo === "deposito" ? "Depósito" : "Retiro"
                        }
                        color={
                          tx.tipo === "deposito" ? "success" : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      ${Math.abs(tx.monto).toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>{tx.concepto}</TableCell>
                    <TableCell>
                      ${tx.saldoNuevo.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* MODAL NUEVA SOLICITUD */}
      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>Solicitar Recarga</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose}>Cancelar</Button>
          <Button
            onClick={handleSubmitSolicitud}
            variant="contained"
            disabled={submitting}
            sx={{ background: "#00897b" }}
          >
            {submitting ? "Enviando..." : "Enviar Solicitud"}
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
    </Box>
  );
};

export default BilleteraFlota;
