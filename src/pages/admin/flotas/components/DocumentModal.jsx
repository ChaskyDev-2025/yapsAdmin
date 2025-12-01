// src/pages/admin/flotas/components/DocumentModal.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

export const DocumentModal = ({ open, onClose, docFormData, docFile, onDocFormDataChange, onDocFileChange, onAdd }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#d7171a",
          color: "white",
          fontFamily: "Mulish, sans-serif",
          fontWeight: 700,
        }}
      >
        📎 Agregar Documento
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ fontFamily: "Mulish, sans-serif" }}>Tipo de Documento</InputLabel>
          <Select
            value={docFormData.tipo}
            onChange={(e) => onDocFormDataChange({ ...docFormData, tipo: e.target.value })}
            label="Tipo de Documento"
            sx={{ fontFamily: "Mulish, sans-serif" }}
          >
            <MenuItem value="Licencia de Operación" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Licencia de Operación
            </MenuItem>
            <MenuItem value="Certificado de Cámara de Comercio" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Certificado de Cámara de Comercio
            </MenuItem>
            <MenuItem value="RUT" sx={{ fontFamily: "Mulish, sans-serif" }}>
              RUT
            </MenuItem>
            <MenuItem value="Póliza de Seguro" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Póliza de Seguro
            </MenuItem>
            <MenuItem value="Certificado Bancario" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Certificado Bancario
            </MenuItem>
            <MenuItem value="Contrato de Afiliación" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Contrato de Afiliación
            </MenuItem>
            <MenuItem value="Otro" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Otro
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Nombre del Documento"
          value={docFormData.nombre}
          onChange={(e) => onDocFormDataChange({ ...docFormData, nombre: e.target.value })}
          sx={{ mb: 2, fontFamily: "Mulish, sans-serif" }}
          helperText="Opcional: Nombre descriptivo del documento"
        />

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Información / Contenido"
          value={docFormData.contenido}
          onChange={(e) => onDocFormDataChange({ ...docFormData, contenido: e.target.value })}
          sx={{ mb: 2, fontFamily: "Mulish, sans-serif" }}
          helperText="Escribe aquí los datos del documento (número, detalles, etc.)"
          placeholder="Ej: Número de licencia: 123456789, Vigencia: 2025-12-31"
        />

        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            mb: 1,
            color: "#666",
            fontFamily: "Mulish, sans-serif",
            fontWeight: 600,
          }}
        >
          - O también puedes agregar -
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
            fullWidth
            sx={{
              borderColor: "#d7171a",
              color: "#d7171a",
              fontFamily: "Mulish, sans-serif",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#b71c1c",
                bgcolor: "rgba(215, 23, 26, 0.04)",
              },
            }}
          >
            Subir Archivo (Opcional)
            <input type="file" hidden onChange={onDocFileChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          </Button>
          {docFile && (
            <Alert severity="success" sx={{ mt: 1, fontFamily: "Mulish, sans-serif" }}>
              Archivo seleccionado: {docFile.name}
            </Alert>
          )}
        </Box>

        <TextField
          fullWidth
          label="URL del Documento (Opcional)"
          value={docFormData.url}
          onChange={(e) => onDocFormDataChange({ ...docFormData, url: e.target.value })}
          helperText="O pega una URL si el documento ya está en línea"
          sx={{ fontFamily: "Mulish, sans-serif" }}
          placeholder="https://..."
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600, color: "#484848" }}>
          Cancelar
        </Button>
        <Button
          onClick={onAdd}
          variant="contained"
          sx={{
            bgcolor: "#d7171a",
            fontFamily: "Mulish, sans-serif",
            fontWeight: 700,
            "&:hover": { bgcolor: "#b71c1c" },
          }}
        >
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
