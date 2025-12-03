// src/pages/admin/flotas/components/FlotaFormDialog.jsx
import React, { useEffect, useState } from "react";
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

  // Debug: Verificar que los datos lleguen al componente
  useEffect(() => {
    console.log('📋 FlotaFormDialog - Administradores recibidos:', administradores);
    console.log('📋 FlotaFormDialog - Servicios recibidos:', serviciosDisponibles);
    console.log('📋 FlotaFormDialog - Documentos recibidos:', documentosPorCiudad);
    console.log('📋 FlotaFormDialog - FormData:', formData);
  }, [administradores, serviciosDisponibles, documentosPorCiudad, formData]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: "#d7171a",
          color: "white",
          fontFamily: "Mulish, sans-serif",
          fontWeight: 900,
          fontSize: "1.5rem",
        }}
      >
        {editMode ? "Editar Flota" : "Crear Nueva Flota"}
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={3}>
          {/* Imagen de la Flota */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 800,
                color: "#d7171a",
                mb: 2,
                fontSize: "1.1rem",
                borderBottom: "2px solid #d7171a",
                pb: 1,
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
                    width: 150,
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "2px solid #d7171a",
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Perfil de la Flota */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 800,
                color: "#d7171a",
                mb: 2,
                fontSize: "1.1rem",
                borderBottom: "2px solid #d7171a",
                pb: 1,
              }}
            >
              📋 Perfil de la Flota
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              fullWidth
              label="Nombre de la Flota"
              name="nombre"
              value={formData.nombre}
              onChange={onInputChange}
              required
              size="small"
              sx={{ fontFamily: "Mulish, sans-serif" }}
            />
            <TextField
              fullWidth
              label="Representante Legal"
              name="representanteLegal"
              value={formData.representanteLegal}
              onChange={onInputChange}
              size="small"
              sx={{ fontFamily: "Mulish, sans-serif" }}
            />
            <TextField
              fullWidth
              label="Teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={onInputChange}
              size="small"
              sx={{ fontFamily: "Mulish, sans-serif" }}
            />
          </Box>

          {/* Documentos de la Flota */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 800,
                color: "#d7171a",
                mb: 2,
                fontSize: "1.1rem",
                borderBottom: "2px solid #d7171a",
                pb: 1,
              }}
            >
              📄 Documentos
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              fullWidth
              label="NIT"
              name="nit"
              value={formData.nit}
              onChange={onInputChange}
              required
              size="small"
              sx={{ fontFamily: "Mulish, sans-serif" }}
              helperText="Número de identificación tributaria"
            />
            <TextField
              fullWidth
              label="URL Foto NIT"
              name="fotoNit"
              value={formData.fotoNit}
              onChange={onInputChange}
              placeholder="https://..."
              size="small"
              sx={{ fontFamily: "Mulish, sans-serif" }}
              helperText="URL de la imagen del documento NIT"
            />
          </Box>

          {/* Propietarios */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 800,
                color: "#d7171a",
                mb: 2,
                fontSize: "1.1rem",
                borderBottom: "2px solid #d7171a",
                pb: 1,
              }}
            >
              👥 Propietarios (Administradores)
            </Typography>
          </Box>

          <Box>
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
                sx={{ fontFamily: "Mulish, sans-serif" }}
              >
                {administradores.length === 0 ? (
                  <MenuItem disabled>
                    <Typography sx={{ fontFamily: "Mulish, sans-serif", color: "#484848" }}>
                      Cargando administradores...
                    </Typography>
                  </MenuItem>
                ) : (
                  getAvailableAdministradores(formData.id).map((admin) => (
                    <MenuItem key={admin.uid} value={admin.uid}>
                      <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {admin.nombre} ({admin.email})
                      </Typography>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>

          {/* Servicios por Ciudad */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 800,
                color: "#d7171a",
                mb: 2,
                fontSize: "1.1rem",
                borderBottom: "2px solid #d7171a",
                pb: 1,
              }}
            >
              🚗 Servicios Disponibles por Ciudad
            </Typography>
          </Box>

          {/* Pestañas de Ciudades */}
          {Object.keys(serviciosPorCiudad).length > 0 && (
            <>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs 
                  value={ciudadSeleccionadaServicios || (Object.keys(serviciosPorCiudad)[0] || "")}
                  onChange={(e, newValue) => setCiudadSeleccionadaServicios(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {Object.keys(serviciosPorCiudad).map((ciudad) => (
                    <Tab key={ciudad} label={`📍 ${ciudad}`} value={ciudad} />
                  ))}
                </Tabs>
              </Box>

              {/* Selector de Servicios para la ciudad seleccionada */}
              {ciudadSeleccionadaServicios && serviciosPorCiudad[ciudadSeleccionadaServicios] && (
                <Box>
                  <Typography sx={{ mb: 1, fontFamily: "Mulish, sans-serif", fontSize: "0.9rem", color: "#666" }}>
                    Selecciona los servicios de {ciudadSeleccionadaServicios}:
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Seleccionar Servicios de {ciudadSeleccionadaServicios}</InputLabel>
                    <Select
                      multiple
                      value={formData.servicios}
                      onChange={(e) => onFormDataChange({ ...formData, servicios: e.target.value })}
                      input={<OutlinedInput label={`Seleccionar Servicios de ${ciudadSeleccionadaServicios}`} />}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((servicioNombre) => (
                            <Chip
                              key={servicioNombre}
                              label={servicioNombre}
                              size="small"
                              onDelete={() => {
                                const nuevosServicios = formData.servicios.filter(s => s !== servicioNombre);
                                onFormDataChange({ ...formData, servicios: nuevosServicios });
                              }}
                              sx={{
                                bgcolor: "#000000",
                                color: "white",
                                fontFamily: "Mulish, sans-serif",
                                fontWeight: 600,
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      sx={{ fontFamily: "Mulish, sans-serif" }}
                    >
                      {serviciosPorCiudad[ciudadSeleccionadaServicios].map((servicio) => {
                        const nombreServicio = servicio.nombre || servicio.name || servicio.id;
                        return (
                          <MenuItem key={servicio.id} value={nombreServicio}>
                            <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                              {nombreServicio}
                            </Typography>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </>
          )}

          {/* Documentos por Ciudad */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 800,
                color: "#d7171a",
                mb: 2,
                fontSize: "1.1rem",
                borderBottom: "2px solid #d7171a",
                pb: 1,
              }}
            >
              📄 Documentos Disponibles por Ciudad
            </Typography>
          </Box>

          {/* Pestañas de Ciudades para Documentos */}
          {documentosPorCiudad && Object.keys(documentosPorCiudad).length > 0 && (
            <>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs 
                  value={ciudadSeleccionadaDocumentos || (Object.keys(documentosPorCiudad)[0] || "")}
                  onChange={(e, newValue) => setCiudadSeleccionadaDocumentos(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {Object.keys(documentosPorCiudad).map((ciudad) => (
                    <Tab key={ciudad} label={`📍 ${ciudad}`} value={ciudad} />
                  ))}
                </Tabs>
              </Box>

              {/* Selector de Documentos para la ciudad seleccionada */}
              {ciudadSeleccionadaDocumentos && documentosPorCiudad[ciudadSeleccionadaDocumentos] && (
                <Box>
                  <Typography sx={{ mb: 1, fontFamily: "Mulish, sans-serif", fontSize: "0.9rem", color: "#666" }}>
                    Selecciona los documentos de {ciudadSeleccionadaDocumentos}:
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Seleccionar Documentos de {ciudadSeleccionadaDocumentos}</InputLabel>
                    <Select
                      multiple
                      value={formData.documentos || []}
                      onChange={(e) => onFormDataChange({ ...formData, documentos: e.target.value })}
                      input={<OutlinedInput label={`Seleccionar Documentos de ${ciudadSeleccionadaDocumentos}`} />}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((docNombre) => (
                            <Chip
                              key={docNombre}
                              label={docNombre}
                              size="small"
                              onDelete={() => {
                                const nuevosDocs = (formData.documentos || []).filter(d => d !== docNombre);
                                onFormDataChange({ ...formData, documentos: nuevosDocs });
                              }}
                              sx={{
                                bgcolor: "#d7171a",
                                color: "white",
                                fontFamily: "Mulish, sans-serif",
                                fontWeight: 600,
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      sx={{ fontFamily: "Mulish, sans-serif" }}
                    >
                      {documentosPorCiudad[ciudadSeleccionadaDocumentos].map((doc) => {
                        const nombreDoc = doc.titulo || doc.screenTitle || doc.id;
                        return (
                          <MenuItem key={doc.id} value={nombreDoc}>
                            <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                              {nombreDoc}
                            </Typography>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </>
          )}

          {/* Estado */}
          <Box sx={{ mt: 2 }}>
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
                    Flota Habilitada
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: "Mulish, sans-serif", color: "#666" }}>
                    {formData.habilitado
                      ? "La flota puede recibir y procesar solicitudes de viaje"
                      : "La flota no recibirá nuevas solicitudes de viaje"}
                  </Typography>
                </Box>
              }
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: "#f5f5f5" }}>
        <Button
          onClick={onClose}
          sx={{ color: "#484848", fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
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
            px: 4,
            "&:hover": {
              backgroundColor: "#a00000",
            },
            "&:disabled": {
              backgroundColor: "#ccc",
            },
          }}
        >
          {isSaving ? "Guardando..." : editMode ? "Actualizar" : "Crear Flota"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
