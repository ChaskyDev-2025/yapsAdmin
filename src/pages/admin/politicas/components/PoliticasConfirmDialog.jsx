import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";

const PoliticasConfirmDialog = ({ open, onClose, onConfirm, saving }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmar cambios</DialogTitle>
      <DialogContent>
        <Typography>¿Estás seguro de que deseas guardar estos cambios?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={saving}
          sx={{
            background: "linear-gradient(90deg, #D61319 0%, #A30E13 50%, #700A09 100%)",
          }}
        >
          {saving ? <CircularProgress size={20} /> : "Confirmar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PoliticasConfirmDialog;
