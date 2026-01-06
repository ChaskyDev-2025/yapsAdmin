import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const SolicitudesTable = ({
  solicitudesFiltradas,
  onVerDetalles,
  onVerOferta,
  onAsignarFlota,
  onRechazar,
  formatearFecha,
  getEstadoColor,
  getEstadoStyles,
}) => {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#000000" }}>
          <TableRow>
            <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Fecha</TableCell>
            <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Categoría</TableCell>
            <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Servicio</TableCell>
            <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Estado</TableCell>
            <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem", textAlign: "center" }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {solicitudesFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                <Typography color="textSecondary">No hay solicitudes</Typography>
              </TableCell>
            </TableRow>
          ) : (
            solicitudesFiltradas.map((solicitud) => (
              <TableRow key={solicitud.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" }, borderBottom: "1px solid #d0d0d0" }}>
                <TableCell>{formatearFecha(solicitud.solicitud?.fechaCreacion || solicitud.fechaCreacion || solicitud.createdAt)}</TableCell>
                <TableCell>{solicitud.solicitud?.categoria || "-"}</TableCell>
                <TableCell>{solicitud.solicitud?.servicio || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={solicitud.estado}
                    sx={getEstadoStyles(solicitud.estado)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => onVerDetalles(solicitud)}
                      sx={{ bgcolor: "#f0f0f0", color: "#d7171a", "&:hover": { bgcolor: "#e8e8e8" } }}
                      title="Ver detalles"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {solicitud.solicitud?.oferta && (
                      <IconButton
                        size="small"
                        onClick={() => onVerOferta(solicitud)}
                        sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffb3b8" } }}
                        title="Ver oferta"
                      >
                        <AttachMoneyIcon />
                      </IconButton>
                    )}
                    {solicitud.estado === "solicitado" || solicitud.estado === "pendiente" || solicitud.estado === "rechazada" ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => onAsignarFlota(solicitud)}
                          sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffb3b8" } }}
                          title="Asignar flota"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                        {solicitud.estado !== "rechazada" && (
                          <IconButton
                            size="small"
                            onClick={() => onRechazar(solicitud.id)}
                            sx={{ bgcolor: "#ffebee", color: "#d7171a", "&:hover": { bgcolor: "#ffcdd2" } }}
                            title="Rechazar"
                          >
                            <CancelIcon />
                          </IconButton>
                        )}
                      </>
                    ) : null}
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SolicitudesTable;
