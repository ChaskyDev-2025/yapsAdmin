// components/DetalleModal.jsx
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, Divider, IconButton
} from "@mui/material";
import LocalTaxiIcon from "@mui/icons-material/LocalTaxi";
import CloseIcon     from "@mui/icons-material/Close";
import { useState } from "react";
import ModalIzquierdo from "./modalIzquierdo";
import ModalDerecho from "./modalDerecho";
import ViewModal from "./viewModal";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { Snackbar, Alert } from "@mui/material";

export default function DetalleModal({ open, onClose, rowData }) {
  const [mensaje, setMensaje] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  async function handleSaveEstado(nuevoEstado, docInfo) {
    try {
      if (!rowData?.firebaseId || !docInfo?.id) {
        throw new Error("Faltan datos para guardar");
      }

      const ref = doc(db, "users", rowData.firebaseId, "docs", docInfo.id);

      await updateDoc(ref, {
        estado: nuevoEstado,
        updatedAt: serverTimestamp(),
      });

      setMensaje("Estado guardado correctamente");
      setOpenSnackbar(true);

      // cerrar el modal del documento
      setDocActivo(null);

    } catch (e) {
      console.error("Error guardando estado:", e);
      setMensaje("No se pudo guardar el estado: " + (e?.message || ""));
      setOpenSnackbar(true);
    }
  }

  const [docActivo, setDocActivo] = useState(null);
  if (!rowData) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, p: 0, bgcolor: "#fafafa" } }}
      >
        {/* Encabezado */}
        <Box sx={{ display: "flex", alignItems: "center", px: 3, py: 2 }}>
          <Typography><b>ID:</b> {rowData.id}</Typography>
          <LocalTaxiIcon color="primary" sx={{ mr: 1 }} />
          <DialogTitle sx={{ flexGrow: 1, p: 0 }}>Detalle del Radiotaxi</DialogTitle>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Divider />

        {/* Contenido a dos columnas */}
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ display: "flex" }}>
            <ModalIzquierdo rowData={rowData} />
            <Divider orientation="vertical" flexItem />
            <ModalDerecho
              userId={rowData.firebaseId}   // 👈 importante
              setDocActivo={setDocActivo}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="contained">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL-VISOR DEL DOCUMENTO */}
      <ViewModal
        open={Boolean(docActivo)}
        doc={docActivo}
        onClose={() => setDocActivo(null)}
        onSaveEstado={handleSaveEstado}
      />
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // no importa, lo vamos a centrar con sx
        sx={{
          position: "fixed",
          top: "50% !important",
          left: "50% !important",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={mensaje.startsWith("No se pudo") ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </>
  );
}
