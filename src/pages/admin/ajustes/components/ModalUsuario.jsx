// src/pages/admin/ajustes/components/ModalUsuario.jsx
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Divider, IconButton
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import CloseIcon from "@mui/icons-material/Close";
import ModalEmpresaInfo from "./ModalEmpresaInfo";
import ModalUsuariosLista from "./ModalUsuariosLista";

export default function DetalleModal({ open, onClose, rowData }) {

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
          <BusinessIcon color="primary" sx={{ mr: 1 }} />
          <DialogTitle sx={{ flexGrow: 1, p: 0 }}>
            {rowData.nombreEmpresa}
          </DialogTitle>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        {/* Contenido a dos columnas */}
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ display: "flex" }}>
            {/* Columna izquierda: Info de la empresa */}
            <ModalEmpresaInfo rowData={rowData} />
            
            <Divider orientation="vertical" flexItem />
            
            {/* Columna derecha: Lista de usuarios de la empresa */}
            <ModalUsuariosLista userId={rowData.firebaseId} />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
