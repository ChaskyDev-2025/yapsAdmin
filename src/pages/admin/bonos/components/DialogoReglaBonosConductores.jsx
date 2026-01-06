import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";

export const DialogoReglaBonosConductores = ({
  open,
  onClose,
  onGuardar,
  editando,
  formData,
  onFormChange,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", color: "#000" }}>
        {editando ? "Editar Regla de Bono" : "Nueva Regla de Bono"}
      </DialogTitle>
      <DialogContent sx={{ paddingTop: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Viajes Requeridos"
            type="number"
            value={formData.viajes}
            onChange={(e) => onFormChange("viajes", e.target.value)}
            variant="outlined"
            placeholder="Ej: 40"
          />
          <TextField
            fullWidth
            label="Monto del Bono (Bs.)"
            type="number"
            value={formData.monto}
            onChange={(e) => onFormChange("monto", e.target.value)}
            variant="outlined"
            placeholder="Ej: 100"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Button onClick={onClose} sx={{ color: "#666" }}>
          Cancelar
        </Button>
        <Button
          onClick={onGuardar}
          variant="contained"
          sx={{
            backgroundColor: "#d7171a",
            color: "white",
            "&:hover": { backgroundColor: "#a80a12" },
          }}
        >
          {editando ? "Actualizar" : "Crear"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
