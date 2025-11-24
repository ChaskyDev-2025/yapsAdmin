// src/pages/admin/personalizar/components/ColorEmpresa.jsx
import { useState } from "react";
import {
  Typography,
  Stack,
  Button,
  Box
} from "@mui/material";

const ColorEmpresa = ({ onSave }) => {
  const [color, setColor] = useState("#d7171a"); // Rojo corporativo por defecto
  const [guardado, setGuardado] = useState(false);

  const handleGuardar = () => {
    onSave(color);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  return (
    <Stack spacing={2} mt={2}>
      <Typography>Selecciona un color representativo:</Typography>

      <Box display="flex" alignItems="center" gap={2}>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: "50px", height: "50px", border: "none", cursor: "pointer" }}
        />
        <Typography>{color}</Typography>
      </Box>

      <Button
        variant="contained"
        onClick={handleGuardar}
      >
        Guardar color
      </Button>

      {guardado && (
        <Typography color="success.main">
          Color guardado correctamente.
        </Typography>
      )}
    </Stack>
  );
};

export default ColorEmpresa;
