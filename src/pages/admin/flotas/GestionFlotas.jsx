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
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFlota, setCurrentFlota] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", severity: "success" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    imageUrl: "",
  });

  useEffect(() => {
    fetchFlotas();
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

  const handleOpenDialog = (flota = null) => {
    if (flota) {
      setEditMode(true);
      setCurrentFlota(flota);
      setFormData({
        nombre: flota.nombre || "",
        imageUrl: flota.imageUrl || "",
      });
      setImagePreview(flota.imageUrl || null);
      setImageFile(null);
    } else {
      setEditMode(false);
      setCurrentFlota(null);
      setFormData({
        nombre: "",
        imageUrl: "",
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
    if (!formData.nombre.trim()) {
      showAlert("El nombre de la flota es obligatorio", "error");
      return;
    }

    try {
      if (editMode && currentFlota) {
        // Actualizar flota existente
        const flotaRef = doc(db, "flotas", currentFlota.id);
        await updateDoc(flotaRef, {
          nombre: formData.nombre,
          imageUrl: imagePreview || "",
          updatedAt: serverTimestamp(),
        });
        showAlert("Flota actualizada exitosamente", "success");
      } else {
        // Crear nueva flota
        const flotaDocRef = await addDoc(collection(db, "flotas"), {
          nombre: formData.nombre,
          imageUrl: imagePreview || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Crear roles para la flota
        const rolesRef = collection(db, "flotas", flotaDocRef.id, "roles");
        await addDoc(rolesRef, {
          nombre: "dueño",
          permisos: ["gestion_completa", "editar_flota", "eliminar_flota", "gestionar_trabajadores"],
          createdAt: serverTimestamp(),
        });
        await addDoc(rolesRef, {
          nombre: "trabajador",
          permisos: ["ver_informacion", "actualizar_perfil"],
          createdAt: serverTimestamp(),
        });

        showAlert("Flota y roles creados exitosamente", "success");
      }
      
      fetchFlotas();
      handleCloseDialog();
    } catch (error) {
      console.error("Error al guardar flota:", error);
      showAlert("Error al guardar la flota: " + error.message, "error");
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
                <TableCell colSpan={4} align="center">
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 900, fontSize: "1.5rem" }}>
          {editMode ? "Editar Flota" : "Nueva Flota"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              label="Nombre de la Flota"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              sx={{ fontFamily: "Mulish, sans-serif" }}
            />

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <Avatar
                src={imagePreview}
                sx={{ width: 120, height: 120, bgcolor: "#d7171a" }}
              >
                {!imagePreview && <DirectionsCarIcon sx={{ fontSize: 60 }} />}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            sx={{ color: "#484848", fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              backgroundColor: "#d7171a",
              fontFamily: "Mulish, sans-serif",
              fontWeight: 700,
              "&:hover": {
                backgroundColor: "#a00000",
              },
            }}
          >
            {editMode ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionFlotas;
