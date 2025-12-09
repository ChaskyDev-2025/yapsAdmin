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
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../data/firebase/firebase';

export const HistorialViajesConductorModal = ({ open, onClose, conductorUID }) => {
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pasajerosMap, setPasajerosMap] = useState({});

  // Cargar datos del pasajero
  const cargarNombrePasajero = async (uidUser) => {
    if (pasajerosMap[uidUser]) {
      return pasajerosMap[uidUser];
    }
    
    try {
      // Primero intentar obtener por ID del documento
      const docRef = doc(db, 'pasajeros', uidUser);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const pasajero = docSnap.data();
        const nombre = pasajero.perfil?.name || pasajero.name || pasajero.email || '-';
        const rating = pasajero.rating || '-';
        setPasajerosMap(prev => ({ 
          ...prev, 
          [uidUser]: { nombre, rating }
        }));
        return { nombre, rating };
      }
      
      // Si no está por ID, buscar por campo uid
      const pasajerosCollection = collection(db, 'pasajeros');
      const q = query(pasajerosCollection, where('uid', '==', uidUser));
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        const pasajero = snapshot.docs[0].data();
        const nombre = pasajero.perfil?.name || pasajero.name || pasajero.email || '-';
        const rating = pasajero.rating || '-';
        setPasajerosMap(prev => ({ 
          ...prev, 
          [uidUser]: { nombre, rating }
        }));
        return { nombre, rating };
      }
      
      return { nombre: '-', rating: '-' };
    } catch (error) {
      console.error('Error al cargar pasajero:', error);
      return { nombre: '-', rating: '-' };
    }
  };

  useEffect(() => {
    const cargarViajes = async () => {
      setLoading(true);
      try {
        // Cargar desde ordenes filtrando por uidTaxista
        const ordenesCollection = collection(db, 'ordenes');
        const q = query(ordenesCollection, where('uidTaxista', '==', conductorUID));
        const snapshot = await getDocs(q);
        
        if (snapshot.docs.length > 0) {
          const viajesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).sort((a, b) => {
            const dateA = a.orden?.createdAt?.toDate?.() || new Date(a.orden?.createdAt);
            const dateB = b.orden?.createdAt?.toDate?.() || new Date(b.orden?.createdAt);
            return dateB - dateA;
          });
          
          // Cargar nombres de pasajeros para todos los viajes
          const viajesConPasajeros = await Promise.all(
            viajesData.map(async (viaje) => {
              // uidUser está en el nivel raíz del documento, no dentro de orden
              if (viaje.uidUser) {
                const datosPasajero = await cargarNombrePasajero(viaje.uidUser);
                return {
                  ...viaje,
                  pasajeroInfo: datosPasajero
                };
              }
              return { ...viaje, pasajeroInfo: { nombre: '-', rating: '-' } };
            })
          );
          
          setViajes(viajesConPasajeros);
        } else {
          setViajes([]);
        }
      } catch (error) {
        console.error('Error al cargar historial de viajes del conductor:', error);
        setViajes([]);
      } finally {
        setLoading(false);
      }
    };

    if (open && conductorUID) {
      cargarViajes();
    }
  }, [open, conductorUID]);

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
      
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formateando fecha:', timestamp, e);
      return '-';
    }
  };

  const obtenerCalle = (ubicacion) => {
    if (!ubicacion) return 'Sin información';
    return ubicacion.calle || 'Sin calle';
  };

  const obtenerDireccion = (ubicacion) => {
    if (!ubicacion) return '';
    return ubicacion.direccion || '';
  };

  const obtenerCiudad = (ubicacion) => {
    if (!ubicacion) return '';
    return ubicacion.ciudad || ubicacion.departamento || '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#d7171a', color: 'white', fontWeight: 700 }}>
        🚖 Historial de Viajes del Conductor
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : viajes.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No hay viajes registrados para este conductor
          </Typography>
        ) : (
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
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {obtenerCalle(viaje.orden?.origen)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {obtenerDireccion(viaje.orden?.origen)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {obtenerCiudad(viaje.orden?.origen)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {obtenerCalle(viaje.orden?.destino)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {obtenerDireccion(viaje.orden?.destino)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {obtenerCiudad(viaje.orden?.destino)}
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
