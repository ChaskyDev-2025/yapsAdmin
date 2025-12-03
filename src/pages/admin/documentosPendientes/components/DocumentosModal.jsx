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
  Snackbar,
  Alert,
} from "@mui/material";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

const getDocumentStatusColor = (estado) => {
  switch (estado) {
    case "aprobado":
      return "success";
    case "rechazado":
      return "error";
    case "pendiente":
      return "warning";
    default:
      return "default";
  }
};

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

  const handleApproveDocument = async (trabajadorId, docIndex) => {
    try {
      const trabajadorRef = doc(db, "trabajadores", trabajadorId);
      const trabajadorSnap = await getDoc(trabajadorRef);
      const docs = trabajadorSnap.data().documentos || [];
      docs[docIndex].estado = "aprobado";
      docs[docIndex].aprobadoEn = new Date().toISOString();

      await updateDoc(trabajadorRef, { documentos: docs });
      setSnackbar({
        open: true,
        message: "Documento aprobado correctamente",
        severity: "success",
      });

      onDocumentApproved();
    } catch (error) {
      console.error("Error al aprobar documento:", error);
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
      docs[docIndex].estado = "rechazado";
      docs[docIndex].rechazadoEn = new Date().toISOString();

      await updateDoc(trabajadorRef, { documentos: docs });
      setSnackbar({
        open: true,
        message: "Documento rechazado",
        severity: "warning",
      });

      onDocumentRejected();
    } catch (error) {
      console.error("Error al rechazar documento:", error);
      setSnackbar({
        open: true,
        message: "Error al rechazar documento",
        severity: "error",
      });
    }
  };

  return (
    <>
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
          Documentos de {selectedTrabajador?.perfil?.name}
          <Button
            onClick={onClose}
            sx={{ color: "white", minWidth: "auto" }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedTrabajador?.documentos &&
            selectedTrabajador.documentos.map((doc, index) => {
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
                        onClick={() => handleApproveDocument(selectedTrabajador.id, index)}
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
                        onClick={() => handleRejectDocument(selectedTrabajador.id, index)}
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
