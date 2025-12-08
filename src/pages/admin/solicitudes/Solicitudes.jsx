import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { TableToolbar } from "../usuarios/components/TableToolbar";

const Solicitudes = () => {
  // Estilos para campos deshabilitados
  const disabledTextFieldStyles = {
    "& .MuiInputBase-input.Mui-disabled": {
      color: "#000",
      WebkitTextFillColor: "#000"
    }
  };

  const [solicitudes, setSolicitudes] = useState([]);
  const [searchSolicitudes, setSearchSolicitudes] = useState("");
  const [filterEstado, setFilterEstado] = useState("todas");
  const [sortBySolicitudes, setSortBySolicitudes] = useState("fecha-desc");
  const [flotas, setFlotas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pasajeros, setPasajeros] = useState([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [asignadaFlota, setAsignadaFlota] = useState("");
  const [detallesDialogOpen, setDetallesDialogOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

  // Cargar solicitudes
  useEffect(() => {
    const cargarSolicitudes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "solicitudes"));
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            fechaCreacion: docData.fechaCreacion?.toDate ? docData.fechaCreacion.toDate() : (docData.fechaCreacion instanceof Date ? docData.fechaCreacion : null),
            solicitud: {
              ...docData.solicitud,
              fechaCreacion: docData.solicitud?.fechaCreacion?.toDate ? docData.solicitud.fechaCreacion.toDate() : (docData.solicitud?.fechaCreacion instanceof Date ? docData.solicitud.fechaCreacion : null),
              detalles: {
                ...docData.solicitud?.detalles,
                fechaProgramada: docData.solicitud?.detalles?.fechaProgramada?.toDate ? docData.solicitud.detalles.fechaProgramada.toDate() : null,
                fechaInicio: docData.solicitud?.detalles?.fechaInicio?.toDate ? docData.solicitud.detalles.fechaInicio.toDate() : null,
              }
            }
          };
        });
        setSolicitudes(data);
      } catch (error) {
        console.error("Error cargando solicitudes:", error);
      }
    };

    cargarSolicitudes();
  }, []);

  // Cargar flotas para el dropdown
  useEffect(() => {
    const cargarFlotas = async () => {
      try {
        const snapshot = await getDocs(collection(db, "flotas"));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFlotas(data);
      } catch (error) {
        console.error("Error cargando flotas:", error);
      }
    };

    cargarFlotas();
  }, []);

  // Cargar usuarios
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuarios(data);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      }
    };

    cargarUsuarios();
  }, []);

  // Cargar pasajeros
  useEffect(() => {
    const cargarPasajeros = async () => {
      try {
        const snapshot = await getDocs(collection(db, "pasajeros"));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPasajeros(data);
      } catch (error) {
        console.error("Error cargando pasajeros:", error);
      }
    };

    cargarPasajeros();
  }, []);

  // Normalizar strings para comparación consistente
  const normalizarTexto = (texto) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_") // Reemplazar espacios por guiones bajos
      .replace(/[_-]+/g, "_") // Normalizar guiones múltiples
      .replace(/\s+y\s+/g, "_y_") // Normalizar " y " a "_y_"
      .replace(/á/g, "a")
      .replace(/é/g, "e")
      .replace(/í/g, "i")
      .replace(/ó/g, "o")
      .replace(/ú/g, "u")
      .replace(/ñ/g, "n");
  };

  // Obtener flotas disponibles para una categoría y servicio
  const obtenerFlotasDisponibles = (categoria, servicio) => {
    if (!categoria) return [];
    
    const categoriaNorm = normalizarTexto(categoria);
    
    const flotasDisponibles = flotas.filter(flota => {
      // Buscar en el array de servicios
      const servicios = flota.servicios;
      if (!Array.isArray(servicios)) return false;
      
      // Buscar servicios que contengan la categoría normalizada
      const encontrado = servicios.some(svc => {
        const svcNorm = normalizarTexto(svc);
        // Solo verificar que el servicio comience o contenga la categoría
        return svcNorm.includes(categoriaNorm);
      });
      
      return encontrado;
    });
    
    return flotasDisponibles;
  };
  const obtenerNombreUsuario = (uid) => {
    if (!uid) return "No disponible";
    
    // Primero busca en pasajeros
    const pasajero = pasajeros.find(p => p.id === uid);
    if (pasajero) {
      return pasajero.perfil?.name || pasajero.nombre || pasajero.email || pasajero.id || "Usuario desconocido";
    }
    
    // Si no encuentra en pasajeros, busca en usuarios
    const usuario = usuarios.find(u => u.id === uid);
    if (usuario) {
      return usuario.nombre || usuario.email || usuario.id || "Usuario desconocido";
    }
    
    // Si no encuentra en ninguno, intenta buscar por email
    const usuarioEmail = usuarios.find(u => u.email === uid);
    if (usuarioEmail) {
      return usuarioEmail.nombre || usuarioEmail.email || "Usuario desconocido";
    }
    
    return uid || "No disponible";
  };

  // Filtrar y ordenar solicitudes
  const solicitudesFiltradas = useMemo(() => {
    let filtered = solicitudes;

    // Filtro por búsqueda
    if (searchSolicitudes) {
      const search = searchSolicitudes.toLowerCase();
      filtered = filtered.filter(s => {
        const cliente = s.solicitud?.cliente || s.nombre_cliente || "";
        const servicio = s.solicitud?.servicio || "";
        const categoria = s.solicitud?.categoria || "";
        return cliente.toLowerCase().includes(search) ||
               servicio.toLowerCase().includes(search) ||
               categoria.toLowerCase().includes(search);
      });
    }

    // Filtro por estado
    if (filterEstado !== "todas") {
      filtered = filtered.filter(s => s.estado === filterEstado);
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortBySolicitudes) {
      case "fecha-asc":
        sorted.sort((a, b) => {
          const fechaA = a.solicitud?.fechaCreacion || a.fechaCreacion;
          const fechaB = b.solicitud?.fechaCreacion || b.fechaCreacion;
          return new Date(fechaA) - new Date(fechaB);
        });
        break;
      case "fecha-desc":
        sorted.sort((a, b) => {
          const fechaA = a.solicitud?.fechaCreacion || a.fechaCreacion;
          const fechaB = b.solicitud?.fechaCreacion || b.fechaCreacion;
          return new Date(fechaB) - new Date(fechaA);
        });
        break;
      case "cliente-asc":
        sorted.sort((a, b) => {
          const clienteA = a.solicitud?.cliente || a.nombre_cliente || "";
          const clienteB = b.solicitud?.cliente || b.nombre_cliente || "";
          return clienteA.localeCompare(clienteB);
        });
        break;
      case "cliente-desc":
        sorted.sort((a, b) => {
          const clienteA = a.solicitud?.cliente || a.nombre_cliente || "";
          const clienteB = b.solicitud?.cliente || b.nombre_cliente || "";
          return clienteB.localeCompare(clienteA);
        });
        break;
      default:
        break;
    }

    return sorted;
  }, [solicitudes, searchSolicitudes, filterEstado, sortBySolicitudes]);

  // Abrir diálogo para asignar flota
  const handleOpenDialog = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setAsignadaFlota(solicitud.flota_asignada || "");
    setDialogOpen(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSolicitud(null);
    setAsignadaFlota("");
  };

  // Abrir diálogo de detalles
  const handleVerDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setDetallesDialogOpen(true);
  };

  // Cerrar diálogo de detalles
  const handleCloseDetallesDialog = () => {
    setDetallesDialogOpen(false);
    setSolicitudSeleccionada(null);
  };

  // Asignar flota a solicitud
  const handleAsignarFlota = async () => {
    if (!selectedSolicitud || !asignadaFlota) return;

    try {
      await updateDoc(doc(db, "solicitudes", selectedSolicitud.id), {
        flota_asignada: asignadaFlota,
        estado: "asignada",
        fecha_asignacion: new Date()
      });

      setSolicitudes(solicitudes.map(s =>
        s.id === selectedSolicitud.id
          ? { ...s, flota_asignada: asignadaFlota, estado: "asignada" }
          : s
      ));

      handleCloseDialog();
    } catch (error) {
      console.error("Error asignando flota:", error);
    }
  };

  // Rechazar solicitud
  const handleRechazarSolicitud = async (id) => {
    if (!window.confirm("¿Rechazar esta solicitud?")) return;

    try {
      await updateDoc(doc(db, "solicitudes", id), {
        estado: "rechazada",
        fecha_rechazo: new Date()
      });

      setSolicitudes(solicitudes.map(s =>
        s.id === id ? { ...s, estado: "rechazada" } : s
      ));
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      let d;
      // Si ya es una instancia de Date
      if (fecha instanceof Date) {
        d = fecha;
      } else if (typeof fecha === 'object' && fecha.toDate) {
        // Si es un Timestamp de Firebase
        d = fecha.toDate();
      } else {
        // Intentar crear una fecha
        d = new Date(fecha);
      }
      
      if (isNaN(d.getTime())) return "-";
      
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }) + " " + d.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "-";
    }
  };

  // Color del chip según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "solicitado":
      case "pendiente":
        return "warning";
      case "asignada":
        return "success";
      case "rechazada":
        return "error";
      case "completada":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>
          Panel de Solicitudes
        </Typography>

        {/* Toolbar */}
        <TableToolbar
          searchValue={searchSolicitudes}
          onSearchChange={setSearchSolicitudes}
          sortOptions={[
            { label: "↑ Fecha (Más antigua)", value: "fecha-asc" },
            { label: "↓ Fecha (Más reciente)", value: "fecha-desc" },
            { label: "↑ Cliente (A-Z)", value: "cliente-asc" },
            { label: "↓ Cliente (Z-A)", value: "cliente-desc" },
          ]}
          sortValue={sortBySolicitudes}
          onSortChange={setSortBySolicitudes}
          filterOptions={[
            {
              name: "estado",
              label: "Estado",
              defaultValue: "todas",
              options: [
                { label: "Todas", value: "todas" },
                { label: "Solicitado", value: "solicitado" },
                { label: "Asignada", value: "asignada" },
                { label: "Rechazada", value: "rechazada" },
                { label: "Completada", value: "completada" }
              ]
            }
          ]}
          filterValue={{ estado: filterEstado }}
          onFilterChange={(filterName, value) => {
            if (filterName === "estado") {
              setFilterEstado(value);
            }
          }}
          visibleColumns={{}}
          onVisibleColumnsChange={() => {}}
          showClearButton={true}
        />

        {/* Tabla de solicitudes */}
        <TableContainer sx={{ mt: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Servicio</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {solicitudesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">No hay solicitudes</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                solicitudesFiltradas.map((solicitud) => (
                  <TableRow key={solicitud.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                    <TableCell>{formatearFecha(solicitud.solicitud?.fechaCreacion)}</TableCell>
                    <TableCell>{solicitud.solicitud?.categoria || "-"}</TableCell>
                    <TableCell>{solicitud.solicitud?.servicio || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={solicitud.estado}
                        color={getEstadoColor(solicitud.estado)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleVerDetalles(solicitud)}
                        sx={{ color: "#00bcd4" }}
                        title="Ver detalles"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {solicitud.estado === "solicitado" && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(solicitud)}
                            sx={{ color: "#4caf50" }}
                            title="Asignar flota"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRechazarSolicitud(solicitud.id)}
                            sx={{ color: "#d7171a" }}
                            title="Rechazar"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog para asignar flota */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Flota a Solicitud</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedSolicitud && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Categoría"
                value={selectedSolicitud.solicitud?.categoria || ""}
                disabled
                fullWidth
                size="small"
              />
              <TextField
                label="Servicio Solicitado"
                value={selectedSolicitud.solicitud?.servicio || ""}
                disabled
                fullWidth
                size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Seleccionar Flota</InputLabel>
                <Select
                  value={asignadaFlota}
                  label="Seleccionar Flota"
                  onChange={(e) => setAsignadaFlota(e.target.value)}
                >
                  {obtenerFlotasDisponibles(selectedSolicitud.solicitud?.categoria).map(flota => (
                    <MenuItem key={flota.id} value={flota.id}>
                      {flota.nombre || flota.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleAsignarFlota}
            variant="contained"
            sx={{ backgroundColor: "#d7171a" }}
          >
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver detalles del formulario */}
      <Dialog open={detallesDialogOpen} onClose={handleCloseDetallesDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#d7171a", color: "white", fontWeight: "bold" }}>
          Detalles de la Solicitud
        </DialogTitle>
        <DialogContent sx={{ pt: 3, backgroundColor: "#fafafa", maxHeight: "80vh", overflow: "auto" }}>
          {solicitudSeleccionada && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Información General */}
              <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                  📋 Información General
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Categoría"
                      value={solicitudSeleccionada.solicitud?.categoria || ""}
                      disabled
                      fullWidth
                      size="small"
                      InputProps={{ 
                        style: { backgroundColor: "#f5f5f5", color: "#000" },
                        disabledUnderline: true
                      }}
                      InputLabelProps={{ style: { color: "#000" } }}
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          color: "#000",
                          WebkitTextFillColor: "#000"
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Servicio"
                      value={solicitudSeleccionada.solicitud?.servicio || ""}
                      disabled
                      fullWidth
                      size="small"
                      InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                      InputLabelProps={{ style: { color: "#000" } }}
                      sx={disabledTextFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Estado"
                      value={solicitudSeleccionada.estado || ""}
                      disabled
                      fullWidth
                      size="small"
                      InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                      InputLabelProps={{ style: { color: "#000" } }}
                      sx={disabledTextFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Fecha de Creación"
                      value={formatearFecha(solicitudSeleccionada.solicitud?.fechaCreacion )}
                      disabled
                      fullWidth
                      size="small"
                      InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                      InputLabelProps={{ style: { color: "#000" } }}
                      sx={disabledTextFieldStyles}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Ubicación - Origen y Destino */}
              {solicitudSeleccionada.solicitud?.origen && (
                <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                    📍 Origen
                  </Typography>
                  <TextField
                    label="Dirección"
                    value={solicitudSeleccionada.solicitud.origen.direccion || ""}
                    disabled
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000", overflow: "auto", whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "150px" } }}
                    InputLabelProps={{ style: { color: "#000" } }}
                    sx={{ ...disabledTextFieldStyles, "& .MuiOutlinedInput-root": { overflow: "auto", alignItems: "flex-start", width: "100%" }, "& .MuiInputBase-input": { overflow: "auto !important", width: "100%" } }}
                  />
                </Box>
              )}

              {solicitudSeleccionada.solicitud?.destino && (
                <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                    📍 Destino
                  </Typography>
                  <TextField
                    label="Dirección"
                    value={solicitudSeleccionada.solicitud.destino.direccion || ""}
                    disabled
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000", overflow: "auto", whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "150px" } }}
                    InputLabelProps={{ style: { color: "#000" } }}
                    sx={{ ...disabledTextFieldStyles, "& .MuiOutlinedInput-root": { overflow: "auto", alignItems: "flex-start", width: "100%" }, "& .MuiInputBase-input": { overflow: "auto !important", width: "100%" } }}
                  />
                </Box>
              )}

              {solicitudSeleccionada.solicitud?.ubicacion && (
                <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                    📍 Ubicación
                  </Typography>
                  <TextField
                    label="Dirección"
                    value={solicitudSeleccionada.solicitud.ubicacion.direccion || ""}
                    disabled
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000", overflow: "auto", whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "150px" } }}
                    InputLabelProps={{ style: { color: "#000" } }}
                    sx={{ ...disabledTextFieldStyles, "& .MuiOutlinedInput-root": { overflow: "auto", alignItems: "flex-start", width: "100%" }, "& .MuiInputBase-input": { overflow: "auto !important", width: "100%" } }}
                  />
                </Box>
              )}

              {/* Detalles específicos por categoría */}
              {solicitudSeleccionada.solicitud?.detalles && (
                <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                    📝 Detalles Adicionales
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Mudanza */}
                    {solicitudSeleccionada.solicitud.categoria === "mudanza" && (
                      <>
                        <Grid item xs={6}>
                          <TextField
                            label="Ayudantes"
                            value={solicitudSeleccionada.solicitud.detalles.ayudantes || ""}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Piso Origen"
                            value={solicitudSeleccionada.solicitud.detalles.pisoOrigen || ""}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Piso Destino"
                            value={solicitudSeleccionada.solicitud.detalles.pisoDestino || ""}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="¿Ascensor en origen?"
                            value={solicitudSeleccionada.solicitud.detalles.tieneAscensorOrigen ? "Sí" : "No"}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="¿Ascensor en destino?"
                            value={solicitudSeleccionada.solicitud.detalles.tieneAscensorDestino ? "Sí" : "No"}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Hora Programada"
                            value={solicitudSeleccionada.solicitud.detalles.horaProgramada || ""}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Fecha Programada"
                            value={formatearFecha(solicitudSeleccionada.solicitud.detalles.fechaProgramada)}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Descripción"
                            value={solicitudSeleccionada.solicitud.detalles.descripcion || ""}
                            disabled
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                      </>
                    )}

                    {/* Construcción/Volqueta */}
                    {solicitudSeleccionada.solicitud.categoria === "construccion" && (
                      <>
                        <Grid item xs={6}>
                          <TextField
                            label="Duración (horas)"
                            value={solicitudSeleccionada.solicitud.detalles.duracionHoras || ""}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Hora de Inicio"
                            value={solicitudSeleccionada.solicitud.detalles.horaInicio || ""}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Fecha de Inicio"
                            value={formatearFecha(solicitudSeleccionada.solicitud.detalles.fechaInicio)}
                            disabled
                            fullWidth
                            size="small"
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Descripción"
                            value={solicitudSeleccionada.solicitud.detalles.descripcion || ""}
                            disabled
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                            InputLabelProps={{ style: { color: "#000" } }}
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Nombre del Usuario */}
              <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <TextField
                  label="Usuario"
                  value={obtenerNombreUsuario(solicitudSeleccionada.uidUser || solicitudSeleccionada.solicitud?.uidUser)}
                  disabled
                  fullWidth
                  size="small"
                  InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000" } }}
                  InputLabelProps={{ style: { color: "#000" } }}
                  sx={disabledTextFieldStyles}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "#fafafa", borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={handleCloseDetallesDialog} variant="contained" sx={{ backgroundColor: "#d7171a" }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Solicitudes;
