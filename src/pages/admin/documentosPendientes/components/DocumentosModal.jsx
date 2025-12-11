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
} from "@mui/material";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CancelIcon from "@mui/icons-material/Cancel";

const DocumentosModal = ({
  open,
  onClose,
  selectedTrabajador,
  onDocumentApproved,
  onDocumentRejected,
}) => {
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [documentoActivo, setDocumentoActivo] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [documentosAprobados, setDocumentosAprobados] = useState(false);

  // Procesar documentos al abrir el modal
  useEffect(() => {
    if (selectedTrabajador?.documentos) {
      // Obtener documentos (puede ser array o objeto con índices numéricos)
      let docsArray = [];
      
      if (Array.isArray(selectedTrabajador.documentos)) {
        docsArray = selectedTrabajador.documentos;
      } else {
        // Es un objeto, extraer solo los documentos (ignorar documentos_aprobados)
        docsArray = Object.keys(selectedTrabajador.documentos)
          .filter(key => !isNaN(Number(key))) // Solo índices numéricos
          .sort((a, b) => Number(a) - Number(b))
          .map(key => selectedTrabajador.documentos[key]);
      }
      
      // Los documentos pueden ser strings o objetos
      const docsProcessed = docsArray.map((doc, index) => {
        if (typeof doc === 'string') {
          // Si es string, convertir a objeto
          return {
            index,
            nombre: doc,
            estado: "pendiente",
            url: null,
            fecha: null,
          };
        }
        // Si ya es objeto, retornarlo con valores por defecto
        return {
          index,
          nombre: doc.nombre || doc,
          estado: doc.estado || "pendiente",
          url: doc.url || null,
          fecha: doc.fecha || null,
        };
      });
      // Mostrar TODOS los documentos (no filtrar)
      setDocumentos(docsProcessed);
      setDocumentoActivo(null);
      
      // Cargar estado documentos_aprobados si existe
      const estadoDocAprobados = typeof selectedTrabajador.documentos === 'object' && !Array.isArray(selectedTrabajador.documentos)
        ? selectedTrabajador.documentos.documentos_aprobados || false
        : false;
      setDocumentosAprobados(estadoDocAprobados);
    }
  }, [selectedTrabajador, open]);

  const handleApproveDocument = async (trabajadorId, docIndex) => {
    try {
      const trabajadorRef = doc(db, "trabajadores", trabajadorId);
      const trabajadorSnap = await getDoc(trabajadorRef);
      const docs = trabajadorSnap.data().documentos || [];
      
      // Actualizar el documento en el índice correcto
      if (typeof docs[docIndex] === 'string') {
        // Si es string, crear un objeto con estado
        docs[docIndex] = {
          nombre: docs[docIndex],
          estado: "aprobado",
          aprobadoEn: new Date().toISOString(),
        };
      } else {
        // Si ya es objeto, actualizar
        docs[docIndex].estado = "aprobado";
        docs[docIndex].aprobadoEn = new Date().toISOString();
      }

      await updateDoc(trabajadorRef, { documentos: docs });
      
      // Actualizar lista local - actualizar el documento sin remover
      const updatedDocs = documentos.map((d, i) => 
        i === docIndex ? { ...d, estado: "aprobado", aprobadoEn: new Date().toISOString() } : d
      );
      setDocumentos(updatedDocs);
      setDocumentoActivo(null);
      
      setSnackbar({
        open: true,
        message: "Documento aprobado correctamente",
        severity: "success",
      });

      onDocumentApproved();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al aprobar documento",
        severity: "error",
      });
    }
  };

  const handleRejectDocument = async (trabajadorId, docIndex) => {
    try {
      const trabajadorRef = doc(db, "trabajadores", trabajadorId);
      const trabajadorSnap = await getDoc(trabajadorRef);
      const docs = trabajadorSnap.data().documentos || [];
      
      // Actualizar el documento en el índice correcto
      if (typeof docs[docIndex] === 'string') {
        // Si es string, crear un objeto con estado
        docs[docIndex] = {
          nombre: docs[docIndex],
          estado: "rechazado",
          rechazadoEn: new Date().toISOString(),
        };
      } else {
        // Si ya es objeto, actualizar
        docs[docIndex].estado = "rechazado";
        docs[docIndex].rechazadoEn = new Date().toISOString();
      }

      await updateDoc(trabajadorRef, { documentos: docs });
      
      // Actualizar lista local - actualizar el documento sin remover
      const updatedDocs = documentos.map((d, i) => 
        i === docIndex ? { ...d, estado: "rechazado", rechazadoEn: new Date().toISOString() } : d
      );
      setDocumentos(updatedDocs);
      setDocumentoActivo(null);
      
      setSnackbar({
        open: true,
        message: "Documento rechazado",
        severity: "warning",
      });

      onDocumentRejected();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al rechazar documento",
        severity: "error",
      });
    }
  };

  const handleChangeEstado = async (trabajadorId, docIndex, nuevoEstado) => {
    try {
      const trabajadorRef = doc(db, "trabajadores", trabajadorId);
      const trabajadorSnap = await getDoc(trabajadorRef);
      const docs = trabajadorSnap.data().documentos || [];
      
      // Actualizar el documento en el índice correcto
      if (typeof docs[docIndex] === 'string') {
        docs[docIndex] = {
          nombre: docs[docIndex],
          estado: nuevoEstado,
        };
      } else {
        docs[docIndex].estado = nuevoEstado;
      }

      // Agregar timestamps según el estado
      if (nuevoEstado === "aprobado") {
        docs[docIndex].aprobadoEn = new Date().toISOString();
      } else if (nuevoEstado === "rechazado") {
        docs[docIndex].rechazadoEn = new Date().toISOString();
      }

      await updateDoc(trabajadorRef, { documentos: docs });
      
      // Actualizar lista local
      const updatedDocs = documentos.map((d, i) => {
        if (i === docIndex) {
          const updated = { ...d, estado: nuevoEstado };
          if (nuevoEstado === "aprobado") {
            updated.aprobadoEn = new Date().toISOString();
          } else if (nuevoEstado === "rechazado") {
            updated.rechazadoEn = new Date().toISOString();
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
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error al cambiar estado",
        severity: "error",
      });
    }
  };

  // Manejar cambio de documentos_aprobados
  const handleToggleDocumentosAprobados = async (event) => {
    const nuevoValor = event.target.checked;
    
    try {
      const trabajadorRef = doc(db, "trabajadores", selectedTrabajador.id);
      
      // Actualizar dentro del objeto documentos
      const docsActualizados = {
        ...selectedTrabajador.documentos,
        documentos_aprobados: nuevoValor,
      };
      
      await updateDoc(trabajadorRef, {
        documentos: docsActualizados,
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
                        <strong>Nombre:</strong> {selectedTrabajador?.perfil?.name}
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
                  {/* Vista previa */}
                  <Card sx={{ boxShadow: 2 }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: 280,
                        bgcolor: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {docActive.url ? (
                        <Box
                          component="img"
                          src={docActive.url}
                          alt={docActive.nombre}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin imagen
                        </Typography>
                      )}
                    </Box>
                  </Card>

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
                        handleChangeEstado(selectedTrabajador.id, docActive.index, "pendiente");
                        setMenuAnchor(null);
                      }}>
                        <ListItemIcon><HourglassBottomIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                        <ListItemText>Pendiente</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => {
                        handleChangeEstado(selectedTrabajador.id, docActive.index, "aprobado");
                        setMenuAnchor(null);
                      }}>
                        <ListItemIcon><CheckCircleIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                        <ListItemText>Aprobado</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => {
                        handleChangeEstado(selectedTrabajador.id, docActive.index, "rechazado");
                        setMenuAnchor(null);
                      }}>
                        <ListItemIcon><CancelIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                        <ListItemText>Rechazado</ListItemText>
                      </MenuItem>
                    </Menu>
                    {docActive.estado === "aprobado" && docActive.aprobadoEn && (
                      <Typography variant="caption" color="success.main" display="block" sx={{ mb: 1 }}>
                        <strong>Aprobado:</strong> {new Date(docActive.aprobadoEn).toLocaleDateString()}
                      </Typography>
                    )}
                    {docActive.estado === "rechazado" && docActive.rechazadoEn && (
                      <Typography variant="caption" color="error.main" display="block" sx={{ mb: 1 }}>
                        <strong>Rechazado:</strong> {new Date(docActive.rechazadoEn).toLocaleDateString()}
                      </Typography>
                    )}
                    {docActive.fecha && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        <strong>Fecha carga:</strong> {new Date(docActive.fecha).toLocaleDateString()}
                      </Typography>
                    )}
                  </Card>

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
            title={!puedeHabilitarSwitch ? "Todos los documentos deben estar aprobados" : ""}
            arrow
          >
            <FormControlLabel
              control={
                <Switch
                  checked={documentosAprobados && puedeHabilitarSwitch}
                  onChange={handleToggleDocumentosAprobados}
                  disabled={!puedeHabilitarSwitch}
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
    </>
  );
};

export default DocumentosModal;
