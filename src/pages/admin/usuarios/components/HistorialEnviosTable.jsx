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
  Chip,
} from '@mui/material';

const HistorialEnviosTable = ({ envios, formatearFecha }) => {
  if (envios.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        No hay envios registrados para este conductor
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
            <TableCell sx={{ fontWeight: 700 }}>Remitente</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Destinatario</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">Precio</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {envios.map((envio) => (
            <TableRow key={envio.id} hover>
              <TableCell>
                <Typography variant="body2">
                  {formatearFecha(envio.fechaCreacion)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {envio.orden?.origen?.direccion || '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {envio.orden?.origen?.referencia || ''}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {envio.orden?.destino?.direccion || '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {envio.orden?.destino?.referencia || ''}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {envio.orden?.remitente?.nombre || '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {envio.orden?.remitente?.telefono || ''}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {envio.orden?.destinatario?.nombre || '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {envio.orden?.destinatario?.telefono || ''}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Bs. {envio.precio || '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={envio.estado === 'completado' ? '✓ Completado' : envio.estado}
                  size="small"
                  color={envio.estado === 'completado' ? 'success' : envio.estado === 'cancelado' ? 'error' : 'default'}
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

export default HistorialEnviosTable;
