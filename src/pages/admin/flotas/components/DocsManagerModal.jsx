// src/pages/admin/flotas/components/DocsManagerModal.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export const DocsManagerModal = ({
  open,
  onClose,
  flota,
  onOpenDocModal,
  onSave,
  onDeleteDoc,
  onViewDoc,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#d7171a",
          color: "white",
          fontFamily: "Mulish, sans-serif",
          fontWeight: 700,
        }}
      >
        📂 Gestión de Documentos - {flota?.nombre}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
            Documentos Adicionales
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={onOpenDocModal}
            sx={{
              borderColor: "#d7171a",
              color: "#d7171a",
              fontFamily: "Mulish, sans-serif",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#a00000",
                bgcolor: "rgba(215, 23, 26, 0.04)",
              },
            }}
          >
            Agregar Documento
          </Button>
        </Box>

        {flota?.documentosFlota?.otrosDocumentos && flota.documentosFlota.otrosDocumentos.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>Nombre</TableCell>
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>Información</TableCell>
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell align="center" sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flota.documentosFlota.otrosDocumentos.map((doc, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>{doc.tipo}</TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>{doc.nombre}</TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif", maxWidth: "200px" }}>
                      {doc.contenido ? (
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "Mulish, sans-serif",
                          }}
                        >
                          {doc.contenido}
                        </Typography>
                      ) : doc.url ? (
                        <Chip label="Archivo/URL" size="small" color="primary" />
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "Mulish, sans-serif" }}>
                          Sin info
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                      {doc.fechaSubida ? new Date(doc.fechaSubida).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell align="center">
                      {doc.url && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onViewDoc(doc.url)}
                          title="Ver documento"
                        >
                          👁️
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteDoc(index, doc.nombre || doc.tipo)}
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info" sx={{ fontFamily: "Mulish, sans-serif" }}>
            No hay documentos adicionales. Haz clic en "Agregar Documento" para comenzar.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600, color: "#484848" }}>
          Cerrar
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          sx={{
            bgcolor: "#d7171a",
            fontFamily: "Mulish, sans-serif",
            fontWeight: 700,
            "&:hover": { bgcolor: "#b71c1c" },
          }}
        >
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
};
