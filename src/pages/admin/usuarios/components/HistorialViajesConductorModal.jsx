import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../data/firebase/firebase';
import HistorialViajesTable from './HistorialViajesTable';
import HistorialEnviosTable from './HistorialEnviosTable';

export const HistorialViajesConductorModal = ({ open, onClose, conductorUID }) => {
  const [viajes, setViajes] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pasajerosMap, setPasajerosMap] = useState({});
  const [selectedTab, setSelectedTab] = useState(0);

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
        const nombre = pasajero.perfil?.nombre || pasajero.perfil?.name || pasajero.nombre || pasajero.name || pasajero.email || '-';
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
        const nombre = pasajero.perfil?.nombre || pasajero.perfil?.name || pasajero.nombre || pasajero.name || pasajero.email || '-';
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
    const cargarHistorial = async () => {
      setLoading(true);
      try {
        // Cargar viajes desde ordenes
        const ordenesCollection = collection(db, 'ordenes');
        const qViajes = query(ordenesCollection, where('uidTaxista', '==', conductorUID));
        const snapshotViajes = await getDocs(qViajes);
        
        if (snapshotViajes.docs.length > 0) {
          const viajesData = snapshotViajes.docs.map(doc => ({
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

        // Cargar envios desde ordenes con categoria: "envios"
        try {
          const allOrders = await getDocs(collection(db, 'ordenes'));
          const enviosData = allOrders.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(doc => {
              const esEnvio = doc.orden?.categoria === "envios";
              const esDelConductor = doc.conductorUID === conductorUID || doc.uidUser === conductorUID;
              return esEnvio && esDelConductor;
            })
            .sort((a, b) => {
              const dateA = a.fechaCreacion?.toDate?.() || new Date(a.fechaCreacion);
              const dateB = b.fechaCreacion?.toDate?.() || new Date(b.fechaCreacion);
              return dateB - dateA;
            });
          
          setEnvios(enviosData);
        } catch (error) {
          console.error('Error cargando envios:', error);
          setEnvios([]);
        }
      } catch (error) {
        console.error('Error al cargar historial:', error);
        setViajes([]);
        setEnvios([]);
      } finally {
        setLoading(false);
      }
    };

    if (open && conductorUID) {
      cargarHistorial();
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
      <DialogTitle sx={{ backgroundColor: '#d7171a', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📋 Historial del Conductor</span>
      </DialogTitle>
      
      {/* Pestañas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{
            "& .MuiTab-root": {
              fontWeight: 600,
              color: "#666",
              "&.Mui-selected": {
                color: "#d7171a"
              }
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#d7171a"
            }
          }}
        >
          <Tab label={`🚖 Viajes (${viajes.length})`} />
          <Tab label={`📦 Envios (${envios.length})`} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : selectedTab === 0 ? (
          <HistorialViajesTable
            viajes={viajes}
          />
        ) : (
          <HistorialEnviosTable
            envios={envios}
            formatearFecha={formatearFecha}
          />
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
