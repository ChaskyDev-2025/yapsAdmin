import React from "react";
import { Dialog, DialogTitle, DialogContent, Box, Typography, Grid, TextField, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const DetallesDialog = ({
  open,
  onClose,
  solicitudSeleccionada,
  formatearFecha,
  disabledTextFieldStyles,
  obtenerNombreUsuario,
  obtenerNombreConductor,
}) => {
  if (!solicitudSeleccionada) return null;

  const formatMaybeTimestamp = (val) => {
    if (!val) return "-";
    if (val?.toDate) return formatearFecha(val.toDate());
    if (typeof val === 'object' && typeof val.seconds === 'number') return formatearFecha(new Date(val.seconds * 1000));
    if (val instanceof Date) return formatearFecha(val);
    if (typeof val === 'number') return formatearFecha(new Date(val));
    try { return formatearFecha(new Date(val)); } catch { return String(val); }
  };

  const s = solicitudSeleccionada.solicitud || {};
  const estado = solicitudSeleccionada.estado || "";

  // Usar preferentemente el nombre del pasajero desde la estructura estándar: `solicitud.pasajero.perfil.name`.
  // Si no está presente, usar el uid para resolver con `obtenerNombreUsuario` (consulta a `pasajeros/{uid}.perfil.name`).
  const uidUser = solicitudSeleccionada.uidUser || s.uidUser || "";

  const passengerName = solicitudSeleccionada.pasajero?.perfil?.name || s.pasajero?.perfil?.name || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: "#d7171a", color: "white", fontWeight: "bold", display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Detalles de la Solicitud</Typography>
        <IconButton aria-label="cerrar" onClick={onClose} sx={{ color: 'white' }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 2, backgroundColor: "#fafafa", maxHeight: "70vh", overflow: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Información General */}
          <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
              📋 Información General
            </Typography>
            <Grid container spacing={2}>
              {s.categoria && (
                <Grid item xs={6}>
                  <TextField
                    label="Categoría"
                    value={s.categoria}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {s.servicio && (
                <Grid item xs={6}>
                  <TextField
                    label="Servicio"
                    value={s.servicio}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {estado && (
                <Grid item xs={6}>
                  <TextField
                    label="Estado"
                    value={estado}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {(solicitudSeleccionada.fechaCreacion || s.fechaCreacion) && (
                <Grid item xs={6}>
                  <TextField
                    label="Fecha de Creación"
                    value={formatMaybeTimestamp(solicitudSeleccionada.fechaCreacion || s.fechaCreacion)}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {s.tipoContenido && (
                <Grid item xs={6}>
                  <TextField
                    label="Tipo de Contenido"
                    value={s.tipoContenido}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {typeof s.precioBase !== 'undefined' && (
                <Grid item xs={6}>
                  <TextField
                    label="Precio Base"
                    value={s.precioBase}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {typeof s.precioEstimado !== 'undefined' && (
                <Grid item xs={6}>
                  <TextField
                    label="Precio Estimado"
                    value={s.precioEstimado}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {typeof s.duracionHoras !== 'undefined' && (
                <Grid item xs={6}>
                  <TextField
                    label="Duración (horas)"
                    value={s.duracionHoras}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {solicitudSeleccionada.conductor_asignado && (
                <Grid item xs={6}>
                  <TextField
                    label="Conductor Asignado"
                    value={obtenerNombreConductor ? obtenerNombreConductor(solicitudSeleccionada.conductor_asignado) : (solicitudSeleccionada.conductor_asignado || '')}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}
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

          {/* Datos específicos y descripción */}
          {(solicitudSeleccionada.solicitud?.descripcion || (solicitudSeleccionada.solicitud?.datosEspecificos && Object.keys(solicitudSeleccionada.solicitud.datosEspecificos).length > 0)) && (
            <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                📝 Detalles
              </Typography>
              {solicitudSeleccionada.solicitud?.descripcion && (
                <TextField
                  label="Descripción"
                  value={solicitudSeleccionada.solicitud.descripcion || ""}
                  disabled
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  sx={{ mb: 1, ...disabledTextFieldStyles }}
                />
              )}
              {solicitudSeleccionada.solicitud?.datosEspecificos && Object.keys(solicitudSeleccionada.solicitud.datosEspecificos).length > 0 && (
                <Box>
                  {Object.entries(solicitudSeleccionada.solicitud.datosEspecificos).map(([k, v]) => {
                    // Si es timestamp, formatear
                    let display = "";
                    if (v && typeof v === 'object' && (typeof v.seconds === 'number' || typeof v.toDate === 'function')) {
                      display = formatMaybeTimestamp(v);
                    } else if (typeof v === 'object') {
                      display = JSON.stringify(v);
                    } else {
                      display = String(v);
                    }

                    return (
                      <TextField
                        key={k}
                        label={String(k)}
                        value={display}
                        disabled
                        fullWidth
                        size="small"
                        sx={{ mb: 1, ...disabledTextFieldStyles }}
                      />
                    );
                  })}
                </Box>
              )}
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

          {/* Programación y costos */}
          {(solicitudSeleccionada.solicitud?.fechaProgramada || solicitudSeleccionada.solicitud?.horaProgramada || solicitudSeleccionada.solicitud?.precioEstimado !== undefined) && (
            <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                ⏰ Programación / Precio
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                      label="Fecha Programada"
                      value={formatMaybeTimestamp(
                        solicitudSeleccionada.solicitud?.fechaProgramada ||
                        solicitudSeleccionada.solicitud?.detalles?.fechaProgramada ||
                        solicitudSeleccionada.solicitud?.detalles?.fechaProgramada
                      )}
                      disabled
                      fullWidth
                      size="small"
                      sx={disabledTextFieldStyles}
                    />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Hora Programada"
                    value={solicitudSeleccionada.solicitud?.horaProgramada || ""}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Lo necesito ahora"
                    value={String(solicitudSeleccionada.solicitud?.loNecesitoAhora ?? '')}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Precio Estimado"
                    value={solicitudSeleccionada.solicitud?.precioEstimado ?? ''}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Destinatario / Remitente / Paquete */}
          {(solicitudSeleccionada.solicitud?.destinatario || solicitudSeleccionada.solicitud?.remitente || solicitudSeleccionada.solicitud?.paquete) && (
            <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
                👥 Participantes / Paquete
              </Typography>
              <Grid container spacing={2}>
                {solicitudSeleccionada.solicitud?.remitente && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Remitente"
                      value={solicitudSeleccionada.solicitud.remitente?.nombre || ''}
                      disabled
                      fullWidth
                      size="small"
                      sx={disabledTextFieldStyles}
                    />
                    <TextField
                      label="Teléfono Remitente"
                      value={solicitudSeleccionada.solicitud.remitente?.telefono || ''}
                      disabled
                      fullWidth
                      size="small"
                      sx={{ mt: 1, ...disabledTextFieldStyles }}
                    />
                  </Grid>
                )}

                {solicitudSeleccionada.solicitud?.destinatario && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Destinatario"
                      value={solicitudSeleccionada.solicitud.destinatario?.nombre || ''}
                      disabled
                      fullWidth
                      size="small"
                      sx={disabledTextFieldStyles}
                    />
                    <TextField
                      label="Teléfono Destinatario"
                      value={solicitudSeleccionada.solicitud.destinatario?.telefono || ''}
                      disabled
                      fullWidth
                      size="small"
                      sx={{ mt: 1, ...disabledTextFieldStyles }}
                    />
                  </Grid>
                )}

                {solicitudSeleccionada.solicitud?.paquete && (
                  <Grid item xs={12}>
                    <TextField
                      label="Descripción del Paquete"
                      value={solicitudSeleccionada.solicitud.paquete?.descripcion || ''}
                      disabled
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      sx={{ ...disabledTextFieldStyles }}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Opciones y metadatos */}
          <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#d7171a" }}>
              ⚙️ Opciones / Metadatos
            </Typography>
            <Grid container spacing={2}>
              {solicitudSeleccionada.solicitud?.numeroReferencia && (
                <Grid item xs={6}>
                  <TextField
                    label="Número de referencia"
                    value={solicitudSeleccionada.solicitud.numeroReferencia}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {typeof solicitudSeleccionada.solicitud?.requiereComprobante !== 'undefined' && (
                <Grid item xs={6}>
                  <TextField
                    label="Requiere comprobante"
                    value={String(solicitudSeleccionada.solicitud.requiereComprobante)}
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}

              {(solicitudSeleccionada.solicitud?.fechaInicio || solicitudSeleccionada.solicitud?.horaInicio) && (
                <>
                  {solicitudSeleccionada.solicitud?.fechaInicio && (
                    <Grid item xs={6}>
                      <TextField
                        label="Fecha Inicio"
                        value={formatMaybeTimestamp(solicitudSeleccionada.solicitud.fechaInicio)}
                        disabled
                        fullWidth
                        size="small"
                        sx={disabledTextFieldStyles}
                      />
                    </Grid>
                  )}
                  {solicitudSeleccionada.solicitud?.horaInicio && (
                    <Grid item xs={6}>
                      <TextField
                        label="Hora Inicio"
                        value={solicitudSeleccionada.solicitud.horaInicio}
                        disabled
                        fullWidth
                        size="small"
                        sx={disabledTextFieldStyles}
                      />
                    </Grid>
                  )}
                </>
              )}

              {/* Coordenadas removidas por solicitud del usuario */}

              { (passengerName || solicitudSeleccionada.uidUser) && (
                <Grid item xs={6}>
                  <TextField
                    label="Usuario"
                    value={
                      passengerName || (obtenerNombreUsuario ? obtenerNombreUsuario(uidUser) : (uidUser || ''))
                    }
                    disabled
                    fullWidth
                    size="small"
                    sx={disabledTextFieldStyles}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DetallesDialog;
