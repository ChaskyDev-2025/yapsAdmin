import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, Box, Typography, Grid, TextField, IconButton, Modal, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

const DetallesDialog = ({
  open,
  onClose,
  solicitudSeleccionada,
  formatearFecha,
  disabledTextFieldStyles,
  obtenerNombreUsuario,
  obtenerNombreConductor,
  sendWhatsApp,
  pasajeros,
}) => {
  const [imagenExpandida, setImagenExpandida] = useState(null);

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

  // Obtener teléfono del pasajero
  const getPhoneNumber = () => {
    if (pasajeros && uidUser) {
      const pasajero = pasajeros.find(p => p.id === uidUser);
      if (pasajero && pasajero.phone) {
        return pasajero.phone;
      }
    }
    return null;
  };

  const phoneNumber = getPhoneNumber();

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
              Información General
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
                Origen
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
                Detalles
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
                Destino
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
                Ubicación
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
                Programación / Precio
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
                Participantes / Paquete
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
              Opciones / Metadatos
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

              {/* Comprobante de Pago (si estado es aceptado, conductor_asignado, en_curso o finalizado) */}
              {(solicitudSeleccionada.estado === "aceptado" || solicitudSeleccionada.estado === "conductor_asignado" || solicitudSeleccionada.estado === "en_curso" || solicitudSeleccionada.estado === "finalizado") && (
                <Grid item xs={12}>
                  {(solicitudSeleccionada.solicitud?.oferta?.comprobantePagoUrl) ? (
                    <Box sx={{ backgroundColor: "#f0f7ff", p: 2, borderRadius: 1, border: "1px solid #2196f3" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#1976d2" }}>
                        Comprobante de Pago
                      </Typography>
                      <Box
                        component="img"
                        src={solicitudSeleccionada.solicitud?.oferta?.comprobantePagoUrl}
                        alt="Comprobante de pago"
                        sx={{
                          width: "100%",
                          maxHeight: 300,
                          objectFit: "contain",
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                          "&:hover": { transform: "scale(1.02)" }
                        }}
                        onClick={() => setImagenExpandida(solicitudSeleccionada.solicitud?.oferta?.comprobantePagoUrl)}
                        title="Haz clic para ampliar"
                      />
                    </Box>
                  ) : (
                    <Box sx={{ backgroundColor: "#fff3e0", p: 2, borderRadius: 1, border: "1px solid #ff9800" }}>
                      <Typography variant="body2" sx={{ color: "#e65100" }}>
                        Comprobante pendiente de pago
                      </Typography>
                    </Box>
                  )}
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                    {phoneNumber && sendWhatsApp && (
                      <Tooltip title="Contactar por WhatsApp">
                        <IconButton
                          size="small"
                          onClick={() => sendWhatsApp(phoneNumber, passengerName || (obtenerNombreUsuario ? obtenerNombreUsuario(uidUser) : uidUser))}
                          sx={{
                            color: "#25D366",
                            "&:hover": {
                              backgroundColor: "rgba(37, 211, 102, 0.1)",
                            },
                          }}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </DialogContent>

      {/* Modal para imagen expandida del comprobante */}
      <Modal
        open={Boolean(imagenExpandida)}
        onClose={() => setImagenExpandida(null)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1400,
        }}
      >
        <Box
          onClick={() => setImagenExpandida(null)}
          sx={{
            position: "relative",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            padding: 2,
            borderRadius: 2,
            maxWidth: "90vw",
            maxHeight: "90vh",
            overflow: "auto",
            cursor: "pointer",
          }}
        >
          <IconButton
            onClick={() => setImagenExpandida(null)}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.8)" },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={imagenExpandida}
            alt="Comprobante expandido"
            sx={{
              width: "100%",
              height: "auto",
              maxHeight: "85vh",
              objectFit: "contain",
            }}
          />
        </Box>
      </Modal>
    </Dialog>
  );
};

export default DetallesDialog;
