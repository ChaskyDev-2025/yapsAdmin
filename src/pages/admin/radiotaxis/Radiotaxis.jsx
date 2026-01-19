// src/pages/admin/radiotaxis/Radiotaxis.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Paper,
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
  Chip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import DetalleModal from "./components/modalGenerico";
import TableToolbar from "../usuarios/components/TableToolbar";
import DateFilterComponent from "../usuarios/components/DateFilterComponent";
import { useAuth } from "../../../auth/AuthContext";
import { doc, getDoc, deleteDoc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { isSuperAdmin } from "../../../services/userService";
// 👉 Datos desde el hook (Firebase)
import { useTrabajadoresPorFlota } from "./hooks/useTrabajadoresPorFlota";

const Radiotaxis = () => {
  // Función para capitalizar nombres
  const capitalizarNombre = (nombre) => {
    if (!nombre) return "";
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Función para obtener la foto del radiotaxi desde múltiples ubicaciones posibles
  const obtenerFotoRadiotaxis = (radio) => {
    return radio.fotoUrl || radio.logo || "";
  };

  // Función para obtener el saldo de la billetera del conductor
  const obtenerSaldoTrabajador = async (uid) => {
    try {
      const billeteraRef = doc(db, "trabajadores", uid, "billetera", "data");
      const billeteraSnap = await getDoc(billeteraRef);
      if (billeteraSnap.exists()) {
        const saldo = billeteraSnap.data().saldo || 0;
        return `Bs. ${parseFloat(saldo).toFixed(2)}`;
      }
      return "Bs. 0.00";
    } catch (error) {
      console.error("Error al obtener saldo:", error);
      return "Bs. 0.00";
    }
  };

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
  const [periodFilterRadiotaxis, setPeriodFilterRadiotaxis] = useState("todos");
  const [filterConectadoRadiotaxis, setFilterConectadoRadiotaxis] = useState("todos"); // todos, en linea, desconectados
  const [visibleColumnsRadiotaxis, setVisibleColumnsRadiotaxis] = useState({
    foto: true,
    nombre: true,
    email: true,
    telefono: true,
    documentos: true,
    conectado: true,
    contactar: true,
    fecha: true,
    acciones: true,
  });
  const { user, userRole } = useAuth();
  const isSuperAdminUser = isSuperAdmin(userRole);
  const [allRadiotaxis, setAllRadiotaxis] = useState([]);
  const [saldosPorTrabajador, setSaldosPorTrabajador] = useState({});
  const ITEMS_PER_PAGE = 10;
  
  // Estados para diálogo de eliminación de conductor
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [conductorToDelete, setConductorToDelete] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({ title: "", message: "", type: "success" });
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Cargar todos los radiotaxis (solo para superadmin)
  useEffect(() => {
    if (!isSuperAdminUser) return;

    const trabajadoresRef = collection(db, "trabajadores");
    const q = query(trabajadoresRef, where("modo", "==", "trabajador"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const trabajador = docSnap.data();
        // Nueva estructura: datos en la raíz del documento
        const nombreUsuario = trabajador.nombre || trabajador.perfil?.nombre || trabajador.perfil?.name || "Trabajador sin nombre";
        const telefono = trabajador.telefono || trabajador.phoneNumber || "Sin teléfono";
        const email = trabajador.perfil?.email || trabajador.email || "Sin email";
        const fotoUrl = trabajador.perfil?.foto || trabajador.perfil?.fotoUrl || trabajador.perfil?.photoURL || trabajador.fotoUrl || trabajador.photoURL || "";
        const createdAt = trabajador.createdAt || null;

        return {
          id: docSnap.id,
          firebaseId: docSnap.id,
          nombreEmpresa: nombreUsuario,
          telefono,
          phoneVerified: trabajador.phoneVerified || false,
          email,
          representante: email,
          logoUrl: fotoUrl,
          logo: fotoUrl,
          fotoUrl: fotoUrl,
          saldo: "Bs. 0.00",
          estado: "Trabajador",
          activo: trabajador.activo !== false,
          online: trabajador.online === true,
          documentos: trabajador.documentos || {},
          documentos_aprobados: trabajador.documentos_aprobados || false,
          deletedByFlotaId: trabajador.deletedByFlotaId || null,
          departamento: trabajador.departamento || "-",
          categorias: trabajador.categorias || [],
          servicios: trabajador.servicios || {},
          flotaId: trabajador.flotaId || "-",
          flotaNombre: trabajador.flotaNombre || "-",
          createdAt: createdAt,
          perfil: trabajador.perfil || {},
        };
      });
      setAllRadiotaxis(data);
    });

    return () => unsubscribe();
  }, [isSuperAdminUser]);

  // Cargar saldos de billeteras para cada trabajador
  useEffect(() => {
    if (allRadiotaxis.length === 0) return;

    const cargarSaldos = async () => {
      const saldos = {};
      for (const trabajador of allRadiotaxis) {
        saldos[trabajador.firebaseId] = await obtenerSaldoTrabajador(trabajador.firebaseId);
      }
      setSaldosPorTrabajador(saldos);
    };

    cargarSaldos();
  }, [allRadiotaxis]);

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
      departamento: row.departamento || "",
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
        departamento: editFormData.departamento,
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
    setConductorToDelete(row);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setConductorToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!conductorToDelete) return;
    
    setLoading(true);
    try {
      if (isSuperAdminUser) {
        // Superadmin elimina permanentemente
        await deleteDoc(doc(db, "trabajadores", conductorToDelete.firebaseId));
        setSuccessMessage("Radiotaxi eliminado permanentemente");
      } else {
        // Admin de flota hace soft delete (marca como eliminado por su flota)
        await updateDoc(doc(db, "trabajadores", conductorToDelete.firebaseId), {
          deletedByFlotaId: flotaId,
          deletedAt: new Date(),
        });
        setSuccessMessage("Radiotaxi ocultado para su flota");
      }
      setErrorMessage("");
      handleCloseDeleteDialog();
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
      setConfirmDialogData({
        title: "\u26a0️ Documentos no aprobados",
        message: "No puede activar este radiotaxi. Los documentos aún no han sido aprobados.",
        type: "warning"
      });
      setConfirmAction(null);
      setConfirmDialogOpen(true);
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

  // Enviar mensaje por WhatsApp al número del radiotaxi/conductor
  const sendWhatsApp = (phone, name) => {
    try {
      if (!phone) {
        setConfirmDialogData({
          title: "\u26a0️ Validación",
          message: "No hay número de teléfono disponible para este radiotaxi.",
          type: "warning"
        });
        setConfirmAction(null);
        setConfirmDialogOpen(true);
        return;
      }

      const cleaned = String(phone).replace(/[^0-9+]/g, "");
      const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

      if (!digits || digits.length < 6) {
        setConfirmDialogData({
          title: "\u26a0️ Validación",
          message: `Número de teléfono inválido para WhatsApp: ${phone}`,
          type: "warning"
        });
        setConfirmAction(null);
        setConfirmDialogOpen(true);
        return;
      }

      const text = `Hola ${name || ""}, te escribo desde la plataforma YAAPS.`;
      const url = `https://wa.me/${encodeURIComponent(digits)}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error al abrir WhatsApp:", err);
      setConfirmDialogData({
        title: "\u274c Error",
        message: "No se pudo abrir WhatsApp. Por favor intenta nuevamente.",
        type: "error"
      });
      setConfirmAction(null);
      setConfirmDialogOpen(true);
    }
  };

  // Filtrado y ordenamiento
  const radiotaxisFiltrados = useMemo(() => {
    let filtered = displayRows;
    
    // Filtro por período
    if (periodFilterRadiotaxis !== "todos") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter((radio) => {
        if (!radio.createdAt) return false;
        
        // Convertir timestamp de Firebase a Date
        let fechaDate;
        if (radio.createdAt?.toDate && typeof radio.createdAt.toDate === 'function') {
          fechaDate = radio.createdAt.toDate();
        } else if (typeof radio.createdAt === 'string') {
          fechaDate = new Date(radio.createdAt);
        } else if (radio.createdAt instanceof Date) {
          fechaDate = radio.createdAt;
        } else if (radio.createdAt?.seconds) {
          fechaDate = new Date(radio.createdAt.seconds * 1000);
        } else {
          return false;
        }
        
        // Obtener solo la fecha (ignorar hora)
        const registroDate = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate());
        
        switch (periodFilterRadiotaxis) {
          case "hoy":
            return registroDate.getTime() === today.getTime();
          case "esta-semana": {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return registroDate >= startOfWeek && registroDate <= today;
          }
          case "este-mes": {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            return registroDate >= startOfMonth && registroDate <= today;
          }
          case "ultimos-7": {
            const hace7Dias = new Date(today);
            hace7Dias.setDate(hace7Dias.getDate() - 7);
            return registroDate >= hace7Dias && registroDate <= today;
          }
          case "ultimos-30": {
            const hace30Dias = new Date(today);
            hace30Dias.setDate(hace30Dias.getDate() - 30);
            return registroDate >= hace30Dias && registroDate <= today;
          }
          default:
            return true;
        }
      });
    }
    
    // Filtro por conectado
    if (filterConectadoRadiotaxis !== "todos") {
      filtered = filtered.filter(r => {
        if (filterConectadoRadiotaxis === "en linea") return r.online === true;
        if (filterConectadoRadiotaxis === "desconectados") return r.online !== true;
        return true;
      });
    }
    
    // Filtro por búsqueda
    if (searchRadiotaxis) {
      const search = searchRadiotaxis.toLowerCase();
      filtered = filtered.filter(r => {
        const nombre = (r.nombreEmpresa || "").toLowerCase();
        const email = (r.email || "").toLowerCase();
        const telefono = (r.telefono || "").toLowerCase();
        return nombre.includes(search) || email.includes(search) || telefono.includes(search);
      });
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
  }, [displayRows, searchRadiotaxis, sortByRadiotaxis, periodFilterRadiotaxis, filterConectadoRadiotaxis]);

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
          Conductores Registrados
        </Typography>
        <Typography color="text.secondary" gutterBottom sx={{ fontFamily: "Mulish, sans-serif" }}>
          Aquí puedes gestionar los conductores y sus historiales de viajes.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, mt: 3, flexWrap: "wrap" }}>
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
              filterOptions={[
                {
                  name: "conectado",
                  label: "Conectado",
                  defaultValue: "todos",
                  options: [
                    { label: "Todos", value: "todos" },
                    { label: "En línea", value: "en linea" },
                    { label: "Desconectados", value: "desconectados" },
                  ],
                },
              ]}
              filterValue={{ conectado: filterConectadoRadiotaxis }}
              onFilterChange={(name, value) => setFilterConectadoRadiotaxis(value)}
              visibleColumns={visibleColumnsRadiotaxis}
              onColumnChange={(col, visible) => setVisibleColumnsRadiotaxis(prev => ({ ...prev, [col]: visible }))}
              showClearButton={searchRadiotaxis !== ""}
              onClear={() => {
                setSearchRadiotaxis("");
                setSortByRadiotaxis("nombre-asc");
                setFilterConectadoRadiotaxis("todos");
              }}
            />
          </Box>
          <DateFilterComponent
            onFilterChange={setPeriodFilterRadiotaxis}
            currentDateFilter={periodFilterRadiotaxis}
          />
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
                  {visibleColumnsRadiotaxis.foto && (
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Foto
                    </TableCell>
                  )}
                  {visibleColumnsRadiotaxis.nombre && (
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Nombre
                    </TableCell>
                  )}
                  {visibleColumnsRadiotaxis.email && (
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Email
                    </TableCell>
                  )}
                  {visibleColumnsRadiotaxis.telefono && (
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Teléfono
                    </TableCell>
                  )}
                  {visibleColumnsRadiotaxis.documentos && (
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Documentos
                    </TableCell>
                  )}
                  {visibleColumnsRadiotaxis.conectado && (
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Conectado
                    </TableCell>
                  )}
                  {visibleColumnsRadiotaxis.contactar && (
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Contactar
                    </TableCell>
                  )}
                  {visibleColumnsRadiotaxis.fecha && (
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Fecha Registro
                    </TableCell>
                  )}
                  {visibleColumnsRadiotaxis.acciones && (
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                      Acciones
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {radiotaxisPaginados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                        No hay conductores registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  radiotaxisPaginados.map((radio) => (
                    <TableRow key={radio.firebaseId} hover sx={{ borderBottom: "1px solid #d0d0d0" }}>
                      {visibleColumnsRadiotaxis.foto && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", textAlign: "center" }}>
                          <Avatar
                            src={obtenerFotoRadiotaxis(radio)}
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
                      )}
                      {visibleColumnsRadiotaxis.nombre && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                          {capitalizarNombre(radio.nombreEmpresa || "-")}
                        </TableCell>
                      )}
                      {visibleColumnsRadiotaxis.email && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {radio.email || "-"}
                        </TableCell>
                      )}
                      {visibleColumnsRadiotaxis.telefono && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <span>{radio.telefono || "-"}</span>
                            <Tooltip title={radio.phoneVerified ? "Teléfono verificado" : "Teléfono sin verificar"}>
                              <Box
                                sx={{
                                  display: "inline-block",
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: radio.phoneVerified ? "#4caf50" : "#f44336",
                                  flexShrink: 0,
                                }}
                              />
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                      {visibleColumnsRadiotaxis.documentos && (
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
                      )}
                      {visibleColumnsRadiotaxis.conectado && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          <Chip
                            icon={radio.online === true ? <WifiIcon /> : <WifiOffIcon />}
                            label={radio.online === true ? "En línea" : "Desconectado"}
                            size="small"
                            sx={{
                              color: radio.online === true ? "#2e7d32" : "#616161",
                              backgroundColor: radio.online === true ? "#e8f5e9" : "#f5f5f5",
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                            }}
                          />
                        </TableCell>
                      )}
                      {visibleColumnsRadiotaxis.contactar && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", textAlign: "center" }}>
                          {radio.telefono ? (
                            <Tooltip title="Contactar por WhatsApp">
                              <IconButton
                                size="small"
                                onClick={() => sendWhatsApp(radio.telefono || radio.phoneNumber || radio.representante || radio.representanteTelefono, radio.nombreEmpresa)}
                                sx={{ bgcolor: "#e6f7ea", color: "#25D366", "&:hover": { bgcolor: "#d9f0df" } }}
                              >
                                <WhatsAppIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography sx={{ color: "#9e9e9e" }}>-</Typography>
                          )}
                        </TableCell>
                      )}
                      {visibleColumnsRadiotaxis.fecha && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontSize: "0.9rem" }}>
                          {radio.createdAt
                            ? (() => {
                                let date;
                                if (radio.createdAt?.toDate && typeof radio.createdAt.toDate === 'function') {
                                  date = radio.createdAt.toDate();
                                } else if (typeof radio.createdAt === 'string') {
                                  date = new Date(radio.createdAt);
                                } else if (radio.createdAt instanceof Date) {
                                  date = radio.createdAt;
                                } else {
                                  return "-";
                                }
                                return date.toLocaleDateString("es-ES");
                              })()
                            : "-"}
                        </TableCell>
                      )}
                      {visibleColumnsRadiotaxis.acciones && (
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
                      )}
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
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#000000", color: "white", display: "flex", alignItems: "center", gap: 1 }}>
          <EditIcon /> Editar Radiotaxi
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Sección 1: Información del Conductor */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                Información del Conductor
              </Typography>
              <TextField
                label="Nombre del Conductor"
                fullWidth
                value={editFormData.nombreEmpresa}
                onChange={(e) => setEditFormData({ ...editFormData, nombreEmpresa: e.target.value })}
                placeholder="Ej: GUIDO HERBAS CECILIANO"
                error={!editFormData.nombreEmpresa}
                helperText={!editFormData.nombreEmpresa ? "Campo requerido" : ""}
              />
            </Box>

            {/* Sección 2: Contacto */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                Información de Contacto
              </Typography>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="ejemplo@correo.com"
                sx={{ mb: 2 }}
              />
              <TextField
                label="Teléfono"
                fullWidth
                value={editFormData.telefono}
                onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                placeholder="+591 XXXXXXXXX"
                error={!editFormData.telefono}
                helperText={!editFormData.telefono ? "Campo requerido" : ""}
              />
            </Box>

            {/* Sección 3: Ubicación */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                Ubicación
              </Typography>
              <TextField
                label="Departamento"
                fullWidth
                value={editFormData.departamento}
                onChange={(e) => setEditFormData({ ...editFormData, departamento: e.target.value })}
                placeholder="Ej: La Paz, Santa Cruz, Cochabamba..."
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e0e0e0" }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: "#484848", fontWeight: 600, textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={loading || !editFormData.nombreEmpresa || !editFormData.telefono}
            sx={{ 
              bgcolor: "#d7171a", 
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              "&:hover": { bgcolor: "#b01217" },
              "&:disabled": { bgcolor: "#ccc" }
            }}
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
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

      {/* Dialog de confirmación para eliminar conductor */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>
          ⚠️ Eliminar Conductor
        </DialogTitle>
        <DialogContent sx={{ fontFamily: "Mulish, sans-serif", pt: 2 }}>
          <Typography sx={{ mb: 2 }}>
            ¿Deseas eliminar este conductor?
          </Typography>
          {conductorToDelete && (
            <Box sx={{ backgroundColor: "#f5f5f5", p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: "#d7171a" }}>
                {conductorToDelete.nombreEmpresa}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666" }}>
                {conductorToDelete.email}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ color: "#666" }}>
            {isSuperAdminUser 
              ? "Se eliminará permanentemente del sistema." 
              : "Se ocultará para su flota."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación personalizado */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: 
            confirmDialogData.type === "success" ? "#4caf50" :
            confirmDialogData.type === "error" ? "#f44336" :
            "#ff9800",
          color: "white",
          fontWeight: "bold",
          fontSize: "1.2rem"
        }}>
          {confirmDialogData.title}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 3 }}>
          <Typography variant="body1" sx={{ color: "#333" }}>
            {confirmDialogData.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setConfirmDialogOpen(false);
              if (confirmAction) {
                confirmAction();
              }
            }}
            variant="contained" 
            sx={{ 
              backgroundColor: 
                confirmDialogData.type === "success" ? "#4caf50" :
                confirmDialogData.type === "error" ? "#f44336" :
                "#ff9800",
              "&:hover": {
                backgroundColor:
                  confirmDialogData.type === "success" ? "#388e3c" :
                  confirmDialogData.type === "error" ? "#d32f2f" :
                  "#e65100"
              }
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Radiotaxis;
