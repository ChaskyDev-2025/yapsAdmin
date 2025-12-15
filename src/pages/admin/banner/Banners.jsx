// src/pages/admin/banner/Banners.jsx
import React from "react";
import Icons from "../../../shared/constants/Icons";
import { 
  Typography, Paper, Box, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Button, Snackbar, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Avatar, IconButton, Tooltip 
} from "@mui/material";
import TableToolbar from "../usuarios/components/TableToolbar";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
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
  const [searchBanners, setSearchBanners] = React.useState("");
  const [sortByBanners, setSortByBanners] = React.useState("createdAt-desc");
  const [visibleColumnsBanners, setVisibleColumnsBanners] = React.useState({
    imagen: true,
    titulo: true,
    estado: true,
    fechaCreacion: true,
    acciones: true,
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

  if (loading) return <CircularProgress />;
  if (error)   return <Alert severity="error">{error.message}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: "#000000" }}>
          Banners
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <TableToolbar
              searchValue={searchBanners}
              onSearchChange={setSearchBanners}
              sortValue={sortByBanners}
              onSortChange={setSortByBanners}
              sortOptions={[
                { label: "↑ Sort by Creación (ASC)", value: "createdAt-asc" },
                { label: "↓ Sort by Creación (DESC)", value: "createdAt-desc" },
              ]}
              visibleColumns={visibleColumnsBanners}
              onColumnChange={(col, visible) => setVisibleColumnsBanners(prev => ({ ...prev, [col]: visible }))}
              showClearButton={searchBanners !== ""}
              onClear={() => {
                setSearchBanners("");
                setSortByBanners("createdAt-desc");
              }}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ backgroundColor: "#d7171a", whiteSpace: "nowrap", "&:hover": { backgroundColor: "#b01217" } }}
            onClick={() => {
              // Aquí se dispara el modal de agregar
            }}
          >
            Agregar Banner
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#000000" }}>
              <TableRow>
                <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                  Imagen
                </TableCell>
                <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                  Título
                </TableCell>
                <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                  Estado
                </TableCell>
                <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                  Fecha de Creación
                </TableCell>
                <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                      No hay banners registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((banner) => (
                  <TableRow key={banner.id} hover sx={{ borderBottom: "1px solid #d0d0d0" }}>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                      {banner.imagen ? (
                        <Avatar
                          src={banner.imagen}
                          alt={banner.titulo || "Banner"}
                          sx={{ width: 50, height: 50, bgcolor: "#d7171a" }}
                        />
                      ) : (
                        <Avatar sx={{ width: 50, height: 50, bgcolor: "#d7171a" }}>-</Avatar>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                      {banner.titulo || "-"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                      <Typography
                        sx={{
                          color: banner.estado === true ? "#d7171a" : "#bdbdbd",
                          fontWeight: 600,
                          fontFamily: "Mulish, sans-serif"
                        }}
                      >
                        {banner.estado === true ? "Activo" : "Inactivo"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                      {banner.createdAt
                        ? new Date(banner.createdAt.toDate()).toLocaleDateString("es-ES")
                        : "-"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Ver imagen">
                          <IconButton
                            size="small"
                            onClick={() => handleView(banner)}
                            sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffebee" } }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(banner)}
                            sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffebee" } }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(banner)}
                            sx={{ bgcolor: "#ffebee", color: "#d7171a", "&:hover": { bgcolor: "#ffcccb" } }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
    </Box>
  );
};

export default Banners;
