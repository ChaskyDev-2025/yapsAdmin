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
}) => {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Categoría</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Servicio</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Acciones</TableCell>
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
              <TableRow key={solicitud.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                <TableCell>{formatearFecha(solicitud.solicitud?.fechaCreacion)}</TableCell>
                <TableCell>{solicitud.solicitud?.categoria || "-"}</TableCell>
                <TableCell>{solicitud.solicitud?.servicio || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={solicitud.estado}
                    color={getEstadoColor(solicitud.estado)}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => onVerDetalles(solicitud)}
                    sx={{ color: "#00bcd4" }}
                    title="Ver detalles"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  {solicitud.solicitud?.oferta && (
                    <IconButton
                      size="small"
                      onClick={() => onVerOferta(solicitud)}
                      sx={{ color: "#ff9800" }}
                      title="Ver oferta"
                    >
                      <AttachMoneyIcon />
                    </IconButton>
                  )}
                  {solicitud.estado === "solicitado" && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => onAsignarFlota(solicitud)}
                        sx={{ color: "#4caf50" }}
                        title="Asignar flota"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onRechazar(solicitud.id)}
                        sx={{ color: "#d7171a" }}
                        title="Rechazar"
                      >
                        <CancelIcon />
                      </IconButton>
                    </>
                  )}
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
