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
  Tabs,
  Tab,
} from "@mui/material";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export default function ModalDerechoConductor({ userId }) {
  const [viajes, setViajes] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pasajerosMap, setPasajerosMap] = useState({});
  const [selectedTab, setSelectedTab] = useState(0);

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
        const nombre = pasajero.perfil?.nombre || pasajero.perfil?.name || pasajero.nombre || pasajero.name || pasajero.email || "-";
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
        const nombre = pasajero.perfil?.nombre || pasajero.perfil?.name || pasajero.nombre || pasajero.name || pasajero.email || "-";
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
      setEnvios([]);
      setCargando(false);
      return;
    }

    let cancel = false;

    const loadDatos = async () => {
      try {
        // Cargar viajes
        const ordenesCollection = collection(db, "ordenes");
        const qViajes = query(ordenesCollection, where("uidTaxista", "==", userId));
        const snapshotViajes = await getDocs(qViajes);

        if (snapshotViajes.docs.length > 0) {
          const viajesData = snapshotViajes.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          viajesData.sort((a, b) => {
            const getTimestamp = (date) => {
              if (!date) return 0;
              try {
                if (typeof date.toDate === 'function') return date.toDate().getTime();
                if (date instanceof Date) return date.getTime();
                if (typeof date === 'string') return new Date(date).getTime();
                if (typeof date === 'number') return date;
              } catch (e) {}
              return 0;
            };
            return getTimestamp(b.orden?.createdAt) - getTimestamp(a.orden?.createdAt);
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
          }
        } else {
          if (!cancel) {
            setViajes([]);
          }
        }

        // Cargar envios
        try {
          const allOrders = await getDocs(collection(db, "ordenes"));
          const enviosData = allOrders.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(doc => {
              const esEnvio = doc.orden?.categoria === "envios";
              const esDelConductor = doc.conductorUID === userId || doc.uidUser === userId;
              return esEnvio && esDelConductor;
            })
            .sort((a, b) => {
              const getTimestamp = (date) => {
                if (!date) return 0;
                try {
                  if (typeof date.toDate === 'function') return date.toDate().getTime();
                  if (date instanceof Date) return date.getTime();
                  if (typeof date === 'string') return new Date(date).getTime();
                  if (typeof date === 'number') return date;
                } catch (e) {}
                return 0;
              };
              return getTimestamp(b.fechaCreacion) - getTimestamp(a.fechaCreacion);
            });
          
          if (!cancel) {
            setEnvios(enviosData);
          }
        } catch (error) {
          console.error("Error cargando envios:", error);
          if (!cancel) {
            setEnvios([]);
          }
        }

        if (!cancel) {
          setCargando(false);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        if (!cancel) {
          setViajes([]);
          setEnvios([]);
          setCargando(false);
        }
      }
    };

    loadDatos();
    return () => { cancel = true; };
  }, [userId, cargarNombrePasajero]);

  if (cargando) {
    return (
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "#d7171a" }} />
      </Box>
    );
  }

  // Determinar qué categorías tienen datos
  const tieneViajes = viajes.length > 0;
  const tieneEnvios = envios.length > 0;
  const tieneAmbas = tieneViajes && tieneEnvios;

  // Ajustar tab seleccionado si la categoría no está disponible
  let tabActual = selectedTab;
  if (!tieneAmbas) {
    tabActual = tieneViajes ? 0 : 1;
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Encabezado con pestañas - mostrar solo las categorías con datos */}
      {(tieneViajes || tieneEnvios) && (
        <Box sx={{ px: 3, py: 1, borderBottom: "2px solid #e0e0e0" }}>
          <Tabs
            value={tabActual}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                color: "#666",
                minHeight: "auto",
                py: 1,
                "&.Mui-selected": {
                  color: "#d7171a"
                }
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#d7171a"
              }
            }}
          >
            {tieneViajes && <Tab label={`🚖 Viajes (${viajes.length})`} />}
            {tieneEnvios && <Tab label={`📦 Envios (${envios.length})`} />}
          </Tabs>
        </Box>
      )}

      {/* Tabla de Viajes - mostrar si hay viajes y (solo viajes o tab 0 seleccionado) */}
      {tieneViajes && (tabActual === 0 || !tieneAmbas) ? (
        tieneViajes ? (
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
                // Formatear fecha de forma segura
                const formatearFecha = (timestamp) => {
                  if (!timestamp) return '-';
                  try {
                    let fecha;
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
                    
                    return fecha.toLocaleString('es-BO');
                  } catch (e) {
                    return '-';
                  }
                };

                const fechaViajeStr = formatearFecha(viaje.orden?.createdAt);

                // Extraer dirección del origen y destino
                const getUbicacion = (ubicacion) => {
                  if (typeof ubicacion === "string") return ubicacion;
                  if (ubicacion?.direccion) return ubicacion.direccion;
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
        ) : (
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Typography sx={{ color: "#bdbdbd", fontFamily: "Mulish, sans-serif" }}>
              Sin viajes registrados
            </Typography>
          </Box>
        )
      ) : null}

      {/* Tabla de Envios - mostrar si hay envios y (solo envios o tab 1 seleccionado) */}
      {tieneEnvios && (tabActual === 1 || !tieneAmbas) ? (
        tieneEnvios ? (
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
                    Remitente
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }}>
                    Destinatario
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
                {envios.map((envio) => {
                  // Formatear fecha de envio de forma segura
                  const formatearFechaEnvio = (timestamp) => {
                    if (!timestamp) return '-';
                    try {
                      let fecha;
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
                      
                      return fecha.toLocaleString('es-BO');
                    } catch (e) {
                      return '-';
                    }
                  };

                  return (
                  <TableRow key={envio.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#000000" }}>
                      {formatearFechaEnvio(envio.fechaCreacion)}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#484848" }}>
                      {envio.orden?.origen?.direccion || "-"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#484848" }}>
                      {envio.orden?.destino?.direccion || "-"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#000000" }}>
                      <Typography variant="body2">
                        {envio.orden?.remitente?.nombre || "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {envio.orden?.remitente?.telefono || ""}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#000000" }}>
                      <Typography variant="body2">
                        {envio.orden?.destinatario?.nombre || "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {envio.orden?.destinatario?.telefono || ""}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#d7171a", fontWeight: 700 }}>
                      Bs. {Number(envio.precio || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem" }}>
                      <Chip
                        label={envio.estado || "pendiente"}
                        size="small"
                        sx={{
                          bgcolor: envio.estado === "completado" ? "#000000" : envio.estado === "cancelado" ? "#d7171a" : "#484848",
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
        ) : (
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Typography sx={{ color: "#bdbdbd", fontFamily: "Mulish, sans-serif" }}>
              Sin envios registrados
            </Typography>
          </Box>
        )
      ) : null}
    </Box>
  );
}
