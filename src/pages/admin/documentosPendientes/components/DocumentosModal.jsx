import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
  Snackbar,
  Alert,
  Divider,
  Stack,
  IconButton,
  Card,
  CardContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Switch,
  FormControlLabel,
  TextField,
  Modal,
} from "@mui/material";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { useAuth } from "../../../../auth/AuthContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CancelIcon from "@mui/icons-material/Cancel";
import ZoomInIcon from "@mui/icons-material/ZoomIn";

const DocumentosModal = ({
  open,
  onClose,
  selectedTrabajador,
  onDocumentApproved,
  onDocumentRejected,
}) => {
  const { userRole } = useAuth();
  const isAdminOrSuperAdmin = userRole === "admin" || userRole === "superadmin";
  
  // Función para capitalizar nombres
  const capitalizarNombre = (nombre) => {
    if (!nombre) return "";
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [documentoActivo, setDocumentoActivo] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [documentosAprobados, setDocumentosAprobados] = useState(false);
  const [fotoExpandida, setFotoExpandida] = useState(null); // Para el modal de imagen
  const [motivoRechazo, setMotivoRechazo] = useState(""); // Para el justificativo de rechazo
  const [mostrarFormularioRechazo, setMostrarFormularioRechazo] = useState(false);

  // Procesar documentos al abrir el modal
  useEffect(() => {
    if (selectedTrabajador?.documentos) {
      // Extraer documentos: cada documento es un objeto con fotos, textos, idConfig, etc
      const docsObj = selectedTrabajador.documentos;
      const docsArray = [];
      
      // Recorrer todas las claves del objeto documentos
      Object.keys(docsObj).forEach((key) => {
        // Ignorar propiedades especiales
        if (['updatedAt', 'documentosActualizadoEn'].includes(key)) {
          return;
        }
        
        const docData = docsObj[key];
        
        // Verificar que sea un objeto con la estructura esperada (fotos, textos, idConfig)
        if (typeof docData === 'object' && docData !== null && docData.fotos) {
          // Extraer el título desde textos o usar la clave como nombre
          const titulo = docData.textos?.titulo || key;
          const fotos = Array.isArray(docData.fotos) ? docData.fotos : Object.values(docData.fotos || {});
          
          // Procesar textos: normalizar a un objeto con claves numéricas
          let textosProcessed = {};
          if (docData.textos && typeof docData.textos === 'object') {
            Object.keys(docData.textos).forEach(textKey => {
              if (textKey !== 'titulo') {
                const textItem = docData.textos[textKey];
                // Si es un objeto con label y valor, guardarlo directamente
                if (typeof textItem === 'object' && textItem !== null && (textItem.label || textItem.valor)) {
                  textosProcessed[textKey] = textItem;
                }
              }
            });
          }
          
          docsArray.push({
            key, // nombre/clave del documento
            nombre: titulo,
            estado: docData.estado || "pendiente",
            fotos: fotos, // Array de fotos
            textos: textosProcessed, // Textos/campos normalizados
            textosRaw: docData.textos, // Textos crudos por si acaso
            idConfig: docData.idConfig,
            updatedAt: docData.updatedAt,
            motivoRechazo: docData.motivoRechazo || null, // Guardar motivo de rechazo
            aprobadoEn: docData.aprobadoEn || null,
            rechazadoEn: docData.rechazadoEn || null,
            fecha: docData.updatedAt || docData.fecha,
          });
        }
      });
      
      setDocumentos(docsArray);
      setDocumentoActivo(null);
      
      // Cargar estado documentos_aprobados desde la raíz del trabajador
      setDocumentosAprobados(selectedTrabajador.documentos_aprobados || false);
    }
  }, [selectedTrabajador, open]);

  const handleApproveDocument = async (trabajadorId, docKey) => {
    try {
      const trabajadorRef = doc(db, "trabajadores", trabajadorId);
      const trabajadorSnap = await getDoc(trabajadorRef);
      const docsObj = trabajadorSnap.data().documentos || {};
      
      // Actualizar el documento con la clave correcta
      if (docsObj[docKey]) {
        docsObj[docKey].estado = "aprobado";
        docsObj[docKey].aprobadoEn = new Date().toISOString();
        delete docsObj[docKey].motivoRechazo;
      }

      // Calcular documentos_aprobados: todos deben estar aprobados
      const documentosAprobadosValue = Object.keys(docsObj)
        .filter(key => !['updatedAt', 'documentosActualizadoEn'].includes(key))
        .filter(key => docsObj[key] && typeof docsObj[key] === 'object' && docsObj[key].fotos)
        .every(key => docsObj[key].estado === "aprobado");

      // Una sola operación que actualiza todo
      await updateDoc(trabajadorRef, { 
        documentos: docsObj,
        documentos_aprobados: documentosAprobadosValue,
        activo: documentosAprobadosValue
      });
      
      // Actualizar lista local
      const updatedDocs = documentos.map((d) => {
        if (d.key === docKey) {
          return { ...d, estado: "aprobado", aprobadoEn: new Date().toISOString() };
        }
        return d;
      });
      setDocumentos(updatedDocs);
      setDocumentosAprobados(documentosAprobadosValue);
      setDocumentoActivo(null);
      
      setSnackbar({
        open: true,
        message: "Documento aprobado correctamente",
        severity: "success",
      });

      onDocumentApproved();
    } catch (error) {
      console.error("Error al aprobar:", error);
      setSnackbar({
        open: true,
        message: "Error al aprobar documento",
        severity: "error",
      });
    }
  };

  const handleRejectDocument = async (trabajadorId, docKey) => {
    try {
      const trabajadorRef = doc(db, "trabajadores", trabajadorId);
      const trabajadorSnap = await getDoc(trabajadorRef);
      const docsObj = trabajadorSnap.data().documentos || {};
      
      // Actualizar el documento con la clave correcta
      if (docsObj[docKey]) {
        docsObj[docKey].estado = "rechazado";
        docsObj[docKey].rechazadoEn = new Date().toISOString();
      }
      
      // Calcular documentos_aprobados: todos deben estar aprobados
      const documentosAprobadosValue = Object.keys(docsObj)
        .filter(key => !['updatedAt', 'documentosActualizadoEn'].includes(key))
        .filter(key => docsObj[key] && typeof docsObj[key] === 'object' && docsObj[key].fotos)
        .every(key => docsObj[key].estado === "aprobado");

      // Una sola operación que actualiza todo
      await updateDoc(trabajadorRef, { 
        documentos: docsObj,
        documentos_aprobados: documentosAprobadosValue,
        activo: false // Desactivar automáticamente si hay rechazos
      });
      
      // Actualizar lista local
      const updatedDocs = documentos.map((d) => {
        if (d.key === docKey) {
          return { ...d, estado: "rechazado", rechazadoEn: new Date().toISOString() };
        }
        return d;
      });
      setDocumentos(updatedDocs);
      setDocumentosAprobados(documentosAprobadosValue);
      setDocumentoActivo(null);
      
      setSnackbar({
        open: true,
        message: "Documento rechazado y trabajador desactivado",
        severity: "warning",
      });

      onDocumentRejected();
    } catch (error) {
      console.error("Error al rechazar:", error);
      setSnackbar({
        open: true,
        message: "Error al rechazar documento",
        severity: "error",
      });
    }
  };

  const handleChangeEstado = async (trabajadorId, docKey, nuevoEstado, motivo = "") => {
    try {
      const trabajadorRef = doc(db, "trabajadores", trabajadorId);
      const trabajadorSnap = await getDoc(trabajadorRef);
      const docsObj = trabajadorSnap.data().documentos || {};
      
      // Actualizar el documento con la clave correcta
      if (docsObj[docKey]) {
        docsObj[docKey].estado = nuevoEstado;
        
        // Agregar timestamps según el estado
        if (nuevoEstado === "aprobado") {
          docsObj[docKey].aprobadoEn = new Date().toISOString();
          delete docsObj[docKey].motivoRechazo; // Eliminar motivo si se aprueba
        } else if (nuevoEstado === "rechazado") {
          docsObj[docKey].rechazadoEn = new Date().toISOString();
          docsObj[docKey].motivoRechazo = motivo; // Guardar el motivo de rechazo
        }
      }

      // Calcular documentos_aprobados: todos deben estar aprobados
      const documentosAprobadosValue = Object.keys(docsObj)
        .filter(key => !['updatedAt', 'documentosActualizadoEn'].includes(key))
        .filter(key => docsObj[key] && typeof docsObj[key] === 'object' && docsObj[key].fotos)
        .every(key => docsObj[key].estado === "aprobado");

      // Una sola operación que actualiza todo
      await updateDoc(trabajadorRef, { 
        documentos: docsObj,
        documentos_aprobados: documentosAprobadosValue,
        activo: nuevoEstado === "rechazado" ? false : documentosAprobadosValue
      });
      
      // Actualizar lista local
      const updatedDocs = documentos.map((d) => {
        if (d.key === docKey) {
          const updated = { ...d, estado: nuevoEstado };
          if (nuevoEstado === "aprobado") {
            updated.aprobadoEn = new Date().toISOString();
            delete updated.motivoRechazo;
          } else if (nuevoEstado === "rechazado") {
            updated.rechazadoEn = new Date().toISOString();
            updated.motivoRechazo = motivo;
          }
          return updated;
        }
        return d;
      });
      setDocumentos(updatedDocs);
      setDocumentosAprobados(documentosAprobadosValue);
      
      setSnackbar({
        open: true,
        message: `Documento cambió a ${nuevoEstado}`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      setSnackbar({
        open: true,
        message: "Error al cambiar estado",
        severity: "error",
      });
    }
  };

  // Manejar cambio de documentos_aprobados
  const handleToggleDocumentosAprobados = async (event) => {
    if (!isAdminOrSuperAdmin) {
      setSnackbar({
        open: true,
        message: "Solo admin y superadmin pueden cambiar este estado",
        severity: "error",
      });
      return;
    }
    
    const nuevoValor = event.target.checked;
    
    try {
      const trabajadorRef = doc(db, "trabajadores", selectedTrabajador.id);
      
      // Actualizar documentos_aprobados y activo vinculados: activo = documentos_aprobados
      await updateDoc(trabajadorRef, {
        documentos_aprobados: nuevoValor,
        activo: nuevoValor
      });
      
      setDocumentosAprobados(nuevoValor);
      
      setSnackbar({
        open: true,
        message: nuevoValor ? "Documentos marcados como aprobados" : "Documentos marcados como no aprobados",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al actualizar estado de documentos",
        severity: "error",
      });
    }
  };

  // Verificar si todos los documentos están aprobados
  const todosAprobados = documentos.length > 0 && documentos.every(doc => doc.estado === "aprobado");
  const puedeHabilitarSwitch = todosAprobados;

  if (!selectedTrabajador) return null;

  const docActive = documentoActivo !== null ? documentos[documentoActivo] : null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        {/* Encabezado */}
        <Box sx={{ display: "flex", alignItems: "center", px: 3, py: 2 }}>
          <PersonIcon color="primary" sx={{ mr: 1 }} />
          <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>
            Documentos de {selectedTrabajador?.perfil?.name}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        {/* Contenido a dos columnas */}
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ display: "flex", minHeight: "600px" }}>
            {/* COLUMNA IZQUIERDA - Información del trabajador y lista de documentos */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                overflowY: "auto",
                bgcolor: "#f9f9f9",
              }}
            >
              {/* Información del trabajador */}
              <Card sx={{ mb: 3, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Información del Trabajador
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>Nombre:</strong> {capitalizarNombre(selectedTrabajador?.perfil?.name)}
                      </Typography>
                    </Box>
                    {selectedTrabajador?.perfil?.email && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Email:</strong> {selectedTrabajador.perfil.email}
                        </Typography>
                      </Box>
                    )}
                    {selectedTrabajador?.perfil?.phone && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Teléfono:</strong> {selectedTrabajador.perfil.phone}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Lista de documentos pendientes */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Documentos Pendientes ({documentos.length})
              </Typography>

              <Stack spacing={1.5}>
                {documentos.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No hay documentos pendientes
                  </Typography>
                ) : (
                  documentos.map((doc, idx) => {
                    const isPendiente = doc.estado === "pendiente";
                    const isAprobado = doc.estado === "aprobado";
                    const isRechazado = doc.estado === "rechazado";
                    
                    let chipColor = "warning"; // pendiente
                    if (isAprobado) chipColor = "success";
                    if (isRechazado) chipColor = "error";
                    
                    let chipLabel = doc.estado.charAt(0).toUpperCase() + doc.estado.slice(1);
                    
                    return (
                      <Card
                        key={idx}
                        sx={{
                          p: 1.5,
                          cursor: "pointer",
                          opacity: 1,
                          border: documentoActivo === idx ? "2px solid #d7171a" : "1px solid #e0e0e0",
                          bgcolor: documentoActivo === idx ? "rgba(215, 23, 26, 0.05)" : isAprobado ? "rgba(76, 175, 80, 0.05)" : isRechazado ? "rgba(244, 67, 54, 0.05)" : "white",
                          transition: "all 0.2s",
                          "&:hover": {
                            boxShadow: 2,
                            borderColor: "#d7171a",
                          },
                        }}
                        onClick={() => setDocumentoActivo(idx)}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: isRechazado ? "error.main" : "inherit" }}>
                            {doc.nombre || `Documento ${idx + 1}`}
                          </Typography>
                          <Chip
                            label={chipLabel}
                            size="small"
                            color={chipColor}
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Card>
                    );
                  })
                )}
              </Stack>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* COLUMNA DERECHA - Detalle del documento seleccionado */}
            <Box
              sx={{
                flex: 1,
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                overflowY: "auto",
              }}
            >
              {docActive ? (
                <Stack spacing={2} sx={{ width: "100%", maxWidth: 380 }}>
                  {/* Galería de fotos */}
                  {docActive.fotos && docActive.fotos.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {docActive.fotos.map((foto, fotoidx) => (
                        <Card 
                          key={fotoidx} 
                          sx={{ 
                            boxShadow: 2,
                            cursor: "pointer",
                            transition: "transform 0.2s, boxShadow 0.2s",
                            "&:hover": {
                              transform: "scale(1.02)",
                              boxShadow: 4
                            }
                          }}
                          onClick={() => setFotoExpandida(foto)}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              height: 200,
                              bgcolor: "#f5f5f5",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            {foto.url ? (
                              <>
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    background: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)",
                                    p: 1,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    zIndex: 1,
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: "white" }}>
                                    {foto.label || `Foto ${fotoidx + 1}`}
                                  </Typography>
                                  <ZoomInIcon sx={{ fontSize: 18, color: "white" }} />
                                </Box>
                                <Box
                                  component="img"
                                  src={foto.url}
                                  alt={foto.label}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Sin imagen
                              </Typography>
                            )}
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Card sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Sin fotos disponibles
                      </Typography>
                    </Card>
                  )}

                  {/* Información del documento */}
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {docActive.nombre || `Documento`}
                    </Typography>
                    <Tooltip title="Click para cambiar estado">
                      <Chip
                        label={docActive.estado === "aprobado" ? "Aprobado" : docActive.estado === "rechazado" ? "Rechazado" : "Pendiente de revisión"}
                        size="small"
                        color={docActive.estado === "aprobado" ? "success" : docActive.estado === "rechazado" ? "error" : "warning"}
                        sx={{ fontWeight: 600, mb: 2, cursor: "pointer" }}
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                      />
                    </Tooltip>
                    <Menu
                      anchorEl={menuAnchor}
                      open={Boolean(menuAnchor)}
                      onClose={() => setMenuAnchor(null)}
                    >
                      <MenuItem onClick={() => {
                        handleChangeEstado(selectedTrabajador.id, docActive.key, "pendiente");
                        setMenuAnchor(null);
                      }}>
                        <ListItemIcon><HourglassBottomIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                        <ListItemText>Pendiente</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => {
                        handleChangeEstado(selectedTrabajador.id, docActive.key, "aprobado");
                        setMenuAnchor(null);
                      }}>
                        <ListItemIcon><CheckCircleIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                        <ListItemText>Aprobado</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => {
                        // Abrir formulario de rechazo en lugar de rechazar directamente
                        setMotivoRechazo("");
                        setMostrarFormularioRechazo(true);
                        setMenuAnchor(null);
                      }}>
                        <ListItemIcon><CancelIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                        <ListItemText>Rechazar</ListItemText>
                      </MenuItem>
                    </Menu>
                    {docActive.estado === "aprobado" && docActive.aprobadoEn && (
                      <Typography variant="caption" color="success.main" display="block" sx={{ mb: 1 }}>
                        <strong>Aprobado:</strong> {new Date(docActive.aprobadoEn).toLocaleDateString()}
                      </Typography>
                    )}
                    {docActive.estado === "rechazado" && docActive.rechazadoEn && (
                      <>
                        <Typography variant="caption" color="error.main" display="block" sx={{ mb: 1 }}>
                          <strong>Rechazado:</strong> {new Date(docActive.rechazadoEn).toLocaleDateString()}
                        </Typography>
                        {docActive.motivoRechazo && (
                          <Box sx={{
                            bgcolor: "rgba(244, 67, 54, 0.1)",
                            border: "1px solid #f44336",
                            borderRadius: 1,
                            p: 1.5,
                            mb: 1,
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5, color: "#d32f2f" }}>
                              Motivo del rechazo:
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#666" }}>
                              {docActive.motivoRechazo}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                    {docActive.fecha && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        <strong>Fecha carga:</strong> {new Date(docActive.fecha).toLocaleDateString()}
                      </Typography>
                    )}
                  </Card>

                  {/* Campos de texto/información del documento */}
                  {docActive.textos && Object.keys(docActive.textos).length > 0 && (
                    <Card sx={{ p: 2, bgcolor: "#f9f9f9" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Información Ingresada
                      </Typography>
                      <Stack spacing={1.5}>
                        {Object.keys(docActive.textos)
                          .sort((a, b) => {
                            // Ordenar numéricamente si son números, sino alfabéticamente
                            if (!isNaN(a) && !isNaN(b)) return Number(a) - Number(b);
                            return a.localeCompare(b);
                          })
                          .map((key) => {
                            const item = docActive.textos[key];
                            if (!item || typeof item !== 'object') return null;
                            
                            const label = item.label || `Campo ${key}`;
                            const valor = item.valor || "-";
                            
                            return (
                              <Box key={key} sx={{ pb: 1.5, borderBottom: '1px solid #e0e0e0', '&:last-child': { borderBottom: 'none' } }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "#666", display: "block", mb: 0.5 }}>
                                  {label}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  p: 1, 
                                  bgcolor: "white", 
                                  borderRadius: 0.5,
                                  border: "1px solid #e0e0e0",
                                  wordBreak: "break-word",
                                  color: "#333"
                                }}>
                                  {valor}
                                </Typography>
                              </Box>
                            );
                          })}
                      </Stack>
                    </Card>
                  )}

                  {/* Acciones - Cambiar estado desde el Chip */}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
                    Haz click en el estado (chip) arriba para cambiar el estado del documento
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 5 }}>
                  Selecciona un documento para revisar
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Tooltip 
            title={
              !isAdminOrSuperAdmin 
                ? "Solo admin y superadmin pueden cambiar este estado"
                : !puedeHabilitarSwitch 
                ? "Todos los documentos deben estar aprobados" 
                : ""
            }
            arrow
          >
            <FormControlLabel
              control={
                <Switch
                  checked={documentosAprobados && puedeHabilitarSwitch}
                  onChange={handleToggleDocumentosAprobados}
                  disabled={!puedeHabilitarSwitch || !isAdminOrSuperAdmin}
                  color="primary"
                />
              }
              label={
                <Typography sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                  {puedeHabilitarSwitch && documentosAprobados ? "✓ Documentos Aprobados" : "Documentos No Aprobados"}
                </Typography>
              }
            />
          </Tooltip>
          <Button onClick={onClose} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%", fontFamily: "Mulish, sans-serif" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modal para ver imagen expandida */}
      <Modal
        open={!!fotoExpandida}
        onClose={() => setFotoExpandida(null)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1300,
        }}
      >
        <Box
          sx={{
            position: "relative",
            maxWidth: "90vw",
            maxHeight: "90vh",
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 24,
            p: 2,
          }}
        >
          <IconButton
            onClick={() => setFotoExpandida(null)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0, 0, 0, 0.5)",
              color: "white",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.7)" },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          {fotoExpandida && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                {fotoExpandida.label}
              </Typography>
              <Box
                component="img"
                src={fotoExpandida.url}
                alt={fotoExpandida.label}
                sx={{
                  maxWidth: "85%",
                  maxHeight: "90vh",
                  objectFit: "contain",
                }}
              />
            </Box>
          )}
        </Box>
      </Modal>

      {/* Modal para rechazar con justificativo */}
      <Dialog
        open={mostrarFormularioRechazo}
        onClose={() => setMostrarFormularioRechazo(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Rechazar Documento
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Documento: <strong>{docActive?.nombre}</strong>
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label="Motivo del rechazo"
            placeholder="Escriba el motivo por el cual se rechaza este documento..."
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setMostrarFormularioRechazo(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (!motivoRechazo.trim()) {
                setSnackbar({
                  open: true,
                  message: "Debe ingresar un motivo de rechazo",
                  severity: "warning",
                });
                return;
              }
              
              await handleChangeEstado(selectedTrabajador.id, docActive.key, "rechazado", motivoRechazo);
              setMostrarFormularioRechazo(false);
              setMotivoRechazo("");
              setSnackbar({
                open: true,
                message: "Documento rechazado con justificativo",
                severity: "success",
              });
            }}
            variant="contained"
            color="error"
          >
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DocumentosModal;
