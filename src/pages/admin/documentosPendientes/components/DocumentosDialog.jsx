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
        {trabajador?.documentos &&
          trabajador.documentos.map((doc, index) => {
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
      </DialogContent>
    </Dialog>
  );
};

export default DocumentosDialog;
