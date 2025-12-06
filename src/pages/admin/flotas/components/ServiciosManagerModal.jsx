// src/pages/admin/flotas/components/ServiciosManagerModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const ServiciosManagerModal = ({
  open,
  onClose,
  flota,
  servicios = [],
  serviciosPorCiudad = {},
  onAssignServicios,
}) => {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedServicios, setSelectedServicios] = useState([]);
  const [message, setMessage] = useState(null);
  const [loadedServicios, setLoadedServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");

  // Obtener lista de departamentos disponibles
  const departamentosDisponibles = Object.keys(serviciosPorCiudad || {});

  // Cargar servicios de Firebase si no se pasan por prop
  useEffect(() => {
    if (assignDialogOpen && servicios.length === 0 && Object.keys(serviciosPorCiudad).length === 0) {
      loadServiciosFromFirebase();
    } else if (assignDialogOpen && Object.keys(serviciosPorCiudad).length > 0) {
      // Usar serviciosPorCiudad si está disponible
      const allServicios = [];
      Object.values(serviciosPorCiudad).forEach((ciudadServicios) => {
        Object.values(ciudadServicios || {}).forEach((servicio) => {
          if (servicio && servicio.id) {
            allServicios.push(servicio);
          }
        });
      });
      setLoadedServicios(allServicios);
    }
  }, [assignDialogOpen, servicios.length, serviciosPorCiudad]);

  const loadServiciosFromFirebase = async () => {
    setLoadingServicios(true);
    try {
      const DEPARTAMENTOS = [
        "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
        "Oruro", "Potosí", "Tarija", "Pando", "Beni"
      ];

      const allServicios = [];

      // Cargar servicios de cada departamento
      for (const departamento of DEPARTAMENTOS) {
        try {
          const querySnapshot = await getDocs(
            collection(db, "Tarifas", departamento, "Cochabamba")
          );
          
          querySnapshot.docs.forEach((doc) => {
            allServicios.push({
              id: doc.id,
              departamento,
              ...doc.data(),
            });
          });
        } catch (error) {
          // Error al cargar servicios
        }
      }

      setLoadedServicios(allServicios);
    } catch (error) {
      setLoadedServicios([]);
    } finally {
      setLoadingServicios(false);
    }
  };

  // Usar servicios de prop si existen, sino usar los cargados
  const serviciosToUse = servicios.length > 0 ? servicios : loadedServicios;

  // Filtrar servicios por departamento seleccionado
  const serviciosFiltrados = departamentoSeleccionado && serviciosPorCiudad[departamentoSeleccionado]
    ? Object.values(serviciosPorCiudad[departamentoSeleccionado] || {}).filter(s => s && s.id)
    : serviciosToUse;

  // Agrupar servicios filtrados por categoría
  const serviciosPorCategoria = serviciosFiltrados.reduce((acc, servicio) => {
    const categoria = servicio.categoria || "Sin categoría";
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(servicio);
    return acc;
  }, {});

  // Verificar si todos los servicios están asignados
  useEffect(() => {
    if (open && serviciosToUse.length > 0) {
      const assignedCount = flota?.servicios?.length || 0;
      const totalCount = serviciosToUse.length;

      if (totalCount > 0) {
        if (assignedCount === totalCount) {
          setMessage({
            type: "success",
            text: `✓ Todos los ${assignedCount} servicios disponibles están asignados`,
          });
        } else if (assignedCount > 0) {
          setMessage({
            type: "info",
            text: `${assignedCount} de ${totalCount} servicios asignados`,
          });
        } else {
          setMessage(null);
        }
      }
    }
  }, [open, flota?.servicios, serviciosToUse]);

  useEffect(() => {
    // Precargar selección si la flota ya tiene servicios asignados
    const assigned = flota?.servicios || [];
    setSelectedServicios(assigned);
  }, [flota, open]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            bgcolor: "#d7171a",
            color: "white",
            fontFamily: "Mulish, sans-serif",
            fontWeight: 700,
          }}
        >
          📋 Gestión de Servicios - {flota?.nombre}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {message && (
            <Alert
              severity={message.type === "success" ? "success" : "info"}
              sx={{ mb: 2, fontFamily: "Mulish, sans-serif" }}
            >
              {message.text}
            </Alert>
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
            >
              Servicios Asignados
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LocalOfferIcon />}
              onClick={() => setAssignDialogOpen(true)}
              sx={{
                borderColor: "#1976d2",
                color: "#1976d2",
                fontFamily: "Mulish, sans-serif",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#115293",
                  bgcolor: "rgba(25,118,210,0.04)",
                },
              }}
            >
              {(flota?.servicios?.length || 0) > 0
                ? "Agregar más servicios"
                : "Asignar Servicios"}
            </Button>
          </Box>

          {flota?.servicios &&
          Array.isArray(flota.servicios) &&
          flota.servicios.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                pl: 1,
              }}
            >
              {flota.servicios.map((servicioId, i) => (
                <Chip
                  key={servicioId || i}
                  label={servicioId}
                  color="primary"
                  variant="outlined"
                  onDelete={() => {
                    const updated = flota.servicios.filter(
                      (s) => s !== servicioId
                    );
                    if (onAssignServicios) onAssignServicios(updated);
                  }}
                  sx={{
                    fontFamily: "Mulish, sans-serif",
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
          ) : (
            <Alert severity="info" sx={{ fontFamily: "Mulish, sans-serif" }}>
              No hay servicios asignados. Haz clic en "Asignar Servicios" para
              comenzar.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={onClose}
            sx={{
              fontFamily: "Mulish, sans-serif",
              fontWeight: 600,
              color: "#484848",
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo para asignar servicios */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: "Mulish, sans-serif",
            fontWeight: 700,
          }}
        >
          Asignar Servicios a {flota?.nombre}
        </DialogTitle>
        <DialogContent>
          {departamentosDisponibles.length > 0 && (
            <Box sx={{ mb: 2, mt: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                Filtrar por Departamento:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Chip
                  label="Todos"
                  onClick={() => setDepartamentoSeleccionado("")}
                  color={departamentoSeleccionado === "" ? "primary" : "default"}
                  variant={departamentoSeleccionado === "" ? "filled" : "outlined"}
                  sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
                />
                {departamentosDisponibles.map((depto) => (
                  <Chip
                    key={depto}
                    label={depto}
                    onClick={() => setDepartamentoSeleccionado(depto)}
                    color={departamentoSeleccionado === depto ? "primary" : "default"}
                    variant={departamentoSeleccionado === depto ? "filled" : "outlined"}
                    sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Box>
          )}
          <Box sx={{ mt: 2 }}>
            {loadingServicios ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "300px",
                }}
              >
                <CircularProgress />
              </Box>
            ) : serviciosToUse.length === 0 ? (
              <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                No hay servicios disponibles
              </Typography>
            ) : (
              Object.entries(serviciosPorCategoria)
                .sort()
                .map(([categoria, serviciosEnCat]) => {
                  return (
                    <Box key={categoria} sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: "Mulish, sans-serif",
                          fontWeight: 700,
                          color: "#d7171a",
                          mb: 1,
                          borderBottom: "1px solid #ddd",
                          pb: 1,
                        }}
                      >
                        🏷️ {categoria}
                      </Typography>
                      {serviciosEnCat.map((servicio) => {
                        const isSelected = selectedServicios.includes(
                          servicio.id
                        );
                        return (
                          <Box
                            key={servicio.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              py: 0.8,
                              pl: 1,
                              borderRadius: "4px",
                              "&:hover": {
                                bgcolor: "rgba(215, 23, 26, 0.05)",
                              },
                            }}
                          >
                            <Box>
                              <Typography
                                sx={{
                                  fontFamily: "Mulish, sans-serif",
                                  fontSize: "0.95rem",
                                  fontWeight: 500,
                                }}
                              >
                                {servicio.nombre}
                              </Typography>
                              {servicio.nombre_visible && (
                                <Typography
                                  sx={{
                                    fontFamily: "Mulish, sans-serif",
                                    fontSize: "0.8rem",
                                    color: "#999",
                                  }}
                                >
                                  {servicio.nombre_visible}
                                </Typography>
                              )}
                            </Box>
                            <Button
                              size="small"
                              variant={isSelected ? "contained" : "outlined"}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedServicios((prev) =>
                                    prev.filter((id) => id !== servicio.id)
                                  );
                                } else {
                                  setSelectedServicios((prev) => [
                                    ...prev,
                                    servicio.id,
                                  ]);
                                }
                              }}
                              sx={{
                                ...(isSelected && {
                                  bgcolor: "#d7171a",
                                  "&:hover": { bgcolor: "#b01117" },
                                }),
                              }}
                            >
                              {isSelected ? (
                                <>
                                  <CheckIcon
                                    fontSize="small"
                                    sx={{ mr: 0.5 }}
                                  />
                                  Seleccionado
                                </>
                              ) : (
                                "Seleccionar"
                              )}
                            </Button>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAssignDialogOpen(false)}
            startIcon={<CloseIcon />}
            sx={{ fontFamily: "Mulish, sans-serif" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (onAssignServicios) onAssignServicios(selectedServicios);
              setAssignDialogOpen(false);
            }}
            variant="contained"
            sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
          >
            Asignar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ServiciosManagerModal;
