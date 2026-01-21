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

// Función para parsear fechas en español o ISO format
const parseFecha = (fechaStr) => {
  if (!fechaStr) return null;

  // Si es una cadena, intentar parsearla
  if (typeof fechaStr === "string") {
    // Primero intentar formato ISO
    const isoDate = new Date(fechaStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Si no es ISO, intentar parsear formato español
    // Ej: "30 de noviembre de 2026 a las 11:59:59 p.m. UTC-4"
    const mesesEspanol = {
      enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
      julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };

    // Regex para parsear "30 de noviembre de 2026 a las 11:59:59 p.m."
    const regex = /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\s+a\s+las\s+(\d{1,2}):(\d{2}):(\d{2})/i;
    const match = fechaStr.match(regex);

    if (match) {
      const [, dia, mesStr, año, hora, minuto, segundo] = match;
      const mes = mesesEspanol[mesStr.toLowerCase()];

      if (mes !== undefined) {
        // Ajustar hora si es p.m. y no es 12
        let horaNum = parseInt(hora);
        if (fechaStr.includes("p.m.") && horaNum !== 12) {
          horaNum += 12;
        } else if (fechaStr.includes("a.m.") && horaNum === 12) {
          horaNum = 0;
        }

        return new Date(año, mes, dia, horaNum, minuto, segundo);
      }
    }
  }

  // Si es un objeto Timestamp de Firebase
  if (fechaStr && typeof fechaStr === "object" && fechaStr.toDate) {
    return fechaStr.toDate();
  }

  return null;
};

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
    fechaExpiracion: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (codigoData) {
      // Convertir fechaExpiracion a datetime-local si existe
      let fechaExpiracion = "";
      if (codigoData.fechaExpiracion) {
        const fecha = parseFecha(codigoData.fechaExpiracion);
        if (fecha && !isNaN(fecha.getTime())) {
          // Convertir a formato datetime-local (YYYY-MM-DDTHH:mm)
          fechaExpiracion = fecha.toISOString().slice(0, 16);
        }
      }
      setFormData({
        ...codigoData,
        fechaExpiracion: fechaExpiracion
      });
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
        fechaExpiracion: "",
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
          background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)", 
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "1.3rem"
        }}
      >
        {codigoData ? "✏️ Editar Código" : "🎟️ Nuevo Código"}
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 3, overflow: 'visible' }}>
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

        <Box sx={{ position: 'relative', zIndex: 1000 }}>
          {/* Sección 1: Información General */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", mb: 2.5, fontSize: "0.95rem" }}>
              📋 Información General
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2.5,
              p: 0,
              bgcolor: 'transparent',
              borderRadius: 2,
              border: 'none'
            }}>
              {/* Código Promocional con botón Generar */}
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
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
                    textTransform: "none",
                    borderColor: "#d7171a",
                    color: "#d7171a",
                    whiteSpace: "nowrap",
                    height: 40,
                    "&:hover": {
                      borderColor: "#d7171a",
                      bgcolor: "#ffe0e0",
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

              {/* Departamento */}
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

              {/* Descripción */}
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
            </Box>
          </Box>

          {/* Sección 1b: Información de Fechas (solo en edición) */}
          {codigoData && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", mb: 2.5, fontSize: "0.95rem" }}>
                📅 Información de Fechas
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Fecha de Creación"
                    value={formData.fechaCreacion ? new Date(formData.fechaCreacion).toLocaleString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    }) : ""}
                    disabled
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
            </>
          )}

          {/* Divisor */}
          <Divider sx={{ my: 3 }} />

          {/* Sección 2: Descuentos */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", mb: 2.5, fontSize: "0.95rem" }}>
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
          <Typography variant="subtitle2" sx={{ fontWeight: 700, background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", mb: 2.5, fontSize: "0.95rem" }}>
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
                label="Fecha de Expiración"
                name="fechaExpiracion"
                type="datetime-local"
                value={formData.fechaExpiracion}
                onChange={handleChange}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
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

          {/* Sección 4: Categoría */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", mb: 2.5, fontSize: "0.95rem" }}>
            📁 Categoría
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
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
          <Typography variant="subtitle2" sx={{ fontWeight: 700, background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", mb: 2, fontSize: "0.95rem" }}>
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
                      color: "#d7171a",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#d7171a",
                    },
                  }}
                />
              }
              label={
                <span style={{ fontWeight: 600, color: formData.activo ? "#d7171a" : "#c62828" }}>
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
            background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #b01217 0%, #a01012 100%)"
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
