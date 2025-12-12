import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Grid,
  TextField,
} from "@mui/material";

const DetallesDialog = ({
  open,
  onClose,
  solicitudSeleccionada,
  formatearFecha,
  disabledTextFieldStyles,
}) => {
  if (!solicitudSeleccionada) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: "#d7171a", color: "white", fontWeight: "bold" }}>
        Detalles de la Solicitud
      </DialogTitle>
      <DialogContent sx={{ pt: 3, backgroundColor: "#fafafa", maxHeight: "80vh", overflow: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Información General */}
          <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
              📋 Información General
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Categoría"
                  value={solicitudSeleccionada.solicitud?.categoria || ""}
                  disabled
                  fullWidth
                  size="small"
                  sx={disabledTextFieldStyles}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Servicio"
                  value={solicitudSeleccionada.solicitud?.servicio || ""}
                  disabled
                  fullWidth
                  size="small"
                  sx={disabledTextFieldStyles}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Estado"
                  value={solicitudSeleccionada.estado || ""}
                  disabled
                  fullWidth
                  size="small"
                  sx={disabledTextFieldStyles}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Fecha de Creación"
                  value={formatearFecha(solicitudSeleccionada.solicitud?.fechaCreacion)}
                  disabled
                  fullWidth
                  size="small"
                  sx={disabledTextFieldStyles}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Origen */}
          {solicitudSeleccionada.solicitud?.origen && (
            <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                📍 Origen
              </Typography>
              <TextField
                label="Dirección"
                value={solicitudSeleccionada.solicitud.origen.direccion || ""}
                disabled
                fullWidth
                size="small"
                multiline
                minRows={3}
                sx={disabledTextFieldStyles}
              />
            </Box>
          )}

          {/* Destino */}
          {solicitudSeleccionada.solicitud?.destino && (
            <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                📍 Destino
              </Typography>
              <TextField
                label="Dirección"
                value={solicitudSeleccionada.solicitud.destino.direccion || ""}
                disabled
                fullWidth
                size="small"
                multiline
                minRows={3}
                sx={disabledTextFieldStyles}
              />
            </Box>
          )}

          {/* Ubicación */}
          {solicitudSeleccionada.solicitud?.ubicacion && (
            <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                📍 Ubicación
              </Typography>
              <TextField
                label="Dirección"
                value={solicitudSeleccionada.solicitud.ubicacion.direccion || ""}
                disabled
                fullWidth
                size="small"
                multiline
                minRows={3}
                sx={disabledTextFieldStyles}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DetallesDialog;
