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
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CancelIcon from "@mui/icons-material/Cancel";
import ZoomInIcon from "@mui/icons-material/ZoomIn";

const DocumentosConductoresModal = ({
  open,
  onClose,
  selectedConductor,
}) => {
  const { userRole } = useAuth();
  const isAdminOrSuperAdmin = userRole === "admin" || userRole === "superadmin";
  
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [documentoActivo, setDocumentoActivo] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [documentosAprobados, setDocumentosAprobados] = useState(false);
  const [fotoExpandida, setFotoExpandida] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [mostrarFormularioRechazo, setMostrarFormularioRechazo] = useState(false);

  // Procesar documentos al abrir el modal
  useEffect(() => {
    if (selectedConductor?.documentos) {
      const docsObj = selectedConductor.documentos;
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
            key,
            nombre: titulo,
            estado: docData.estado || "pendiente",
            fotos: fotos,
            textos: textosProcessed,
            textosRaw: docData.textos,
            idConfig: docData.idConfig,
            updatedAt: docData.updatedAt,
            motivoRechazo: docData.motivoRechazo || null,
            aprobadoEn: docData.aprobadoEn || null,
            rechazadoEn: docData.rechazadoEn || null,
            fecha: docData.updatedAt || docData.fecha,
          });
        }
      });
      
      setDocumentos(docsArray);
      setDocumentoActivo(null);
      
      // Cargar estado documentos_aprobados desde la raíz del conductor
      setDocumentosAprobados(selectedConductor.documentos_aprobados || false);
    }
  }, [selectedConductor, open]);

  const handleChangeEstado = async (conductorId, docKey, nuevoEstado, motivo = "") => {
    try {
      const conductorRef = doc(db, "trabajadores", conductorId);
      const conductorSnap = await getDoc(conductorRef);
      const docsObj = conductorSnap.data().documentos || {};
      
      // Actualizar el documento con la clave correcta
      if (docsObj[docKey]) {
        docsObj[docKey].estado = nuevoEstado;
        
        // Agregar timestamps según el estado
        if (nuevoEstado === "aprobado") {
          docsObj[docKey].aprobadoEn = new Date().toISOString();
          delete docsObj[docKey].motivoRechazo;
        } else if (nuevoEstado === "rechazado") {
          docsObj[docKey].rechazadoEn = new Date().toISOString();
          docsObj[docKey].motivoRechazo = motivo;
        }
      }

      await updateDoc(conductorRef, { documentos: docsObj });
      
      // Calcular documentos_aprobados: todos deben estar aprobados
      const documentosAprobadosValue = Object.keys(docsObj)
        .filter(key => !['updatedAt', 'documentosActualizadoEn'].includes(key))
        .filter(key => docsObj[key] && typeof docsObj[key] === 'object' && docsObj[key].fotos)
        .every(key => docsObj[key].estado === "aprobado");

      // Actualizar documentos_aprobados y activo vinculados: activo = documentos_aprobados
      await updateDoc(conductorRef, { 
        documentos_aprobados: documentosAprobadosValue,
        activo: documentosAprobadosValue
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
      
      setSnackbar({
        open: true,
        message: `Documento cambió a ${nuevoEstado}`,
        severity: "success",
      });
      
      setMenuAnchor(null);
      setDocumentoActivo(null);
      setMotivoRechazo("");
      setMostrarFormularioRechazo(false);
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
      const conductorRef = doc(db, "trabajadores", selectedConductor.id);
      
      // Actualizar documentos_aprobados y activo vinculados: activo = documentos_aprobados
      await updateDoc(conductorRef, {
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

  if (!selectedConductor) return null;

  const docActive = documentoActivo !== null ? documentos[documentoActivo] : null;

  const getChipColor = (estado) => {
    switch (estado) {
      case "aprobado":
        return { bg: "#e8f5e9", color: "#2e7d32" };
      case "rechazado":
        return { bg: "#ffebee", color: "#c62828" };
      default:
        return { bg: "#fff3e0", color: "#e65100" };
    }
  };

  const getIcon = (estado) => {
    switch (estado) {
      case "aprobado":
        return <CheckCircleIcon sx={{ color: "#2e7d32" }} />;
      case "rechazado":
        return <CancelIcon sx={{ color: "#c62828" }} />;
      default:
        return <HourglassBottomIcon sx={{ color: "#e65100" }} />;
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          {/* Encabezado */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Documentos de {selectedConductor?.perfil?.name || "Conductor"}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Info del conductor */}
          <Card sx={{ mb: 3, bgcolor: "#f5f5f5" }}>
            <CardContent>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">
                    <strong>Nombre:</strong> {selectedConductor?.perfil?.name || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedConductor?.perfil?.email || "N/A"}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Divider sx={{ my: 2 }} />

          {/* Lista de documentos */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Documentos ({documentos.length})
          </Typography>

          <Stack spacing={2} sx={{ maxHeight: "50vh", overflowY: "auto" }}>
            {documentos.map((doc, idx) => (
              <Card key={idx} sx={{ p: 2, cursor: "pointer", "&:hover": { bgcolor: "#f9f9f9" } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      {doc.nombre}
                    </Typography>
                    <Tooltip title="Click para ver detalles">
                      <Chip
                        label={doc.estado === "aprobado" ? "Aprobado" : doc.estado === "rechazado" ? "Rechazado" : "Pendiente"}
                        size="small"
                        color={doc.estado === "aprobado" ? "success" : doc.estado === "rechazado" ? "error" : "warning"}
                        sx={{ fontWeight: 600, cursor: "pointer" }}
                        onClick={() => setDocumentoActivo(idx)}
                      />
                    </Tooltip>
                    {doc.fotos && doc.fotos.length > 0 && (
                      <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {doc.fotos.map((foto, fotoIdx) => (
                          <Box
                            key={fotoIdx}
                            onClick={() => setFotoExpandida(foto)}
                            sx={{
                              position: "relative",
                              width: 80,
                              height: 80,
                              borderRadius: 1,
                              overflow: "hidden",
                              cursor: "pointer",
                              "&:hover": { opacity: 0.8 },
                            }}
                          >
                            <img
                              src={foto.url || foto}
                              alt={`Foto ${fotoIdx}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <ZoomInIcon
                              sx={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                color: "white",
                                opacity: 0,
                                "&:hover": { opacity: 1 },
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                  <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => setMenuAnchor(null)}
                  >
                    <MenuItem onClick={() => {
                      handleChangeEstado(selectedConductor.id, doc.key, "pendiente");
                      setMenuAnchor(null);
                    }}>
                      <ListItemIcon><HourglassBottomIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                      <ListItemText>Pendiente</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      handleChangeEstado(selectedConductor.id, doc.key, "aprobado");
                      setMenuAnchor(null);
                    }}>
                      <ListItemIcon><CheckCircleIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                      <ListItemText>Aprobado</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setMotivoRechazo("");
                      setMostrarFormularioRechazo(true);
                      setMenuAnchor(null);
                    }}>
                      <ListItemIcon><CancelIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                      <ListItemText>Rechazar</ListItemText>
                    </MenuItem>
                  </Menu>
                </Box>
              </Card>
            ))}
          </Stack>

          {/* Modal de detalles del documento activo */}
          {docActive && (
            <Dialog open={Boolean(docActive)} onClose={() => setDocumentoActivo(null)} maxWidth="md" fullWidth>
              <DialogContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {docActive.nombre}
                  </Typography>
                  <IconButton onClick={() => setDocumentoActivo(null)} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Card sx={{ p: 2, mb: 2 }}>
                  <Tooltip title="Click para cambiar estado">
                    <Chip
                      label={docActive.estado === "aprobado" ? "Aprobado" : docActive.estado === "rechazado" ? "Rechazado" : "Pendiente de revisión"}
                      size="small"
                      color={docActive.estado === "aprobado" ? "success" : docActive.estado === "rechazado" ? "error" : "warning"}
                      sx={{ fontWeight: 600, mb: 2, cursor: "pointer" }}
                      onClick={(e) => setMenuAnchor(e.currentTarget)}
                    />
                  </Tooltip>
                  
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

                  {/* Galería de fotos */}
                  {docActive.fotos && docActive.fotos.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Fotos
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {docActive.fotos.map((foto, idx) => (
                          <Box
                            key={idx}
                            onClick={() => setFotoExpandida(foto)}
                            sx={{
                              position: "relative",
                              width: 100,
                              height: 100,
                              borderRadius: 1,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: "2px solid #ddd",
                              "&:hover": { borderColor: "#1976d2" },
                            }}
                          >
                            <img
                              src={foto.url || foto}
                              alt={`Foto ${idx}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "rgba(0, 0, 0, 0.3)",
                                opacity: 0,
                                "&:hover": { opacity: 1 },
                              }}
                            >
                              <ZoomInIcon sx={{ color: "white", fontSize: 32 }} />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Campos de texto/información */}
                  {docActive.textos && Object.keys(docActive.textos).length > 0 && (
                    <Card sx={{ p: 2, bgcolor: "#f9f9f9", mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Información Ingresada
                      </Typography>
                      <Stack spacing={1}>
                        {Object.entries(docActive.textos)
                          .sort((a, b) => {
                            const aNum = parseInt(a[0]);
                            const bNum = parseInt(b[0]);
                            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                            return a[0].localeCompare(b[0]);
                          })
                          .map(([key, value]) => (
                            <Box key={key} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                                {value.label || key}:
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#333" }}>
                                {value.valor || value}
                              </Typography>
                            </Box>
                          ))}
                      </Stack>
                    </Card>
                  )}
                </Card>

                <DialogActions sx={{ px: 0, py: 2, display: "flex", justifyContent: "space-between" }}>
                  <Button onClick={() => setDocumentoActivo(null)} variant="text">
                    Cerrar
                  </Button>
                  <Box>
                    <Button
                      onClick={() => handleChangeEstado(selectedConductor.id, docActive.key, "pendiente")}
                      variant="outlined"
                      sx={{ mr: 1 }}
                    >
                      Pendiente
                    </Button>
                    <Button
                      onClick={() => handleChangeEstado(selectedConductor.id, docActive.key, "aprobado")}
                      variant="contained"
                      color="success"
                      sx={{ mr: 1 }}
                    >
                      Aprobar
                    </Button>
                    <Button
                      onClick={() => {
                        setMotivoRechazo("");
                        setMostrarFormularioRechazo(true);
                      }}
                      variant="contained"
                      color="error"
                    >
                      Rechazar
                    </Button>
                  </Box>
                </DialogActions>
              </DialogContent>
            </Dialog>
          )}

          {/* Dialog para ingresar motivo de rechazo */}
          <Dialog open={mostrarFormularioRechazo} onClose={() => setMostrarFormularioRechazo(false)} maxWidth="sm" fullWidth>
            <DialogContent sx={{ pt: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Motivo del Rechazo
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Ingresa el motivo por el cual se rechaza este documento"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                variant="outlined"
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setMostrarFormularioRechazo(false)} variant="text">
                Cancelar
              </Button>
              <Button
                onClick={() => handleChangeEstado(selectedConductor.id, docActive.key, "rechazado", motivoRechazo)}
                variant="contained"
                color="error"
                disabled={!motivoRechazo.trim()}
              >
                Rechazar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de imagen expandida */}
          {fotoExpandida && (
            <Modal
              open={!!fotoExpandida}
              onClose={() => setFotoExpandida(null)}
              sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              <Box
                sx={{
                  position: "relative",
                  maxWidth: "90%",
                  maxHeight: "90%",
                  outline: "none",
                }}
              >
                <img
                  src={fotoExpandida.url || fotoExpandida}
                  alt="Ampliada"
                  style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 4 }}
                />
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
              </Box>
            </Modal>
          )}
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
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DocumentosConductoresModal;
