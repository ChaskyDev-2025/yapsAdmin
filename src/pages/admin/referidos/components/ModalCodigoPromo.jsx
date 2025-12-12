import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  MenuItem,
  Grid,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { guardarCodigoPromo, eliminarCodigoPromo } from "../../../../services/codigosPromoService";

const DEPARTAMENTOS = [
  "Cochabamba",
  "La Paz",
  "Santa Cruz",
  "Oruro",
  "Potosí",
  "Chuquisaca",
  "Tarija",
  "Beni",
  "Pando"
];

const ModalCodigoPromo = ({ open, onClose, codigoData, onSaved, onDeleted }) => {
  const [formData, setFormData] = useState({
    codigo: "",
    departamento: "",
    descripcion: "",
    descuentoPorcentaje: 0,
    descuentoMaximo: 0,
    usosMaximos: 100,
    usosActuales: 0,
    activo: true,
    tipoCategoria: "viajes",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (codigoData) {
      setFormData(codigoData);
    } else {
      setFormData({
        codigo: "",
        departamento: "",
        descripcion: "",
        descuentoPorcentaje: 0,
        descuentoMaximo: 0,
        usosMaximos: 100,
        usosActuales: 0,
        activo: true,
        tipoCategoria: "viajes",
      });
    }
    setError("");
  }, [codigoData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const generarCodigoAleatorio = () => {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "PROMO";
    for (let i = 0; i < 8; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setFormData({
      ...formData,
      codigo: codigo,
    });
  };

  const handleSave = async () => {
    try {
      setError("");
      setLoading(true);

      if (!formData.codigo.trim()) {
        setError("El código es requerido");
        return;
      }

      if (!formData.departamento) {
        setError("El departamento es requerido");
        return;
      }

      await guardarCodigoPromo(formData, codigoData?.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Error al guardar el código");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("¿Está seguro que desea eliminar este código?")) {
      try {
        setLoading(true);
        await eliminarCodigoPromo(codigoData.id);
        onDeleted();
        onClose();
      } catch (err) {
        setError(err.message || "Error al eliminar el código");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle 
        sx={{ 
          fontWeight: 700, 
          bgcolor: "#00897b", 
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "1.3rem"
        }}
      >
        {codigoData ? "✏️ Editar Código" : "🎟️ Nuevo Código"}
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 3 }}>
        {error && (
          <Box 
            sx={{ 
              color: "#c62828", 
              mb: 3, 
              p: 2, 
              bgcolor: "#ffebee", 
              borderRadius: 2,
              border: "1px solid #ef5350",
              fontWeight: 500
            }}
          >
            ⚠️ {error}
          </Box>
        )}

        <Box>
          {/* Sección 1: Información General */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#00897b", mb: 2.5, fontSize: "0.95rem" }}>
            📋 Información General
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <TextField
                  fullWidth
                  label="Código Promocional"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  placeholder="NAVIDAD2024"
                  disabled={!!codigoData}
                  inputProps={{ style: { textTransform: "uppercase", fontWeight: 600 } }}
                  variant="outlined"
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={generarCodigoAleatorio}
                  disabled={!!codigoData}
                  sx={{
                    mt: 0.5,
                    textTransform: "none",
                    borderColor: "#00897b",
                    color: "#00897b",
                    whiteSpace: "nowrap",
                    "&:hover": {
                      borderColor: "#00897b",
                      bgcolor: "rgba(0, 137, 123, 0.04)",
                    },
                    "&:disabled": {
                      borderColor: "#ccc",
                      color: "#999",
                    }
                  }}
                >
                  🎲 Generar
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Departamento"
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  }
                }}
              >
                {DEPARTAMENTOS.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe la promoción"
                multiline
                rows={2}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Divisor */}
          <Divider sx={{ my: 3 }} />

          {/* Sección 2: Descuentos */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#00897b", mb: 2.5, fontSize: "0.95rem" }}>
            💰 Descuentos
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Descuento %"
                name="descuentoPorcentaje"
                type="number"
                value={formData.descuentoPorcentaje}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Descuento Máximo $"
                name="descuentoMaximo"
                type="number"
                value={formData.descuentoMaximo}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Grid>
          </Grid>

          {/* Divisor */}
          <Divider sx={{ my: 3 }} />

          {/* Sección 3: Límites de Uso */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#00897b", mb: 2.5, fontSize: "0.95rem" }}>
            📊 Límites de Uso
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Usos Máximos"
                name="usosMaximos"
                type="number"
                value={formData.usosMaximos}
                onChange={handleChange}
                inputProps={{ min: 1 }}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Categoría"
                name="tipoCategoria"
                value={formData.tipoCategoria}
                onChange={handleChange}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                  }
                }}
              >
                <MenuItem value="viajes">🚗 Viajes</MenuItem>
                <MenuItem value="servicios">🔧 Servicios</MenuItem>
                <MenuItem value="general">📦 General</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {/* Divisor */}
          <Divider sx={{ my: 3 }} />

          {/* Sección 4: Estado */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#00897b", mb: 2, fontSize: "0.95rem" }}>
            ⚡ Estado
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#00897b",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#00897b",
                    },
                  }}
                />
              }
              label={
                <span style={{ fontWeight: 600, color: formData.activo ? "#2e7d32" : "#c62828" }}>
                  {formData.activo ? "✓ Activo" : "✗ Inactivo"}
                </span>
              }
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1, bgcolor: "#f5f5f5" }}>
        {codigoData && (
          <Button
            onClick={handleDelete}
            color="error"
            disabled={loading}
            variant="outlined"
            startIcon={<DeleteIcon />}
            sx={{ mr: "auto" }}
          >
            Eliminar
          </Button>
        )}
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
          startIcon={<CloseIcon />}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{ 
            bgcolor: "#00897b",
            "&:hover": {
              bgcolor: "#00695c"
            }
          }}
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalCodigoPromo;
