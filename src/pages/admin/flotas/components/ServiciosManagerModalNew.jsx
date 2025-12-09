import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  Stack,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

export const ServiciosManagerModalNew = ({
  open,
  onClose,
  flota,
  serviciosPorCiudad = {},
  onSaveServicios,
}) => {
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("");
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState({});

  // Obtener lista de ciudades
  const ciudadesDisponibles = useMemo(() => Object.keys(serviciosPorCiudad || {}), [serviciosPorCiudad]);

  // Inicializar ciudad seleccionada
  useEffect(() => {
    if (open && ciudadesDisponibles.length > 0) {
      setCiudadSeleccionada(ciudadesDisponibles[0]);
    }
  }, [open, ciudadesDisponibles]);

  // Inicializar servicios seleccionados desde la flota
  useEffect(() => {
    if (open && flota?.servicios) {
      setServiciosSeleccionados(
        typeof flota.servicios === 'object' && !Array.isArray(flota.servicios)
          ? { ...flota.servicios }
          : {}
      );
    }
  }, [open, flota]);

  const handleSelectServicio = useCallback((servicio) => {
    setServiciosSeleccionados((prev) => {
      const slug = servicio.id;
      const deptServicios = prev[ciudadSeleccionada] || {};
      
      if (deptServicios[slug]) {
        // Ya existe, eliminarlo
        const nuevosDept = { ...deptServicios };
        delete nuevosDept[slug];
        
        if (Object.keys(nuevosDept).length === 0) {
          const nuevoPrev = { ...prev };
          delete nuevoPrev[ciudadSeleccionada];
          return nuevoPrev;
        }
        return { ...prev, [ciudadSeleccionada]: nuevosDept };
      } else {
        // Agregarlo con el campo original que tiene el servicio
        const nombreValue = servicio.servicio || servicio.nombre_visible || servicio.nombre;
        const servicioObj = { categoria: servicio.categoria };
        
        if (servicio._nombreField === 'servicio' || servicio.hasOwnProperty('servicio')) {
          servicioObj.servicio = nombreValue;
        } else if (servicio._nombreField === 'nombre_visible' || servicio.hasOwnProperty('nombre_visible')) {
          servicioObj.nombre_visible = nombreValue;
        } else {
          servicioObj.nombre = nombreValue;
        }
        
        return { 
          ...prev, 
          [ciudadSeleccionada]: { ...deptServicios, [slug]: servicioObj } 
        };
      }
    });
  }, [ciudadSeleccionada]);

  const handleRemoveServicio = useCallback((ciudad, servicioSlug) => {
    setServiciosSeleccionados((prev) => {
      const deptServicios = prev[ciudad];
      if (!deptServicios) return prev;
      
      const nuevosDept = { ...deptServicios };
      delete nuevosDept[servicioSlug];
      
      if (Object.keys(nuevosDept).length === 0) {
        const nuevoPrev = { ...prev };
        delete nuevoPrev[ciudad];
        return nuevoPrev;
      }
      
      return { ...prev, [ciudad]: nuevosDept };
    });
  }, []);

  const handleSave = () => {
    if (onSaveServicios) {
      onSaveServicios(serviciosSeleccionados);
    }
    onClose();
  };

  // Agrupar servicios por categoría para la ciudad seleccionada
  const serviciosPorCategoria = useMemo(() => {
    if (!ciudadSeleccionada || !serviciosPorCiudad[ciudadSeleccionada]) {
      return {};
    }

    const agrupados = {};
    serviciosPorCiudad[ciudadSeleccionada].forEach(servicio => {
      const categoria = servicio.categoria || "Sin categoría";
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      agrupados[categoria].push(servicio);
    });

    return agrupados;
  }, [serviciosPorCiudad, ciudadSeleccionada]);

  // Contar total de servicios asignados (memoizado)
  const totalServicios = useMemo(() => {
    return Object.values(serviciosSeleccionados).reduce(
      (sum, obj) => sum + (typeof obj === 'object' && !Array.isArray(obj) ? Object.keys(obj).length : 0),
      0
    );
  }, [serviciosSeleccionados]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#d7171a",
          color: "white",
          fontFamily: "Mulish, sans-serif",
          fontWeight: 700,
        }}
      >
        🚗 Gestión de Servicios - {flota?.nombre}
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Pestañas por ciudad */}
        {ciudadesDisponibles.length > 0 && (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={ciudadSeleccionada}
              onChange={(e, newValue) => setCiudadSeleccionada(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 600,
                  textTransform: "none",
                },
              }}
            >
              {ciudadesDisponibles.map((ciudad) => (
                <Tab key={ciudad} label={`📍 ${ciudad}`} value={ciudad} />
              ))}
            </Tabs>
          </Box>
        )}

        <Box sx={{ p: 2 }}>
          {/* Servicios seleccionados por ciudad */}
          {Object.keys(serviciosSeleccionados).length > 0 && (
            <Box sx={{ mb: 3, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 600,
                  mb: 1,
                  color: "#d7171a",
                }}
              >
                Servicios Asignados ({totalServicios})
              </Typography>
              {Object.entries(serviciosSeleccionados).map(([ciudad, servicios]) => (
                <Box key={ciudad} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 500, mb: 1 }}>
                    📌 {ciudad}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pl: 1 }}>
                    {Object.entries(servicios || {}).map(([slug, servicio]) => {
                      const nombreServicio = servicio.servicio || servicio.nombre_visible || servicio.nombre;
                      return (
                      <Chip
                        key={slug}
                        label={`${nombreServicio} - ${servicio.categoria}`}
                        onDelete={() => handleRemoveServicio(ciudad, slug)}
                        sx={{
                          bgcolor: "#d7171a",
                          color: "white",
                          fontFamily: "Mulish, sans-serif",
                          fontWeight: 500,
                          "& .MuiChip-deleteIcon": { color: "white" },
                        }}
                      />
                    );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Servicios disponibles de la ciudad seleccionada */}
          {ciudadSeleccionada && serviciosPorCiudad[ciudadSeleccionada] && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Servicios disponibles en {ciudadSeleccionada}
              </Typography>

              <Stack spacing={2.5}>
                {Object.keys(serviciosPorCategoria).sort().map((categoria) => (
                  <Box key={categoria}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: "Mulish, sans-serif",
                        fontWeight: 700,
                        color: "#d7171a",
                        mb: 1,
                        fontSize: "0.95rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {categoria}
                    </Typography>
                    <Stack spacing={1}>
                      {serviciosPorCategoria[categoria].map((servicio) => {
                        const isSelected = !!serviciosSeleccionados[ciudadSeleccionada]?.[servicio.id];

                        return (
                          <Box
                            key={servicio.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              p: 1.5,
                              borderRadius: 1,
                              border: "1px solid #e0e0e0",
                              "&:hover": {
                                bgcolor: "rgba(215, 23, 26, 0.05)",
                                borderColor: "#d7171a",
                              },
                              bgcolor: isSelected ? "rgba(215, 23, 26, 0.1)" : "transparent",
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Mulish, sans-serif",
                                fontWeight: 500,
                                flex: 1,
                              }}
                            >
                              {servicio.servicio || servicio.nombre_visible || servicio.nombre}
                            </Typography>
                            <Button
                              size="small"
                              variant={isSelected ? "contained" : "outlined"}
                              onClick={() => handleSelectServicio(servicio)}
                              sx={{
                                ...(isSelected && {
                                  bgcolor: "#d7171a",
                                  "&:hover": { bgcolor: "#b01117" },
                                }),
                              }}
                            >
                              {isSelected ? (
                                <>
                                  <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />
                                  Asignado
                                </>
                              ) : (
                                "Asignar"
                              )}
                            </Button>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ fontFamily: "Mulish, sans-serif" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            fontFamily: "Mulish, sans-serif",
            fontWeight: 600,
            bgcolor: "#d7171a",
            "&:hover": { bgcolor: "#b01117" },
          }}
        >
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiciosManagerModalNew;
