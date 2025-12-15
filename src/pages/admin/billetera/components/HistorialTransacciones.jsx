import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const HistorialTransacciones = ({ open, onClose, flota, transacciones = [] }) => {
  if (!flota) return null;

  const tipoColor = (tipo) => {
    switch (tipo) {
      case "deposito":
        return "#4caf50";
      case "retiro":
        return "#d32f2f";
      case "ajuste":
        return "#ff9800";
      default:
        return "#2196f3";
    }
  };

  const tipoLabel = (tipo) => {
    const labels = {
      deposito: "Depósito",
      retiro: "Retiro",
      ajuste: "Ajuste",
    };
    return labels[tipo] || tipo;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
          color: "#fff",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        📊 Historial de Transacciones - {flota.nombre}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {transacciones.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="textSecondary">
              No hay transacciones registradas
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Concepto</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Monto
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Saldo Posterior
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transacciones.map((trans, idx) => (
                  <TableRow
                    key={trans.id || idx}
                    sx={{
                      "&:hover": { bgcolor: "#f9f9f9" },
                    }}
                  >
                    <TableCell sx={{ fontSize: "0.85rem" }}>
                      {trans.fechaRegistro || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tipoLabel(trans.tipo)}
                        size="small"
                        sx={{
                          bgcolor: tipoColor(trans.tipo),
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.9rem" }}>
                      {trans.concepto || "-"}
                      {trans.notas && (
                        <Box sx={{ fontSize: "0.75rem", color: "#999" }}>
                          {trans.notas}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      <span
                        style={{
                          color: trans.monto > 0 ? "#4caf50" : "#d32f2f",
                        }}
                      >
                        {trans.monto > 0 ? "+" : "-"}${Math.abs(trans.monto).toLocaleString(
                          "es-ES",
                          { minimumFractionDigits: 2 }
                        )}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      ${(trans.saldoNuevo || 0).toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ textTransform: "none" }}
          startIcon={<CloseIcon />}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistorialTransacciones;
