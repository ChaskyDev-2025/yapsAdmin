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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useAuth } from "../../../auth/AuthContext";
import {
  obtenerSolicitudesPendientes,
  aprobarSolicitud,
  rechazarSolicitud,
} from "../../../services/solicitudesRecargaService";

const GestionarSolicitudes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTipo, setDialogTipo] = useState("aprobar"); // 'aprobar' o 'rechazar'
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [razonRechazo, setRazonRechazo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await obtenerSolicitudesPendientes();
      setSolicitudes(data);
    } catch (error) {
      mostrarSnackbar("Error al cargar solicitudes", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const mostrarSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAbrirDialog = (solicitud, tipo) => {
    setSelectedSolicitud(solicitud);
    setDialogTipo(tipo);
    setRazonRechazo("");
    setDialogOpen(true);
  };

  const handleCerrarDialog = () => {
    setDialogOpen(false);
    setSelectedSolicitud(null);
    setRazonRechazo("");
  };

  const handleAprobar = async () => {
    try {
      setSubmitting(true);
      await aprobarSolicitud(
        selectedSolicitud.flotaId,
        selectedSolicitud.id,
        user.uid
      );
      mostrarSnackbar("Solicitud aprobada correctamente", "success");
      handleCerrarDialog();
      cargarSolicitudes();
    } catch (error) {
      mostrarSnackbar(error.message || "Error al aprobar solicitud", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRechazar = async () => {
    try {
      if (!razonRechazo.trim()) {
        mostrarSnackbar("Debes indicar el motivo del rechazo", "error");
        return;
      }

      setSubmitting(true);
      await rechazarSolicitud(
        selectedSolicitud.flotaId,
        selectedSolicitud.id,
        user.uid,
        razonRechazo
      );
      mostrarSnackbar("Solicitud rechazada", "success");
      handleCerrarDialog();
      cargarSolicitudes();
    } catch (error) {
      mostrarSnackbar(error.message || "Error al rechazar solicitud", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
        Solicitudes de Recarga
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ background: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Flota</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Monto</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Concepto</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Notas</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Fecha Solicitud</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {solicitudes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    No hay solicitudes pendientes
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              solicitudes.map((solicitud) => (
                <TableRow key={`${solicitud.flotaId}-${solicitud.id}`}>
                  <TableCell sx={{ fontWeight: "500" }}>
                    {solicitud.flotaNombre}
                  </TableCell>
                  <TableCell>
                    ${solicitud.monto.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>{solicitud.concepto}</TableCell>
                  <TableCell>{solicitud.notas || "-"}</TableCell>
                  <TableCell>
                    {solicitud.fechaSolicitud?.toDate?.().toLocaleDateString("es-ES") ||
                      "N/A"}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Aprobar">
                      <IconButton
                        color="success"
                        size="small"
                        onClick={() =>
                          handleAbrirDialog(solicitud, "aprobar")
                        }
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rechazar">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() =>
                          handleAbrirDialog(solicitud, "rechazar")
                        }
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIALOG PARA APROBAR/RECHAZAR */}
      <Dialog open={dialogOpen} onClose={handleCerrarDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogTipo === "aprobar"
            ? "Aprobar Solicitud"
            : "Rechazar Solicitud"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedSolicitud && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Flota:</strong> {selectedSolicitud.flotaNombre}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Monto:</strong> $
                {selectedSolicitud.monto.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Concepto:</strong> {selectedSolicitud.concepto}
              </Typography>
              {selectedSolicitud.notas && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Notas:</strong> {selectedSolicitud.notas}
                </Typography>
              )}

              {dialogTipo === "rechazar" && (
                <TextField
                  fullWidth
                  label="Motivo del rechazo"
                  multiline
                  rows={3}
                  value={razonRechazo}
                  onChange={(e) => setRazonRechazo(e.target.value)}
                  placeholder="Explica por qué se rechaza la solicitud..."
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarDialog}>Cancelar</Button>
          <Button
            onClick={
              dialogTipo === "aprobar" ? handleAprobar : handleRechazar
            }
            variant="contained"
            color={dialogTipo === "aprobar" ? "success" : "error"}
            disabled={submitting}
          >
            {submitting
              ? "Procesando..."
              : dialogTipo === "aprobar"
              ? "Aprobar"
              : "Rechazar"}
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

export default GestionarSolicitudes;
