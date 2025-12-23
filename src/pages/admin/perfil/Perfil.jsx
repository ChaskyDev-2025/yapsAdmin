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
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { IconButton, InputAdornment } from "@mui/material";
import { useAuth } from "../../../auth/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { uploadImageToApi } from "../../../services/imageUploadService";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

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

  // Estados para cambiar contraseña
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [successPassword, setSuccessPassword] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [mostrarPasswordActual, setMostrarPasswordActual] = useState(false);
  const [mostrarPasswordNueva, setMostrarPasswordNueva] = useState(false);
  const [mostrarPasswordConfirm, setMostrarPasswordConfirm] = useState(false);

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
          // IMPORTANTE: Nunca cargar la contraseña desde Firebase
          // Los campos de contraseña siempre deben estar vacíos
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

  const handleCambiarPassword = async () => {
    setErrorPassword("");
    setSuccessPassword("");

    if (!passwordActual || !passwordNueva || !passwordConfirm) {
      setErrorPassword("Por favor completa todos los campos");
      return;
    }

    if (passwordNueva !== passwordConfirm) {
      setErrorPassword("Las contraseñas nuevas no coinciden");
      return;
    }

    if (passwordNueva.length < 6) {
      setErrorPassword("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (passwordNueva === passwordActual) {
      setErrorPassword("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    setGuardandoPassword(true);

    try {
      // Reautenticar usuario
      const credential = EmailAuthProvider.credential(user.email, passwordActual);
      await reauthenticateWithCredential(user, credential);

      // Cambiar contraseña
      await updatePassword(user, passwordNueva);

      setSuccessPassword("✓ Contraseña actualizada correctamente");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirm("");
      setMostrarCambioPassword(false);
      setTimeout(() => setSuccessPassword(""), 3000);
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      if (err.code === "auth/wrong-password") {
        setErrorPassword("La contraseña actual es incorrecta");
      } else if (err.code === "auth/weak-password") {
        setErrorPassword("La contraseña es muy débil");
      } else {
        setErrorPassword("Error al cambiar la contraseña. Intenta nuevamente");
      }
    } finally {
      setGuardandoPassword(false);
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

            <Divider sx={{ my: 3 }} />

            {/* SECCIÓN: Cambiar Contraseña */}
            <Box>
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => setMostrarCambioPassword(!mostrarCambioPassword)}
                fullWidth
                sx={{ mb: 2, textTransform: "none", fontSize: "1rem" }}
              >
                {mostrarCambioPassword ? "Cancelar cambio de contraseña" : "Cambiar contraseña"}
              </Button>

              {mostrarCambioPassword && (
                <Stack spacing={2}>
                  {successPassword && (
                    <Alert severity="success">
                      {successPassword}
                    </Alert>
                  )}

                  {errorPassword && (
                    <Alert severity="error">
                      {errorPassword}
                    </Alert>
                  )}

                  <TextField
                    label="Contraseña actual"
                    name="password-actual"
                    type={mostrarPasswordActual ? "text" : "password"}
                    fullWidth
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setMostrarPasswordActual(!mostrarPasswordActual)}
                            edge="end"
                          >
                            {mostrarPasswordActual ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    label="Nueva contraseña"
                    name="password-nueva"
                    type={mostrarPasswordNueva ? "text" : "password"}
                    fullWidth
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    placeholder="Ingresa tu nueva contraseña"
                    helperText="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setMostrarPasswordNueva(!mostrarPasswordNueva)}
                            edge="end"
                          >
                            {mostrarPasswordNueva ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    label="Confirmar nueva contraseña"
                    name="password-confirm"
                    type={mostrarPasswordConfirm ? "text" : "password"}
                    fullWidth
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setMostrarPasswordConfirm(!mostrarPasswordConfirm)}
                            edge="end"
                          >
                            {mostrarPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleCambiarPassword}
                    disabled={!passwordActual || !passwordNueva || !passwordConfirm || guardandoPassword}
                  >
                    {guardandoPassword ? <CircularProgress size={24} /> : "Actualizar contraseña"}
                  </Button>
                </Stack>
              )}
            </Box>
          </Stack>
        </>
      )}
    </Paper>
  );
};

export default Perfil;
