import React from "react";
import {
  Stack,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

const PerfilInfo = ({
  nombre,
  onNombreChange,
  correo,
  onCorreoChange,
  telefono,
  onTelefonoChange,
  guardando,
  onGuardar,
}) => {
  return (
    <Stack spacing={3}>
      <TextField
        label="Nombre"
        fullWidth
        value={nombre}
        onChange={(e) => onNombreChange(e.target.value)}
        placeholder="Tu nombre completo"
      />

      <TextField
        label="Correo"
        fullWidth
        type="email"
        value={correo}
        onChange={(e) => onCorreoChange(e.target.value)}
        placeholder="Tu correo electrónico"
      />

      <TextField
        label="Teléfono"
        fullWidth
        value={telefono}
        onChange={(e) => onTelefonoChange(e.target.value)}
        placeholder="Tu número de teléfono"
      />

      <Button
        variant="contained"
        color="primary"
        onClick={onGuardar}
        disabled={!nombre || !correo || guardando}
        sx={{ mt: 2 }}
      >
        {guardando ? <CircularProgress size={24} /> : "Guardar cambios"}
      </Button>
    </Stack>
  );
};

export default PerfilInfo;
