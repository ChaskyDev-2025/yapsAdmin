import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Chip,
  Button,
  Snackbar,
  Alert,
  Stack,
  IconButton,
  Card,
  Modal,
} from "@mui/material";
import CloseIconMUI from "@mui/icons-material/Close";
import ZoomInIconMUI from "@mui/icons-material/ZoomIn";
import PersonIconMUI from "@mui/icons-material/Person";

const DocumentosConductoresViewModal = ({
  open,
  onClose,
  selectedConductor,
}) => {
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [documentoActivo, setDocumentoActivo] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [fotoExpandida, setFotoExpandida] = useState(null);

  // Procesar documentos al abrir el modal
  useEffect(() => {
    if (open && selectedConductor?.documentos) {
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
    } else if (open && !selectedConductor?.documentos) {
      // Si el modal está abierto pero no hay documentos, limpiar
      setDocumentos([]);
      setDocumentoActivo(null);
    } else if (!open) {
      // Si el modal se cierra, limpiar todo
      setDocumentos([]);
      setDocumentoActivo(null);
      setFotoExpandida(null);
    }
  }, [selectedConductor, open]);

  if (!selectedConductor) return null;

  const docActive = documentoActivo !== null ? documentos[documentoActivo] : null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          {/* Encabezado */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <PersonIconMUI color="primary" sx={{ mr: 1 }} />
            <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>
              Documentos de {selectedConductor?.perfil?.name}
            </Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIconMUI />
            </IconButton>
          </Box>

          {/* Info del conductor */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIconMUI fontSize="small" />
              <Typography variant="caption">
                <strong>Email:</strong> {selectedConductor?.perfil?.email || "N/A"}
              </Typography>
            </Box>
          </Stack>

          {/* Lista de documentos */}
          <Stack spacing={1}>
            {documentos.map((doc, idx) => (
              <Card
                key={idx}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  "&:hover": { bgcolor: "#f5f5f5" },
                }}
                onClick={() => setDocumentoActivo(idx)}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {doc.nombre}
                  </Typography>
                </Box>
                <Chip
                  label={doc.estado === "aprobado" ? "Aprobado" : doc.estado === "rechazado" ? "Rechazado" : "Pendiente"}
                  size="small"
                  color={doc.estado === "aprobado" ? "success" : doc.estado === "rechazado" ? "error" : "warning"}
                  sx={{ fontWeight: 600 }}
                />
              </Card>
            ))}
          </Stack>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose} variant="contained" color="primary">
              Cerrar
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles del documento activo */}
      {docActive && (
        <Dialog open={Boolean(docActive)} onClose={() => setDocumentoActivo(null)} maxWidth="md" fullWidth>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {docActive.nombre}
              </Typography>
              <IconButton onClick={() => setDocumentoActivo(null)} size="small">
                <CloseIconMUI />
              </IconButton>
            </Box>

            <Card sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={docActive.estado === "aprobado" ? "Aprobado" : docActive.estado === "rechazado" ? "Rechazado" : "Pendiente"}
                  size="small"
                  color={docActive.estado === "aprobado" ? "success" : docActive.estado === "rechazado" ? "error" : "warning"}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              
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
                      mb: 2,
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
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
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
                          <ZoomInIconMUI sx={{ color: "white", fontSize: 32 }} />
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

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setDocumentoActivo(null)} variant="contained">
                Cerrar
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de imagen expandida */}
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
            <CloseIconMUI />
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

export default DocumentosConductoresViewModal;
