// src/pages/admin/ajustes/Ajustes.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Typography,
  Paper,
  Box,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Pagination,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DetalleModal from "./components/ModalUsuario";
import { useUsuarios } from "./hooks/useUsuarios";
import { useAuth } from "../../../auth/AuthContext";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { TableToolbar } from "../usuarios/components/TableToolbar";

const Ajustes = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [nombreEmpresa, setNombreEmpresa] = useState("Empresa");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [flotaIdActual, setFlotaIdActual] = useState(null);
  const [searchUsuarios, setSearchUsuarios] = useState("");
  const [sortByUsuarios, setSortByUsuarios] = useState("nombre-asc");
  const [pageUsuarios, setPageUsuarios] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [visibleColumnsAjustes, setVisibleColumnsAjustes] = useState({
    id: true,
    nombre: true,
    telefono: true,
    email: true,
    rol: true,
    fechaRegistro: true,
    acciones: true,
  });

  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setPageUsuarios(0);
  }, [searchUsuarios]);
  
  const { rows, cargando, error, refetch } = useUsuarios(flotaIdActual);
  const { user } = useAuth();

  //Obtener nombre de empresa del usuario actual
  useEffect(() => {
    const fetchEmpresaName = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            //Si tiene flotaId, buscar el nombre en la flota
            if (userData.flotaId) {
              setFlotaIdActual(userData.flotaId);
              const flotaDoc = await getDoc(doc(db, "flotas", userData.flotaId));
              if (flotaDoc.exists()) {
                const flotaData = flotaDoc.data();
                setNombreEmpresa(flotaData.nombre || flotaData.nombreEmpresa || "Empresa");
              }
            } else {
              //Si no tiene FlotaID, usar nombreEmpresa del usuario
              setNombreEmpresa(userData.nombreEmpresa || "Empresa");
            }
          }
        } catch (error) {
          console.error("Error al obtener nombre de empresa:", error);
        }
      }
    };
    fetchEmpresaName();
  }, [user]);

  const handleVer = (row) => {
    setSelectedRow(row);
    setOpenModal(true);
  };

  const handleEditar = (row) => {
    setSelectedRow(row);
    setOpenModal(true);
  };

  const handleEliminar = (row) => {
    setUserToDelete(row);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const collection = userToDelete.tipo === "trabajador" ? "trabajadores" : "users";
      await deleteDoc(doc(db, collection, userToDelete.firebaseId));

      setMessage({ type: "success", text: "Usuario eliminado correctamente" });
      setOpenDeleteDialog(false);
      setUserToDelete(null);

      // Recargar los datos
      if (refetch) refetch();

      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setMessage({ type: "error", text: "Error al eliminar usuario: " + error.message });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } finally {
      setDeleting(false);
    }
  };

  // Filtrado y ordenamiento
  const usuariosFiltrados = useMemo(() => {
    let filtered = rows;

    if (searchUsuarios) {
      const search = searchUsuarios.toLowerCase();
      filtered = filtered.filter(u =>
        (u.nombreUsuario || "").toLowerCase().includes(search) ||
        (u.email || "").toLowerCase().includes(search) ||
        (u.telefono || "").toLowerCase().includes(search)
      );
    }

    const sorted = [...filtered];
    switch (sortByUsuarios) {
      case "nombre-asc":
        sorted.sort((a, b) => (a.nombreUsuario || "").localeCompare(b.nombreUsuario || ""));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => (b.nombreUsuario || "").localeCompare(a.nombreUsuario || ""));
        break;
      case "fecha-desc":
        sorted.sort((a, b) => new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0));
        break;
      default:
        break;
    }

    return sorted;
  }, [rows, searchUsuarios, sortByUsuarios]);

  // Paginación
  const usuariosPaginados = useMemo(() => {
    const start = pageUsuarios * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return usuariosFiltrados.slice(start, end);
  }, [usuariosFiltrados, pageUsuarios]);

  const totalPagesUsuarios = Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: "#d7171a", mr: 2 }}>
            <BusinessIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: "Mulish, sans-serif", color: "#000000" }}>
              {nombreEmpresa}
            </Typography>
            <Typography color="text.secondary" sx={{ fontFamily: "Mulish, sans-serif", color: "#484848" }}>
              Gestión de usuarios del sistema
            </Typography>
          </Box>
        </Box>

        <TableToolbar
          searchValue={searchUsuarios}
          onSearchChange={setSearchUsuarios}
          sortValue={sortByUsuarios}
          onSortChange={setSortByUsuarios}
          sortOptions={[
            { label: "↑ Sort by Nombre (ASC)", value: "nombre-asc" },
            { label: "↓ Sort by Nombre (DESC)", value: "nombre-desc" },
            { label: "↓ Sort by Fecha Registro", value: "fecha-desc" },
          ]}
          placeholder="Buscar por nombre, email o teléfono..."
          sx={{ mb: 3 }}
          visibleColumns={visibleColumnsAjustes}
          onColumnChange={(col, visible) => setVisibleColumnsAjustes(prev => ({ ...prev, [col]: visible }))}
          showClearButton={searchUsuarios !== ""}
          onClear={() => {
            setSearchUsuarios("");
            setSortByUsuarios("nombre-asc");
          }}
        />

        <TableContainer sx={{ mt: 3, borderRadius: 2, overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#000000" }}>
              <TableRow>
                <TableCell sx={{
                  backgroundColor: "#000000",
                  color: "white",
                  fontWeight: 700,
                  fontFamily: "Mulish, sans-serif",
                  fontSize: "0.95rem"
                }}>ID</TableCell>
                <TableCell sx={{
                  backgroundColor: "#000000",
                  color: "white",
                  fontWeight: 700,
                  fontFamily: "Mulish, sans-serif",
                  fontSize: "0.95rem"
                }}>Nombre Usuario</TableCell>
                <TableCell sx={{
                  backgroundColor: "#000000",
                  color: "white",
                  fontWeight: 700,
                  fontFamily: "Mulish, sans-serif",
                  fontSize: "0.95rem"
                }}>Teléfono</TableCell>
                <TableCell sx={{
                  backgroundColor: "#000000",
                  color: "white",
                  fontWeight: 700,
                  fontFamily: "Mulish, sans-serif",
                  fontSize: "0.95rem"
                }}>Email</TableCell>
                <TableCell sx={{
                  backgroundColor: "#000000",
                  color: "white",
                  fontWeight: 700,
                  fontFamily: "Mulish, sans-serif",
                  fontSize: "0.95rem"
                }}>Rol</TableCell>
                <TableCell sx={{
                  backgroundColor: "#000000",
                  color: "white",
                  fontWeight: 700,
                  fontFamily: "Mulish, sans-serif",
                  fontSize: "0.95rem"
                }}>Fecha de Registro</TableCell>
                <TableCell sx={{
                  backgroundColor: "#000000",
                  color: "white",
                  fontWeight: 700,
                  fontFamily: "Mulish, sans-serif",
                  fontSize: "0.95rem",
                  textAlign: "center"
                }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 3 }}>
                    <Typography>Cargando usuarios...</Typography>
                  </TableCell>
                </TableRow>
              ) : usuariosFiltrados.length > 0 ? (
                usuariosPaginados.map((row) => (
                  <TableRow
                    key={row.firebaseId || row.id}
                    sx={{
                      borderBottom: "1px solid #d0d0d0",
                      "&:hover": { backgroundColor: "#f9f9f9" },
                      cursor: "pointer"
                    }}
                    onClick={() => handleVer(row)}
                  >
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                      {row.nro || "-"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                      {row.nombreUsuario || "-"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                      {row.telefono || "Sin teléfono"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                      {row.email || "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.rol || "Usuario"}
                        sx={{
                          backgroundColor: row.rol === "Admin" ? "#d7171a" : "#e0e0e0",
                          color: row.rol === "Admin" ? "white" : "#333",
                          fontWeight: 600,
                          fontFamily: "Mulish, sans-serif"
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                      {row.fechaRegistro ? new Date(row.fechaRegistro).toLocaleDateString("es-ES") : "Sin fecha"}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditar(row);
                        }}
                        title="Editar"
                        sx={{ color: "#d7171a" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminar(row);
                        }}
                        title="Eliminar"
                        sx={{ color: "#f44336" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 3 }}>
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {usuariosFiltrados.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Mostrando {pageUsuarios * ITEMS_PER_PAGE + 1} - {Math.min((pageUsuarios + 1) * ITEMS_PER_PAGE, usuariosFiltrados.length)} de {usuariosFiltrados.length}
            </Typography>
            <Pagination
              count={totalPagesUsuarios}
              page={pageUsuarios + 1}
              onChange={(e, page) => setPageUsuarios(page - 1)}
              sx={{
                "& .MuiButtonBase-root": {
                  fontFamily: "Mulish, sans-serif",
                  color: "#000",
                },
                "& .Mui-selected": {
                  backgroundColor: "#aaaaaa !important",
                  color: "white",
                },
              }}
            />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, fontFamily: "Mulish, sans-serif" }}>
            {error}
          </Alert>
        )}
      </Paper>

      {message.text && (
        <Alert severity={message.type} sx={{ mt: 2, fontFamily: "Mulish, sans-serif" }}>
          {message.text}
        </Alert>
      )}

      <DetalleModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        rowData={selectedRow}
      />

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#f44336", color: "white", fontWeight: "bold" }}>
          ⚠️ Confirmar eliminación
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          ¿Estás seguro de que deseas eliminar a <strong>{userToDelete?.nombreUsuario}</strong>?
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            disabled={deleting}
            sx={{ backgroundColor: "#d7171a", "&:hover": { backgroundColor: "#b01217" } }}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Ajustes;