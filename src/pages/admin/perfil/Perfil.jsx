// src/pages/admin/perfil/Perfil.jsx
import {
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Box,
  Stack,
} from "@mui/material";
import { useAuth } from "../../../auth/AuthContext";
import { usePerfilData } from "./hooks/usePerfilData";
import { usePerfilPassword } from "./hooks/usePerfilPassword";
import PerfilFoto from "./components/PerfilFoto";
import PerfilInfo from "./components/PerfilInfo";
import PerfilPassword from "./components/PerfilPassword";

const Perfil = () => {
  const { user } = useAuth();

  const perfilData = usePerfilData(user);
  const perfilPassword = usePerfilPassword(user);

  const {
    nombre,
    setNombre,
    correo,
    setCorreo,
    telefono,
    setTelefono,
    cargando,
    error,
    guardado,
    preview,
    handleFotoChange,
    guardarCambios,
  } = perfilData;

  const {
    passwordActual,
    setPasswordActual,
    passwordNueva,
    setPasswordNueva,
    passwordConfirm,
    setPasswordConfirm,
    mostrarPasswordActual,
    setMostrarPasswordActual,
    mostrarPasswordNueva,
    setMostrarPasswordNueva,
    mostrarPasswordConfirm,
    setMostrarPasswordConfirm,
    errorPassword,
    successPassword,
    guardandoPassword,
    mostrarCambioPassword,
    setMostrarCambioPassword,
    cambiarPassword,
  } = perfilPassword;

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
        <Stack spacing={4} mt={3}>
          <PerfilFoto
            preview={preview}
            onFotoChange={handleFotoChange}
          />

          <Divider />

          <PerfilInfo
            nombre={nombre}
            onNombreChange={setNombre}
            correo={correo}
            onCorreoChange={setCorreo}
            telefono={telefono}
            onTelefonoChange={setTelefono}
            guardando={perfilData.guardando}
            onGuardar={guardarCambios}
          />

          <Divider sx={{ my: 3 }} />

          <PerfilPassword
            mostrarCambioPassword={mostrarCambioPassword}
            onToggleCambioPassword={() => setMostrarCambioPassword(!mostrarCambioPassword)}
            passwordActual={passwordActual}
            onPasswordActualChange={setPasswordActual}
            mostrarPasswordActual={mostrarPasswordActual}
            onToggleMostrarPasswordActual={() => setMostrarPasswordActual(!mostrarPasswordActual)}
            passwordNueva={passwordNueva}
            onPasswordNuevaChange={setPasswordNueva}
            mostrarPasswordNueva={mostrarPasswordNueva}
            onToggleMostrarPasswordNueva={() => setMostrarPasswordNueva(!mostrarPasswordNueva)}
            passwordConfirm={passwordConfirm}
            onPasswordConfirmChange={setPasswordConfirm}
            mostrarPasswordConfirm={mostrarPasswordConfirm}
            onToggleMostrarPasswordConfirm={() => setMostrarPasswordConfirm(!mostrarPasswordConfirm)}
            errorPassword={errorPassword}
            successPassword={successPassword}
            guardandoPassword={guardandoPassword}
            onCambiarPassword={cambiarPassword}
          />
        </Stack>
      )}
    </Paper>
  );
};

export default Perfil;
