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
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useAuth } from "../../../auth/AuthContext";

import { getAllUsers, createAdminUser, updateUser, deleteUser, isSuperAdmin } from "../../../services/userService";
import { collection, deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { TableToolbar } from "./components/TableToolbar";
import ModalDetalleConductor from "./components/ModalDetalleConductor";
import ModalDetallePasajero from "./components/ModalDetallePasajero";
import DocumentosConductoresViewModal from "./components/DocumentosConductoresViewModal";
import DateFilterComponent from "./components/DateFilterComponent";

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
  
  // Estados para filtros de fecha
  const [dateFilterTypeAdmin, setDateFilterTypeAdmin] = useState("todos");
  const [customStartDateAdmin, setCustomStartDateAdmin] = useState("");
  const [customEndDateAdmin, setCustomEndDateAdmin] = useState("");
  const [sortByDateAdmin, setSortByDateAdmin] = useState("recientes");
  
  const [dateFilterTypePasajeros, setDateFilterTypePasajeros] = useState("todos");
  const [customStartDatePasajeros, setCustomStartDatePasajeros] = useState("");
  const [customEndDatePasajeros, setCustomEndDatePasajeros] = useState("");
  const [sortByDatePasajeros, setSortByDatePasajeros] = useState("recientes");
  
  const [dateFilterTypeConductores, setDateFilterTypeConductores] = useState("todos");
  const [customStartDateConductores, setCustomStartDateConductores] = useState("");
  const [customEndDateConductores, setCustomEndDateConductores] = useState("");
  const [sortByDateConductores, setSortByDateConductores] = useState("recientes");
  
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
    
    // Filtro por fecha
    if (dateFilterTypeAdmin !== "todos") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      filtered = filtered.filter((u) => {
        const dateField = u.createdAt;
        if (!dateField) return false;

        let date;
        if (typeof dateField === "object" && dateField.seconds) {
          date = new Date(dateField.seconds * 1000);
        } else if (typeof dateField === "number") {
          date = new Date(dateField);
        } else if (typeof dateField === "string") {
          date = new Date(dateField);
        } else {
          return false;
        }

        switch (dateFilterTypeAdmin) {
          case "hoy":
            return date >= startOfToday && date < endOfToday;
          case "esta-semana": {
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return date >= startOfWeek && date < endOfToday;
          }
          case "este-mes": {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return date >= startOfMonth && date < endOfMonth;
          }
          case "ultimos-7": {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return date >= sevenDaysAgo && date <= now;
          }
          case "ultimos-30": {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return date >= thirtyDaysAgo && date <= now;
          }
          case "custom": {
            if (customStartDateAdmin && customEndDateAdmin) {
              const start = new Date(customStartDateAdmin);
              const end = new Date(customEndDateAdmin);
              end.setDate(end.getDate() + 1);
              return date >= start && date < end;
            }
            return true;
          }
          default:
            return true;
        }
      });
    }
    
    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByDateAdmin) {
      case "email-asc":
        sorted.sort((a, b) => (a.email || "").localeCompare((b.email || "")));
        break;
      case "email-desc":
        sorted.sort((a, b) => (b.email || "").localeCompare((a.email || "")));
        break;
      case "nombre-asc":
        sorted.sort((a, b) => (a.nombre || "").localeCompare((b.nombre || "")));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => (b.nombre || "").localeCompare((a.nombre || "")));
        break;
      case "recientes":
        sorted.sort((a, b) => {
          const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          return dateB - dateA;
        });
        break;
      case "antiguos":
        sorted.sort((a, b) => {
          const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          return dateA - dateB;
        });
        break;
      default:
        break;
    }
    
    return sorted;
  }, [usuarios, searchAdmin, filterEstado, sortByDateAdmin, dateFilterTypeAdmin, customStartDateAdmin, customEndDateAdmin]);

  const pasajerosFiltrados = useMemo(() => {
    let filtered = pasajeros;
    
    if (searchPasajeros) {
      const search = searchPasajeros.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || p.perfil?.name || "").toLowerCase().includes(search) ||
        (p.email || p.perfil?.email || "").toLowerCase().includes(search)
      );
    }

    // Filtro por fecha
    if (dateFilterTypePasajeros !== "todos") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      filtered = filtered.filter((p) => {
        const dateField = p.createdAt;
        if (!dateField) return false;

        let date;
        if (typeof dateField === "object" && dateField.seconds) {
          date = new Date(dateField.seconds * 1000);
        } else if (typeof dateField === "object" && dateField.toDate) {
          date = dateField.toDate();
        } else if (typeof dateField === "number") {
          date = new Date(dateField);
        } else if (typeof dateField === "string") {
          date = new Date(dateField);
        } else {
          return false;
        }

        switch (dateFilterTypePasajeros) {
          case "hoy":
            return date >= startOfToday && date < endOfToday;
          case "esta-semana": {
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return date >= startOfWeek && date < endOfToday;
          }
          case "este-mes": {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return date >= startOfMonth && date < endOfMonth;
          }
          case "ultimos-7": {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return date >= sevenDaysAgo && date <= now;
          }
          case "ultimos-30": {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return date >= thirtyDaysAgo && date <= now;
          }
          case "custom": {
            if (customStartDatePasajeros && customEndDatePasajeros) {
              const start = new Date(customStartDatePasajeros);
              const end = new Date(customEndDatePasajeros);
              end.setDate(end.getDate() + 1);
              return date >= start && date < end;
            }
            return true;
          }
          default:
            return true;
        }
      });
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
      case "recientes":
        sorted.sort((a, b) => {
          const fechaA = a.createdAt?.toDate?.() || a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          const fechaB = b.createdAt?.toDate?.() || b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          return fechaB - fechaA;
        });
        break;
      case "antiguos":
        sorted.sort((a, b) => {
          const fechaA = a.createdAt?.toDate?.() || a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          const fechaB = b.createdAt?.toDate?.() || b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          return fechaA - fechaB;
        });
        break;
      default:
        break;
    }
    
    return sorted;
  }, [pasajeros, searchPasajeros, sortByPasajeros, dateFilterTypePasajeros, customStartDatePasajeros, customEndDatePasajeros]);

  const conductoresFiltrados = useMemo(() => {
    let filtered = trabajadores;
    
    if (searchConductores) {
      const search = searchConductores.toLowerCase();
      filtered = filtered.filter(t =>
        (t.perfil?.name || "").toLowerCase().includes(search) ||
        (t.perfil?.email || "").toLowerCase().includes(search) ||
        (t.perfil?.categoria || "").toLowerCase().includes(search) ||
        (t.perfil?.flota || "").toLowerCase().includes(search)
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

    // Filtro por fecha
    if (dateFilterTypeConductores !== "todos") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      filtered = filtered.filter((t) => {
        const dateField = t.perfil?.createdAt || t.createdAt;
        if (!dateField) return false;

        let date;
        if (typeof dateField === "object" && dateField.seconds) {
          date = new Date(dateField.seconds * 1000);
        } else if (typeof dateField === "object" && dateField.toDate) {
          date = dateField.toDate();
        } else if (typeof dateField === "number") {
          date = new Date(dateField);
        } else if (typeof dateField === "string") {
          date = new Date(dateField);
        } else {
          return false;
        }

        switch (dateFilterTypeConductores) {
          case "hoy":
            return date >= startOfToday && date < endOfToday;
          case "esta-semana": {
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return date >= startOfWeek && date < endOfToday;
          }
          case "este-mes": {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return date >= startOfMonth && date < endOfMonth;
          }
          case "ultimos-7": {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return date >= sevenDaysAgo && date <= now;
          }
          case "ultimos-30": {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return date >= thirtyDaysAgo && date <= now;
          }
          case "custom": {
            if (customStartDateConductores && customEndDateConductores) {
              const start = new Date(customStartDateConductores);
              const end = new Date(customEndDateConductores);
              end.setDate(end.getDate() + 1);
              return date >= start && date < end;
            }
            return true;
          }
          default:
            return true;
        }
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
      case "recientes":
        sorted.sort((a, b) => {
          const fechaA = a.perfil?.createdAt?.toDate?.() || a.perfil?.createdAt?.seconds ? new Date(a.perfil.createdAt.seconds * 1000) : new Date(0);
          const fechaB = b.perfil?.createdAt?.toDate?.() || b.perfil?.createdAt?.seconds ? new Date(b.perfil.createdAt.seconds * 1000) : new Date(0);
          return fechaB - fechaA;
        });
        break;
      case "antiguos":
        sorted.sort((a, b) => {
          const fechaA = a.perfil?.createdAt?.toDate?.() || a.perfil?.createdAt?.seconds ? new Date(a.perfil.createdAt.seconds * 1000) : new Date(0);
          const fechaB = b.perfil?.createdAt?.toDate?.() || b.perfil?.createdAt?.seconds ? new Date(b.perfil.createdAt.seconds * 1000) : new Date(0);
          return fechaA - fechaB;
        });
        break;
      default:
        break;
    }
    
    return sorted;
  }, [trabajadores, searchConductores, sortByConductores, filterEstadoConductores, dateFilterTypeConductores, customStartDateConductores, customEndDateConductores]);

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

  // Handlers para filtros de fecha - Administradores
  const handleDateFilterChangeAdmin = (filterType, startDate, endDate) => {
    setDateFilterTypeAdmin(filterType);
    if (filterType === "custom") {
      setCustomStartDateAdmin(startDate || "");
      setCustomEndDateAdmin(endDate || "");
    }
    setPageAdmin(0);
  };

  const handleSortByDateAdmin = (sortType) => {
    setSortByDateAdmin(sortType);
  };

  // Handlers para filtros de fecha - Pasajeros
  const handleDateFilterChangePasajeros = (filterType, startDate, endDate) => {
    setDateFilterTypePasajeros(filterType);
    if (filterType === "custom") {
      setCustomStartDatePasajeros(startDate || "");
      setCustomEndDatePasajeros(endDate || "");
    }
    setPagePasajeros(0);
  };

  const handleSortByDatePasajeros = (sortType) => {
    setSortByDatePasajeros(sortType);
  };

  // Handlers para filtros de fecha - Conductores
  const handleDateFilterChangeConductores = (filterType, startDate, endDate) => {
    setDateFilterTypeConductores(filterType);
    if (filterType === "custom") {
      setCustomStartDateConductores(startDate || "");
      setCustomEndDateConductores(endDate || "");
    }
    setPageConductores(0);
  };

  const handleSortByDateConductores = (sortType) => {
    setSortByDateConductores(sortType);
  };

  // Funciones para limpiar todos los filtros
  const handleClearAllAdmin = () => {
    setDateFilterTypeAdmin("todos");
    setCustomStartDateAdmin("");
    setCustomEndDateAdmin("");
    setPageAdmin(0);
  };

  const handleClearAllPasajeros = () => {
    setDateFilterTypePasajeros("todos");
    setCustomStartDatePasajeros("");
    setCustomEndDatePasajeros("");
    setPagePasajeros(0);
  };

  const handleClearAllConductores = () => {
    setDateFilterTypeConductores("todos");
    setCustomStartDateConductores("");
    setCustomEndDateConductores("");
    setPageConductores(0);
  };

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
        role: formData.role,
        password: formData.password,
        flotaId: formData.flotaId || null,
        createdBy: user.uid,
      });

      if (result.success) {
        setSuccess("✅ Usuario creado exitosamente");
        loadUsers();
        setTimeout(() => {
          handleCloseDialog();
          setSuccess("");
        }, 2000);
      } else {
        setError(result.error || "Error al crear usuario");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        const result = await deleteUser(userId);
        if (result.success) {
          setSnackbar({
            open: true,
            message: "✅ Usuario eliminado correctamente",
            severity: "success"
          });
          loadUsers();
        } else {
          setSnackbar({
            open: true,
            message: "❌ " + (result.error || "Error al eliminar usuario"),
            severity: "error"
          });
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: "❌ Error al eliminar usuario: " + err.message,
          severity: "error"
        });
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
            {/* Toolbar y Filtros Alineados */}
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end", mb: 2, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 280 }}>
                <TableToolbar
                  searchValue={searchAdmin}
                  onSearchChange={setSearchAdmin}
                  searchPlaceholder="Nombre, Email del Administrador"
                  sortOptions={[
                    { label: "↑ Email (ASC)", value: "email-asc" },
                    { label: "↓ Email (DESC)", value: "email-desc" },
                    { label: "↑ Nombre (ASC)", value: "nombre-asc" },
                    { label: "↓ Nombre (DESC)", value: "nombre-desc" },
                    { label: "↑ Más Recientes", value: "recientes" },
                    { label: "↓ Más Antiguos", value: "antiguos" },
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
                  onClearAll={handleClearAllAdmin}
                  dateFilter={dateFilterTypeAdmin}
                />
              </Box>
              
              {/* Filtro de Fecha */}
              <DateFilterComponent
                onFilterChange={handleDateFilterChangeAdmin}
                onSortChange={handleSortByDateAdmin}
                currentSort={sortByDateAdmin}
                currentDateFilter={dateFilterTypeAdmin}
              />
            </Box>

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
              {visibleColumnsAdmin.contraseña && <TableCell sx={{ fontWeight: "bold", color: "white" }}>Contraseña</TableCell>}
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
            {/* Toolbar y Filtros Alineados */}
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end", mb: 2, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 280 }}>
                <TableToolbar
                  searchValue={searchPasajeros}
                  onSearchChange={setSearchPasajeros}
                  searchPlaceholder="Nombre, Email del Pasajero"
                  sortOptions={[
                    { label: "↑ Nombre (ASC)", value: "nombre-asc" },
                    { label: "↓ Nombre (DESC)", value: "nombre-desc" },
                    { label: "↑ Email (ASC)", value: "email-asc" },
                    { label: "↓ Email (DESC)", value: "email-desc" },
                    { label: "↑ Más Recientes", value: "recientes" },
                    { label: "↓ Más Antiguos", value: "antiguos" },
                  ]}
                  sortValue={sortByPasajeros}
                  onSortChange={setSortByPasajeros}
                  visibleColumns={visibleColumnsPasajeros}
                  onColumnChange={(col, visible) => setVisibleColumnsPasajeros(prev => ({ ...prev, [col]: visible }))}
                  showClearButton={true}
                  onClearAll={handleClearAllPasajeros}
                  dateFilter={dateFilterTypePasajeros}
                />
              </Box>
              
              {/* Filtro de Fecha para Pasajeros */}
              <DateFilterComponent
                onFilterChange={handleDateFilterChangePasajeros}
                onSortChange={handleSortByDatePasajeros}
                currentSort={sortByDatePasajeros}
                currentDateFilter={dateFilterTypePasajeros}
              />
            </Box>

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
                        <Tooltip title="Ver Detalles">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setPasajeroDetalles({
                                ...pasajero,
                                firebaseId: pasajero.id
                              });
                              setDetallesPasajeroModalOpen(true);
                            }}
                            sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffebee" } }}
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
            {/* Toolbar y Filtros Alineados */}
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end", mb: 2, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 280 }}>
                <TableToolbar
                  searchValue={searchConductores}
                  onSearchChange={setSearchConductores}
                  searchPlaceholder="Nombre, Email, Categoría, Flota"
                  sortOptions={[
                    { label: "↑ Nombre (ASC)", value: "nombre-asc" },
                    { label: "↓ Nombre (DESC)", value: "nombre-desc" },
                    { label: "↑ Email (ASC)", value: "email-asc" },
                    { label: "↓ Email (DESC)", value: "email-desc" },
                    { label: "↑ Más Recientes", value: "recientes" },
                    { label: "↓ Más Antiguos", value: "antiguos" },
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
                  onClearAll={handleClearAllConductores}
                  dateFilter={dateFilterTypeConductores}
                />
              </Box>
              
              {/* Filtro de Fecha para Conductores */}
              <DateFilterComponent
                onFilterChange={handleDateFilterChangeConductores}
                onSortChange={handleSortByDateConductores}
                currentSort={sortByDateConductores}
                currentDateFilter={dateFilterTypeConductores}
              />
            </Box>

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
                    Teléfono
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
                    <TableCell colSpan={9} align="center">
                      <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                        Cargando trabajadores...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : conductoresFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
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
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <span>{trabajador.phoneNumber || "-"}</span>
                          <Tooltip title={trabajador.phoneVerified ? "Teléfono verificado" : "Teléfono sin verificar"}>
                            <Box
                              sx={{
                                display: "inline-block",
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: trabajador.phoneVerified ? "#4caf50" : "#f44336",
                                flexShrink: 0,
                              }}
                            />
                          </Tooltip>
                        </Box>
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
                              setConductorDetalles({
                                ...trabajador,
                                firebaseId: trabajador.id
                              });
                              setDetallesConductorModalOpen(true);
                            }}
                            sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffebee" }, mr: 1 }}
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

          {!editingUser && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.role}
                label="Rol"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="superadmin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          )}

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
                disabled
                inputProps={{ readOnly: true }}
              />
              <TextField
                label="Categoría"
                fullWidth
                margin="normal"
                value={formData.categoria}
                disabled
                inputProps={{ readOnly: true }}
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

      <DocumentosConductoresViewModal
        open={documentosConductorModalOpen}
        onClose={() => setDocumentosConductorModalOpen(false)}
        selectedConductor={conductorDocumentosSeleccionado}
      />

      {/* Modal de Detalles del Pasajero - Nuevo */}
      <ModalDetallePasajero
        open={detallesPasajeroModalOpen}
        onClose={() => setDetallesPasajeroModalOpen(false)}
        rowData={pasajeroDetalles}
      />

      {/* Modal de Detalles del Conductor - Nuevo */}
      <ModalDetalleConductor
        open={detallesConductorModalOpen}
        onClose={() => setDetallesConductorModalOpen(false)}
        rowData={conductorDetalles}
      />

    </Box>
  );
};

export default GestionUsuarios;