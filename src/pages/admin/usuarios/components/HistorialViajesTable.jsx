import React from 'react';
import {
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
} from '@mui/material';

const formatearFecha = (timestamp) => {
  if (!timestamp) return '-';
  try {
    let fecha;
    // Si es un objeto Timestamp de Firebase
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      fecha = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      fecha = timestamp;
    } else if (typeof timestamp === 'string') {
      fecha = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      fecha = new Date(timestamp);
    } else {
      return '-';
    }
    
    if (isNaN(fecha.getTime())) {
      return '-';
    }
    
    return fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '-';
  }
};

const HistorialViajesTable = ({ viajes }) => {
  if (viajes.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        No hay viajes registrados para este conductor
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Origen</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Destino</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Pasajero</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">Precio</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {viajes.map((viaje) => (
            <TableRow key={viaje.id} hover>
              <TableCell>
                <Typography variant="body2">
                  {formatearFecha(viaje.orden?.createdAt)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {viaje.orden?.origen?.direccion || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {viaje.orden?.destino?.direccion || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {viaje.pasajeroInfo?.nombre || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ⭐ {viaje.pasajeroInfo?.rating || '-'}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Bs. {viaje.orden?.precio || '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={viaje.estado === 'completado' ? '✓ Completado' : viaje.estado}
                  size="small"
                  color={viaje.estado === 'completado' ? 'success' : viaje.estado === 'cancelado' ? 'error' : 'default'}
                  variant="outlined"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default HistorialViajesTable;
