// src/pages/admin/flotas/components/FlotaFormDialog.jsx
import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

export const FlotaFormDialog = ({
  open,
  onClose,
  formData,
  onInputChange,
  onImageChange,
  imagePreview,
  administradores,
  serviciosDisponibles,
  serviciosPorCiudad,
  documentosPorCiudad,
  onSave,
  isSaving,
  editMode,
  onFormDataChange,
  getAvailableAdministradores,
}) => {
  const [ciudadSeleccionadaServicios, setCiudadSeleccionadaServicios] = useState("");
  const [ciudadSeleccionadaDocumentos, setCiudadSeleccionadaDocumentos] = useState("");

  const ciudadesServicios = useMemo(() => 
    Object.keys(serviciosPorCiudad || {}),
    [serviciosPorCiudad]
  );

  const ciudadesDocumentos = useMemo(() => 
    Object.keys(documentosPorCiudad || {}),
    [documentosPorCiudad]
  );

  const tabsServicios = useMemo(() =>
    ciudadesServicios.map(ciudad => (
      <Tab key={ciudad} label={`📍 ${ciudad}`} value={ciudad} />
    )),
    [ciudadesServicios]
  );

  const tabsDocumentos = useMemo(() =>
    ciudadesDocumentos.map(ciudad => (
      <Tab key={ciudad} label={`📍 ${ciudad}`} value={ciudad} />
    )),
    [ciudadesDocumentos]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: "#d7171a",
          color: "white",
          fontFamily: "Mulish, sans-serif",
          fontWeight: 900,
          fontSize: "1.3rem",
          p: 2.5,
        }}
      >
        {editMode ? "✏️ Editar Flota" : "➕ Crear Nueva Flota"}
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#fafafa" }}>
        <Stack spacing={3.5}>
          {/* SECCIÓN 1: LOGO */}
          <Paper sx={{ p: 2.5, bgcolor: "white", borderRadius: 2 }}>
            <Typography
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 800,
                color: "#d7171a",
                mb: 2,
                fontSize: "1rem",
              }}
            >
              🖼️ Logo de la Flota
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                sx={{
                  borderColor: "#d7171a",
                  color: "#d7171a",
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "#a00000",
                    bgcolor: "rgba(215, 23, 26, 0.04)",
                  },
                }}
              >
                Seleccionar Imagen
                <input type="file" hidden accept="image/*" onChange={onImageChange} />
              </Button>
              {imagePreview && (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 1.5,
                    border: "3px solid #d7171a",
                  }}
                />
              )}
            </Box>
          </Paper>

          {/* SECCIÓN 2: INFORMACIÓN BÁSICA */}
          <Paper sx={{ p: 2.5, bgcolor: "white", borderRadius: 2 }}>
            <Typography
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 800,
                color: "#d7171a",
                mb: 2,
                fontSize: "1rem",
              }}
            >
              📋 Información de la Flota
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                label="Nombre de la Flota"
                name="nombre"
                value={formData.nombre}
                onChange={onInputChange}
                required
                size="small"
              />
              <TextField
                fullWidth
                label="Representante Legal"
                name="representanteLegal"
                value={formData.representanteLegal}
                onChange={onInputChange}
                size="small"
              />
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={onInputChange}
                size="small"
              />
              <TextField
                fullWidth
                label="Email Contacto"
                name="emailContacto"
                type="email"
                value={formData.emailContacto || ""}
                onChange={onInputChange}
                size="small"
              />
              <TextField
                fullWidth
                label="Domicilio Comercial"
                name="domicilio"
                value={formData.domicilio || ""}
                onChange={onInputChange}
                size="small"
                multiline
                rows={2}
              />
            </Stack>
          </Paper>

          {/* SECCIÓN 3: DOCUMENTOS */}
          <Paper sx={{ p: 2.5, bgcolor: "white", borderRadius: 2 }}>
            <Typography
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 800,
                color: "#d7171a",
                mb: 2,
                fontSize: "1rem",
              }}
            >
              📄 Documentación Legal
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                label="NIT"
                name="nit"
                value={formData.nit}
                onChange={onInputChange}
                required
                size="small"
                helperText="Número de Identificación Tributaria"
              />
              <TextField
                fullWidth
                label="Número de RUC"
                name="ruc"
                value={formData.ruc || ""}
                onChange={onInputChange}
                size="small"
                helperText="Registro Único de Contribuyente (Opcional)"
              />
              <TextField
                fullWidth
                label="Cédula de Identidad Representante"
                name="cedulaRepresentante"
                value={formData.cedulaRepresentante || ""}
                onChange={onInputChange}
                size="small"
                helperText="Carné de identidad del representante legal"
              />
              <TextField
                fullWidth
                label="Vigencia Licencia Municipal"
                name="vigenciaLicenciaMunicipal"
                type="date"
                value={formData.vigenciaLicenciaMunicipal || ""}
                onChange={onInputChange}
                InputLabelProps={{ shrink: true }}
                size="small"
                helperText="Fecha de vencimiento"
              />
              <TextField
                fullWidth
                label="Vigencia Seguro"
                name="vigenciaSeguro"
                type="date"
                value={formData.vigenciaSeguro || ""}
                onChange={onInputChange}
                InputLabelProps={{ shrink: true }}
                size="small"
                helperText="Fecha de vencimiento del seguro"
              />
            </Stack>
          </Paper>

          {/* SECCIÓN 4: PROPIETARIOS */}
          <Paper sx={{ p: 2.5, bgcolor: "white", borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography
                sx={{
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 800,
                  color: "#d7171a",
                  fontSize: "1rem",
                }}
              >
                👥 Administradores
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 500,
                  color: "#ff9800",
                  fontSize: "0.85rem",
                  bgcolor: "#fff3e0",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                ℹ️ Opcional
              </Typography>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Seleccionar Administradores</InputLabel>
              <Select
                multiple
                value={formData.uidPropietarios}
                onChange={(e) => onFormDataChange({ ...formData, uidPropietarios: e.target.value })}
                input={<OutlinedInput label="Seleccionar Administradores" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((uid) => {
                      const admin = administradores.find((a) => a.uid === uid);
                      return (
                        <Chip
                          key={uid}
                          label={admin?.nombre || admin?.email?.split('@')[0] || uid}
                          size="small"
                          sx={{
                            bgcolor: "#d7171a",
                            color: "white",
                            fontFamily: "Mulish, sans-serif",
                            fontWeight: 600,
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {administradores.length === 0 ? (
                  <MenuItem disabled>Cargando administradores...</MenuItem>
                ) : (
                  getAvailableAdministradores(formData.id).map((admin) => (
                    <MenuItem key={admin.uid} value={admin.uid}>
                      {admin.nombre} ({admin.email})
                    </MenuItem>
                  ))
                )}
              </Select>
              <Typography
                sx={{
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 500,
                  color: "#666",
                  fontSize: "0.85rem",
                  mt: 1,
                }}
              >
                💡 Puedes crear la flota sin asignar administradores y agregarlos después desde la edición
              </Typography>
            </FormControl>
          </Paper>

          {/* SECCIÓN 5: NOTA SOBRE SERVICIOS Y DOCUMENTOS */}
          <Paper sx={{ p: 2.5, bgcolor: "#e8f5e9", borderLeft: "4px solid #4caf50", borderRadius: 2 }}>
            <Typography
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 700,
                color: "#2e7d32",
                mb: 1,
                fontSize: "0.95rem",
              }}
            >
              ℹ️ Servicios y Documentos
            </Typography>
            <Typography
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 500,
                color: "#558b2f",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              Los servicios y documentos requeridos pueden ser asignados desde el panel de gestión de flotas una vez que la flota haya sido creada. Usa los botones de acción en la tabla para administrar servicios y documentos por departamento.
            </Typography>
          </Paper>

          {/* SECCIÓN 6: ESTADO */}
          <Paper sx={{ p: 2.5, bgcolor: "white", borderRadius: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.habilitado}
                  onChange={(e) => onFormDataChange({ ...formData, habilitado: e.target.checked })}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#4caf50",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#4caf50",
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>
                    🟢 Flota Habilitada
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: "Mulish, sans-serif", color: "#666" }}>
                    {formData.habilitado ? "✓ Activa" : "✗ Inactiva"}
                  </Typography>
                </Box>
              }
            />
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: "#f5f5f5" }}>
        <Button
          onClick={onClose}
          sx={{
            color: "#484848",
            fontFamily: "Mulish, sans-serif",
            fontWeight: 600,
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={isSaving}
          sx={{
            backgroundColor: "#d7171a",
            fontFamily: "Mulish, sans-serif",
            fontWeight: 700,
            px: 3,
            "&:hover": {
              backgroundColor: "#a00000",
            },
            "&:disabled": {
              backgroundColor: "#ccc",
            },
          }}
        >
          {isSaving ? "Guardando..." : editMode ? "✓ Actualizar" : "➕ Crear"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
