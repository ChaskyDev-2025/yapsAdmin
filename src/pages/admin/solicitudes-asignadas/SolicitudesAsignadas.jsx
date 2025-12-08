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
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { TableToolbar } from "../usuarios/components/TableToolbar";
import { useAuth } from "../../../auth/AuthContext";

const SolicitudesAsignadas = () => {
  const { user } = useAuth();
  
  const disabledTextFieldStyles = {
    "& .MuiInputBase-input.Mui-disabled": {
      color: "#000",
      WebkitTextFillColor: "#000"
    }
  };

  const [solicitudes, setSolicitudes] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [flotaId, setFlotaId] = useState(null);
  const [searchSolicitudes, setSearchSolicitudes] = useState("");
  const [filterEstado, setFilterEstado] = useState("todas");
  const [sortBySolicitudes, setSortBySolicitudes] = useState("fecha-desc");
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [asignadoConductor, setAsignadoConductor] = useState("");
  const [detallesDialogOpen, setDetallesDialogOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Opciones para filtros y ordenamiento
  const sortOptions = [
    { label: "Fecha más reciente", value: "fecha-desc" },
    { label: "Fecha más antigua", value: "fecha-asc" }
  ];

  const filterOptions = [
    {
      name: "estado",
      label: "Estado",
      defaultValue: "todas",
      options: [
        { label: "Todas", value: "todas" },
        { label: "Asignada", value: "asignada" },
        { label: "En Proceso", value: "en_proceso" },
        { label: "Completada", value: "completada" },
        { label: "Rechazada", value: "rechazada" }
      ]
    }
  ];

  // Cargar solicitudes asignadas a esta flota y obtener el flotaId
  useEffect(() => {
    const cargarSolicitudes = async () => {
      try {
        setCargando(true);
        const snapshot = await getDocs(collection(db, "solicitudes"));
        const data = snapshot.docs
          .map(doc => {
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
          })
          .filter(sol => (sol.estado === "asignada" || sol.estado === "en_proceso") && sol.flota_asignada);
        
        setSolicitudes(data);

        // Obtener el flotaId de la primera solicitud asignada (todas tienen la misma flota)
        if (data.length > 0) {
          setFlotaId(data[0].flota_asignada);
        }
        setCargando(false);
      } catch (error) {
        console.error("Error cargando solicitudes:", error);
        setCargando(false);
      }
    };

    cargarSolicitudes();
  }, []);

  // Cargar conductores de la flota
  useEffect(() => {
    const cargarConductores = async () => {
      if (!flotaId) return; // No cargar si no tenemos flotaId

      try {
        const snapshot = await getDocs(collection(db, "trabajadores"));
        const data = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(trabajador => trabajador.flotaId === flotaId); // Filtrar por flotaId
        
        setConductores(data);
      } catch (error) {
        console.error("Error cargando conductores:", error);
      }
    };

    cargarConductores();
  }, [flotaId]);

  // Funciones auxiliares
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      return new Date(fecha).toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "-";
    }
  };

  const obtenerNombreConductor = (conductorId) => {
    if (!conductorId) return "Sin asignar";
    if (conductores.length === 0) return "Cargando...";
    const conductor = conductores.find(c => c.id === conductorId);
    if (!conductor) return "Conductor desconocido";
    
    // Intentar obtener el nombre de diferentes ubicaciones
    const nombre = 
      conductor?.nombre || 
      conductor?.perfil?.nombre || 
      conductor?.perfil?.displayName ||
      conductor?.displayName ||
      conductor?.email ||
      conductorId;
    
    return nombre;
  };

  // Filtrado y ordenamiento
  const solicitudesFiltradas = useMemo(() => {
    let resultado = solicitudes;

    // Búsqueda
    if (searchSolicitudes) {
      const searchLower = searchSolicitudes.toLowerCase();
      resultado = resultado.filter(sol =>
        sol.solicitud?.detalles?.descripcion?.toLowerCase().includes(searchLower) ||
        sol.solicitud?.categoria?.toLowerCase().includes(searchLower) ||
        sol.uidUser?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (filterEstado !== "todas") {
      resultado = resultado.filter(sol => sol.estado === filterEstado);
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      if (sortBySolicitudes === "fecha-desc") {
        return new Date(b.solicitud?.fechaCreacion || 0) - new Date(a.solicitud?.fechaCreacion || 0);
      } else if (sortBySolicitudes === "fecha-asc") {
        return new Date(a.solicitud?.fechaCreacion || 0) - new Date(b.solicitud?.fechaCreacion || 0);
      }
      return 0;
    });

    return resultado;
  }, [solicitudes, searchSolicitudes, filterEstado, sortBySolicitudes]);

  // Manejadores de diálogos
  const handleOpenDialog = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setAsignadoConductor(solicitud.conductor_asignado || "");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSolicitud(null);
    setAsignadoConductor("");
  };

  const handleOpenDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setDetallesDialogOpen(true);
  };

  const handleCloseDetalles = () => {
    setDetallesDialogOpen(false);
    setSolicitudSeleccionada(null);
  };

  // Asignar conductor
  const handleAsignarConductor = async () => {
    if (!selectedSolicitud || !asignadoConductor) {
      alert("Por favor selecciona un conductor");
      return;
    }

    try {
      await updateDoc(doc(db, "solicitudes", selectedSolicitud.id), {
        conductor_asignado: asignadoConductor,
        estado: "en_proceso"
      });

      setSolicitudes(prevSolicitudes =>
        prevSolicitudes.map(sol =>
          sol.id === selectedSolicitud.id
            ? { ...sol, conductor_asignado: asignadoConductor, estado: "en_proceso" }
            : sol
        )
      );

      handleCloseDialog();
      alert("Conductor asignado correctamente");
    } catch (error) {
      console.error("Error asignando conductor:", error);
      alert("Error al asignar conductor");
    }
  };

  // Rechazar solicitud
  const handleRechazarSolicitud = async (solicitud) => {
    if (!window.confirm("¿Seguro que deseas rechazar esta solicitud?")) return;

    try {
      await updateDoc(doc(db, "solicitudes", solicitud.id), {
        estado: "rechazada",
        motivo_rechazo: "Rechazada por la flota"
      });

      setSolicitudes(prevSolicitudes => prevSolicitudes.filter(sol => sol.id !== solicitud.id));
      alert("Solicitud rechazada");
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
      alert("Error al rechazar solicitud");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Solicitudes Asignadas a Flota
        </Typography>

        <TableToolbar
          searchValue={searchSolicitudes}
          onSearchChange={setSearchSolicitudes}
          sortOptions={sortOptions}
          sortValue={sortBySolicitudes}
          onSortChange={setSortBySolicitudes}
          filterOptions={filterOptions}
          filterValue={{ estado: filterEstado }}
          onFilterChange={(filterName, value) => {
            if (filterName === "estado") {
              setFilterEstado(value);
            }
          }}
          showClearButton={searchSolicitudes !== "" || filterEstado !== "todas"}
          onClear={() => {
            setSearchSolicitudes("");
            setFilterEstado("todas");
            setSortBySolicitudes("fecha-desc");
          }}
        />

        <TableContainer sx={{ mt: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Servicio</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Fecha Creación</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Conductor</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 3 }}>
                    <Typography>Cargando solicitudes...</Typography>
                  </TableCell>
                </TableRow>
              ) : solicitudesFiltradas.length > 0 ? (
                solicitudesFiltradas.map((solicitud) => (
                  <TableRow key={solicitud.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                    <TableCell>{solicitud.solicitud?.categoria || "-"}</TableCell>
                    <TableCell>{solicitud.solicitud?.servicio || "-"}</TableCell>
                    <TableCell>{formatearFecha(solicitud.solicitud?.fechaCreacion)}</TableCell>
                    <TableCell>{obtenerNombreConductor(solicitud.conductor_asignado)}</TableCell>
                    <TableCell>
                      <Chip
                        label={solicitud.estado}
                        color={
                          solicitud.estado === "asignada" ? "warning" :
                          solicitud.estado === "en_proceso" ? "info" :
                          solicitud.estado === "completada" ? "success" :
                          "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDetalles(solicitud)}
                        title="Ver detalles"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {solicitud.estado === "asignada" && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(solicitud)}
                            title="Asignar conductor"
                            color="success"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRechazarSolicitud(solicitud)}
                            title="Rechazar"
                            color="error"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : !cargando ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 3 }}>
                    No hay solicitudes asignadas
                  </TableCell>
                </TableRow>
              ) : null
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo para asignar conductor */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Conductor</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Categoría"
                fullWidth
                value={selectedSolicitud?.solicitud?.categoria || ""}
                disabled
                sx={disabledTextFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Conductor</InputLabel>
                <Select
                  value={asignadoConductor}
                  label="Seleccionar Conductor"
                  onChange={(e) => setAsignadoConductor(e.target.value)}
                >
                  {conductores.map((conductor) => {
                    const nombre = 
                      conductor?.nombre || 
                      conductor?.perfil?.name || 
                      conductor?.perfil?.displayName ||
                      conductor?.displayName ||
                      conductor?.email ||
                      conductor.id;
                    return (
                      <MenuItem key={conductor.id} value={conductor.id}>
                        {nombre}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleAsignarConductor} variant="contained" color="success">
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver detalles del formulario */}
      <Dialog open={detallesDialogOpen} onClose={handleCloseDetalles} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#d7171a", color: "white", fontWeight: "bold" }}>
          Detalles de la Solicitud
        </DialogTitle>
        <DialogContent sx={{ pt: 3, backgroundColor: "#fafafa", maxHeight: "80vh", overflow: "auto" }}>
          {solicitudSeleccionada && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Información General */}
              <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                  ℹ️ Información General
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Categoría"
                      value={solicitudSeleccionada.solicitud?.categoria || ""}
                      disabled
                      fullWidth
                      size="small"
                      sx={disabledTextFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Servicio"
                      value={solicitudSeleccionada.solicitud?.servicio || ""}
                      disabled
                      fullWidth
                      size="small"
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
                      sx={disabledTextFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Conductor Asignado"
                      value={obtenerNombreConductor(solicitudSeleccionada.conductor_asignado)}
                      disabled
                      fullWidth
                      size="small"
                      sx={disabledTextFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Fecha de Creación"
                      value={formatearFecha(solicitudSeleccionada.solicitud?.fechaCreacion)}
                      disabled
                      fullWidth
                      size="small"
                      sx={disabledTextFieldStyles}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Ubicación - Origen */}
              {solicitudSeleccionada.solicitud?.detalles?.origen && (
                <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                    📍 Origen
                  </Typography>
                  <TextField
                    label="Dirección"
                    value={solicitudSeleccionada.solicitud.detalles.origen.direccion || ""}
                    disabled
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    sx={{ ...disabledTextFieldStyles, "& .MuiOutlinedInput-root": { overflow: "auto", alignItems: "flex-start", width: "100%" }, "& .MuiInputBase-input": { overflow: "auto !important", width: "100%" } }}
                  />
                </Box>
              )}

              {/* Ubicación - Destino */}
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

              {/* Ubicación - Si existe */}
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

              {/* Detalles Adicionales - Mostrar todos los campos dinámicamente */}
              {solicitudSeleccionada.solicitud?.detalles && (
                <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                    📝 Detalles Adicionales
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Mostrar descripción primero si existe */}
                    {solicitudSeleccionada.solicitud.detalles.descripcion && (
                      <Grid item xs={12} key="descripcion">
                        <TextField
                          label="Descripción"
                          value={solicitudSeleccionada.solicitud.detalles.descripcion || ""}
                          disabled
                          fullWidth
                          size="small"
                          multiline
                          rows={3}
                          InputProps={{ style: { backgroundColor: "#f5f5f5", color: "#000", overflow: "auto" } }}
                          InputLabelProps={{ style: { color: "#000" } }}
                          sx={disabledTextFieldStyles}
                        />
                      </Grid>
                    )}
                    {Object.entries(solicitudSeleccionada.solicitud.detalles).map(([key, value]) => {
                      // Ignorar campos complejos (origen, destino, descripcion)
                      if (typeof value === 'object' || key === 'descripcion' || key === 'origen' || key === 'destino') {
                        return null;
                      }

                      // Si es vacío, no mostrar
                      if (value === "" || value === null || value === undefined) {
                        return null;
                      }

                      // Formatear el label
                      const label = key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/_/g, " ")
                        .trim()
                        .split(" ")
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ");

                      return (
                        <Grid item xs={6} key={key}>
                          <TextField
                            label={label}
                            value={value || ""}
                            disabled
                            fullWidth
                            size="small"
                            sx={disabledTextFieldStyles}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDetalles} variant="contained" color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SolicitudesAsignadas;
