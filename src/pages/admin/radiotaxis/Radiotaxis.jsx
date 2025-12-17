// src/pages/admin/radiotaxis/Radiotaxis.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Paper,
  Stack,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Switch,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Button,
  Avatar,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DetalleModal from "./components/modalGenerico";
import TableToolbar from "../usuarios/components/TableToolbar";
import { useAuth } from "../../../auth/AuthContext";
import { doc, getDoc, deleteDoc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { isSuperAdmin } from "../../../services/userService";
// 👉 Datos desde el hook (Firebase)
import { useTrabajadoresPorFlota } from "./hooks/useTrabajadoresPorFlota";

const Radiotaxis = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRadio, setEditingRadio] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nombreEmpresa: "",
    email: "",
    telefono: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [flotaId, setFlotaId] = useState(null);
  const [searchRadiotaxis, setSearchRadiotaxis] = useState("");
  const [sortByRadiotaxis, setSortByRadiotaxis] = useState("nombre-asc");
  const [pageRadiotaxis, setPageRadiotaxis] = useState(0);
  const [visibleColumnsRadiotaxis, setVisibleColumnsRadiotaxis] = useState({
    nombre: true,
    email: true,
    telefono: true,
    documentos: true,
    estado: true,
    acciones: true,
  });
  const { user, userRole } = useAuth();
  const isSuperAdminUser = isSuperAdmin(userRole);
  const [allRadiotaxis, setAllRadiotaxis] = useState([]);
  const ITEMS_PER_PAGE = 10;
  
  // Cargar todos los radiotaxis (solo para superadmin)
  useEffect(() => {
    if (!isSuperAdminUser) return;

    const trabajadoresRef = collection(db, "trabajadores");
    const q = query(trabajadoresRef, where("modo", "==", "trabajador"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const trabajador = docSnap.data();
        const nombreUsuario = trabajador.perfil?.name || "Trabajador sin nombre";
        const telefono = trabajador.telefono || "Sin teléfono";
        const email = trabajador.perfil?.email || trabajador.email || "Sin email";
        const fotoUrl = trabajador.perfil?.photoUrl || "";

        return {
          id: docSnap.id,
          firebaseId: docSnap.id,
          nombreEmpresa: nombreUsuario,
          telefono,
          email,
          representante: email,
          logoUrl: fotoUrl,
          logo: fotoUrl,
          saldo: "Bs. 0.00",
          estado: "Trabajador",
          activo: trabajador.activo !== false,
          documentos: trabajador.documentos || {},
          documentos_aprobados: trabajador.documentos_aprobados || false,
          deletedByFlotaId: trabajador.deletedByFlotaId || null,
          departamento: trabajador.departamento || "-",
          categoria: trabajador.categoria || "-",
          flotaId: trabajador.flotaId || "-",
          flotaNombre: trabajador.flotaNombre || "-",
          servicio: trabajador.servicio || "-",
        };
      });
      setAllRadiotaxis(data);
    });

    return () => unsubscribe();
  }, [isSuperAdminUser]);

  // Seleccionar filas correctas según el rol
  const { rows: rowsFlota, cargando, error, refetch } = useTrabajadoresPorFlota(flotaId);
  const displayRows = isSuperAdminUser ? allRadiotaxis : rowsFlota;

  // Obtener flotaId del usuario actual
  useEffect(() => {
    const fetchFlotaId = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().flotaId) {
            setFlotaId(userDoc.data().flotaId);
          }
        } catch (error) {
          console.error("Error al obtener flotaId:", error);
        }
      }
    };
    fetchFlotaId();
  }, [user]);

  // Reset página al cambiar búsqueda
  useEffect(() => {
    setPageRadiotaxis(0);
  }, [searchRadiotaxis]);

  const handleVer = (row) => {
    setSelectedRow(row);
    setOpenModal(true);
  };

  const handleEdit = (row) => {
    setEditingRadio(row);
    setEditFormData({
      nombreEmpresa: row.nombreEmpresa || "",
      email: row.email || "",
      telefono: row.telefono || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.nombreEmpresa || !editFormData.telefono) {
      setErrorMessage("Nombre y teléfono son obligatorios");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "trabajadores", editingRadio.firebaseId), {
        nombreEmpresa: editFormData.nombreEmpresa,
        email: editFormData.email,
        telefono: editFormData.telefono,
        updatedAt: new Date(),
      });
      setSuccessMessage("Radiotaxi actualizado correctamente");
      setEditDialogOpen(false);
      setEditingRadio(null);
      setErrorMessage("");
      setTimeout(() => {
        setSuccessMessage("");
        refetch();
      }, 2000);
    } catch (error) {
      setErrorMessage("Error al actualizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar a ${row.nombreEmpresa}? Este usuario será eliminado de su sistema.`)) {
      return;
    }

    setLoading(true);
    try {
      if (isSuperAdminUser) {
        // Superadmin elimina permanentemente
        await deleteDoc(doc(db, "trabajadores", row.firebaseId));
        setSuccessMessage("Radiotaxi eliminado permanentemente");
      } else {
        // Admin de flota hace soft delete (marca como eliminado por su flota)
        await updateDoc(doc(db, "trabajadores", row.firebaseId), {
          deletedByFlotaId: flotaId,
          deletedAt: new Date(),
        });
        setSuccessMessage("Radiotaxi ocultado para su flota");
      }
      setErrorMessage("");
      setTimeout(() => {
        setSuccessMessage("");
        refetch();
      }, 2000);
    } catch (error) {
      setErrorMessage("Error al eliminar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabilitado = async (firebaseId, nuevoEstado, documentosAprobados) => {
    // Si intenta activar y documentos_aprobados es false, no permitir
    if (nuevoEstado && !documentosAprobados) {
      alert("No puede activar este radiotaxi. Los documentos aún no han sido aprobados.");
      return;
    }

    try {
      const ref = doc(db, "trabajadores", firebaseId);
      await updateDoc(ref, {
        activo: nuevoEstado,
      });
      // Refrescar la tabla
      refetch();
    } catch (e) {
      console.error("Error al actualizar estado:", e);
    }
  };

  // Función para verificar si documentos están aprobados
  const verificarDocumentosAprobados = (documentosObj) => {
    return documentosObj?.documentos_aprobados === true;
  };

  // Filtrado y ordenamiento
  const radiotaxisFiltrados = useMemo(() => {
    let filtered = displayRows;
    
    // Filtro por búsqueda
    if (searchRadiotaxis) {
      const search = searchRadiotaxis.toLowerCase();
      filtered = filtered.filter(r =>
        (r.nombreEmpresa || "").toLowerCase().includes(search) ||
        (r.email || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByRadiotaxis) {
      case "nombre-asc":
        sorted.sort((a, b) => (a.nombreEmpresa || "").localeCompare(b.nombreEmpresa || ""));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => (b.nombreEmpresa || "").localeCompare(a.nombreEmpresa || ""));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [displayRows, searchRadiotaxis, sortByRadiotaxis]);

  // Paginación
  const radiotaxisPaginados = useMemo(() => {
    const start = pageRadiotaxis * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return radiotaxisFiltrados.slice(start, end);
  }, [radiotaxisFiltrados, pageRadiotaxis]);

  const totalPagesRadiotaxis = Math.ceil(radiotaxisFiltrados.length / ITEMS_PER_PAGE);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: "#000000" }}>
          Radiotaxis Registrados
        </Typography>
        <Typography color="text.secondary" gutterBottom sx={{ fontFamily: "Mulish, sans-serif" }}>
          Aquí puedes gestionar los radiotaxis que han enviado sus documentos.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, mt: 3 }}>
          <Box sx={{ flex: 1 }}>
            <TableToolbar
              searchValue={searchRadiotaxis}
              onSearchChange={setSearchRadiotaxis}
              sortValue={sortByRadiotaxis}
              onSortChange={setSortByRadiotaxis}
              sortOptions={[
                { label: "↑ Sort by Nombre (ASC)", value: "nombre-asc" },
                { label: "↓ Sort by Nombre (DESC)", value: "nombre-desc" },
              ]}
              visibleColumns={visibleColumnsRadiotaxis}
              onColumnChange={(col, visible) => setVisibleColumnsRadiotaxis(prev => ({ ...prev, [col]: visible }))}
              showClearButton={searchRadiotaxis !== ""}
              onClear={() => {
                setSearchRadiotaxis("");
                setSortByRadiotaxis("nombre-asc");
              }}
            />
          </Box>
        </Box>

        {cargando ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress sx={{ color: "#d7171a" }} />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#000000" }}>
                <TableRow>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Foto
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Nombre
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Teléfono
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Documentos Aprobados
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {radiotaxisPaginados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                        No hay radiotaxis registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  radiotaxisPaginados.map((radio) => (
                    <TableRow key={radio.firebaseId} hover sx={{ borderBottom: "1px solid #d0d0d0" }}>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif", textAlign: "center" }}>
                        <Avatar
                          src={radio.logo}
                          alt={radio.nombreEmpresa}
                          sx={{
                            width: 50,
                            height: 50,
                            bgcolor: "#d7171a",
                            border: "2px solid #d7171a",
                            margin: "0 auto",
                            fontWeight: 700,
                            fontSize: "1.2rem"
                          }}
                        >
                          {radio.nombreEmpresa?.[0] || "?"}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                        {radio.nombreEmpresa || "-"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {radio.email || "-"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {radio.telefono || "-"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        <Typography
                          sx={{
                            color: radio.documentos_aprobados ? "#d7171a" : "#bdbdbd",
                            fontWeight: 600,
                            fontFamily: "Mulish, sans-serif"
                          }}
                        >
                          {radio.documentos_aprobados ? "Sí" : "No"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        <Switch
                          checked={radio.activo === true}
                          onChange={(e) => handleToggleHabilitado(radio.firebaseId, e.target.checked, radio.documentos_aprobados)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#d7171a',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#d7171a',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleVer(radio)}
                              sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffebee" } }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(radio)}
                              sx={{ bgcolor: "#e3f2fd", color: "#1976d2", "&:hover": { bgcolor: "#bbdefb" } }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(radio)}
                              sx={{ bgcolor: "#ffebee", color: "#d7171a", "&:hover": { bgcolor: "#ffcdd2" } }}
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
        )}

        {radiotaxisFiltrados.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Mostrando {pageRadiotaxis * ITEMS_PER_PAGE + 1} - {Math.min((pageRadiotaxis + 1) * ITEMS_PER_PAGE, radiotaxisFiltrados.length)} de {radiotaxisFiltrados.length}
            </Typography>
            <Pagination
              count={totalPagesRadiotaxis}
              page={pageRadiotaxis + 1}
              onChange={(e, page) => setPageRadiotaxis(page - 1)}
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

        {successMessage && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
      </Paper>

      {/* Dialog para editar */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#000000", color: "white" }}>
          Editar Radiotaxi
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            label="Nombre de Empresa"
            fullWidth
            margin="normal"
            value={editFormData.nombreEmpresa}
            onChange={(e) => setEditFormData({ ...editFormData, nombreEmpresa: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
          />
          <TextField
            label="Teléfono"
            fullWidth
            margin="normal"
            value={editFormData.telefono}
            onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: "#484848" }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={loading}
            sx={{ bgcolor: "#d7171a", "&:hover": { bgcolor: "#b01217" } }}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Typography color="error" sx={{ mt: 2, fontFamily: "Mulish, sans-serif" }}>
          {error}
        </Typography>
      )}

      {/* Modal de Detalles */}
      <DetalleModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        rowData={selectedRow}
      />
    </Box>
  );
};

export default Radiotaxis;
