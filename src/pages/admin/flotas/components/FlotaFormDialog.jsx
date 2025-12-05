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
                label="URL Foto NIT"
                name="fotoNit"
                value={formData.fotoNit}
                onChange={onInputChange}
                placeholder="https://..."
                size="small"
                helperText="URL de la imagen del documento"
              />
            </Stack>
          </Paper>

          {/* SECCIÓN 4: PROPIETARIOS */}
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
              👥 Administradores
            </Typography>
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
            </FormControl>
          </Paper>

          {/* SECCIÓN 5: SERVICIOS */}
          {ciudadesServicios.length > 0 && (
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
                🚗 Servicios
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs 
                  value={ciudadSeleccionadaServicios || (ciudadesServicios[0] || "")}
                  onChange={(e, newValue) => setCiudadSeleccionadaServicios(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ "& .MuiTab-root": { fontFamily: "Mulish, sans-serif", fontWeight: 600, fontSize: "0.85rem" } }}
                >
                  {tabsServicios}
                </Tabs>
              </Box>

              {ciudadSeleccionadaServicios && serviciosPorCiudad[ciudadSeleccionadaServicios] && (
                <Stack spacing={1.5}>
                  {formData.servicios?.length > 0 && (
                    <Box sx={{ p: 1.5, bgcolor: "#f5f5f5", borderRadius: 1, maxHeight: "120px", overflowY: "auto" }}>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {formData.servicios.map((servicio) => (
                          <Chip
                            key={servicio}
                            label={servicio}
                            size="small"
                            onDelete={() => {
                              onFormDataChange({ ...formData, servicios: formData.servicios.filter(s => s !== servicio) });
                            }}
                            sx={{
                              bgcolor: "#000",
                              color: "white",
                              fontFamily: "Mulish, sans-serif",
                              fontWeight: 600,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  <FormControl fullWidth size="small">
                    <InputLabel>Seleccionar Servicios</InputLabel>
                    <Select
                      multiple
                      value={formData.servicios}
                      onChange={(e) => onFormDataChange({ ...formData, servicios: e.target.value })}
                      input={<OutlinedInput label="Seleccionar Servicios" />}
                      renderValue={(selected) => `${selected.length} servicio(s)`}
                    >
                      {serviciosPorCiudad[ciudadSeleccionadaServicios].map((servicio) => {
                        const nombreServicio = servicio.nombre || servicio.name || servicio.id;
                        return (
                          <MenuItem key={servicio.id} value={nombreServicio}>
                            {nombreServicio}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Stack>
              )}
            </Paper>
          )}

          {/* SECCIÓN 6: DOCUMENTOS */}
          {ciudadesDocumentos.length > 0 && (
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
                📑 Documentos Requeridos
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs 
                  value={ciudadSeleccionadaDocumentos || (ciudadesDocumentos[0] || "")}
                  onChange={(e, newValue) => setCiudadSeleccionadaDocumentos(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ "& .MuiTab-root": { fontFamily: "Mulish, sans-serif", fontWeight: 600, fontSize: "0.85rem" } }}
                >
                  {tabsDocumentos}
                </Tabs>
              </Box>

              {ciudadSeleccionadaDocumentos && documentosPorCiudad[ciudadSeleccionadaDocumentos] && (
                <Stack spacing={1.5}>
                  {formData.documentos?.length > 0 && (
                    <Box sx={{ p: 1.5, bgcolor: "#f5f5f5", borderRadius: 1, maxHeight: "120px", overflowY: "auto" }}>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {formData.documentos.map((docId) => {
                          let doc = null;
                          for (const c in documentosPorCiudad) {
                            const found = documentosPorCiudad[c]?.find(d => d.id === docId);
                            if (found) {
                              doc = found;
                              break;
                            }
                          }
                          const label = doc?.titulo || doc?.screenTitle || docId;
                          return (
                            <Chip
                              key={docId}
                              label={label}
                              size="small"
                              onDelete={() => {
                                onFormDataChange({ ...formData, documentos: formData.documentos.filter(d => d !== docId) });
                              }}
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
                    </Box>
                  )}
                  <FormControl fullWidth size="small">
                    <InputLabel>Seleccionar Documentos</InputLabel>
                    <Select
                      multiple
                      value={formData.documentos || []}
                      onChange={(e) => onFormDataChange({ ...formData, documentos: e.target.value })}
                      input={<OutlinedInput label="Seleccionar Documentos" />}
                      renderValue={(selected) => `${selected.length} documento(s)`}
                    >
                      {documentosPorCiudad[ciudadSeleccionadaDocumentos]?.filter(doc => {
                        return !formData.documentos?.includes(doc.id);
                      }).map((doc) => {
                        const nombreDoc = doc.titulo || doc.screenTitle || doc.id;
                        return (
                          <MenuItem key={doc.id} value={doc.id}>
                            {nombreDoc}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Stack>
              )}
            </Paper>
          )}

          {/* SECCIÓN 7: ESTADO */}
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
