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
  Alert,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  Snackbar,
  Switch,
  FormControlLabel,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalTaxiIcon from "@mui/icons-material/LocalTaxi";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useAuth } from "../../../auth/AuthContext";

import { getAllUsers, createAdminUser, updateUser, deleteUser, isSuperAdmin } from "../../../services/userService";
import { collection, deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { TableToolbar } from "./components/TableToolbar";
import { HistorialViajesModal } from "./components/HistorialViajesModal";
import { HistorialViajesConductorModal } from "./components/HistorialViajesConductorModal";
import DocumentosConductoresViewModal from "./components/DocumentosConductoresViewModal";

const DEPARTAMENTOS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

const GestionUsuarios = () => {
  const { userRole, user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [pasajeros, setPasajeros] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [flotas, setFlotas] = useState([]);
  const [historialModalOpen, setHistorialModalOpen] = useState(false);
  const [pasajeroSeleccionado, setPasajeroSeleccionado] = useState(null);
  const [historialConductorModalOpen, setHistorialConductorModalOpen] = useState(false);
  const [conductorSeleccionado, setConductorSeleccionado] = useState(null);
  const [documentosConductorModalOpen, setDocumentosConductorModalOpen] = useState(false);
  const [conductorDocumentosSeleccionado, setConductorDocumentosSeleccionado] = useState(null);
  const [detallesPasajeroModalOpen, setDetallesPasajeroModalOpen] = useState(false);
  const [pasajeroDetalles, setPasajeroDetalles] = useState(null);
  const [detallesConductorModalOpen, setDetallesConductorModalOpen] = useState(false);
  const [conductorDetalles, setConductorDetalles] = useState(null);
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

  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setPageAdmin(0);
  }, [searchAdmin, filterEstado]);
  
  useEffect(() => {
    setPagePasajeros(0);
  }, [searchPasajeros]);
  
  useEffect(() => {
    setPageConductores(0);
  }, [searchConductores, filterEstadoConductores]);
  
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
    departamento: true,
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

  // Estados para paginación
  const ITEMS_PER_PAGE = 10;
  const [pageAdmin, setPageAdmin] = useState(0);
  const [pagePasajeros, setPagePasajeros] = useState(0);
  const [pageConductores, setPageConductores] = useState(0);
  
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    role: "admin",
    password: "",
    departamentoActual: "",
    codigoReferido: "",
    metodoPagoEfectivo: false,
    metodoPagoQr: false,
    ciudad: "",
    departamento: "",
    servicio: "",
    categoria: "",
    activo: true,
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
      case "fecha-recientes":
        sorted.sort((a, b) => {
          const fechaA = a.createdAt?.toDate?.() || new Date(0);
          const fechaB = b.createdAt?.toDate?.() || new Date(0);
          return fechaB - fechaA;
        });
        break;
      case "fecha-antiguos":
        sorted.sort((a, b) => {
          const fechaA = a.createdAt?.toDate?.() || new Date(0);
          const fechaB = b.createdAt?.toDate?.() || new Date(0);
          return fechaA - fechaB;
        });
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
      case "fecha-recientes":
        sorted.sort((a, b) => {
          const fechaA = a.perfil?.createdAt?.toDate?.() || new Date(0);
          const fechaB = b.perfil?.createdAt?.toDate?.() || new Date(0);
          return fechaB - fechaA;
        });
        break;
      case "fecha-antiguos":
        sorted.sort((a, b) => {
          const fechaA = a.perfil?.createdAt?.toDate?.() || new Date(0);
          const fechaB = b.perfil?.createdAt?.toDate?.() || new Date(0);
          return fechaA - fechaB;
        });
        break;
      default:
        break;
    }
    
    return sorted;
  }, [trabajadores, searchConductores, sortByConductores, filterEstadoConductores]);

  // Datos paginados para Administradores
  const usuariosPaginados = useMemo(() => {
    const start = pageAdmin * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return usuariosFiltrados.slice(start, end);
  }, [usuariosFiltrados, pageAdmin]);

  const totalPagesAdmin = Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE);

  // Datos paginados para Pasajeros
  const pasajerosPaginados = useMemo(() => {
    const start = pagePasajeros * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return pasajerosFiltrados.slice(start, end);
  }, [pasajerosFiltrados, pagePasajeros]);

  const totalPagesPasajeros = Math.ceil(pasajerosFiltrados.length / ITEMS_PER_PAGE);

  // Datos paginados para Conductores
  const conductoresPaginados = useMemo(() => {
    const start = pageConductores * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return conductoresFiltrados.slice(start, end);
  }, [conductoresFiltrados, pageConductores]);

  const totalPagesConductores = Math.ceil(conductoresFiltrados.length / ITEMS_PER_PAGE);

  // Cargar usuarios, pasajeros, trabajadores y flotas
  useEffect(() => {
    loadUsers();
    
    // Listener en tiempo real para trabajadores
    const trabajadoresCollection = collection(db, "trabajadores");
    const unsubscribeTrabajadores = onSnapshot(
      trabajadoresCollection,
      (snapshot) => {
        const trabajadoresList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTrabajadores(trabajadoresList);
      },
      (error) => {
        console.error("Error al escuchar trabajadores:", error);
      }
    );

    // Listener en tiempo real para pasajeros
    const pasajerosCollection = collection(db, "pasajeros");
    const unsubscribePasajeros = onSnapshot(
      pasajerosCollection,
      (snapshot) => {
        const pasajerosList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPasajeros(pasajerosList);
      },
      (error) => {
        console.error("Error al escuchar pasajeros:", error);
      }
    );

    // Listener en tiempo real para flotas
    const flotasCollection = collection(db, "flotas");
    const unsubscribeFlotas = onSnapshot(
      flotasCollection,
      (snapshot) => {
        const flotasList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFlotas(flotasList);
      },
      (error) => {
        console.error("Error al escuchar flotas:", error);
      }
    );

    return () => {
      unsubscribeTrabajadores();
      unsubscribePasajeros();
      unsubscribeFlotas();
    };
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const users = await getAllUsers();
    setUsuarios(users);
    setLoading(false);
  };

  const handleOpenDialog = (usuario = null) => {
    if (usuario) {
      setEditingUser(usuario);
      // Detectar tipo de usuario
      const isPasajero = usuario.modo === "pasajero";
      const isTrabajador = usuario.perfil && usuario.role;
      
      // Obtener nombre y email según el tipo
      let nombreFinal = "";
      let emailFinal = "";
      
      if (isPasajero || isTrabajador) {
        nombreFinal = usuario.perfil?.name || "";
        emailFinal = usuario.perfil?.email || "";
      } else {
        nombreFinal = usuario.nombre || "";
        emailFinal = usuario.email || "";
      }
      
      setFormData({
        email: emailFinal,
        nombre: nombreFinal,
        role: usuario.role || "driver",
        password: "",
        departamentoActual: usuario.departamentoActual || "",
        codigoReferido: usuario.codigoReferido || "",
        metodoPagoEfectivo: usuario.metodos_pago?.efectivo || false,
        metodoPagoQr: usuario.metodos_pago?.qr || false,
        ciudad: usuario.ciudad || "",
        departamento: usuario.departamento || "",
        servicio: usuario.servicio || "",
        categoria: usuario.categoria || "",
        activo: usuario.activo !== false,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: "",
        nombre: "",
        role: "admin",
        password: "",
        departamentoActual: "",
        codigoReferido: "",
        metodoPagoEfectivo: false,
        metodoPagoQr: false,
        ciudad: "",
        departamento: "",
        servicio: "",
        categoria: "",
        activo: true,
      });
    }
    setOpenDialog(true);
    setError("");
    setSuccess("");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({ email: "", nombre: "", role: "admin", password: "", departamentoActual: "", codigoReferido: "", metodoPagoEfectivo: false, metodoPagoQr: false, ciudad: "", departamento: "", servicio: "", categoria: "", activo: true });
  };

  const handleSaveUser = async () => {
    setError("");
    setSuccess("");

    if (!formData.email || !formData.nombre) {
      setError("Email y nombre son obligatorios");
      return;
    }

    if (editingUser) {
      // Verificar qué tipo de usuario es
      const isPasajero = editingUser.modo === "pasajero"; // Los pasajeros tienen modo: "pasajero"
      const isTrabajador = editingUser.perfil && editingUser.role; // Los trabajadores tienen perfil y role

      if (isPasajero) {
        // Actualizar pasajero en colección "pasajeros"
        try {
          await updateDoc(doc(db, "pasajeros", editingUser.id), {
            name: formData.nombre || editingUser.name,
            email: formData.email || editingUser.email,
            perfil: {
              ...editingUser.perfil,
              name: formData.nombre || editingUser.perfil?.name,
              email: formData.email || editingUser.perfil?.email,
            },
            departamentoActual: formData.departamentoActual || editingUser.departamentoActual,
          });
          setSuccess("Pasajero actualizado correctamente");
          setTimeout(() => handleCloseDialog(), 1500);
        } catch (error) {
          console.error("Error al actualizar pasajero:", error);
          setError("Error al actualizar pasajero: " + error.message);
        }
      } else if (isTrabajador) {
        // Actualizar trabajador en colección "trabajadores"
        try {
          await updateDoc(doc(db, "trabajadores", editingUser.id), {
            flotaId: formData.flotaId || null,
            perfil: {
              ...editingUser.perfil,
              name: formData.nombre,
              email: formData.email,
            },
            role: formData.role,
            ciudad: formData.ciudad,
            departamento: formData.departamento,
            servicio: formData.servicio,
            categoria: formData.categoria,
            activo: formData.activo,
          });
          setSuccess("Conductor actualizado correctamente");
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
          flotaId: formData.flotaId || null,
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
        flotaId: formData.flotaId || null,
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
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error al eliminar conductor:", error);
      setError("Error al eliminar conductor");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeletePasajero = async (pasajeroId) => {
    try {
      await deleteDoc(doc(db, "pasajeros", pasajeroId));
      setSuccess("Pasajero eliminado correctamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error al eliminar pasajero:", error);
      setError("Error al eliminar pasajero");
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
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
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
      </Paper>

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

            <Paper sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <TableContainer>
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
              usuariosPaginados.map((usuario) => (
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
            </Paper>
            
            {/* Paginación Administradores */}
            {usuariosFiltrados.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                  Mostrando {usuariosPaginados.length > 0 ? (pageAdmin * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pageAdmin + 1) * ITEMS_PER_PAGE, usuariosFiltrados.length)} de {usuariosFiltrados.length}
                </Typography>
                <Pagination 
                  count={totalPagesAdmin}
                  page={pageAdmin + 1}
                  onChange={(e, page) => setPageAdmin(page - 1)}
                  sx={{
                    "& .MuiButtonBase-root": { fontFamily: "Mulish, sans-serif", color: "#000" },
                    "& .Mui-selected": { backgroundColor: "#aaaaaa !important", color: "white" },
                  }}
                />
              </Box>
            )}

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
                { label: "↓ Más Recientes", value: "fecha-recientes" },
                { label: "↑ Más Antiguos", value: "fecha-antiguos" },
              ]}
              sortValue={sortByPasajeros}
              onSortChange={setSortByPasajeros}
              visibleColumns={visibleColumnsPasajeros}
              onColumnChange={(col, visible) => setVisibleColumnsPasajeros(prev => ({ ...prev, [col]: visible }))}
              showClearButton={true}
            />

            <Paper sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <TableContainer>
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
                  {visibleColumnsPasajeros.departamento && (
                    <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                      Departamento
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
                  pasajerosPaginados.map((pasajero) => (
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
                      {visibleColumnsPasajeros.departamento && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {pasajero.departamentoActual || "-"}
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
                        <Tooltip title="Ver Detalles">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setPasajeroDetalles(pasajero);
                              setDetallesPasajeroModalOpen(true);
                            }}
                            sx={{ color: "#484848" }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(pasajero)}
                            sx={{ color: "#0066cc" }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (window.confirm("¿Estás seguro de eliminar este pasajero?")) {
                                handleDeletePasajero(pasajero.id);
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
            </Paper>
            
            {/* Paginación Pasajeros */}
            {pasajerosFiltrados.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                  Mostrando {pasajerosPaginados.length > 0 ? (pagePasajeros * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pagePasajeros + 1) * ITEMS_PER_PAGE, pasajerosFiltrados.length)} de {pasajerosFiltrados.length}
                </Typography>
                <Pagination 
                  count={totalPagesPasajeros}
                  page={pagePasajeros + 1}
                  onChange={(e, page) => setPagePasajeros(page - 1)}
                  sx={{
                    "& .MuiButtonBase-root": { fontFamily: "Mulish, sans-serif", color: "#000" },
                    "& .Mui-selected": { backgroundColor: "#aaaaaa !important", color: "white" },
                  }}
                />
              </Box>
            )}
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
                { label: "↓ Más Recientes", value: "fecha-recientes" },
                { label: "↑ Más Antiguos", value: "fecha-antiguos" },
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

            <Paper sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <TableContainer>
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
                  conductoresPaginados.map((trabajador) => (
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
                        <Tooltip title="Ver Detalles">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setConductorDetalles(trabajador);
                              setDetallesConductorModalOpen(true);
                            }}
                            sx={{ color: "#484848", mr: 1 }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver Documentos">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setConductorDocumentosSeleccionado(trabajador);
                              setDocumentosConductorModalOpen(true);
                            }}
                            sx={{ color: "#1976d2", mr: 1 }}
                          >
                            <DescriptionIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver Historial de Viajes">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setConductorSeleccionado(trabajador.id);
                              setHistorialConductorModalOpen(true);
                            }}
                            sx={{ color: "#d7171a", mr: 1 }}
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
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
          </Paper>
          
          {/* Paginación Conductores */}
          {conductoresFiltrados.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
              <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                Mostrando {conductoresPaginados.length > 0 ? (pageConductores * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pageConductores + 1) * ITEMS_PER_PAGE, conductoresFiltrados.length)} de {conductoresFiltrados.length}
              </Typography>
              <Pagination 
                count={totalPagesConductores}
                page={pageConductores + 1}
                onChange={(e, page) => setPageConductores(page - 1)}
                sx={{
                  "& .MuiButtonBase-root": { fontFamily: "Mulish, sans-serif", color: "#000" },
                  "& .Mui-selected": { backgroundColor: "#aaaaaa !important", color: "white" },
                }}
              />
            </Box>
          )}
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

          {editingUser?.modo === "pasajero" && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3, mt: 1 }}>
              <Avatar
                src={editingUser.perfil?.photoUrl || editingUser.photoURL}
                alt={editingUser.perfil?.name || editingUser.name}
                sx={{ width: 100, height: 100, bgcolor: "#d7171a" }}
              >
                {(editingUser.perfil?.name || editingUser.name || "?")?.charAt(0).toUpperCase()}
              </Avatar>
            </Box>
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

          {editingUser?.modo === "pasajero" && (
            <>
              <TextField
                label="Departamento Actual"
                fullWidth
                margin="normal"
                value={formData.departamentoActual}
                onChange={(e) => setFormData({ ...formData, departamentoActual: e.target.value })}
              />
            </>
          )}

          {editingUser?.perfil && editingUser?.role && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Departamento/Ciudad</InputLabel>
                <Select
                  value={formData.departamento}
                  label="Departamento/Ciudad"
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value, ciudad: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Seleccionar</em>
                  </MenuItem>
                  {DEPARTAMENTOS.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Servicio"
                fullWidth
                margin="normal"
                value={formData.servicio}
                onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
              />
              <TextField
                label="Categoría"
                fullWidth
                margin="normal"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                }
                label="Conductor Activo"
                sx={{ mt: 1 }}
              />
            </>
          )}

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

      <HistorialViajesConductorModal
        open={historialConductorModalOpen}
        onClose={() => setHistorialConductorModalOpen(false)}
        conductorUID={conductorSeleccionado}
      />

      <DocumentosConductoresViewModal
        open={documentosConductorModalOpen}
        onClose={() => setDocumentosConductorModalOpen(false)}
        selectedConductor={conductorDocumentosSeleccionado}
      />

      {/* Modal de Detalles del Pasajero */}
      <Dialog open={detallesPasajeroModalOpen} onClose={() => setDetallesPasajeroModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          fontWeight: 700, 
          bgcolor: "#000000", 
          color: "#FFFFFF",
          padding: "24px",
          fontSize: "1.3rem"
        }}>
          Detalles del Pasajero: {pasajeroDetalles?.perfil?.name || pasajeroDetalles?.name || ""}
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#FFFFFF", p: 3 }}>
          {pasajeroDetalles && (
            <Box>
              {/* Foto */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                <Avatar
                  src={pasajeroDetalles.perfil?.photoUrl || pasajeroDetalles.photoURL}
                  alt={pasajeroDetalles.perfil?.name || pasajeroDetalles.name}
                  sx={{ width: 140, height: 140, bgcolor: "#d7171a", border: "4px solid #d7171a", boxShadow: "0 4px 12px rgba(215,23,26,0.3)" }}
                >
                  {(pasajeroDetalles.perfil?.name || pasajeroDetalles.name || "?")?.charAt(0).toUpperCase()}
                </Avatar>
              </Box>

              {/* Información Personal */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #d7171a", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2, display: "flex", alignItems: "center" }}>
                  👤 Información Personal
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Nombre</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>{pasajeroDetalles.perfil?.name || pasajeroDetalles.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Email</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#d7171a", fontSize: "0.95rem", wordBreak: "break-all" }}>{pasajeroDetalles.perfil?.email || pasajeroDetalles.email}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Departamento</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#d7171a", fontSize: "1rem" }}>{pasajeroDetalles.departamentoActual || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Provider</Typography>
                    <Chip label={pasajeroDetalles.perfil?.provider || "N/A"} size="small" sx={{ bgcolor: pasajeroDetalles.perfil?.provider === "google" ? "#000000" : "#484848", color: "#FFFFFF", fontWeight: 600 }} />
                  </Box>
                </Box>
              </Box>

              {/* Información de Referidos */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #484848", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2, display: "flex", alignItems: "center" }}>
                  🎯 Información de Referidos
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Código Referido</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem", fontFamily: "monospace" }}>{pasajeroDetalles.codigoReferido || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Código Usado</Typography>
                    <Chip 
                      label={pasajeroDetalles.codigoReferidoUsado ? "✓ Sí" : "✗ No"} 
                      size="small" 
                      sx={{ 
                        bgcolor: pasajeroDetalles.codigoReferidoUsado ? "#000000" : "#484848", 
                        color: "#FFFFFF", 
                        fontWeight: 700 
                      }} 
                    />
                  </Box>
                </Box>
              </Box>

              {/* Estadísticas */}
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2, display: "flex", alignItems: "center", fontFamily: "Mulish, sans-serif" }}>
                📊 Estadísticas
              </Typography>
              <Box sx={{ mb: 3, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box sx={{ p: 3, bgcolor: "#FFFFFF", borderRadius: 1, border: "2px solid #d7171a", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", display: "block", mb: 1 }}>Carreras Completadas</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "2.5rem", color: "#d7171a" }}>{pasajeroDetalles.carrerasCompletadas || 0}</Typography>
                </Box>
                <Box sx={{ p: 3, bgcolor: "#FFFFFF", borderRadius: 1, border: "2px solid #000000", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", display: "block", mb: 1 }}>Donaciones Acumuladas</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "2.5rem", color: "#000000" }}>${parseFloat(pasajeroDetalles.donacionesAcumuladas || 0).toFixed(2)}</Typography>
                </Box>
              </Box>

              {/* Tickets por Departamento */}
              {pasajeroDetalles.tickets && Object.keys(pasajeroDetalles.tickets).length > 0 && (
                <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #d7171a", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2 }}>🎫 Tickets</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 2 }}>
                    {Object.entries(pasajeroDetalles.tickets).filter(([depto]) => depto !== "general").map(([depto, count]) => (
                      <Box key={depto} sx={{ p: 2, bgcolor: "#f9f9f9", borderRadius: 1, textAlign: "center", border: "1px solid #d7171a" }}>
                        <Typography variant="caption" sx={{ color: "#d7171a", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}>{depto}</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: "1.8rem", color: "#d7171a", mt: 0.5 }}>{count}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Última Donación */}
              {pasajeroDetalles.ultimaDonacion && (
                <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #484848", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2 }}>💳 Última Donación</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Monto</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.3rem", color: "#d7171a" }}>${parseFloat(pasajeroDetalles.ultimaDonacion.monto || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Fecha</Typography>
                      <Typography sx={{ fontWeight: 600, color: "#000000" }}>{pasajeroDetalles.ultimaDonacion.fecha?.toDate?.().toLocaleString() || "-"}</Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Último Viaje */}
              {pasajeroDetalles.ultimoViaje && (
                <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #d7171a", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2 }}>🚗 Último Viaje</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Destino</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#000000", mb: 1.5 }}>{pasajeroDetalles.ultimoViaje.destinoNombre || "-"}</Typography>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Fecha y Hora</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#000000" }}>{pasajeroDetalles.ultimoViaje.timestamp?.toDate?.().toLocaleString() || "-"}</Typography>
                  </Box>
                </Box>
              )}

              {/* Métodos de Pago */}
              {pasajeroDetalles.metodos_pago && (
                <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #484848", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2 }}>💰 Métodos de Pago</Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Chip 
                      label={`Efectivo: ${pasajeroDetalles.metodos_pago.efectivo ? "✓ Activo" : "✗ Inactivo"}`} 
                      sx={{ 
                        bgcolor: pasajeroDetalles.metodos_pago.efectivo ? "#000000" : "#e0e0e0",
                        color: pasajeroDetalles.metodos_pago.efectivo ? "#FFFFFF" : "#484848",
                        fontWeight: 700,
                        border: `2px solid ${pasajeroDetalles.metodos_pago.efectivo ? "#000000" : "#b0b0b0"}`
                      }} 
                    />
                    <Chip 
                      label={`QR: ${pasajeroDetalles.metodos_pago.qr ? "✓ Activo" : "✗ Inactivo"}`} 
                      sx={{ 
                        bgcolor: pasajeroDetalles.metodos_pago.qr ? "#000000" : "#e0e0e0",
                        color: pasajeroDetalles.metodos_pago.qr ? "#FFFFFF" : "#484848",
                        fontWeight: 700,
                        border: `2px solid ${pasajeroDetalles.metodos_pago.qr ? "#000000" : "#b0b0b0"}`
                      }} 
                    />
                  </Box>
                </Box>
              )}

              {/* Fechas */}
              <Box sx={{ p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #d7171a", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2 }}>📅 Fechas</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Fecha de Registro</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#000000", fontSize: "0.9rem" }}>{pasajeroDetalles.perfil?.createdAt?.toDate?.().toLocaleString() || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Último Login</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#000000", fontSize: "0.9rem" }}>{pasajeroDetalles.perfil?.ultimoLogin?.toDate?.().toLocaleString() || "-"}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: "#FFFFFF", p: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={() => setDetallesPasajeroModalOpen(false)} variant="contained" sx={{ bgcolor: "#d7171a", color: "#FFFFFF", fontWeight: 700, "&:hover": { bgcolor: "#b8131f" } }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Detalles del Conductor */}
      <Dialog open={detallesConductorModalOpen} onClose={() => setDetallesConductorModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          fontWeight: 700, 
          bgcolor: "#000000", 
          color: "#FFFFFF",
          padding: "24px",
          fontSize: "1.3rem"
        }}>
          Detalles del Conductor: {conductorDetalles?.perfil?.name || conductorDetalles?.name || ""}
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#FFFFFF", p: 3 }}>
          {conductorDetalles && (
            <Box>
              {/* Foto */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                <Avatar
                  src={conductorDetalles.perfil?.photoUrl || conductorDetalles.photoURL}
                  alt={conductorDetalles.perfil?.name || conductorDetalles.name}
                  sx={{ width: 140, height: 140, bgcolor: "#d7171a", border: "4px solid #d7171a", boxShadow: "0 4px 12px rgba(215,23,26,0.3)" }}
                >
                  {(conductorDetalles.perfil?.name || conductorDetalles.name || "?")?.charAt(0).toUpperCase()}
                </Avatar>
              </Box>

              {/* Información Personal */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #d7171a", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2, display: "flex", alignItems: "center" }}>
                  👤 Información Personal
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Nombre</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>{conductorDetalles.perfil?.name || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Email</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#d7171a", fontSize: "0.95rem", wordBreak: "break-all" }}>{conductorDetalles.perfil?.email || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Role</Typography>
                    <Chip label={conductorDetalles.perfil?.role || "N/A"} size="small" sx={{ bgcolor: "#000000", color: "#FFFFFF", fontWeight: 600 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Provider</Typography>
                    <Chip label={conductorDetalles.perfil?.provider || "N/A"} size="small" sx={{ bgcolor: conductorDetalles.perfil?.provider === "google" ? "#000000" : "#484848", color: "#FFFFFF", fontWeight: 600 }} />
                  </Box>
                </Box>
              </Box>

              {/* Información de Ubicación */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #484848", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2, display: "flex", alignItems: "center" }}>
                  📍 Ubicación
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Departamento</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>{conductorDetalles.departamento || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Ciudad</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>{conductorDetalles.ciudad || "-"}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Información del Servicio */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #d7171a", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2, display: "flex", alignItems: "center" }}>
                  🚖 Servicio
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Tipo de Servicio</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>{conductorDetalles.servicio || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Categoría</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>{conductorDetalles.categoria || "-"}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Información de Flota */}
              {conductorDetalles.flotaId && (
                <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #484848", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2, display: "flex", alignItems: "center" }}>
                    🏢 Flota
                  </Typography>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Nombre de Flota</Typography>
                    <Typography sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>{conductorDetalles.flotaNombre || "-"}</Typography>
                  </Box>
                </Box>
              )}

              {/* Estado y Documentos */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #d7171a", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2, display: "flex", alignItems: "center" }}>
                  ✅ Estado
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Estado Activo</Typography>
                    <Chip 
                      label={conductorDetalles.activo !== false ? "✓ Activo" : "✗ Inactivo"} 
                      sx={{ 
                        bgcolor: conductorDetalles.activo !== false ? "#000000" : "#484848",
                        color: "#FFFFFF",
                        fontWeight: 700
                      }} 
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Documentos Aprobados</Typography>
                    <Chip 
                      label={conductorDetalles.documentos_aprobados ? "✓ Sí" : "✗ No"} 
                      sx={{ 
                        bgcolor: conductorDetalles.documentos_aprobados ? "#000000" : "#484848",
                        color: "#FFFFFF",
                        fontWeight: 700
                      }} 
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Tiene Documentos</Typography>
                    <Chip 
                      label={conductorDetalles.tieneDocs ? "✓ Sí" : "✗ No"} 
                      sx={{ 
                        bgcolor: conductorDetalles.tieneDocs ? "#000000" : "#484848",
                        color: "#FFFFFF",
                        fontWeight: 700
                      }} 
                    />
                  </Box>
                </Box>
              </Box>

              {/* Fechas */}
              <Box sx={{ p: 2, bgcolor: "#FFFFFF", borderLeft: "4px solid #d7171a", borderRadius: 1, border: "1px solid #e0e0e0" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", mb: 2 }}>📅 Fechas</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Fecha de Registro</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#000000", fontSize: "0.9rem" }}>{conductorDetalles.perfil?.createdAt?.toDate?.().toLocaleString() || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Último Login</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#000000", fontSize: "0.9rem" }}>{conductorDetalles.perfil?.ultimoLogin?.toDate?.().toLocaleString() || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Documentos Actualizado</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#000000", fontSize: "0.9rem" }}>{conductorDetalles.documentosActualizadoEn?.toDate?.().toLocaleString() || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>Última Actualización</Typography>
                    <Typography sx={{ fontWeight: 600, color: "#000000", fontSize: "0.9rem" }}>{conductorDetalles.updatedAt?.toDate?.().toLocaleString() || "-"}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: "#FFFFFF", p: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={() => setDetallesConductorModalOpen(false)} variant="contained" sx={{ bgcolor: "#d7171a", color: "#FFFFFF", fontWeight: 700, "&:hover": { bgcolor: "#b8131f" } }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default GestionUsuarios;