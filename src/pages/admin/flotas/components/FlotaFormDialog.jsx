// src/pages/admin/flotas/components/FlotaFormDialog.jsx
import React, { useEffect } from "react";
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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";

export const FlotaFormDialog = ({
  open,
  onClose,
  formData,
  onInputChange,
  onImageChange,
  imagePreview,
  administradores,
  serviciosDisponibles,
  onSave,
  isSaving,
  editMode,
  onFormDataChange,
  onOpenDocModal,
  onDeleteDocument,
  onViewDocument,
}) => {
  // Debug: Verificar que los datos lleguen al componente
  useEffect(() => {
    console.log('📋 FlotaFormDialog - Administradores recibidos:', administradores);
    console.log('📋 FlotaFormDialog - Servicios recibidos:', serviciosDisponibles);
    console.log('📋 FlotaFormDialog - FormData:', formData);
  }, [administradores, serviciosDisponibles, formData]);

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

          {/* Otros Documentos */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 800,
                  color: "#d7171a",
                  fontSize: "1.1rem",
                }}
              >
                📎 Otros Documentos
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={onOpenDocModal}
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
                Agregar Documento
              </Button>
            </Box>

            {formData.otrosDocumentos && formData.otrosDocumentos.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>Nombre</TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>Información</TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>Fecha</TableCell>
                      <TableCell align="center" sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.otrosDocumentos.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>{doc.tipo}</TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>{doc.nombre}</TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", maxWidth: "200px" }}>
                          {doc.contenido ? (
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontFamily: "Mulish, sans-serif",
                              }}
                            >
                              {doc.contenido}
                            </Typography>
                          ) : doc.url ? (
                            <Chip label="Archivo/URL" size="small" color="primary" />
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontFamily: "Mulish, sans-serif" }}
                            >
                              Sin info
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {doc.fechaSubida ? new Date(doc.fechaSubida).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell align="center">
                          {doc.url && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onViewDocument(doc.url)}
                              title="Ver documento"
                            >
                              👁️
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteDocument(index)}
                            title="Eliminar"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 1, fontFamily: "Mulish, sans-serif" }}>
                No hay documentos adicionales. Haz clic en "Agregar Documento" para comenzar.
              </Alert>
            )}
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
                          label={admin?.nombre || admin?.name || admin?.displayName || admin?.email?.split('@')[0] || uid}
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
                  administradores.map((admin) => (
                    <MenuItem key={admin.uid} value={admin.uid}>
                      <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {admin.nombre || admin.name || admin.displayName || admin.email?.split("@")[0] || admin.uid}
                      </Typography>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>

          {/* Servicios */}
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
              🚗 Servicios Disponibles
            </Typography>
          </Box>

          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Seleccionar Servicios</InputLabel>
              <Select
                multiple
                value={formData.servicios}
                onChange={(e) => onFormDataChange({ ...formData, servicios: e.target.value })}
                input={<OutlinedInput label="Seleccionar Servicios" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((servicioNombre) => (
                      <Chip
                        key={servicioNombre}
                        label={servicioNombre}
                        size="small"
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
                {serviciosDisponibles.length === 0 ? (
                  <MenuItem disabled>
                    <Typography sx={{ fontFamily: "Mulish, sans-serif", color: "#484848" }}>
                      Cargando servicios...
                    </Typography>
                  </MenuItem>
                ) : (
                  serviciosDisponibles.map((servicio) => {
                    const nombreServicio = servicio.nombre || servicio.name || servicio.title || servicio.tipo || servicio.id;
                    return (
                      <MenuItem key={servicio.id} value={nombreServicio}>
                        <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {nombreServicio}
                        </Typography>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>
          </Box>

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
