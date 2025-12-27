// src/pages/admin/banner/Banners.jsx
import React, { useMemo } from "react";
import Icons from "../../../shared/constants/Icons";
import { 
  Typography, Paper, Box, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Button, Snackbar, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Avatar, IconButton, Tooltip, Pagination, Switch
} from "@mui/material";
import TableToolbar from "../usuarios/components/TableToolbar";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ModalAgregar from "./components/ModalAgregar";
import ModalEditar from "./components/ModalEditar";

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
    linkBanner: true,
    estado: true,
    fechaCreacion: true,
    acciones: true,
  });
  
  // Estados para paginación
  const ITEMS_PER_PAGE = 10;
  const [pageBanners, setPageBanners] = React.useState(0);
  
  // Estados para modal de agregar banner
  const [modalAgregarOpen, setModalAgregarOpen] = React.useState(false);
  
  // Estados para modal de editar banner
  const [modalEditarOpen, setModalEditarOpen] = React.useState(false);
  const [bannerEditando, setBannerEditando] = React.useState(null);
  
  // Estados para modal de ver imagen
  const [imagenExpandidaUrl, setImagenExpandidaUrl] = React.useState(null);
  const [imagenExpandidaOpen, setImagenExpandidaOpen] = React.useState(false);
  
  // Resetear página al cambiar búsqueda o filtros
  React.useEffect(() => {
    setPageBanners(0);
  }, [searchBanners]);
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

  // Filtrar y ordenar banners
  const filteredRows = useMemo(() => {
    let result = [...rows];
    
    // Filtrar por búsqueda
    if (searchBanners.trim()) {
      const search = searchBanners.toLowerCase();
      result = result.filter(banner =>
        (banner.titulo || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenar
    if (sortByBanners === "createdAt-asc") {
      result.sort((a, b) => 
        new Date(a.createdAt?.toDate?.() || a.createdAt || 0) - 
        new Date(b.createdAt?.toDate?.() || b.createdAt || 0)
      );
    } else if (sortByBanners === "createdAt-desc") {
      result.sort((a, b) => 
        new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - 
        new Date(a.createdAt?.toDate?.() || a.createdAt || 0)
      );
    }
    
    return result;
  }, [rows, searchBanners, sortByBanners]);

  // Datos paginados para Banners
  const bannersPaginados = React.useMemo(() => {
    const start = pageBanners * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredRows.slice(start, end);
  }, [filteredRows, pageBanners]);

  const totalPagesBanners = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);

  // Calcular colSpan dinámico basado en columnas visibles
  const getColSpan = React.useMemo(() => {
    return Object.values(visibleColumnsBanners).filter(Boolean).length;
  }, [visibleColumnsBanners]);

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
    setBannerEditando(row);
    setModalEditarOpen(true);
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
    // Abrir imagen en modal
    if (row.imagen) {
      setImagenExpandidaUrl(row.imagen);
      setImagenExpandidaOpen(true);
    } else {
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
            onClick={() => setModalAgregarOpen(true)}
          >
            Agregar Banner
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#000000" }}>
              <TableRow>
                {visibleColumnsBanners.imagen && (
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Imagen
                  </TableCell>
                )}
                {visibleColumnsBanners.titulo && (
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Título
                  </TableCell>
                )}
                {visibleColumnsBanners.linkBanner && (
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Link
                  </TableCell>
                )}
                {visibleColumnsBanners.estado && (
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Estado
                  </TableCell>
                )}
                {visibleColumnsBanners.fechaCreacion && (
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Fecha de Creación
                  </TableCell>
                )}
                {visibleColumnsBanners.acciones && (
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Acciones
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={getColSpan} align="center">
                    <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                      No hay banners registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bannersPaginados.map((banner) => (
                  <TableRow key={banner.id} hover sx={{ borderBottom: "1px solid #d0d0d0" }}>
                    {visibleColumnsBanners.imagen && (
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
                    )}
                    {visibleColumnsBanners.titulo && (
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                        {banner.titulo || "-"}
                      </TableCell>
                    )}
                    {visibleColumnsBanners.linkBanner && (
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {banner.linkBanner ? (
                          <a 
                            href={banner.linkBanner} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: "#d7171a", textDecoration: "none", wordBreak: "break-all" }}
                          >
                            {banner.linkBanner.length > 40 ? banner.linkBanner.substring(0, 40) + "..." : banner.linkBanner}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                    {visibleColumnsBanners.estado && (
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Switch
                            checked={banner.estado === true}
                            onChange={(e) => handleEstadoChange(banner, e.target.checked)}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#d7171a",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#d7171a",
                              },
                            }}
                          />
                          <Typography
                            sx={{
                              color: banner.estado === true ? "#d7171a" : "#bdbdbd",
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                              fontSize: "0.9rem",
                            }}
                          >
                            {banner.estado === true ? "Activo" : "Inactivo"}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    {visibleColumnsBanners.fechaCreacion && (
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {banner.createdAt
                          ? new Date(banner.createdAt.toDate()).toLocaleDateString("es-ES")
                          : "-"}
                      </TableCell>
                    )}
                    {visibleColumnsBanners.acciones && (
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
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredRows.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Mostrando {bannersPaginados.length > 0 ? (pageBanners * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pageBanners + 1) * ITEMS_PER_PAGE, filteredRows.length)} de {filteredRows.length}
            </Typography>
            <Pagination 
              count={totalPagesBanners}
              page={pageBanners + 1}
              onChange={(e, page) => setPageBanners(page - 1)}
              sx={{
                "& .MuiPaginationItem-root": {
                  fontFamily: "Mulish, sans-serif",
                }
              }}
            />
          </Box>
        )}

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

      {/* Modal para agregar banner */}
      <Dialog
        open={modalAgregarOpen}
        onClose={() => setModalAgregarOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          ➕ Agregar Nuevo Banner
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <ModalAgregar
            onReady={(api) => {
              agregarApiRef.current = api;
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
          <Button
            onClick={() => setModalAgregarOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              try {
                await agregarApiRef.current.save();
                setModalAgregarOpen(false);
                setSnackbar({ open: true, message: "Banner agregado exitosamente", severity: "success" });
                fetchBanners();
              } catch (error) {
                setSnackbar({ open: true, message: "Error al agregar banner", severity: "error" });
              }
            }}
            variant="contained"
            sx={{ backgroundColor: "#d7171a", textTransform: "none" }}
            disabled={agregarApiRef.current?.saving}
          >
            {agregarApiRef.current?.saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para editar banner */}
      <Dialog
        open={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          ✏️ Editar Banner
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          {bannerEditando && (
            <ModalEditar
              banner={bannerEditando}
              onReady={(api) => {
                agregarApiRef.current = api;
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
          <Button
            onClick={() => setModalEditarOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              try {
                await agregarApiRef.current.save();
                setModalEditarOpen(false);
                setSnackbar({ open: true, message: "Banner actualizado exitosamente", severity: "success" });
                fetchBanners();
              } catch (error) {
                setSnackbar({ open: true, message: "Error al actualizar banner", severity: "error" });
              }
            }}
            variant="contained"
            sx={{ backgroundColor: "#d7171a", textTransform: "none" }}
            disabled={agregarApiRef.current?.saving}
          >
            {agregarApiRef.current?.saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver imagen expandida */}
      <Dialog
        open={imagenExpandidaOpen}
        onClose={() => setImagenExpandidaOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
            color: "#fff",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          🖼️ Vista Previa del Banner
        </DialogTitle>
        <DialogContent sx={{ pt: 5, pb: 3, textAlign: "center" }}>
          {imagenExpandidaUrl && (
            <Box
              component="img"
              src={imagenExpandidaUrl}
              alt="Banner preview"
              sx={{
                maxWidth: "100%",
                maxHeight: "600px",
                borderRadius: 2,
                objectFit: "contain",
                mt: 2,
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
          <Button
            onClick={() => setImagenExpandidaOpen(false)}
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      </Paper>
    </Box>
  );
};

export default Banners;
