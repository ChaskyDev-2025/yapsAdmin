import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../data/firebase/firebase';

export const HistorialViajesModal = ({ open, onClose, pasajeroUID }) => {
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarViajes = async () => {
      setLoading(true);
      try {
        // Cargar desde historial_pasajeros/{pasajeroUID}/historial
        const viajesCollection = collection(db, 'historial_pasajeros', pasajeroUID, 'historial');
        const snapshot = await getDocs(viajesCollection);
        
        if (snapshot.docs.length > 0) {
          const viajesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).sort((a, b) => {
            const dateA = a.completedAt?.toDate?.() || new Date(a.completedAt);
            const dateB = b.completedAt?.toDate?.() || new Date(b.completedAt);
            return dateB - dateA;
          });
          
          setViajes(viajesData);
        } else {
          setViajes([]);
        }
      } catch (error) {
        console.error('Error cargando viajes:', error);
        setViajes([]);
      } finally {
        setLoading(false);
      }
    };

    if (open && pasajeroUID) {
      cargarViajes();
    }
  }, [open, pasajeroUID]);

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const fecha = timestamp.toDate?.() || new Date(timestamp);
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#d7171a', color: 'white', fontWeight: 700 }}>
        📍 Historial de Viajes
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : viajes.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No hay viajes registrados para este pasajero
          </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Origen</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Destino</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Conductor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Precio</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viajes.map((viaje) => (
                  <TableRow key={viaje.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatearFecha(viaje.completedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {viaje.origen?.direction || viaje.origen?.calle || 'Sin origen'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {viaje.origen?.ciudad || viaje.origen?.pais || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {viaje.destino?.direction || viaje.destino?.calle || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {viaje.destino?.ciudad || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {viaje.conductorNombre || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ⭐ {viaje.conductorRating || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Bs. {viaje.precio || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={viaje.estado === 'completado' ? '✓ Completado' : viaje.estado}
                        size="small"
                        color={viaje.estado === 'completado' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: '#d7171a', fontWeight: 600 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
