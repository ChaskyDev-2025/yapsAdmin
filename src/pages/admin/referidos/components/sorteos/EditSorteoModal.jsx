import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";

const EditSorteoModal = ({
  open,
  onClose,
  sorteo,
  onChange,
  onSubmit,
  imagenPreview,
  imagenSubiendo,
  onImagenChange,
  categoriasDisponibles,
  departamentos,
  disableId = true,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ backgroundColor: "#d7171a", color: "white", fontWeight: "bold" }}>
      ✏️ Editar Sorteo
    </DialogTitle>
    <DialogContent sx={{ pt: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="ID del Sorteo (identificador único)"
          fullWidth
          value={sorteo.id || ""}
          onChange={(e) => onChange({ ...sorteo, id: e.target.value })}
          placeholder="Ej: sorteo_navidad_2025"
          size="small"
          helperText="Usa caracteres alfanuméricos y guiones bajos. Este será el ID del documento."
          disabled={disableId}
        />
        <TextField
          label="Descripción (Opcional)"
          fullWidth
          multiline
          rows={3}
          value={sorteo.descripcion || ""}
          onChange={(e) => onChange({ ...sorteo, descripcion: e.target.value })}
          placeholder="Describe los detalles del sorteo..."
          size="small"
        />
        <FormControl fullWidth>
          <InputLabel>Modo del Sorteo</InputLabel>
          <Select
            value={sorteo.modo || "pasajero"}
            onChange={(e) => onChange({ ...sorteo, modo: e.target.value })}
            label="Modo del Sorteo"
          >
            <MenuItem value="pasajero">👤 Pasajero</MenuItem>
            <MenuItem value="trabajador">👷 Trabajador</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Departamentos Disponibles</InputLabel>
          <Select
            multiple
            value={sorteo.departamentos || []}
            onChange={(e) => onChange({ ...sorteo, departamentos: e.target.value })}
            label="Departamentos Disponibles"
          >
            {departamentos.map((departamento) => (
              <MenuItem key={departamento} value={departamento}>
                {departamento}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Fecha de Inicio"
          fullWidth
          type="datetime-local"
          value={sorteo.fechaInicio || ""}
          onChange={(e) => onChange({ ...sorteo, fechaInicio: e.target.value })}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Fecha de Finalización"
          fullWidth
          type="datetime-local"
          value={sorteo.fechaFin || ""}
          onChange={(e) => onChange({ ...sorteo, fechaFin: e.target.value })}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <FormControl fullWidth>
          <InputLabel>Categorías Aplicables (Opcional)</InputLabel>
          <Select
            multiple
            value={sorteo.categorias || []}
            onChange={(e) => onChange({ ...sorteo, categorias: e.target.value })}
            label="Categorías Aplicables (Opcional)"
          >
            {categoriasDisponibles.map((categoria) => (
              <MenuItem key={categoria} value={categoria}>
                {categoria}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Imagen de Promoción
          </Typography>
          {imagenPreview && (
            <Box sx={{ mb: 2 }}>
              <img
                src={imagenPreview}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "200px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
            </Box>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onImagenChange}
            disabled={imagenSubiendo}
            style={{ width: "100%" }}
          />
          {imagenSubiendo && (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={40} />
            </Box>
          )}
        </Box>
        <Box sx={{ p: 2, backgroundColor: "#fff3cd", borderRadius: 1, border: "1px solid #ffc107" }}>
          <Typography variant="body2" sx={{ color: "#856404", fontWeight: 500 }}>
            ⚠️ Nota: Si ya existe un sorteo activo para {sorteo.modo === "trabajador" ? "trabajadores" : "pasajeros"}, será desactivado automáticamente. Los cupones se almacenarán en una subcolección del documento.
          </Typography>
        </Box>
      </Box>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} sx={{ color: "#666" }}>
        Cancelar
      </Button>
      <Button
        onClick={onSubmit}
        variant="contained"
        sx={{
          background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #b01217 0%, #a01012 100%)",
          },
          fontWeight: 600,
        }}
      >
        Editar Sorteo
      </Button>
    </DialogActions>
  </Dialog>
);

export default EditSorteoModal;
