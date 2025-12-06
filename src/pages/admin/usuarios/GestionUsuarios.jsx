// src/pages/admin/usuarios/GestionUsuarios.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  Snackbar,
  Switch,
  FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalTaxiIcon from "@mui/icons-material/LocalTaxi";
import HistoryIcon from "@mui/icons-material/History";
import { useAuth } from "../../../auth/AuthContext";
import { getAllUsers, createAdminUser, updateUser, deleteUser, isSuperAdmin } from "../../../services/userService";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { TableToolbar } from "./components/TableToolbar";
import { HistorialViajesModal } from "./components/HistorialViajesModal";

const GestionUsuarios = () => {
  const { userRole, user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [pasajeros, setPasajeros] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [flotas, setFlotas] = useState([]);
  const [historialModalOpen, setHistorialModalOpen] = useState(false);
  const [pasajeroSeleccionado, setPasajeroSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  
  // Estados para búsqueda y filtros
  const [searchAdmin, setSearchAdmin] = useState("");
  const [searchPasajeros, setSearchPasajeros] = useState("");
  const [searchConductores, setSearchConductores] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos"); // todos, activos, inactivos
  const [filterEstadoConductores, setFilterEstadoConductores] = useState("todos"); // todos, activos, inactivos
  
  // Estados para ordenamiento
  const [sortByAdmin, setSortByAdmin] = useState("email-asc"); // email-asc, email-desc, nombre-asc, nombre-desc
  const [sortByPasajeros, setSortByPasajeros] = useState("nombre-asc"); // nombre-asc, nombre-desc, email-asc, email-desc
  const [sortByConductores, setSortByConductores] = useState("nombre-asc"); // nombre-asc, nombre-desc, email-asc, email-desc
  
  // Estados para columnas visibles (todas activas por defecto)
  const [visibleColumnsAdmin, setVisibleColumnsAdmin] = useState({
    email: true,
    nombre: true,
    rol: true,
    flota: true,
    estado: true,
    contraseña: true,
    creado: true,
    acciones: true,
  });
  
  const [visibleColumnsPasajeros, setVisibleColumnsPasajeros] = useState({
    foto: true,
    nombre: true,
    email: true,
    modo: true,
    provider: true,
    fecha: true,
  });
  
  const [visibleColumnsConductores, setVisibleColumnsConductores] = useState({
    foto: true,
    nombre: true,
    email: true,
    rol: true,
    flota: true,
    fecha: true,
    estado: true,
    acciones: true,
  });
  
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    role: "admin",
    password: "",
    flotaId: "",
  });

  // Función para formatear fechas de Firestore
  const formatearFecha = (timestamp) => {
    if (!timestamp) return "-";
    let fecha;
    if (timestamp?.toDate) {
      fecha = timestamp.toDate();
    } else if (timestamp?.seconds) {
      fecha = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      fecha = timestamp;
    } else {
      fecha = new Date(timestamp);
    }
    return isNaN(fecha) ? "-" : fecha.toLocaleDateString("es-ES");
  };

  // Funciones de filtrado con useMemo
  const usuariosFiltrados = useMemo(() => {
    let filtered = usuarios;
    
    // Filtro por búsqueda
    if (searchAdmin) {
      const search = searchAdmin.toLowerCase();
      filtered = filtered.filter(u => 
        (u.email && u.email.toLowerCase().includes(search)) ||
        (u.nombre && u.nombre.toLowerCase().includes(search))
      );
    }
    
    // Filtro por estado
    if (filterEstado !== "todos") {
      filtered = filtered.filter(u => {
        if (filterEstado === "activos") return u.active !== false;
        if (filterEstado === "inactivos") return u.active === false;
        return true;
      });
    }
    
    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByAdmin) {
      case "email-asc":
        sorted.sort((a, b) => ((a.email || "") || "").localeCompare((b.email || "") || ""));
        break;
      case "email-desc":
        sorted.sort((a, b) => ((b.email || "") || "").localeCompare((a.email || "") || ""));
        break;
      case "nombre-asc":
        sorted.sort((a, b) => ((a.nombre || "") || "").localeCompare((b.nombre || "") || ""));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => ((b.nombre || "") || "").localeCompare((a.nombre || "") || ""));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [usuarios, searchAdmin, filterEstado, sortByAdmin]);

  const pasajerosFiltrados = useMemo(() => {
    let filtered = pasajeros;
    
    if (searchPasajeros) {
      const search = searchPasajeros.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || p.perfil?.name || "").toLowerCase().includes(search) ||
        (p.email || p.perfil?.email || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByPasajeros) {
      case "nombre-asc":
        sorted.sort((a, b) => ((a.name || a.perfil?.name || "") || "").localeCompare((b.name || b.perfil?.name || "") || ""));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => ((b.name || b.perfil?.name || "") || "").localeCompare((a.name || a.perfil?.name || "") || ""));
        break;
      case "email-asc":
        sorted.sort((a, b) => ((a.email || a.perfil?.email || "") || "").localeCompare((b.email || b.perfil?.email || "") || ""));
        break;
      case "email-desc":
        sorted.sort((a, b) => ((b.email || b.perfil?.email || "") || "").localeCompare((a.email || a.perfil?.email || "") || ""));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [pasajeros, searchPasajeros, sortByPasajeros]);

  const conductoresFiltrados = useMemo(() => {
    let filtered = trabajadores;
    
    if (searchConductores) {
      const search = searchConductores.toLowerCase();
      filtered = filtered.filter(t =>
        (t.perfil?.name || "").toLowerCase().includes(search) ||
        (t.perfil?.email || "").toLowerCase().includes(search)
      );
    }
    
    // Filtro por estado
    if (filterEstadoConductores !== "todos") {
      filtered = filtered.filter(t => {
        if (filterEstadoConductores === "activos") return t.activo !== false;
        if (filterEstadoConductores === "inactivos") return t.activo === false;
        return true;
      });
    }
    
    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByConductores) {
      case "nombre-asc":
        sorted.sort((a, b) => ((a.perfil?.name || "") || "").localeCompare((b.perfil?.name || "") || ""));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => ((b.perfil?.name || "") || "").localeCompare((a.perfil?.name || "") || ""));
        break;
      case "email-asc":
        sorted.sort((a, b) => ((a.perfil?.email || "") || "").localeCompare((b.perfil?.email || "") || ""));
        break;
      case "email-desc":
        sorted.sort((a, b) => ((b.perfil?.email || "") || "").localeCompare((a.perfil?.email || "") || ""));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [trabajadores, searchConductores, sortByConductores, filterEstadoConductores]);

  // Cargar usuarios, pasajeros, trabajadores y flotas
  useEffect(() => {
    loadUsers();
    loadPasajeros();
    loadTrabajadores();
    loadFlotas();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const users = await getAllUsers();
    setUsuarios(users);
    setLoading(false);
  };

  const loadFlotas = async () => {
    try {
      const flotasCollection = collection(db, "flotas");
      const flotasSnapshot = await getDocs(flotasCollection);
      const flotasList = flotasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFlotas(flotasList);
    } catch (error) {
      console.error("Error al cargar flotas:", error);
    }
  };

  const loadPasajeros = async () => {
    try {
      const pasajerosCollection = collection(db, "pasajeros");
      const pasajerosSnapshot = await getDocs(pasajerosCollection);
      const pasajerosList = pasajerosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPasajeros(pasajerosList);
    } catch (error) {
      console.error("Error al cargar pasajeros:", error);
    }
  };

  const loadTrabajadores = async () => {
    try {
      // Cargar de la colección "trabajadores" donde están los conductores
      const trabajadoresCollection = collection(db, "trabajadores");
      const trabajadoresSnapshot = await getDocs(trabajadoresCollection);
      const trabajadoresList = trabajadoresSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setTrabajadores(trabajadoresList);
    } catch (error) {
      console.error("Error al cargar conductores:", error);
    }
  };

  const handleOpenDialog = (usuario = null) => {
    if (usuario) {
      setEditingUser(usuario);
      // Para trabajadores (conductores), siempre tomar del perfil
      const isTrabajador = usuario.perfil;
      const nombreFinal = isTrabajador ? (usuario.perfil?.name || "") : (usuario.nombre || "");
      
      setFormData({
        email: usuario.email || usuario.perfil?.email || "",
        nombre: nombreFinal,
        role: usuario.role || "driver",
        password: "",
        flotaId: usuario.flotaId || "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: "",
        nombre: "",
        role: "admin",
        password: "",
        flotaId: "",
      });
    }
    setOpenDialog(true);
    setError("");
    setSuccess("");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({ email: "", nombre: "", role: "admin", password: "", flotaId: "" });
  };

  const handleSaveUser = async () => {
    setError("");
    setSuccess("");

    if (!formData.email || !formData.nombre) {
      setError("Email y nombre son obligatorios");
      return;
    }

    if (!formData.flotaId) {
      setError("Debes seleccionar una flota");
      return;
    }

    if (editingUser) {
      // Verificar si es un trabajador (conductor) o un admin
      const isTrabajador = editingUser.perfil; // Los trabajadores tienen el campo perfil

      if (isTrabajador) {
        // Actualizar trabajador en colección "trabajadores"
        try {
          await updateDoc(doc(db, "trabajadores", editingUser.id), {
            flotaId: formData.flotaId,
            perfil: {
              ...editingUser.perfil,
              name: formData.nombre,
              email: formData.email,
            },
            role: formData.role,
          });
          setSuccess("Conductor actualizado correctamente");
          loadTrabajadores();
          setTimeout(() => handleCloseDialog(), 1500);
        } catch (error) {
          console.error("Error al actualizar conductor:", error);
          setError("Error al actualizar conductor: " + error.message);
        }
      } else {
        // Actualizar admin en colección "users"
        const result = await updateUser(editingUser.id, {
          email: formData.email,
          nombre: formData.nombre,
          role: "admin",
          flotaId: formData.flotaId,
        });

        if (result.success) {
          setSuccess("Usuario actualizado correctamente");
          loadUsers();
          setTimeout(() => handleCloseDialog(), 1500);
        } else {
          setError(result.error || "Error al actualizar usuario");
        }
      }
    } else {
      // Crear nuevo usuario con Firebase Auth + Firestore
      if (!formData.password) {
        setError("La contraseña es obligatoria para nuevos usuarios");
        return;
      }

      const result = await createAdminUser({
        email: formData.email,
        nombre: formData.nombre,
        role: "admin",
        password: formData.password,
        flotaId: formData.flotaId,
        createdBy: user.uid,
      });

      if (result.success) {
        if (result.requiresRelogin) {
          setSuccess("✅ Usuario creado exitosamente. Por seguridad, debes volver a iniciar sesión...");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          setSuccess("✅ Usuario creado exitosamente");
          loadUsers();
          setTimeout(() => handleCloseDialog(), 2000);
        }
      } else {
        setError(result.error || "Error al crear usuario");
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      const result = await deleteUser(userId);
      if (result.success) {
        setSuccess("Usuario eliminado correctamente");
        loadUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Error al eliminar usuario");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const handleDeleteTrabajador = async (trabajadorId) => {
    try {
      await deleteDoc(doc(db, "trabajadores", trabajadorId));
      setSuccess("Conductor eliminado correctamente");
      loadTrabajadores();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error al eliminar conductor:", error);
      setError("Error al eliminar conductor");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleToggleActivo = async (userId, activo) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        active: activo,
      });
      setSuccess(`Usuario ${activo ? "activado" : "desactivado"} correctamente`);
      loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error al actualizar estado del usuario:", error);
      setError("Error al actualizar estado del usuario");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Solo SuperAdmin puede acceder
  if (!isSuperAdmin(userRole)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta sección. Solo SuperAdmin puede gestionar usuarios.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
          Gestión de Usuarios
        </Typography>
        {tabValue === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ 
              background: "linear-gradient(135deg, #D7171A 0%, #000000 100%)", 
              fontFamily: "Mulish, sans-serif",
              fontWeight: 700,
              "&:hover": { backgroundColor: "#b01217" } 
            }}
          >
            Crear Admin
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: "100%", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              fontFamily: "Mulish, sans-serif",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1rem",
            },
            "& .Mui-selected": {
              color: "#d7171a !important",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#d7171a",
            },
          }}
        >
          <Tab 
            icon={<PeopleIcon />} 
            iconPosition="start" 
            label="Administradores" 
          />
          <Tab 
            icon={<DirectionsCarIcon />} 
            iconPosition="start" 
            label="Pasajeros" 
          />
          <Tab 
            icon={<LocalTaxiIcon />} 
            iconPosition="start" 
            label="Conductores" 
          />
        </Tabs>

        {tabValue === 0 && (
          <>
            {/* Toolbar para Administradores */}
            <TableToolbar
              searchValue={searchAdmin}
              onSearchChange={setSearchAdmin}
              sortOptions={[
                { label: "↑ Sort by Email (ASC)", value: "email-asc" },
                { label: "↓ Sort by Email (DESC)", value: "email-desc" },
                { label: "↑ Sort by Nombre (ASC)", value: "nombre-asc" },
                { label: "↓ Sort by Nombre (DESC)", value: "nombre-desc" },
              ]}
              sortValue={sortByAdmin}
              onSortChange={setSortByAdmin}
              filterOptions={[
                {
                  name: "estado",
                  label: "Estado",
                  defaultValue: "todos",
                  options: [
                    { label: "Todos", value: "todos" },
                    { label: "Activos", value: "activos" },
                    { label: "Inactivos", value: "inactivos" },
                  ],
                },
              ]}
              filterValue={{ estado: filterEstado }}
              onFilterChange={(name, value) => setFilterEstado(value)}
              visibleColumns={visibleColumnsAdmin}
              onColumnChange={(col, visible) => setVisibleColumnsAdmin(prev => ({ ...prev, [col]: visible }))}
              showClearButton={true}
            />

            <TableContainer component={Paper} sx={{ boxShadow: 0 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#000000" }}>
            <TableRow>
              {visibleColumnsAdmin.email && <TableCell sx={{ fontWeight: "bold", color: "white" }}>Email</TableCell>}
              {visibleColumnsAdmin.nombre && <TableCell sx={{ fontWeight: "bold", color: "white" }}>Nombre</TableCell>}
              {visibleColumnsAdmin.rol && <TableCell sx={{ fontWeight: "bold", color: "white" }}>Rol Sistema</TableCell>}
              {visibleColumnsAdmin.flota && <TableCell sx={{ fontWeight: "bold", color: "white" }}>Flota</TableCell>}
              {visibleColumnsAdmin.estado && <TableCell sx={{ fontWeight: "bold", color: "white" }}>Activo/Inactivo</TableCell>}
              {visibleColumnsAdmin.contraseña && <TableCell sx={{ fontWeight: "bold", color: "white" }}>Contraseña Temp</TableCell>}
              {visibleColumnsAdmin.creado && <TableCell sx={{ fontWeight: "bold", color: "white" }}>Creado</TableCell>}
              {visibleColumnsAdmin.acciones && <TableCell sx={{ fontWeight: "bold", color: "white" }} align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : usuariosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {usuarios.length === 0 ? "No hay usuarios registrados" : "No hay resultados para los filtros seleccionados"}
                </TableCell>
              </TableRow>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <TableRow key={usuario.id} hover>
                  {visibleColumnsAdmin.email && <TableCell>{usuario.email}</TableCell>}
                  {visibleColumnsAdmin.nombre && <TableCell>{usuario.nombre}</TableCell>}
                  {visibleColumnsAdmin.rol && (
                    <TableCell>
                      <Chip
                        label={usuario.role === "superadmin" ? "SuperAdmin" : "Admin"}
                        color={usuario.role === "superadmin" ? "error" : "primary"}
                        size="small"
                        sx={{
                          bgcolor: usuario.role === "superadmin" ? "#d7171a" : "#484848",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                  )}
                  {visibleColumnsAdmin.flota && (
                    <TableCell>
                      {usuario.flotaId ? (
                        <Typography variant="body2">
                          {flotas.find(f => f.id === usuario.flotaId)?.nombre || "Flota no encontrada"}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                  )}
                  {visibleColumnsAdmin.estado && (
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={usuario.active !== false}
                            onChange={(e) => handleToggleActivo(usuario.id, e.target.checked)}
                            size="small"
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#4caf50",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#4caf50",
                              },
                            }}
                          />
                        }
                        label={usuario.active !== false ? "Activo" : "Inactivo"}
                        sx={{
                          m: 0,
                          "& .MuiFormControlLabel-label": {
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: usuario.active !== false ? "#fff" : "#fff",
                            backgroundColor: usuario.active !== false ? "#4caf50" : "#9e9e9e",
                            padding: "4px 12px",
                            borderRadius: "16px",
                            display: "inline-block",
                          },
                        }}
                      />
                    </TableCell>
                  )}
                  {visibleColumnsAdmin.contraseña && (
                    <TableCell>
                      {usuario.password ? (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: "monospace", 
                            bgcolor: "#f5f5f5", 
                            p: 0.5, 
                            borderRadius: 1,
                            fontSize: "0.75rem"
                          }}
                        >
                          {usuario.password}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  {visibleColumnsAdmin.creado && <TableCell>{new Date(usuario.createdAt).toLocaleDateString()}</TableCell>}
                  {visibleColumnsAdmin.acciones && (
                    <TableCell align="right">
                      {usuario.status === "pending" && (
                        <Tooltip title="Copiar instrucciones de activación">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const instrucciones = `
📋 ACTIVAR USUARIO: ${usuario.email}

1. Firebase Console → Authentication → Add user
2. Email: ${usuario.email}
3. Password: ${usuario.password || "contraseña_asignada"}
4. Copiar el UID generado
5. Firestore → users → ${usuario.id}
6. Agregar campo "uid": "UID_COPIADO"
7. Cambiar "status": "active"
8. Cambiar "active": true
9. OPCIONAL: Eliminar campo "password"
                            `.trim();
                              
                              navigator.clipboard.writeText(instrucciones);
                              setSuccess("Instrucciones copiadas al portapapeles");
                              setTimeout(() => setSuccess(""), 3000);
                            }}
                            sx={{ color: "#d7171a" }}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(usuario)}
                        sx={{ color: "#484848" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(usuario.id)}
                        sx={{ color: "#d7171a" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
          </>
        )}

        {tabValue === 1 && (
          <>
            {/* Toolbar para Pasajeros */}
            <TableToolbar
              searchValue={searchPasajeros}
              onSearchChange={setSearchPasajeros}
              sortOptions={[
                { label: "↑ Sort by Nombre (ASC)", value: "nombre-asc" },
                { label: "↓ Sort by Nombre (DESC)", value: "nombre-desc" },
                { label: "↑ Sort by Email (ASC)", value: "email-asc" },
                { label: "↓ Sort by Email (DESC)", value: "email-desc" },
              ]}
              sortValue={sortByPasajeros}
              onSortChange={setSortByPasajeros}
              visibleColumns={visibleColumnsPasajeros}
              onColumnChange={(col, visible) => setVisibleColumnsPasajeros(prev => ({ ...prev, [col]: visible }))}
              showClearButton={true}
            />

            <TableContainer component={Paper} sx={{ boxShadow: 0 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#000000" }}>
                <TableRow>
                  {visibleColumnsPasajeros.foto && (
                    <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                      Foto
                    </TableCell>
                  )}
                  {visibleColumnsPasajeros.nombre && (
                    <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                      Nombre
                    </TableCell>
                  )}
                  {visibleColumnsPasajeros.email && (
                    <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                      Email
                    </TableCell>
                  )}
                  {visibleColumnsPasajeros.modo && (
                    <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                      Modo
                    </TableCell>
                  )}
                  {visibleColumnsPasajeros.provider && (
                    <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                      Provider
                    </TableCell>
                  )}
                  {visibleColumnsPasajeros.fecha && (
                    <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                      Fecha Registro
                    </TableCell>
                  )}
                  <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", textAlign: "center" }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pasajerosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                        {pasajeros.length === 0 ? "No hay pasajeros registrados" : "No hay resultados para la búsqueda"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pasajerosFiltrados.map((pasajero) => (
                    <TableRow key={pasajero.id} hover>
                      {visibleColumnsPasajeros.foto && (
                        <TableCell>
                          <Avatar
                            src={pasajero.perfil?.photoUrl || pasajero.photoURL}
                            alt={pasajero.name || pasajero.perfil?.name || pasajero.email}
                            sx={{ width: 40, height: 40, bgcolor: "#d7171a" }}
                          >
                            {(pasajero.name || pasajero.perfil?.name || pasajero.email || "?")?.charAt(0).toUpperCase()}
                          </Avatar>
                        </TableCell>
                      )}
                      {visibleColumnsPasajeros.nombre && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                          {pasajero.name || pasajero.perfil?.name || "Sin nombre"}
                        </TableCell>
                      )}
                      {visibleColumnsPasajeros.email && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {pasajero.email || pasajero.perfil?.email || "-"}
                        </TableCell>
                      )}
                      {visibleColumnsPasajeros.modo && (
                        <TableCell>
                          <Chip
                            label={pasajero.modo || pasajero.perfil?.modo || "pasajero"}
                            size="small"
                            sx={{
                              bgcolor: "#484848",
                              color: "white",
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                            }}
                          />
                        </TableCell>
                      )}
                      {visibleColumnsPasajeros.provider && (
                        <TableCell>
                          <Chip
                            label={pasajero.provider || pasajero.perfil?.provider || "N/A"}
                            size="small"
                            sx={{
                              bgcolor: (pasajero.provider || pasajero.perfil?.provider) === "google" ? "#4285f4" : "#484848",
                              color: "white",
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                            }}
                          />
                        </TableCell>
                      )}
                      {visibleColumnsPasajeros.fecha && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {pasajero.createdAt?.toDate?.().toLocaleDateString() || 
                           pasajero.perfil?.createdAt?.toDate?.().toLocaleDateString() || 
                           "-"}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Tooltip title="Ver Historial de Viajes">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setPasajeroSeleccionado(pasajero.id);
                              setHistorialModalOpen(true);
                            }}
                            sx={{ color: "#d7171a" }}
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          </>
        )}

        {tabValue === 2 && (
          <>
            {/* Toolbar para Conductores */}
            <TableToolbar
              searchValue={searchConductores}
              onSearchChange={setSearchConductores}
              sortOptions={[
                { label: "↑ Sort by Nombre (ASC)", value: "nombre-asc" },
                { label: "↓ Sort by Nombre (DESC)", value: "nombre-desc" },
                { label: "↑ Sort by Email (ASC)", value: "email-asc" },
                { label: "↓ Sort by Email (DESC)", value: "email-desc" },
              ]}
              sortValue={sortByConductores}
              onSortChange={setSortByConductores}
              filterOptions={[
                {
                  name: "estado",
                  label: "Estado",
                  defaultValue: "todos",
                  options: [
                    { label: "Todos", value: "todos" },
                    { label: "Activos", value: "activos" },
                    { label: "Inactivos", value: "inactivos" },
                  ],
                },
              ]}
              filterValue={{ estado: filterEstadoConductores }}
              onFilterChange={(name, value) => setFilterEstadoConductores(value)}
              visibleColumns={visibleColumnsConductores}
              onColumnChange={(col, visible) => setVisibleColumnsConductores(prev => ({ ...prev, [col]: visible }))}
              showClearButton={true}
            />

            <TableContainer component={Paper} sx={{ boxShadow: 0 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#000000" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                    Foto
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                    Nombre
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                    Rol
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                    Flota
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                    Fecha Registro
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                        Cargando trabajadores...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : conductoresFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                        {trabajadores.length === 0 ? "No hay trabajadores registrados" : "No hay resultados para la búsqueda"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  conductoresFiltrados.map((trabajador) => (
                    <TableRow key={trabajador.id} hover>
                      <TableCell>
                        <Avatar
                          src={trabajador.photoURL || trabajador.perfil?.photoUrl}
                          alt={trabajador.perfil?.name || trabajador.email}
                          sx={{ width: 40, height: 40, bgcolor: "#d7171a" }}
                        >
                          {(trabajador.perfil?.name || trabajador.email || "?")?.charAt(0).toUpperCase()}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                        {trabajador.perfil?.name || "Sin nombre"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {trabajador.perfil?.email || "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trabajador.role === "driver" ? "Conductor" : trabajador.role || "Trabajador"}
                          size="small"
                          sx={{
                            bgcolor: "#1976d2",
                            color: "white",
                            fontWeight: 600,
                            fontFamily: "Mulish, sans-serif",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {trabajador.flotaId 
                          ? flotas.find(f => f.id === trabajador.flotaId)?.nombre || "Flota no encontrada"
                          : "-"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {formatearFecha(trabajador.perfil?.createdAt)}
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={trabajador.activo !== false}
                              onChange={async (e) => {
                                try {
                                  const ref = doc(db, "trabajadores", trabajador.id);
                                  await updateDoc(ref, {
                                    activo: e.target.checked,
                                  });
                                  loadTrabajadores();
                                } catch (err) {
                                  setSnackbar({
                                    open: true,
                                    message: "Error al actualizar estado",
                                    severity: "error"
                                  });
                                }
                              }}
                              size="small"
                              sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": {
                                  color: "#4caf50",
                                },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                  backgroundColor: "#4caf50",
                                },
                              }}
                            />
                          }
                          label={trabajador.activo !== false ? "Activo" : "Inactivo"}
                          sx={{
                            m: 0,
                            "& .MuiFormControlLabel-label": {
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "#fff",
                              backgroundColor: trabajador.activo !== false ? "#4caf50" : "#9e9e9e",
                              padding: "4px 12px",
                              borderRadius: "16px",
                              display: "inline-block",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(trabajador)}
                            sx={{ color: "#444444ff", mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (window.confirm("¿Estás seguro de que deseas eliminar este conductor?")) {
                                handleDeleteTrabajador(trabajador.id);
                              }
                            }}
                            sx={{ color: "#d7171a" }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          </>
        )}
      </Paper>

      {/* Dialog para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={editingUser !== null}
          />

          <TextField
            label="Nombre Completo"
            fullWidth
            margin="normal"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />

          <TextField
            label="Flota"
            select
            fullWidth
            margin="normal"
            value={formData.flotaId}
            onChange={(e) => setFormData({ ...formData, flotaId: e.target.value })}
            required
          >
            <MenuItem value="">Seleccionar flota</MenuItem>
            {flotas.map((flota) => (
              <MenuItem key={flota.id} value={flota.id}>
                {flota.nombre}
              </MenuItem>
            ))}
          </TextField>

          {!editingUser && (
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: "#484848" }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            sx={{ bgcolor: "#d7171a", "&:hover": { bgcolor: "#b01217" } }}
          >
            {editingUser ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <HistorialViajesModal
        open={historialModalOpen}
        onClose={() => setHistorialModalOpen(false)}
        pasajeroUID={pasajeroSeleccionado}
      />
    </Box>
  );
};

export default GestionUsuarios;
