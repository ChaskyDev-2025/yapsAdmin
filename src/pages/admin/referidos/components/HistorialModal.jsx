import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const HistorialModal = ({ open, onClose, selectedReferido, historialReferidos }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Historial de Referidos - {selectedReferido?.nombre}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {historialReferidos.length === 0 ? (
          <Typography color="text.secondary">Sin referidos aplicados</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historialReferidos.map((pasajero, idx) => (
                <TableRow key={idx}>
                  <TableCell>{pasajero.nombre}</TableCell>
                  <TableCell>{pasajero.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistorialModal;
