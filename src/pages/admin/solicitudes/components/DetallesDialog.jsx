import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, Box, Typography, Grid, TextField, IconButton, Modal, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

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
  limpiarNull = (v) => {
    // Si es null, undefined o 'null', retorna null
    if (v === null || v === undefined || v === 'null') return null;
    // Si es un objeto, NO lo renderices, excepto si es un Date
    if (typeof v === 'object' && !(v instanceof Date)) return null;
    return v;
  },
  mostrarBooleano = (v) => v === true ? 'Sí' : v === false ? 'No' : limpiarNull(v),
}) => {
  const [imagenExpandida, setImagenExpandida] = useState(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState(null);

  // Cargar teléfono del usuario desde Firestore si no existe en la solicitud
  useEffect(() => {
    if (!open || !solicitudSeleccionada) return;

    const loadUserPhone = async () => {
      try {
        const uidUser = solicitudSeleccionada.uidUser || solicitudSeleccionada.solicitud?.uidUser || "";
        
        // Primero buscar en la raíz
        if (solicitudSeleccionada.phone) {
          setUserPhoneNumber(solicitudSeleccionada.phone);
          return;
        }
        if (solicitudSeleccionada.solicitud?.phone) {
          setUserPhoneNumber(solicitudSeleccionada.solicitud.phone);
          return;
        }
        
        // Luego en pasajero
        if (solicitudSeleccionada.pasajero?.perfil?.phone) {
          setUserPhoneNumber(solicitudSeleccionada.pasajero.perfil.phone);
          return;
        }
        if (solicitudSeleccionada.solicitud?.pasajero?.perfil?.phone) {
          setUserPhoneNumber(solicitudSeleccionada.solicitud.pasajero.perfil.phone);
          return;
        }

        // Si no encontramos, buscar en Firestore
        if (uidUser) {
          const userDocRef = doc(db, "pasajeros", uidUser);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const phone = userData.phone || userData.perfil?.phone || userData.phoneNumber || null;
            setUserPhoneNumber(phone);
            console.log("DetallesDialog - Teléfono cargado desde Firestore:", phone);
          }
        }
      } catch (error) {
        console.error("Error cargando teléfono del usuario:", error);
      }
    };

    loadUserPhone();
  }, [open, solicitudSeleccionada]);

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
    // Primero retornar el que cargamos desde Firestore
    if (userPhoneNumber) {
      return userPhoneNumber;
    }
    
    // Buscar en la raíz primero
    if (solicitudSeleccionada.phone) {
      return solicitudSeleccionada.phone;
    }
    if (solicitudSeleccionada.solicitud?.phone) {
      return solicitudSeleccionada.solicitud.phone;
    }
    
    // Buscar en los datos del pasajero de la solicitud
    if (solicitudSeleccionada.pasajero?.perfil?.phone) {
      return solicitudSeleccionada.pasajero.perfil.phone;
    }
    if (solicitudSeleccionada.solicitud?.pasajero?.perfil?.phone) {
      return solicitudSeleccionada.solicitud.pasajero.perfil.phone;
    }
    
    // Buscar en el array de pasajeros
    if (pasajeros && uidUser) {
      const pasajero = pasajeros.find(p => p.id === uidUser);
      if (pasajero) {
        return pasajero.phone || pasajero.perfil?.phone || pasajero.phoneNumber || null;
      }
    }
    
    return null;
  };

  const phoneNumber = getPhoneNumber();

  console.log("DetallesDialog - solicitudSeleccionada:", solicitudSeleccionada);
  console.log("DetallesDialog - phoneNumber:", phoneNumber);
  console.log("DetallesDialog - sendWhatsApp:", sendWhatsApp);

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
                    value={limpiarNull(s.categoria)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
              )}

              {s.servicio && (
                <Grid item xs={6}>
                  <TextField
                    label="Servicio"
                    value={limpiarNull(s.servicio)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
              )}

              {estado && (
                <Grid item xs={6}>
                  <TextField
                    label="Estado"
                    value={limpiarNull(estado)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
              )}

              {(solicitudSeleccionada.fechaCreacion || s.fechaCreacion) && (
                <Grid item xs={6}>
                  <TextField
                    label="Fecha de Creación"
                    value={limpiarNull(formatMaybeTimestamp(solicitudSeleccionada.fechaCreacion || s.fechaCreacion))}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
              )}

              {s.tipoContenido && (
                <Grid item xs={6}>
                  <TextField
                    label="Tipo de Contenido"
                    value={limpiarNull(s.tipoContenido)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
              )}

              {typeof s.precioBase !== 'undefined' && (
                <Grid item xs={6}>
                  <TextField
                    label="Precio Base"
                    value={limpiarNull(s.precioBase)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
              )}

              {typeof s.precioEstimado !== 'undefined' && (
                <Grid item xs={6}>
                  <TextField
                    label="Precio Estimado"
                    value={limpiarNull(s.precioEstimado)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
              )}

              {typeof s.duracionHoras !== 'undefined' && (
                <Grid item xs={6}>
                  <TextField
                    label="Duración (horas)"
                    value={limpiarNull(s.duracionHoras)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
              )}

              {solicitudSeleccionada.conductor_asignado && (
                <Grid item xs={6}>
                  <TextField
                    label="Conductor Asignado"
                    value={limpiarNull(obtenerNombreConductor ? obtenerNombreConductor(solicitudSeleccionada.conductor_asignado) : (solicitudSeleccionada.conductor_asignado || ''))}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
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
                value={limpiarNull(solicitudSeleccionada.solicitud.origen.direccion)}
                disabled
                fullWidth
                size="small"
                multiline
                minRows={3}
                sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
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
                  value={limpiarNull(solicitudSeleccionada.solicitud.descripcion)}
                  disabled
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  sx={{ mb: 1, ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                />
              )}
              {solicitudSeleccionada.solicitud?.datosEspecificos && Object.keys(solicitudSeleccionada.solicitud.datosEspecificos).length > 0 && (
                <Box>
                  {Object.entries(solicitudSeleccionada.solicitud.datosEspecificos).map(([k, v]) => {
                    // Si es timestamp, formatear
                    if (v && typeof v === 'object' && (typeof v.seconds === 'number' || typeof v.toDate === 'function')) {
                      return (
                        <TextField
                          key={k}
                          label={String(k)}
                          value={limpiarNull(formatMaybeTimestamp(v))}
                          disabled
                          fullWidth
                          size="small"
                          sx={{ mb: 1, ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                        />
                      );
                    } else if (typeof v === 'object' && v !== null) {
                      // Si es un objeto, mostrar solo una propiedad representativa si existe
                      const resumen = v.nombre || v.name || v.email || v.id || v.displayName || null;
                      if (resumen && typeof resumen !== 'object') {
                        return (
                          <TextField
                            key={k}
                            label={String(k)}
                            value={limpiarNull(resumen)}
                            disabled
                            fullWidth
                            size="small"
                            sx={{ mb: 1, ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                          />
                        );
                      }
                      // Si no hay campo representativo o es objeto, ignorar el campo
                      return null;
                    } else {
                      // Valor primitivo
                      let displayValue = v;
                      if (typeof v === 'boolean') {
                        displayValue = mostrarBooleano(v);
                      } else {
                        displayValue = limpiarNull(String(v));
                      }
                      // Si limpiarNull retorna null, no renderizar
                      if (displayValue === null) return null;
                      return (
                        <TextField
                          key={k}
                          label={String(k)}
                          value={displayValue}
                          disabled
                          fullWidth
                          size="small"
                          sx={{ mb: 1, ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                        />
                      );
                    }
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
                value={limpiarNull(solicitudSeleccionada.solicitud.destino.direccion)}
                disabled
                fullWidth
                size="small"
                multiline
                minRows={3}
                sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
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
                value={limpiarNull(solicitudSeleccionada.solicitud.ubicacion.direccion)}
                disabled
                fullWidth
                size="small"
                multiline
                minRows={3}
                sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
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
                      value={limpiarNull(formatMaybeTimestamp(
                        solicitudSeleccionada.solicitud?.fechaProgramada ||
                        solicitudSeleccionada.solicitud?.detalles?.fechaProgramada ||
                        solicitudSeleccionada.solicitud?.detalles?.fechaProgramada
                      ))}
                      disabled
                      fullWidth
                      size="small"
                      sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                    />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Hora Programada"
                    value={limpiarNull(solicitudSeleccionada.solicitud?.horaProgramada)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Lo necesito ahora"
                    value={limpiarNull(String(solicitudSeleccionada.solicitud?.loNecesitoAhora ?? ''))}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Precio Estimado"
                    value={limpiarNull(solicitudSeleccionada.solicitud?.precioEstimado)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
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
                      value={limpiarNull(solicitudSeleccionada.solicitud.remitente?.nombre)}
                      disabled
                      fullWidth
                      size="small"
                      sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                    />
                    <TextField
                      label="Teléfono Remitente"
                      value={limpiarNull(solicitudSeleccionada.solicitud.remitente?.telefono)}
                      disabled
                      fullWidth
                      size="small"
                      sx={{ mt: 1, ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                    />
                  </Grid>
                )}

                {solicitudSeleccionada.solicitud?.destinatario && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Destinatario"
                      value={limpiarNull(solicitudSeleccionada.solicitud.destinatario?.nombre)}
                      disabled
                      fullWidth
                      size="small"
                      sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                    />
                    <TextField
                      label="Teléfono Destinatario"
                      value={limpiarNull(solicitudSeleccionada.solicitud.destinatario?.telefono)}
                      disabled
                      fullWidth
                      size="small"
                      sx={{ mt: 1, ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                    />
                  </Grid>
                )}

                {solicitudSeleccionada.solicitud?.paquete && (
                  <Grid item xs={12}>
                    <TextField
                      label="Descripción del Paquete"
                      value={limpiarNull(solicitudSeleccionada.solicitud.paquete?.descripcion)}
                      disabled
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
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
                    value={limpiarNull(solicitudSeleccionada.solicitud.numeroReferencia)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                  />
                </Grid>
              )}

              {typeof solicitudSeleccionada.solicitud?.requiereComprobante !== 'undefined' && (
                <Grid item xs={6}>
                  <TextField
                    label="Requiere comprobante"
                    value={mostrarBooleano(solicitudSeleccionada.solicitud.requiereComprobante)}
                    disabled
                    fullWidth
                    size="small"
                    sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
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
                        value={limpiarNull(formatMaybeTimestamp(solicitudSeleccionada.solicitud.fechaInicio))}
                        disabled
                        fullWidth
                        size="small"
                        sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                      />
                    </Grid>
                  )}
                  {solicitudSeleccionada.solicitud?.horaInicio && (
                    <Grid item xs={6}>
                      <TextField
                        label="Hora Inicio"
                        value={limpiarNull(solicitudSeleccionada.solicitud.horaInicio)}
                        disabled
                        fullWidth
                        size="small"
                        sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
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
                        limpiarNull(passengerName || (obtenerNombreUsuario ? obtenerNombreUsuario(uidUser) : (uidUser || '')))
                      }
                      disabled
                      fullWidth
                      size="small"
                      sx={{ ...disabledTextFieldStyles, '& .MuiInputBase-input.Mui-disabled': { color: '#000', WebkitTextFillColor: '#000' } }}
                    />
                    {sendWhatsApp && (
                      <Tooltip title={phoneNumber ? "Contactar por WhatsApp" : "Sin teléfono disponible"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (phoneNumber) {
                                const nombreUsuario = passengerName || (obtenerNombreUsuario ? obtenerNombreUsuario(uidUser) : uidUser);
                                const tipoServicio = s.servicio || s.categoria || "";
                                sendWhatsApp(phoneNumber, nombreUsuario, tipoServicio);
                              }
                            }}
                            disabled={!phoneNumber}
                            sx={{
                              color: phoneNumber ? "#25D366" : "#bdbdbd",
                              "&:hover": {
                                backgroundColor: phoneNumber ? "rgba(37, 211, 102, 0.1)" : "transparent",
                              },
                            }}
                          >
                            <WhatsAppIcon />
                          </IconButton>
                        </span>
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
