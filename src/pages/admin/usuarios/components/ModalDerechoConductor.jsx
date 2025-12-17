import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export default function ModalDerechoConductor({ userId }) {
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pasajerosMap, setPasajerosMap] = useState({});

  // Cargar datos del pasajero
  const cargarNombrePasajero = useCallback(async (uidUser) => {
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
  }, [pasajerosMap]);

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
        console.error("Error cargando viajes:", error);
        if (!cancel) {
          setViajes([]);
          setCargando(false);
        }
      }
    };

    loadViajes();
    return () => { cancel = true; };
  }, [userId, cargarNombrePasajero]);

  if (cargando) {
    return (
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "#d7171a" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ px: 3, py: 2, borderBottom: "2px solid #e0e0e0" }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: "#000000" }}>
          📍 Historial de Viajes ({viajes.length})
        </Typography>
      </Box>

      {viajes.length === 0 ? (
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Typography sx={{ color: "#bdbdbd", fontFamily: "Mulish, sans-serif" }}>
            Sin viajes registrados
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ flex: 1, overflow: "auto" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }}>
                  Fecha
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }}>
                  Origen
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }}>
                  Destino
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }}>
                  Pasajero
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }}>
                  Precio
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }}>
                  Estado
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {viajes.map((viaje, idx) => {
                const fechaViajeDate = viaje.orden?.createdAt?.toDate?.() || new Date(viaje.orden?.createdAt);
                const fechaViajeStr = fechaViajeDate.toLocaleString("es-BO");

                // Extraer dirección del origen y destino (pueden ser objetos o strings)
                const getUbicacion = (ubicacion) => {
                  if (typeof ubicacion === "string") return ubicacion;
                  if (ubicacion?.calle && ubicacion?.ciudad) {
                    return `${ubicacion.calle}, ${ubicacion.ciudad}`;
                  }
                  if (ubicacion?.ciudad) return ubicacion.ciudad;
                  if (ubicacion?.calle) return ubicacion.calle;
                  return "-";
                };

                const origenStr = getUbicacion(viaje.orden?.origen);
                const destinoStr = getUbicacion(viaje.orden?.destino);

                const estadoColor = viaje.orden?.estado === "completado" ? "#000000" : viaje.orden?.estado === "cancelado" ? "#d7171a" : "#484848";
                const estadoLabel = viaje.orden?.estado || "pendiente";

                return (
                  <TableRow key={viaje.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#000000" }}>
                      {fechaViajeStr}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#484848" }}>
                      {origenStr}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#484848" }}>
                      {destinoStr}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#000000", fontWeight: 600 }}>
                      {viaje.pasajeroNombre}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#d7171a", fontWeight: 700 }}>
                      Bs. {Number(viaje.orden?.precio || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem" }}>
                      <Chip
                        label={estadoLabel}
                        size="small"
                        sx={{
                          bgcolor: estadoColor,
                          color: "#FFFFFF",
                          fontWeight: 700,
                          textTransform: "capitalize",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
