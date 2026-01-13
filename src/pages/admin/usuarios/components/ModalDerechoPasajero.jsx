import { useState } from "react";
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
import { useHistorialPasajero } from "../hooks/useHistorialPasajero";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function ModalDerechoPasajero({ userId }) {
  const { viajes, envios, cargando, formatearFecha, totalOrdenes } = useHistorialPasajero(userId);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (cargando) {
    return (
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "#d7171a" }} />
      </Box>
    );
  }

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

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {totalOrdenes === 0 ? (
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Typography sx={{ color: "#bdbdbd", fontFamily: "Mulish, sans-serif" }}>
            Sin órdenes registradas
          </Typography>
        </Box>
      ) : (
        <>
          {/* Tabs sin encabezado */}
          <Box sx={{ borderBottom: "2px solid #e0e0e0", px: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="historial tabs"
              sx={{
                "& .MuiTabs-indicator": { backgroundColor: "#d7171a", height: 3 },
              }}
            >
              <Tab
                label={`🚗 Viajes (${viajes.length})`}
                id="tab-0"
                aria-controls="tabpanel-0"
                sx={{
                  fontWeight: 600,
                  color: tabValue === 0 ? "#d7171a" : "#888",
                  textTransform: "none",
                  fontSize: "0.95rem",
                }}
              />
              <Tab
                label={`📦 Envíos (${envios.length})`}
                id="tab-1"
                aria-controls="tabpanel-1"
                sx={{
                  fontWeight: 600,
                  color: tabValue === 1 ? "#d7171a" : "#888",
                  textTransform: "none",
                  fontSize: "0.95rem",
                }}
              />
            </Tabs>
          </Box>

          {/* Panel de Viajes */}
          <TabPanel value={tabValue} index={0} sx={{ flex: 1 }}>
            {viajes.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                <Typography sx={{ color: "#bdbdbd" }}>Sin viajes registrados</Typography>
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
                        Servicio
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }}>
                        Conductor
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }} align="right">
                        Precio
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }} align="center">
                        Estado
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viajes.map((viaje) => {
                      const estadoColor = viaje.estado === "completado" ? "#4caf50" : viaje.estado === "cancelado" ? "#d7171a" : "#ff9800";

                      return (
                        <TableRow key={viaje.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#000000" }}>
                            {formatearFecha(viaje.fechaCreacion)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#484848" }}>
                            {getUbicacion(viaje.origen)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#484848" }}>
                            {getUbicacion(viaje.destino)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#000000", fontWeight: 600 }}>
                            {viaje.servicio}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#000000", fontWeight: 600 }}>
                            {viaje.conductorNombre}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#d7171a", fontWeight: 700 }} align="right">
                            Bs. {Number(viaje.precio || 0).toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem" }} align="center">
                            <Chip
                              label={viaje.estado || "pendiente"}
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
          </TabPanel>

          {/* Panel de Envíos */}
          <TabPanel value={tabValue} index={1} sx={{ flex: 1 }}>
            {envios.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                <Typography sx={{ color: "#bdbdbd" }}>Sin envíos registrados</Typography>
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
                        Remitente
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }}>
                        Destinatario
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }} align="right">
                        Precio
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#000000", backgroundColor: "#f5f5f5", fontSize: "0.85rem" }} align="center">
                        Estado
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {envios.map((envio) => {
                      const estadoColor = envio.estado === "entregado" ? "#4caf50" : envio.estado === "cancelado" ? "#d7171a" : "#ff9800";

                      return (
                        <TableRow key={envio.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#000000" }}>
                            {formatearFecha(envio.fechaCreacion)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#484848" }}>
                            {getUbicacion(envio.origen)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#484848" }}>
                            {getUbicacion(envio.destino)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#000000" }}>
                            <Typography variant="body2">{envio.remitente?.nombre || "-"}</Typography>
                            <Typography variant="caption" sx={{ color: "#888" }}>
                              {envio.remitente?.telefono || ""}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#000000" }}>
                            <Typography variant="body2">{envio.destinatario?.nombre || "-"}</Typography>
                            <Typography variant="caption" sx={{ color: "#888" }}>
                              {envio.destinatario?.telefono || ""}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "#d7171a", fontWeight: 700 }} align="right">
                            Bs. {Number(envio.precio || 0).toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem" }} align="center">
                            <Chip
                              label={envio.estado || "pendiente"}
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
          </TabPanel>
        </>
      )}
    </Box>
  );
}


