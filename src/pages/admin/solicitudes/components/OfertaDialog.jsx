import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";

const OfertaDialog = ({ open, onClose, solicitudOferta }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: "#ff9800", color: "white", fontWeight: "bold" }}>
        💰 Oferta
      </DialogTitle>
      <DialogContent sx={{ pt: 3, backgroundColor: "#fafafa" }}>
        {solicitudOferta && solicitudOferta.solicitud?.oferta ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ backgroundColor: "white", p: 2, borderRadius: 1, border: "1px solid #e0e0e0" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#ff9800" }}>
                Detalles de la Oferta
              </Typography>

              {/* Costo Base */}
              <Box sx={{ mb: 2, p: 1, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: "#666" }}>
                  Costo del Servicio:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#d7171a" }}>
                  Bs. {solicitudOferta.solicitud.oferta.costo?.toFixed(2) || "0.00"}
                </Typography>
              </Box>

              {/* Campos Adicionales */}
              {solicitudOferta.solicitud.oferta.campos &&
                Object.keys(solicitudOferta.solicitud.oferta.campos).length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1, color: "#333" }}>
                      Campos Adicionales:
                    </Typography>
                    {Object.entries(solicitudOferta.solicitud.oferta.campos).map(([key, value]) => (
                      <Box
                        key={key}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          p: 0.5,
                          backgroundColor: "#f5f5f5",
                          mb: 0.5,
                          borderRadius: 0.5,
                        }}
                      >
                        <Typography variant="body2">{key}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          Bs. {parseFloat(value)?.toFixed(2) || "0.00"}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

              {/* Fecha de Oferta */}
              {solicitudOferta.solicitud.oferta.fechaOferta && (
                <Box sx={{ p: 1, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Fecha Oferta:</strong>{" "}
                    {new Date(solicitudOferta.solicitud.oferta.fechaOferta).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Typography color="text.secondary">
            No hay oferta disponible para esta solicitud
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: "#fafafa", borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose} variant="contained" sx={{ backgroundColor: "#ff9800" }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OfertaDialog;
