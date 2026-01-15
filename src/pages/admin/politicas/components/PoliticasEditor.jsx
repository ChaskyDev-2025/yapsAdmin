import React from "react";
import { Box, TextField, Button } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

const PoliticasEditor = ({ contenido, onChange, onSave, saving, onCancel }) => {
  return (
    <Box>
      <TextField
        fullWidth
        multiline
        rows={20}
        value={contenido}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ingresa el contenido de las políticas de privacidad..."
        variant="outlined"
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#fff",
          },
        }}
      />
      <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onSave}
          disabled={saving}
          sx={{
            background: "linear-gradient(90deg, #D61319 0%, #A30E13 50%, #700A09 100%)",
            color: "#fff",
          }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </Box>
    </Box>
  );
};

export default PoliticasEditor;
