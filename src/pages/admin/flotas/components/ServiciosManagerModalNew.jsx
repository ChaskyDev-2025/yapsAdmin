import React, { useState, useEffect, useMemo } from "react";
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

  const handleSelectServicio = (servicio) => {
    setServiciosSeleccionados((prev) => {
      const serviciosPorDept = { ...prev };
      
      if (!serviciosPorDept[ciudadSeleccionada]) {
        serviciosPorDept[ciudadSeleccionada] = {};
      }

      const slug = servicio.id;
      
      if (serviciosPorDept[ciudadSeleccionada][slug]) {
        // Ya existe, eliminarlo
        delete serviciosPorDept[ciudadSeleccionada][slug];
      } else {
        // Agregarlo con solo servicio y categoria
        serviciosPorDept[ciudadSeleccionada][slug] = {
          servicio: servicio.servicio || servicio.nombre,
          categoria: servicio.categoria
        };
      }

      // Remover departamento si no tiene servicios
      if (Object.keys(serviciosPorDept[ciudadSeleccionada]).length === 0) {
        delete serviciosPorDept[ciudadSeleccionada];
      }

      return serviciosPorDept;
    });
  };

  const handleRemoveServicio = (ciudad, servicioSlug) => {
    setServiciosSeleccionados((prev) => {
      const serviciosPorDept = { ...prev };
      
      if (serviciosPorDept[ciudad]) {
        delete serviciosPorDept[ciudad][servicioSlug];
        
        if (Object.keys(serviciosPorDept[ciudad]).length === 0) {
          delete serviciosPorDept[ciudad];
        }
      }

      return serviciosPorDept;
    });
  };

  const handleSave = () => {
    if (onSaveServicios) {
      onSaveServicios(serviciosSeleccionados);
    }
    onClose();
  };

  // Contar total de servicios asignados
  const totalServicios = Object.values(serviciosSeleccionados).reduce(
    (sum, obj) => sum + (typeof obj === 'object' && !Array.isArray(obj) ? Object.keys(obj).length : 0),
    0
  );

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
                    {Object.entries(servicios || {}).map(([slug, servicio]) => (
                      <Chip
                        key={slug}
                        label={`${servicio.servicio} - ${servicio.categoria}`}
                        onDelete={() => handleRemoveServicio(ciudad, slug)}
                        sx={{
                          bgcolor: "#d7171a",
                          color: "white",
                          fontFamily: "Mulish, sans-serif",
                          fontWeight: 500,
                          "& .MuiChip-deleteIcon": { color: "white" },
                        }}
                      />
                    ))}
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

              <Stack spacing={1.5}>
                {serviciosPorCiudad[ciudadSeleccionada].map((servicio) => {
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
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: "Mulish, sans-serif",
                              fontWeight: 500,
                            }}
                          >
                            {servicio.servicio || servicio.nombre}
                          </Typography>
                          {servicio.categoria && (
                            <Typography
                              sx={{
                                fontFamily: "Mulish, sans-serif",
                                fontSize: "0.85rem",
                                color: "#999",
                              }}
                            >
                              {servicio.categoria}
                            </Typography>
                          )}
                        </Box>
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
