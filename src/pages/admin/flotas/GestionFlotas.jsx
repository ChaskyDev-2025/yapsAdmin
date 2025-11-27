import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Avatar,
  Input,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Switch,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";

const GestionFlotas = () => {
  const [flotas, setFlotas] = useState([]);
  const [administradores, setAdministradores] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFlota, setCurrentFlota] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    imageUrl: "",
    nit: "",
    representanteLegal: "",
    telefono: "",
    fotoNit: "",
    uidPropietarios: [],
    servicios: [],
    habilitado: true,
  });

  useEffect(() => {
    fetchFlotas();
    fetchAdministradores();
    fetchServicios();
  }, []);

  const fetchFlotas = async () => {
    try {
      const flotasCollection = collection(db, "flotas");
      const flotasSnapshot = await getDocs(flotasCollection);
      const flotasList = flotasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFlotas(flotasList);
    } catch (error) {
      console.error("Error al obtener flotas:", error);
      showAlert("Error al cargar las flotas", "error");
    }
  };

  const fetchAdministradores = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const adminsList = usersSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          uid: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.role === "admin");
      setAdministradores(adminsList);
    } catch (error) {
      console.error("Error al obtener administradores:", error);
    }
  };

  const fetchServicios = async () => {
    try {
      const serviciosCollection = collection(db, "servicios_departamentos");
      const serviciosSnapshot = await getDocs(serviciosCollection);
      if (!serviciosSnapshot.empty) {
        const docData = serviciosSnapshot.docs[0].data();
        setServiciosDisponibles(docData.Servicios || []);
      }
    } catch (error) {
      console.error("Error al obtener servicios:", error);
    }
  };

  const handleOpenDialog = (flota = null) => {
    if (flota) {
      setEditMode(true);
      setCurrentFlota(flota);
      setFormData({
        nombre: flota.nombre || "",
        imageUrl: flota.imageUrl || "",
        nit: flota.perfilFlota?.nit || flota.documentosFlota?.nit || "",
        representanteLegal: flota.perfilFlota?.representanteLegal || "",
        telefono: flota.perfilFlota?.telefono || "",
        fotoNit: flota.documentosFlota?.fotoNit || "",
        uidPropietarios: flota.uidPropietarios || [],
        servicios: flota.servicios || [],
        habilitado: flota.habilitado !== undefined ? flota.habilitado : true,
      });
      setImagePreview(flota.imageUrl || null);
      setImageFile(null);
    } else {
      setEditMode(false);
      setCurrentFlota(null);
      setFormData({
        nombre: "",
        imageUrl: "",
        nit: "",
        representanteLegal: "",
        telefono: "",
        fotoNit: "",
        uidPropietarios: [],
        servicios: [],
        habilitado: true,
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentFlota(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (isSaving) return; // Evitar doble guardado
    
    if (!formData.nombre.trim()) {
      showAlert("El nombre de la flota es obligatorio", "error");
      return;
    }

    if (!formData.nit.trim()) {
      showAlert("El NIT es obligatorio", "error");
      return;
    }

    if (formData.uidPropietarios.length === 0) {
      showAlert("Debes seleccionar al menos un administrador propietario", "error");
      return;
    }

    setIsSaving(true);
    
    try {
      // Obtener datos del primer administrador seleccionado
      const primerAdminUid = formData.uidPropietarios[0];
      console.log('UID del primer admin:', primerAdminUid);
      console.log('Lista de administradores:', administradores);
      
      const adminSeleccionado = administradores.find(a => a.uid === primerAdminUid);
      console.log('Admin seleccionado:', adminSeleccionado);
      
      if (!adminSeleccionado) {
        showAlert("No se encontró el administrador seleccionado", "error");
        setIsSaving(false);
        return;
      }

      const perfilFlota = {
        nombreFlota: formData.nombre,
        representanteLegal: formData.representanteLegal,
        telefono: formData.telefono,
        correo: adminSeleccionado.email || adminSeleccionado.correo || "",
        contrasena: adminSeleccionado.password || adminSeleccionado.contrasena || "",
      };

      console.log('Perfil flota a guardar:', perfilFlota);

      if (editMode && currentFlota) {
        // Actualizar flota existente
        const flotaRef = doc(db, "flotas", currentFlota.id);
        await updateDoc(flotaRef, {
          nombre: formData.nombre,
          imageUrl: imagePreview || "",
          perfilFlota: perfilFlota,
          documentosFlota: {
            nit: formData.nit,
            fotoNit: formData.fotoNit,
          },
          uidPropietarios: formData.uidPropietarios,
          servicios: formData.servicios,
          habilitado: formData.habilitado,
          updatedAt: serverTimestamp(),
        });

        // Actualizar flotaId en los usuarios seleccionados
        for (const uid of formData.uidPropietarios) {
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, {
            flotaId: currentFlota.id,
            updatedAt: serverTimestamp(),
          });
        }

        showAlert("Flota actualizada exitosamente", "success");
      } else {
        // Crear nueva flota
        console.log('Creando nueva flota...');
        const nuevaFlotaRef = await addDoc(collection(db, "flotas"), {
          nombre: formData.nombre,
          imageUrl: imagePreview || "",
          perfilFlota: perfilFlota,
          documentosFlota: {
            nit: formData.nit,
            fotoNit: formData.fotoNit,
          },
          uidPropietarios: formData.uidPropietarios,
          servicios: formData.servicios,
          habilitado: formData.habilitado,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        console.log('Flota creada con ID:', nuevaFlotaRef.id);

        // Actualizar flotaId en los usuarios seleccionados con el ID de la nueva flota
        for (const uid of formData.uidPropietarios) {
          console.log('Actualizando flotaId para usuario:', uid);
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, {
            flotaId: nuevaFlotaRef.id,
            updatedAt: serverTimestamp(),
          });
        }

        console.log('Proceso completado');
        showAlert("Flota creada exitosamente", "success");
      }
      
      await fetchFlotas();
      handleCloseDialog();
    } catch (error) {
      console.error("Error al guardar flota:", error);
      showAlert("Error al guardar la flota: " + error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (flotaId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta flota?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "flotas", flotaId));
      showAlert("Flota eliminada exitosamente", "success");
      fetchFlotas();
    } catch (error) {
      console.error("Error al eliminar flota:", error);
      showAlert("Error al eliminar la flota", "error");
    }
  };

  const handleToggleHabilitado = async (flotaId, currentState) => {
    try {
      const flotaRef = doc(db, "flotas", flotaId);
      await updateDoc(flotaRef, {
        habilitado: !currentState,
        updatedAt: serverTimestamp(),
      });
      showAlert(
        `Flota ${!currentState ? "habilitada" : "inhabilitada"} exitosamente`,
        "success"
      );
      fetchFlotas();
    } catch (error) {
      console.error("Error al cambiar estado de la flota:", error);
      showAlert("Error al cambiar el estado de la flota", "error");
    }
  };

  const showAlert = (message, severity) => {
    setAlert({ show: true, message, severity });
    setTimeout(() => {
      setAlert({ show: false, message: "", severity: "success" });
    }, 4000);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <DirectionsCarIcon sx={{ fontSize: 40, color: "#d7171a" }} />
          <Typography variant="h4" sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 900 }}>
            Gestión de Flotas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: "#d7171a",
            fontFamily: "Mulish, sans-serif",
            fontWeight: 700,
            "&:hover": {
              backgroundColor: "#a00000",
            },
          }}
        >
          Nueva Flota
        </Button>
      </Box>

      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#000000" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Logo
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Nombre de la Flota
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                NIT
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Representante Legal
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Propietarios
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Estado
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Fecha de Creación
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flotas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                    No hay flotas registradas
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              flotas.map((flota) => (
                <TableRow key={flota.id} hover>
                  <TableCell>
                    <Avatar 
                      src={flota.imageUrl} 
                      alt={flota.nombre}
                      sx={{ width: 50, height: 50, bgcolor: "#d7171a" }}
                    >
                      {!flota.imageUrl && <DirectionsCarIcon />}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                    {flota.nombre}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                    {flota.documentosFlota?.nit || "-"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                    {flota.perfilFlota?.representanteLegal || "-"}
                  </TableCell>
                  <TableCell>
                    {flota.uidPropietarios && flota.uidPropietarios.length > 0 ? (
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {flota.uidPropietarios.slice(0, 2).map((uid) => {
                          const admin = administradores.find(a => a.uid === uid);
                          return (
                            <Chip
                              key={uid}
                              label={admin?.nombre || admin?.email?.split('@')[0] || "Admin"}
                              size="small"
                              sx={{
                                bgcolor: "#d7171a",
                                color: "white",
                                fontWeight: 600,
                                fontFamily: "Mulish, sans-serif",
                                fontSize: "0.7rem",
                              }}
                            />
                          );
                        })}
                        {flota.uidPropietarios.length > 2 && (
                          <Chip
                            label={`+${flota.uidPropietarios.length - 2}`}
                            size="small"
                            sx={{
                              bgcolor: "#484848",
                              color: "white",
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                              fontSize: "0.7rem",
                            }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif", color: "#484848" }}>
                        Sin propietarios
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Switch
                        checked={flota.habilitado !== undefined ? flota.habilitado : true}
                        onChange={() => handleToggleHabilitado(flota.id, flota.habilitado !== undefined ? flota.habilitado : true)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#4caf50',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#4caf50',
                          },
                        }}
                      />
                      <Chip
                        label={flota.habilitado !== undefined && !flota.habilitado ? "Inactiva" : "Activa"}
                        size="small"
                        sx={{
                          bgcolor: flota.habilitado !== undefined && !flota.habilitado ? "#757575" : "#4caf50",
                          color: "white",
                          fontWeight: 600,
                          fontFamily: "Mulish, sans-serif",
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                    {flota.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleOpenDialog(flota)}
                      sx={{ color: "#d7171a" }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(flota.id)}
                      sx={{ color: "#484848" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar flota */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            height: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 900, fontSize: "1.5rem", bgcolor: "#f5f5f5" }}>
          {editMode ? "Editar Flota" : "Nueva Flota"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {/* Logo de la flota */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, bgcolor: "#fafafa", py: 3, borderRadius: 2 }}>
              <Avatar
                src={imagePreview}
                sx={{ width: 100, height: 100, bgcolor: "#d7171a" }}
              >
                {!imagePreview && <DirectionsCarIcon sx={{ fontSize: 50 }} />}
              </Avatar>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                sx={{
                  color: "#d7171a",
                  borderColor: "#d7171a",
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "#a00000",
                    backgroundColor: "rgba(215, 23, 26, 0.08)",
                  },
                }}
              >
                Cargar Logo
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  sx={{ display: "none" }}
                />
              </Button>
            </Box>

            {/* Información del Perfil */}
            <Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontFamily: "Mulish, sans-serif", 
                  fontWeight: 800, 
                  color: "#d7171a", 
                  mb: 2,
                  fontSize: "1.1rem",
                  borderBottom: "2px solid #d7171a",
                  pb: 1
                }}
              >
                📋 Perfil de la Flota
              </Typography>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                fullWidth
                label="Nombre de la Flota"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                size="small"
                sx={{ fontFamily: "Mulish, sans-serif" }}
              />

              <TextField
                fullWidth
                label="Representante Legal"
                name="representanteLegal"
                value={formData.representanteLegal}
                onChange={handleInputChange}
                size="small"
                sx={{ fontFamily: "Mulish, sans-serif" }}
              />

              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                size="small"
                sx={{ fontFamily: "Mulish, sans-serif" }}
              />
            </Box>

            {/* Documentos de la Flota */}
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontFamily: "Mulish, sans-serif", 
                  fontWeight: 800, 
                  color: "#d7171a", 
                  mb: 2,
                  fontSize: "1.1rem",
                  borderBottom: "2px solid #d7171a",
                  pb: 1
                }}
              >
                📄 Documentos
              </Typography>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                fullWidth
                label="NIT"
                name="nit"
                value={formData.nit}
                onChange={handleInputChange}
                required
                size="small"
                sx={{ fontFamily: "Mulish, sans-serif" }}
                helperText="Número de identificación tributaria"
              />

              <TextField
                fullWidth
                label="URL Foto NIT"
                name="fotoNit"
                value={formData.fotoNit}
                onChange={handleInputChange}
                placeholder="https://..."
                size="small"
                sx={{ fontFamily: "Mulish, sans-serif" }}
                helperText="URL de la imagen del documento NIT"
              />
            </Box>

            {/* UID Propietarios */}
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontFamily: "Mulish, sans-serif", 
                  fontWeight: 800, 
                  color: "#d7171a", 
                  mb: 2,
                  fontSize: "1.1rem",
                  borderBottom: "2px solid #d7171a",
                  pb: 1
                }}
              >
                👥 Propietarios (Administradores)
              </Typography>
            </Box>

            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Seleccionar Administradores</InputLabel>
                <Select
                  multiple
                  value={formData.uidPropietarios}
                  onChange={(e) => setFormData({ ...formData, uidPropietarios: e.target.value })}
                  input={<OutlinedInput label="Seleccionar Administradores" />}
                  onClose={() => {}}
                  MenuProps={{
                    autoFocus: false,
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((uid) => {
                        const admin = administradores.find(a => a.uid === uid);
                        return (
                          <Chip 
                            key={uid} 
                            label={admin?.nombre || admin?.email || uid}
                            size="small"
                            sx={{ 
                              bgcolor: "#d7171a", 
                              color: "white",
                              fontFamily: "Mulish, sans-serif",
                              fontWeight: 600
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                  sx={{ fontFamily: "Mulish, sans-serif" }}
                >
                  {administradores.length === 0 ? (
                    <MenuItem disabled>
                      <Typography sx={{ fontFamily: "Mulish, sans-serif", color: "#484848" }}>
                        No hay administradores activos disponibles
                      </Typography>
                    </MenuItem>
                  ) : (
                    administradores.map((admin) => (
                      <MenuItem key={admin.uid} value={admin.uid}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "#d7171a", fontSize: "0.875rem" }}>
                            {admin.nombre?.charAt(0) || admin.email?.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600, fontSize: "0.9rem" }}>
                              {admin.nombre || "Sin nombre"}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: "Mulish, sans-serif", color: "#484848" }}>
                              {admin.email}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <Typography variant="caption" sx={{ fontFamily: "Mulish, sans-serif", color: "#666", mt: 1, display: "block" }}>
                Selecciona los administradores que serán propietarios de esta flota
              </Typography>
            </Box>

            {/* Servicios */}
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontFamily: "Mulish, sans-serif", 
                  fontWeight: 800, 
                  color: "#d7171a", 
                  mb: 2,
                  fontSize: "1.1rem",
                  borderBottom: "2px solid #d7171a",
                  pb: 1
                }}
              >
                🚕 Servicios Disponibles
              </Typography>
            </Box>

            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Seleccionar Servicios</InputLabel>
                <Select
                  multiple
                  value={formData.servicios}
                  onChange={(e) => setFormData({ ...formData, servicios: e.target.value })}
                  input={<OutlinedInput label="Seleccionar Servicios" />}
                  onClose={() => {}}
                  MenuProps={{
                    autoFocus: false,
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((servicio) => (
                        <Chip 
                          key={servicio} 
                          label={servicio}
                          size="small"
                          sx={{ 
                            bgcolor: "#484848", 
                            color: "white",
                            fontFamily: "Mulish, sans-serif",
                            fontWeight: 600
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  sx={{ fontFamily: "Mulish, sans-serif" }}
                >
                  {serviciosDisponibles.length === 0 ? (
                    <MenuItem disabled>
                      <Typography sx={{ fontFamily: "Mulish, sans-serif", color: "#484848" }}>
                        No hay servicios disponibles
                      </Typography>
                    </MenuItem>
                  ) : (
                    serviciosDisponibles.map((servicio) => (
                      <MenuItem key={servicio} value={servicio}>
                        <Typography sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                          {servicio}
                        </Typography>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <Typography variant="caption" sx={{ fontFamily: "Mulish, sans-serif", color: "#666", mt: 1, display: "block" }}>
                Selecciona los servicios que ofrecerá esta flota
              </Typography>
            </Box>

            {/* Estado Habilitado/Inhabilitado */}
            <Box sx={{ mt: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontFamily: "Mulish, sans-serif", 
                  fontWeight: 800, 
                  color: "#d7171a", 
                  mb: 2,
                  fontSize: "1.1rem",
                  borderBottom: "2px solid #d7171a",
                  pb: 1
                }}
              >
                ⚙️ Estado de la Flota
              </Typography>
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.habilitado}
                    onChange={(e) => setFormData({ ...formData, habilitado: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#d7171a',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#d7171a',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                      {formData.habilitado ? "Flota Habilitada" : "Flota Inhabilitada"}
                    </Typography>
                    <Chip
                      label={formData.habilitado ? "Activa" : "Inactiva"}
                      size="small"
                      sx={{
                        bgcolor: formData.habilitado ? "#4caf50" : "#757575",
                        color: "white",
                        fontWeight: 600,
                        fontFamily: "Mulish, sans-serif",
                      }}
                    />
                  </Box>
                }
                sx={{ fontFamily: "Mulish, sans-serif" }}
              />
              <Typography variant="caption" sx={{ fontFamily: "Mulish, sans-serif", color: "#666", mt: 1, display: "block", ml: 4 }}>
                {formData.habilitado 
                  ? "La flota puede recibir y procesar solicitudes de viaje" 
                  : "La flota no recibirá nuevas solicitudes de viaje"}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "#f5f5f5" }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ color: "#484848", fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving}
            sx={{
              backgroundColor: "#d7171a",
              fontFamily: "Mulish, sans-serif",
              fontWeight: 700,
              px: 4,
              "&:hover": {
                backgroundColor: "#a00000",
              },
              "&:disabled": {
                backgroundColor: "#ccc",
              },
            }}
          >
            {isSaving ? "Guardando..." : (editMode ? "Actualizar" : "Crear Flota")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionFlotas;
