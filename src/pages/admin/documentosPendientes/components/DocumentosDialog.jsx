// src/pages/admin/documentosPendientes/components/DocumentosDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Box,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

const DocumentosDialog = ({
  open,
  onClose,
  trabajador,
  onApprove,
  onReject,
  getDocumentStatusColor,
}) => {
  if (!trabajador) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: "#d7171a",
          color: "white",
          fontFamily: "Mulish, sans-serif",
          fontWeight: 900,
          fontSize: "1.3rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Documentos de {trabajador?.perfil?.name}
        <Button
          onClick={onClose}
          sx={{ color: "white", minWidth: "auto" }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        {/* Información del Trabajador */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Información del Trabajador
        </Typography>
        
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
          {/* Foto y datos principales */}
          <Box sx={{ textAlign: "center", gridColumn: { xs: "1 / -1", sm: "1 / 2" } }}>
            {trabajador?.perfil?.photoURL && (
              <Box
                component="img"
                src={trabajador.perfil.photoURL}
                alt={trabajador.perfil.name}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: "4px solid #d7171a",
                  mb: 2,
                  objectFit: "cover",
                  mx: "auto",
                  display: "block",
                }}
              />
            )}
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {trabajador?.perfil?.name || "Nombre no disponible"}
            </Typography>
          </Box>

          {/* Datos de contacto y otros */}
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "2 / 3" } }}>
            {trabajador?.perfil?.email && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>Email:</Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  {trabajador.perfil.email}
                </Typography>
              </Box>
            )}
            
            {trabajador?.perfil?.phoneNumber && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>Teléfono:</Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  {trabajador.perfil.phoneNumber}
                </Typography>
              </Box>
            )}
            
            {trabajador?.departamentoActual && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>Departamento:</Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  {trabajador.departamentoActual}
                </Typography>
              </Box>
            )}

            {trabajador?.flota && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#999", fontWeight: 600 }}>Flota:</Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  {trabajador.flota}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Servicios */}
          {trabajador?.servicios && Object.keys(trabajador.servicios).length > 0 && (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="caption" sx={{ color: "#999", fontWeight: 600, display: "block", mb: 1 }}>
                Categorías y Servicios:
              </Typography>
              {Object.entries(trabajador.servicios).map(([categoria, servicios]) => {
                let serviciosArray = [];
                
                if (Array.isArray(servicios)) {
                  serviciosArray = servicios.map(s => {
                    if (typeof s === 'object' && s?.valor) {
                      return s.valor;
                    }
                    return s;
                  });
                } else if (typeof servicios === 'object' && servicios?.valor) {
                  serviciosArray = [servicios.valor];
                } else if (typeof servicios === 'string') {
                  serviciosArray = [servicios];
                }
                
                return serviciosArray.length > 0 ? (
                  <Box key={categoria} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: "#333", fontWeight: 600 }}>
                      {categoria}:
                    </Typography>
                    {serviciosArray.map((s, idx) => {
                      // Quitar el prefijo de la categoría del servicio
                      let servicioLimpio = s;
                      
                      // Crear variantes del prefijo para comparación
                      const prefijoGuion = categoria.toLowerCase().replace(/\s+/g, '_') + '_';
                      const prefijoEspacio = categoria.toLowerCase() + ' ';
                      
                      // Quitar el prefijo si existe (con guion bajo o espacio)
                      const servicioMinuscula = servicioLimpio.toLowerCase();
                      if (servicioMinuscula.startsWith(prefijoGuion)) {
                        servicioLimpio = servicioLimpio.substring(prefijoGuion.length);
                      } else if (servicioMinuscula.startsWith(prefijoEspacio)) {
                        servicioLimpio = servicioLimpio.substring(prefijoEspacio.length);
                      }
                      
                      // Reemplazar guiones bajos con espacios
                      servicioLimpio = servicioLimpio.replace(/_/g, ' ');
                      
                      return (
                        <Typography key={idx} variant="body2" sx={{ color: "#333", ml: 1 }}>
                          • {servicioLimpio}
                        </Typography>
                      );
                    })}
                  </Box>
                ) : null;
              })}
            </Box>
          )}

          {/* Estado y Fecha de registro */}
          <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 2, alignItems: "center" }}>
            <Box>
              <Typography variant="caption" sx={{ color: "#999", fontWeight: 600, display: "block", mb: 0.5 }}>Estado:</Typography>
              <Chip
                label={trabajador?.activo ? "Activo" : "Inactivo"}
                color={trabajador?.activo ? "success" : "default"}
                size="small"
              />
            </Box>

            {trabajador?.createdAt && (
              <Box>
                <Typography variant="caption" sx={{ color: "#999", fontWeight: 600, display: "block", mb: 0.5 }}>Fecha de registro:</Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  {new Date(
                    trabajador.createdAt?.seconds
                      ? trabajador.createdAt.seconds * 1000
                      : trabajador.createdAt
                  ).toLocaleDateString("es-ES")}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ borderTop: "2px solid #e0e0e0", pt: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Documentos Pendientes
          </Typography>

          {/* Documentos */}
          {trabajador.documentos.map((doc, index) => {
            // Solo mostrar documentos pendientes
            if (doc.estado === "aprobado" || doc.estado === "rechazado") {
              return null;
            }

            return (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  mb: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontFamily: "Mulish, sans-serif" }}>
                    {doc.nombre || `Documento ${index + 1}`}
                  </Typography>
                  <Chip
                    label={doc.estado || "pendiente"}
                    size="small"
                    color={getDocumentStatusColor(doc.estado)}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {doc.url && (
                  <Box
                    component="img"
                    src={doc.url}
                    alt={doc.nombre}
                    sx={{
                      width: "100%",
                      maxHeight: 300,
                      objectFit: "contain",
                      mb: 2,
                      borderRadius: 1,
                      border: "1px solid #e0e0e0",
                    }}
                  />
                )}

                {doc.estado === "pendiente" && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => onApprove(trabajador.id, index)}
                      sx={{
                        bgcolor: "#4caf50",
                        color: "white",
                        fontFamily: "Mulish, sans-serif",
                        "&:hover": { bgcolor: "#45a049" },
                      }}
                    >
                      Aprobar
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CloseIcon />}
                      onClick={() => onReject(trabajador.id, index)}
                      sx={{
                        color: "#d7171a",
                        borderColor: "#d7171a",
                        fontFamily: "Mulish, sans-serif",
                        "&:hover": { bgcolor: "rgba(215, 23, 26, 0.04)" },
                      }}
                    >
                      Rechazar
                    </Button>
                  </Box>
                )}
              </Paper>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentosDialog;
