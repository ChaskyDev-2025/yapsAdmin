import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";
import { useState } from "react";

export default function RecargaSaldoModal({ open, onClose, onGuardar }) {
  const [monto, setMonto] = useState("");
  const [accion, setAccion] = useState("sumar"); // sumar | restar

  const handleGuardar = () => {
    // normaliza el número (acepta 10,5 y 10.5)
    const value = parseFloat(String(monto).replace(",", "."));
    if (!isFinite(value) || value <= 0) return; // no permitimos 0 o vacíos

    // enviamos el delta con signo según la acción
    const delta = accion === "sumar" ? value : -value;
    if (onGuardar) onGuardar(delta);

    // reset y cerrar
    setMonto("");
    setAccion("sumar");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Actualizar saldo</DialogTitle>
      <DialogContent>
        <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
          Selecciona la operación
        </Typography>
        <ToggleButtonGroup
          value={accion}
          exclusive
          onChange={(_, val) => val && setAccion(val)}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="sumar">Sumar</ToggleButton>
          <ToggleButton value="restar">Restar</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          label="Monto"
          type="number"
          fullWidth
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          inputProps={{ min: 0, step: "any" }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleGuardar}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
