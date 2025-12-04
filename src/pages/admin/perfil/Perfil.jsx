// src/pages/admin/perfil/Perfil.jsx
import { useState } from "react";
import {
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Avatar,
  Divider
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";

const Perfil = () => {
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [guardado, setGuardado] = useState(false);

  const handleFotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleGuardar = () => {
    // Aquí iría la lógica real para guardar la información
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, margin: "0 auto" }}>
      <Typography variant="h5" gutterBottom>
        Perfil de Usuario
      </Typography>
      <Typography gutterBottom>
        Aquí puedes actualizar tu foto, nombre, correo y contraseña.
      </Typography>

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
          Subir foto
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
        />

        <TextField
          label="Correo"
          fullWidth
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        <TextField
          label="Contraseña"
          fullWidth
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleGuardar}
          disabled={!nombre || !correo || !contrasena}
        >
          Guardar cambios
        </Button>

        {guardado && (
          <Typography color="success.main" align="center">
            Perfil actualizado correctamente.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

export default Perfil;
