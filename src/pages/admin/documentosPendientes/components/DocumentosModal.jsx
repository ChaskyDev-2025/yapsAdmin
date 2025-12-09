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
} from "@mui/material";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";

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

  // Procesar documentos al abrir el modal
  useEffect(() => {
    if (selectedTrabajador?.documentos) {
      // Los documentos pueden ser strings o objetos
      const docsProcessed = selectedTrabajador.documentos.map((doc, index) => {
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
                          cursor: isPendiente ? "pointer" : "default",
                          opacity: isPendiente ? 1 : 0.6,
                          border: documentoActivo === idx && isPendiente ? "2px solid #d7171a" : "1px solid #e0e0e0",
                          bgcolor: documentoActivo === idx && isPendiente ? "rgba(215, 23, 26, 0.05)" : isAprobado ? "rgba(76, 175, 80, 0.05)" : isRechazado ? "rgba(244, 67, 54, 0.05)" : "white",
                          transition: "all 0.2s",
                          "&:hover": isPendiente ? {
                            boxShadow: 2,
                            borderColor: "#d7171a",
                          } : {},
                        }}
                        onClick={() => isPendiente && setDocumentoActivo(idx)}
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
                    <Chip
                      label={docActive.estado === "aprobado" ? "Aprobado" : docActive.estado === "rechazado" ? "Rechazado" : "Pendiente de revisión"}
                      size="small"
                      color={docActive.estado === "aprobado" ? "success" : docActive.estado === "rechazado" ? "error" : "warning"}
                      sx={{ fontWeight: 600, mb: 2 }}
                    />
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

                  {/* Acciones - Solo si está pendiente */}
                  {docActive.estado === "pendiente" && (
                    <Stack spacing={1}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() =>
                          handleApproveDocument(selectedTrabajador.id, docActive.index)
                        }
                        sx={{
                          bgcolor: "#4caf50",
                          color: "white",
                          fontFamily: "Mulish, sans-serif",
                          fontWeight: 600,
                          "&:hover": { bgcolor: "#45a049" },
                        }}
                      >
                        Aprobar
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        onClick={() =>
                          handleRejectDocument(selectedTrabajador.id, docActive.index)
                        }
                        sx={{
                          color: "#d7171a",
                          borderColor: "#d7171a",
                          fontFamily: "Mulish, sans-serif",
                          fontWeight: 600,
                          "&:hover": { bgcolor: "rgba(215, 23, 26, 0.04)" },
                        }}
                      >
                        Rechazar
                      </Button>
                    </Stack>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 5 }}>
                  Selecciona un documento para revisar
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
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
