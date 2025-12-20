import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Divider, IconButton
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import ModalIzquierdoConductor from "./ModalIzquierdoConductor";
import ModalDerechoConductor from "./ModalDerechoConductor";

export default function ModalDetalleConductor({ open, onClose, rowData }) {
  if (!rowData) return null;

  const nombre = rowData.nombre || rowData.perfil?.name || rowData.name || "-";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{ sx: { borderRadius: 3, p: 0, bgcolor: "#fafafa" } }}
    >
      {/* Encabezado */}
      <Box sx={{ display: "flex", alignItems: "center", px: 3, py: 2, bgcolor: "#FFFFFF", borderBottom: "1px solid #e0e0e0" }}>
        <PersonIcon sx={{ mr: 1, color: "#d7171a" }} />
        <DialogTitle sx={{ flexGrow: 1, p: 0, fontWeight: 700, fontSize: "1.3rem" }}>
          Detalle del Conductor: {nombre}
        </DialogTitle>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Contenido a dos columnas */}
      <DialogContent dividers sx={{ p: 0, overflow: "hidden", bgcolor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", height: "600px", gap: 0 }}>
          <ModalIzquierdoConductor rowData={rowData} />
          <Divider orientation="vertical" flexItem />
          <ModalDerechoConductor userId={rowData.firebaseId || rowData.uid} />
        </Box>
      </DialogContent>

      {/* Acciones */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#FFFFFF", borderTop: "1px solid #e0e0e0" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: "#d7171a",
            color: "#FFFFFF",
            fontWeight: 700,
            "&:hover": { bgcolor: "#b8131f" }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
