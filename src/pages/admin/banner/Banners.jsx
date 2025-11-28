// src/pages/admin/banner/Banners.jsx
import React from "react";
import { Tabla3 } from "../../../shared/components/tablas/tabla3";
import Icons from "../../../shared/constants/Icons";
import { Typography, Paper, Box, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Snackbar } from "@mui/material";
import useBannerColumns from "./data/Columnas";
import ModalAgregar from "./components/ModalAgregar";

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, db } from "../../../data/firebase/firebase";
import { collection, getDocs, addDoc, orderBy, query, serverTimestamp, updateDoc, doc, deleteDoc,  } from "firebase/firestore";

const Banners = () => {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [confirmDialog, setConfirmDialog] = React.useState({
    open: false,
    bannerId: null,
    bannerRow: null,
  });
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });
  const agregarApiRef = React.useRef({ datos: null }); // ModalAgregar te llena esto

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRows(banners);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchBanners(); }, []);

  // Cambiar estado en UI + persistir en Firestore
  const handleEstadoChange = React.useCallback(async (row, newEstado) => {
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, estado: newEstado } : r)));
    try {
      await updateDoc(doc(db, "banners", row.id), { estado: newEstado });
    } catch (e) {
      // revertir si falla
      setRows(prev => prev.map(r => (r.id === row.id ? { ...r, estado: !newEstado } : r)));
      console.error(e);
    }
  }, []);

  const handleEdit = React.useCallback((row) => {
    console.log("Editar banner:", row);
    // Aquí puedes agregar la lógica para editar
    alert("Funcion editar proximamente");
  }, []);

  const handleDelete = React.useCallback((row) => {
    setConfirmDialog({
      open: true,
      bannerId: row.id,
      bannerRow: row,
    });
  }, []);

  const handleConfirmDelete = async () => {
    const { bannerId, bannerRow } = confirmDialog;
    setConfirmDialog({ open: false, bannerId: null, bannerRow: null });

    try {
      // 1. Eliminar de Firestore
      await deleteDoc(doc(db, "banners", bannerId));

      //2. Eliminar imagen de storage
      if (bannerRow.imagen){
        try {
          const imgRef = ref(storage, bannerRow.imagen);
          await deleteObject(imgRef);
        } catch (e) {
          console.warn("No se pudo eliminar la imagen de la storage:", e);
        }
      }

      //3 Actualizar UI
      setRows(prev => prev.filter(r => r.id !== bannerId));
      setSnackbar({ open: true, message: "Banner eliminado exitosamente", severity: "success" });
    }catch (e) {
      console.error("Error al eliminar:", e);
      setSnackbar({ open: true, message: "Error al eliminar el banner: " + e.message, severity: "error" });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, bannerId: null, bannerRow: null });
  };

  const handleView = React.useCallback((row) => {
    //abrir imagen en nueva pestania
    if (row.imagen) {
      window.open(row.imagen, '_blank');
    }else {
      alert("Este banner no tiene imagen");
    }
  }, []);

  const columns = useBannerColumns(handleEstadoChange, handleEdit, handleDelete, handleView);

  if (loading) return <CircularProgress />;
  if (error)   return <Alert severity="error">{error.message}</Alert>;

  return (
    <Paper elevation={6} sx={{ p: 3, borderRadius: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Banners
      </Typography>

      <Tabla3
        rows={rows}
        columns={columns}
        pageSize={3}
        buttons={[
          {
            label: "Agregar",
            icon: <Icons.Add />,
            title: "Agregar nuevo banner",
            renderModal: () => (
              <ModalAgregar onReady={(api) => { agregarApiRef.current = api; }} />
            ),
            footerButtons: (close) => [
              { label: "Cerrar", position: "left", onClick: close },
              {
                label: "Guardar",
                icon: <Icons.Save />,
                position: "right",
onClick: async () => {
  const { save } = agregarApiRef.current || {};
  if (typeof save !== "function") return; // el modal no montó aún
  try {
    const nuevo = await save();           // { id, imagen, estado }
    setRows(prev => [nuevo, ...prev]);    // agrega sin reconsultar
    close();
} catch (e) {
  console.error("UPLOAD ERROR:", e?.code || e?.message, e);
  alert(e?.code || e?.message || "Error al subir la imagen");
}

}



              },
            ],
          },
        ]}
      />

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que quieres eliminar el banner <strong>{confirmDialog.bannerId}</strong>? 
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelDelete}
            sx={{ color: "#484848" }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              backgroundColor: "#D32F2F",
              "&:hover": {
                backgroundColor: "#B71C1C",
              },
            }}
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Banners;
