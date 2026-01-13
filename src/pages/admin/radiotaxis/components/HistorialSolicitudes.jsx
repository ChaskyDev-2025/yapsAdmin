// src/pages/admin/radiotaxis/components/HistorialSolicitudes.jsx
import React, { useState, useMemo } from "react";
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
  Chip,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useSolicitudesHistorial } from "../hooks/useSolicitudesHistorial";

const ITEMS_PER_PAGE = 10;

export const HistorialSolicitudes = ({ conductorId, conductorNombre }) => {
  const { solicitudes, loading, error } = useSolicitudesHistorial(conductorId);
  const [page, setPage] = useState(0);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // Función para obtener el color según el estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "finalizado":
        return { bg: "#e8f5e9", color: "#2e7d32", label: "Finalizado" };
      case "ofertado":
        return { bg: "#fff3e0", color: "#e65100", label: "Ofertado" };
      case "en_progreso":
        return { bg: "#e3f2fd", color: "#1565c0", label: "En Progreso" };
      case "cancelado":
        return { bg: "#ffebee", color: "#c62828", label: "Cancelado" };
      case "aceptado":
        return { bg: "#f3e5f5", color: "#6a1b9a", label: "Aceptado" };
      default:
        return { bg: "#f5f5f5", color: "#616161", label: estado };
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Función para extraer información de servicio
  const obtenerServicio = (solicitud) => {
    if (solicitud.solicitud?.datosEspecificos?.tipoContenido) {
      return solicitud.solicitud.datosEspecificos.tipoContenido;
    }
    if (solicitud.solicitud?.servicio) {
      return solicitud.solicitud.servicio;
    }
    if (solicitud.servicio) {
      return solicitud.servicio;
    }
    return "Servicio";
  };

  // Función para extraer monto
  const obtenerMonto = (solicitud) => {
    if (solicitud.oferta?.costo) {
      return `Bs. ${solicitud.oferta.costo.toFixed(2)}`;
    }
    if (solicitud.solicitud?.datosEspecificos?.precioEstimado) {
      return `Bs. ${solicitud.solicitud.datosEspecificos.precioEstimado.toFixed(2)}`;
    }
    return "N/A";
  };

  // Paginación
  const solicitudesPaginadas = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return solicitudes.slice(start, end);
  }, [solicitudes, page]);

  const totalPages = Math.ceil(solicitudes.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress sx={{ color: "#d7171a" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, bgcolor: "#ffebee" }}>
        <Typography color="error">Error al cargar el historial: {error}</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ color: "#000000", mb: 2 }}>
          Historial de Solicitudes - {conductorNombre}
        </Typography>

        {solicitudes.length === 0 ? (
          <Typography color="textSecondary" sx={{ py: 4, textAlign: "center" }}>
            No hay solicitudes registradas para este conductor
          </Typography>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ boxShadow: 3, mb: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#000000" }}>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700 }}>
                      Servicio
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700 }}>
                      Monto
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700 }}>
                      Fecha Creación
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700 }}>
                      Estado
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700 }}>
                      Flota Asignada
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700 }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solicitudesPaginadas.map((solicitud) => {
                    const estadoInfo = getEstadoColor(solicitud.estado);
                    return (
                      <TableRow key={solicitud.id} hover sx={{ borderBottom: "1px solid #d0d0d0" }}>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {obtenerServicio(solicitud)}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                          {obtenerMonto(solicitud)}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontSize: "0.9rem" }}>
                          {formatearFecha(solicitud.fechaCreacion)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={estadoInfo.label}
                            size="small"
                            sx={{
                              backgroundColor: estadoInfo.bg,
                              color: estadoInfo.color,
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontSize: "0.9rem" }}>
                          {solicitud.flota_asignada ? solicitud.flota_asignada.substring(0, 8) + "..." : "-"}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSolicitud(solicitud);
                                setOpenModal(true);
                              }}
                              sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffebee" } }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {solicitudes.length > ITEMS_PER_PAGE && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                  Mostrando {page * ITEMS_PER_PAGE + 1} - {Math.min((page + 1) * ITEMS_PER_PAGE, solicitudes.length)} de{" "}
                  {solicitudes.length}
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(e, newPage) => setPage(newPage - 1)}
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
      </Paper>

      {/* Modal de Detalles */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#000000", color: "white" }}>
          Detalles de la Solicitud
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedSolicitud && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Servicio
                </Typography>
                <Typography>{obtenerServicio(selectedSolicitud)}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Descripción
                </Typography>
                <Typography>
                  {selectedSolicitud.solicitud?.datosEspecificos?.descripcion || "N/A"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Monto
                </Typography>
                <Typography>{obtenerMonto(selectedSolicitud)}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Estado
                </Typography>
                <Chip
                  label={getEstadoColor(selectedSolicitud.estado).label}
                  sx={{
                    backgroundColor: getEstadoColor(selectedSolicitud.estado).bg,
                    color: getEstadoColor(selectedSolicitud.estado).color,
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Origen
                </Typography>
                <Typography sx={{ fontSize: "0.9rem" }}>
                  {selectedSolicitud.solicitud?.origen?.direccion ||
                    selectedSolicitud.origen?.direccion ||
                    "N/A"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Destino
                </Typography>
                <Typography sx={{ fontSize: "0.9rem" }}>
                  {selectedSolicitud.solicitud?.destino?.direccion ||
                    selectedSolicitud.destino?.direccion ||
                    "N/A"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  Fecha Creación
                </Typography>
                <Typography>{formatearFecha(selectedSolicitud.fechaCreacion)}</Typography>
              </Box>

              {selectedSolicitud.estado === "finalizado" && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Fecha Finalización
                  </Typography>
                  <Typography>
                    {formatearFecha(selectedSolicitud.fechaEstadoActual)}
                  </Typography>
                </Box>
              )}

              {selectedSolicitud.oferta?.comprobantePagoUrl && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Comprobante de Pago
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    href={selectedSolicitud.oferta.comprobantePagoUrl}
                    target="_blank"
                    sx={{ mt: 1, color: "#d7171a", borderColor: "#d7171a" }}
                  >
                    Ver Comprobante
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: "#484848" }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistorialSolicitudes;
