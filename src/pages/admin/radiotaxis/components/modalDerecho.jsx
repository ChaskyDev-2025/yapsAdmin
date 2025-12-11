// modalDerecho.jsx
import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from "@mui/material";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export default function ModalDerecho({ userId }) {
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pasajerosMap, setPasajerosMap] = useState({});

  // Cargar datos del pasajero
  const cargarNombrePasajero = async (uidUser) => {
    if (pasajerosMap[uidUser]) {
      return pasajerosMap[uidUser];
    }
    
    try {
      // Primero intentar obtener por ID del documento
      const docRef = doc(db, "pasajeros", uidUser);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const pasajero = docSnap.data();
        const nombre = pasajero.perfil?.name || pasajero.name || pasajero.email || "-";
        setPasajerosMap(prev => ({ 
          ...prev, 
          [uidUser]: nombre
        }));
        return nombre;
      }
      
      // Si no está por ID, buscar por campo uid
      const pasajerosCollection = collection(db, "pasajeros");
      const q = query(pasajerosCollection, where("uid", "==", uidUser));
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        const pasajero = snapshot.docs[0].data();
        const nombre = pasajero.perfil?.name || pasajero.name || pasajero.email || "-";
        setPasajerosMap(prev => ({ 
          ...prev, 
          [uidUser]: nombre
        }));
        return nombre;
      }
      
      return "-";
    } catch (error) {
      return "-";
    }
  };

  useEffect(() => {
    if (!userId) {
      setViajes([]);
      setCargando(false);
      return;
    }

    let cancel = false;

    const loadViajes = async () => {
      try {
        // Cargar desde ordenes filtrando por uidTaxista
        const ordenesCollection = collection(db, "ordenes");
        const q = query(ordenesCollection, where("uidTaxista", "==", userId));
        const snapshot = await getDocs(q);
        
        if (snapshot.docs.length > 0) {
          const viajesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          viajesData.sort((a, b) => {
            const dateA = a.orden?.createdAt?.toDate?.() || new Date(a.orden?.createdAt);
            const dateB = b.orden?.createdAt?.toDate?.() || new Date(b.orden?.createdAt);
            return dateB - dateA;
          });
          
          // Cargar nombres de pasajeros
          const viajesConPasajeros = await Promise.all(
            viajesData.map(async (viaje) => {
              if (viaje.uidUser) {
                const nombrePasajero = await cargarNombrePasajero(viaje.uidUser);
                return {
                  ...viaje,
                  pasajeroNombre: nombrePasajero
                };
              }
              return { ...viaje, pasajeroNombre: "-" };
            })
          );
          
          if (!cancel) {
            setViajes(viajesConPasajeros);
            setCargando(false);
          }
        } else {
          if (!cancel) {
            setViajes([]);
            setCargando(false);
          }
        }
      } catch (error) {
        if (!cancel) {
          setViajes([]);
          setCargando(false);
        }
      }
    };

    loadViajes();

    return () => {
      cancel = true;
    };
  }, [userId]);

  const formatearFecha = (timestamp) => {
    if (!timestamp) return "-";
    try {
      let fecha;
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        fecha = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        fecha = timestamp;
      } else if (typeof timestamp === "string") {
        fecha = new Date(timestamp);
      } else if (typeof timestamp === "number") {
        fecha = new Date(timestamp);
      } else {
        return "-";
      }
      
      return fecha.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "-";
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

  const obtenerEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "completado":
      case "finalizado":
        return "success";
      case "cancelado":
        return "error";
      case "en_curso":
      case "en curso":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: 3,
        overflowY: "auto",
        minWidth: 0, // Importante para el flex
      }}
    >
      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : viajes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 5, textAlign: "center" }}>
          {userId
            ? "No hay viajes registrados para este conductor"
            : "Selecciona un radiotaxi para ver su historial"}
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ 
          width: "100%", 
          maxHeight: "600px", 
          overflow: "auto",
          boxShadow: "0px 2px 4px rgba(0,0,0,0.1)"
        }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Origen</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Destino</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Pasajero</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 80 }} align="right">Precio</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 100 }} align="center">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {viajes.map((viaje) => (
                <TableRow key={viaje.id} hover sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {formatearFecha(viaje.orden?.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
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
                  <TableCell sx={{ minWidth: 150 }}>
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
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2">
                      {viaje.pasajeroNombre}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 80 }} align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Bs. {parseFloat(viaje.orden?.precio || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 100 }} align="center">
                    <Chip
                      label={viaje.orden?.estado || viaje.estado || "Desconocido"}
                      size="small"
                      color={obtenerEstadoColor(viaje.orden?.estado || viaje.estado)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
