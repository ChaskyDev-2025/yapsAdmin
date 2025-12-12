import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HistoryIcon from "@mui/icons-material/History";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const ReferidosTable = ({ data, loading, tipo, onCopyCode, onOpenHistorial }) => {
  const filteredData = data.filter((item) => item.modo === tipo);

  const getAvatarColor = () => {
    return tipo === "trabajador" ? "#1976d2" : "#9c27b0";
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
      <Table>
        <TableHead sx={{ bgcolor: "#484848" }}>
          <TableRow>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Ranking</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Usuario</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Código</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
              Referidos
            </TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
              Tickets
            </TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                Cargando...
              </TableCell>
            </TableRow>
          ) : filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No hay {tipo === "trabajador" ? "trabajadores" : "pasajeros"} registrados
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((referido, index) => (
              <TableRow key={referido.id} hover>
                <TableCell>
                  <Chip
                    icon={index < 3 && referido.referidos > 0 ? <EmojiEventsIcon /> : undefined}
                    label={`#${index + 1}`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor:
                        index === 0 && referido.referidos > 0
                          ? "#ffd700"
                          : index === 1 && referido.referidos > 0
                          ? "#c0c0c0"
                          : index === 2 && referido.referidos > 0
                          ? "#cd7f32"
                          : "#e0e0e0",
                      color: index < 3 && referido.referidos > 0 ? "white" : "#484848",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      src={referido.photoUrl}
                      sx={{
                        bgcolor: getAvatarColor(),
                        width: 40,
                        height: 40,
                      }}
                    >
                      {referido.nombre.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {referido.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {referido.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={referido.codigo}
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      bgcolor: referido.tieneCodigoReferido ? "#c8e6c9" : "#f5f5f5",
                      color: referido.tieneCodigoReferido ? "#2e7d32" : "#757575",
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color={referido.referidos > 0 ? "#4caf50" : "#bdbdbd"}
                  >
                    {referido.referidos}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color={referido.tickets > 0 ? "#ff9800" : "#bdbdbd"}
                  >
                    {referido.tickets}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {referido.tieneCodigoReferido && (
                    <Tooltip title="Copiar código">
                      <IconButton
                        onClick={() => onCopyCode(referido.codigo)}
                        size="small"
                        sx={{ color: "#484848", mr: 1 }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {referido.referidos > 0 && (
                    <Tooltip title="Ver historial de referidos">
                      <IconButton
                        onClick={() => onOpenHistorial(referido)}
                        size="small"
                        sx={{ color: "#1976d2" }}
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
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

export default ReferidosTable;
