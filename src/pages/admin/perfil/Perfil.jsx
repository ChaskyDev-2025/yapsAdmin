// src/pages/admin/perfil/Perfil.jsx
import { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Box
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { useAuth } from "../../../auth/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { uploadImageToApi } from "../../../services/imageUploadService";

const Perfil = () => {
  const { user } = useAuth();
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Cargar datos del usuario autenticado
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!user?.uid) {
        setCargando(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setNombre(userData.nombre || "");
          setCorreo(userData.email || user.email || "");
          setTelefono(userData.telefono || "");
          setFotoUrl(userData.fotoUrl || "");
          setPreview(userData.fotoUrl || null);
        } else {
          setCorreo(user.email || "");
        }
      } catch (err) {
        console.error("Error al cargar datos del usuario:", err);
        setError("Error al cargar los datos del perfil");
      } finally {
        setCargando(false);
      }
    };

    cargarDatosUsuario();
  }, [user]);

  const handleFotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleGuardar = async () => {
    if (!user?.uid) {
      setError("Usuario no autenticado");
      return;
    }

    if (!nombre || !correo) {
      setError("Por favor completa los campos requeridos");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      let nuevoFotoUrl = fotoUrl;

      // Si se seleccionó una nueva foto, subirla
      if (foto) {
        nuevoFotoUrl = await uploadImageToApi(foto, "perfil");
      }

      // Actualizar datos en Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        nombre: nombre,
        email: correo,
        telefono: telefono,
        fotoUrl: nuevoFotoUrl,
        actualizadoEn: new Date().toISOString(),
      });

      setFotoUrl(nuevoFotoUrl);
      setFoto(null);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) {
      console.error("Error al guardar cambios:", err);
      setError("Error al guardar los cambios. Intenta nuevamente");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, margin: "0 auto" }}>
      <Typography variant="h5" gutterBottom>
        Mi Perfil
      </Typography>
      <Typography gutterBottom color="textSecondary">
        Actualiza tu información personal
      </Typography>

      {guardado && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✓ Cambios guardados correctamente
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Stack spacing={3} mt={3} alignItems="center">
            <Avatar
              src={preview}
              alt="Foto de perfil"
              sx={{ width: 120, height: 120 }}
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Cambiar foto
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFotoChange}
              />
            </Button>
          </Stack>

          <Divider sx={{ my: 4 }} />

          <Stack spacing={3}>
            <TextField
              label="Nombre"
              fullWidth
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
            />

            <TextField
              label="Correo"
              fullWidth
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled
              helperText="El correo no se puede cambiar"
            />

            <TextField
              label="Teléfono"
              fullWidth
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Tu número de teléfono"
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleGuardar}
              disabled={!nombre || !correo || guardando}
              sx={{ mt: 2 }}
            >
              {guardando ? <CircularProgress size={24} /> : "Guardar cambios"}
            </Button>
          </Stack>
        </>
      )}
    </Paper>
  );
};

export default Perfil;
