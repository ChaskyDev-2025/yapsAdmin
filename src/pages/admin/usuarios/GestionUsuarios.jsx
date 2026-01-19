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
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { useAuth } from "../../../auth/AuthContext";

import { getAllUsers, createAdminUser, updateUser, deleteUser, isSuperAdmin } from "../../../services/userService";
import { deleteDocumentWithSubcollections } from "../../../services/deleteService";
import { collection, doc, updateDoc, onSnapshot } from "firebase/firestore";
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
  
  // Función para capitalizar nombres
  const capitalizarNombre = (nombre) => {
    if (!nombre) return "";
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
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
  
  // Estados para diálogos de eliminación
  const [openDeleteAdminDialog, setOpenDeleteAdminDialog] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [openDeleteConductorDialog, setOpenDeleteConductorDialog] = useState(false);
  const [conductorToDelete, setConductorToDelete] = useState(null);
  const [openDeletePasajeroDialog, setOpenDeletePasajeroDialog] = useState(false);
  const [pasajeroToDelete, setPasajeroToDelete] = useState(null);
  
  // Estados para búsqueda y filtros
  const [searchAdmin, setSearchAdmin] = useState("");
  const [searchPasajeros, setSearchPasajeros] = useState("");
  const [searchConductores, setSearchConductores] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos"); // todos, activos, inactivos
  const [filterConectadoConductores, setFilterConectadoConductores] = useState("todos"); // todos, en linea, desconectados

  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setPageAdmin(0);
  }, [searchAdmin, filterEstado]);
  
  useEffect(() => {
    setPagePasajeros(0);
  }, [searchPasajeros]);
  
  useEffect(() => {
    setPageConductores(0);
  }, [searchConductores, filterConectadoConductores]);
  
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
    creado: true,
    acciones: true,
  });
  
  const [visibleColumnsPasajeros, setVisibleColumnsPasajeros] = useState({
    foto: true,
    nombre: true,
    email: true,
    phone: true,
    departamento: true,
    fecha: true,
  });
  
  const [visibleColumnsConductores, setVisibleColumnsConductores] = useState({
    foto: true,
    nombre: true,
    email: true,
    telefono: true,
    flota: true,
    fecha: true,
    documentos: true,
    conectado: true,
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
    telefono: "",
    numerolicencia: "",
    placavehiculo: "",
    marcavehiculo: "",
    modelovehiculo: "",
    colorvehiculo: "",
    anosexperiencia: "",
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
        (p.name || p.nombre || p.perfil?.name || p.perfil?.nombre || "").toLowerCase().includes(search) ||
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
        sorted.sort((a, b) => ((a.name || a.nombre || a.perfil?.name || a.perfil?.nombre || "") || "").localeCompare((b.name || b.nombre || b.perfil?.name || b.perfil?.nombre || "") || ""));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => ((b.name || b.nombre || b.perfil?.name || b.perfil?.nombre || "") || "").localeCompare((a.name || a.nombre || a.perfil?.name || a.perfil?.nombre || "") || ""));
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
      filtered = filtered.filter(t => {
        // Búsqueda por nombre en todos los campos posibles
        const nombre = (t.nombre || t.perfil?.nombre || t.perfil?.name || t.name || "").toLowerCase();
        // Búsqueda por email
        const email = (t.email || "").toLowerCase();
        // Búsqueda por teléfono
        const telefono = (t.telefono || t.phoneNumber || "").toLowerCase();
        // Búsqueda por categorías
        const categorias = (t.categorias || []).some(cat => cat.toLowerCase().includes(search));
        // Búsqueda por flota
        const flota = (flotas.find(f => f.id === t.flotaId)?.nombre || "").toLowerCase();
        
        return nombre.includes(search) || email.includes(search) || telefono.includes(search) || categorias || flota.includes(search);
      });
    }
    
    // Filtro por conectado
    if (filterConectadoConductores !== "todos") {
      filtered = filtered.filter(t => {
        if (filterConectadoConductores === "en linea") return t.online === true;
        if (filterConectadoConductores === "desconectados") return t.online !== true;
        return true;
      });
    }

    // Filtro por fecha
    if (dateFilterTypeConductores !== "todos") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      filtered = filtered.filter((t) => {
        const dateField = t.createdAt;
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
        sorted.sort((a, b) => {
          const nombreA = (a.nombre || a.perfil?.nombre || a.perfil?.name || a.name || "").toLowerCase();
          const nombreB = (b.nombre || b.perfil?.nombre || b.perfil?.name || b.name || "").toLowerCase();
          return nombreA.localeCompare(nombreB);
        });
        break;
      case "nombre-desc":
        sorted.sort((a, b) => {
          const nombreA = (a.nombre || a.perfil?.nombre || a.perfil?.name || a.name || "").toLowerCase();
          const nombreB = (b.nombre || b.perfil?.nombre || b.perfil?.name || b.name || "").toLowerCase();
          return nombreB.localeCompare(nombreA);
        });
        break;
      case "email-asc":
        sorted.sort((a, b) => ((a.email || "") || "").localeCompare((b.email || "") || ""));
        break;
      case "email-desc":
        sorted.sort((a, b) => ((b.email || "") || "").localeCompare((a.email || "") || ""));
        break;
      case "recientes":
        sorted.sort((a, b) => {
          const fechaA = a.createdAt?.toDate?.() || (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0));
          const fechaB = b.createdAt?.toDate?.() || (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0));
          return fechaB - fechaA;
        });
        break;
      case "antiguos":
        sorted.sort((a, b) => {
          const fechaA = a.createdAt?.toDate?.() || (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0));
          const fechaB = b.createdAt?.toDate?.() || (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0));
          return fechaA - fechaB;
        });
        break;
      default:
        break;
    }
    
    return sorted;
  }, [trabajadores, searchConductores, sortByConductores, filterConectadoConductores, dateFilterTypeConductores, customStartDateConductores, customEndDateConductores]);

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
        const trabajadoresList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Mapeo de nueva estructura
            nombre: data.nombre || data.perfil?.nombre || data.perfil?.name || data.name || "Sin nombre",
            email: data.email || data.perfil?.email || "",
            telefono: data.telefono || data.phoneNumber || "",
            phoneNumber: data.telefono || data.phoneNumber || "",
            phoneVerified: data.phoneVerified || false,
            categorias: data.categorias || [],
            servicios: data.servicios || {},
            documentos_aprobados: data.documentos_aprobados || false,
            createdAt: data.createdAt || data.perfil?.createdAt || null,
            fotoUrl: data.perfil?.foto || data.perfil?.fotoUrl || "",
            // Mantener para compatibilidad
            perfil: data.perfil || {
              name: data.nombre || data.perfil?.nombre || "Sin nombre",
              email: data.email || "",
              createdAt: data.createdAt,
              photoUrl: data.fotoUrl || data.photoURL
            }
          };
        });
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
    setSearchConductores("");
    setFilterConectadoConductores("todos");
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
      // Detectar tipo de usuario
      const isPasajero = usuario.modo === "pasajero" || (usuario.perfil && usuario.name === undefined && usuario.email === undefined);
      const isTrabajador = usuario.perfil && usuario.role;
      const isConductor = usuario.role === "driver" || (usuario.servicio && usuario.categoria);
      
      // Agregar tipo para mejor identificación en el componente
      const usuarioConTipo = {
        ...usuario,
        _tipo: isConductor ? "conductor" : isPasajero ? "pasajero" : "admin"
      };
      
      setEditingUser(usuarioConTipo);
      
      // Obtener nombre y email según el tipo
      let nombreFinal = "";
      let emailFinal = "";
      let telefonoFinal = "";
      
      if (isPasajero) {
        nombreFinal = usuario.name || usuario.nombre || usuario.perfil?.name || usuario.perfil?.nombre || "";
        emailFinal = usuario.email || usuario.perfil?.email || "";
        telefonoFinal = usuario.phone || usuario.perfil?.phone || usuario.phoneNumber || "";
      } else if (isTrabajador) {
        nombreFinal = usuario.perfil?.name || "";
        emailFinal = usuario.perfil?.email || "";
        telefonoFinal = usuario.perfil?.phone || "";
      } else {
        nombreFinal = usuario.nombre || "";
        emailFinal = usuario.email || "";
        telefonoFinal = usuario.telefono || usuario.phoneNumber || "";
      }
      
      // Determinar el rol del usuario - asegurar que se preserve el rol existente
      let rolFinal = "admin"; // Default
      if (usuario.role === "superadmin") {
        rolFinal = "superadmin";
      } else if (usuario.role === "admin") {
        rolFinal = "admin";
      }

      setFormData({
        email: emailFinal,
        nombre: nombreFinal,
        role: rolFinal,
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
        telefono: telefonoFinal,
        numerolicencia: usuario.numerolicencia || "",
        placavehiculo: usuario.placavehiculo || "",
        marcavehiculo: usuario.marcavehiculo || "",
        modelovehiculo: usuario.modelovehiculo || "",
        colorvehiculo: usuario.colorvehiculo || "",
        anosexperiencia: usuario.anosexperiencia || "",
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
        telefono: "",
        numerolicencia: "",
        placavehiculo: "",
        marcavehiculo: "",
        modelovehiculo: "",
        colorvehiculo: "",
        anosexperiencia: "",
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
          role: formData.role,
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

  const handleOpenDeleteAdminDialog = (usuario) => {
    setAdminToDelete(usuario);
    setOpenDeleteAdminDialog(true);
  };

  const handleCloseDeleteAdminDialog = () => {
    setOpenDeleteAdminDialog(false);
    setAdminToDelete(null);
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      const result = await deleteUser(adminToDelete.id);
      if (result.success) {
        setSnackbar({
          open: true,
          message: "✅ Admin eliminado correctamente",
          severity: "success"
        });
        loadUsers();
      } else {
        setSnackbar({
          open: true,
          message: "❌ " + (result.error || "Error al eliminar admin"),
          severity: "error"
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "❌ Error al eliminar admin: " + err.message,
        severity: "error"
      });
    }
    handleCloseDeleteAdminDialog();
  };

  const handleOpenDeleteConductorDialog = (conductor) => {
    setConductorToDelete(conductor);
    setOpenDeleteConductorDialog(true);
  };

  const handleCloseDeleteConductorDialog = () => {
    setOpenDeleteConductorDialog(false);
    setConductorToDelete(null);
  };

  const handleConfirmDeleteConductor = async () => {
    if (!conductorToDelete) return;
    try {
      await deleteDocumentWithSubcollections("trabajadores", conductorToDelete.id);
      setSnackbar({
        open: true,
        message: "✅ Conductor y todas sus subcollecciones eliminados",
        severity: "success"
      });
    } catch (error) {
      console.error("Error al eliminar conductor:", error);
      setSnackbar({
        open: true,
        message: "❌ Error al eliminar conductor",
        severity: "error"
      });
    }
    handleCloseDeleteConductorDialog();
  };

  const handleOpenDeletePasajeroDialog = (pasajero) => {
    setPasajeroToDelete(pasajero);
    setOpenDeletePasajeroDialog(true);
  };

  const handleCloseDeletePasajeroDialog = () => {
    setOpenDeletePasajeroDialog(false);
    setPasajeroToDelete(null);
  };

  const handleConfirmDeletePasajero = async () => {
    if (!pasajeroToDelete) return;
    try {
      await deleteDocumentWithSubcollections("pasajeros", pasajeroToDelete.id);
      setSnackbar({
        open: true,
        message: "✅ Pasajero y todas sus subcollecciones eliminados",
        severity: "success"
      });
    } catch (error) {
      console.error("Error al eliminar pasajero:", error);
      setSnackbar({
        open: true,
        message: "❌ Error al eliminar pasajero",
        severity: "error"
      });
    }
    handleCloseDeletePasajeroDialog();
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
                        onClick={() => handleOpenDeleteAdminDialog(usuario)}
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
                  {visibleColumnsPasajeros.phone && (
                    <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                      Teléfono
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
                            alt={pasajero.name || pasajero.nombre || pasajero.perfil?.name || pasajero.perfil?.nombre || pasajero.email}
                            sx={{ width: 40, height: 40, bgcolor: "#d7171a" }}
                          >
                            {(pasajero.name || pasajero.nombre || pasajero.perfil?.name || pasajero.perfil?.nombre || pasajero.email || "?")?.charAt(0).toUpperCase()}
                          </Avatar>
                        </TableCell>
                      )}
                      {visibleColumnsPasajeros.nombre && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                          {pasajero.name || pasajero.nombre || pasajero.perfil?.name || pasajero.perfil?.nombre || "Sin nombre"}
                        </TableCell>
                      )}
                      {visibleColumnsPasajeros.email && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {pasajero.email || pasajero.perfil?.email || "-"}
                        </TableCell>
                      )}
                      {visibleColumnsPasajeros.phone && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {pasajero.phone || pasajero.perfil?.phone || "-"}
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
                            onClick={() => handleOpenDeletePasajeroDialog(pasajero)}
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
                  filterValue={{ conectado: filterConectadoConductores }}
                  onFilterChange={(name, value) => setFilterConectadoConductores(value)}
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
                      {visibleColumnsConductores.foto && (
                        <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                          Foto
                        </TableCell>
                      )}
                      {visibleColumnsConductores.nombre && (
                        <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                          Nombre
                        </TableCell>
                      )}
                      {visibleColumnsConductores.email && (
                        <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                          Email
                        </TableCell>
                      )}
                      {visibleColumnsConductores.telefono && (
                        <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                          Teléfono
                        </TableCell>
                      )}
                      {visibleColumnsConductores.flota && (
                        <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                          Flota
                        </TableCell>
                      )}
                      {visibleColumnsConductores.fecha && (
                        <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                          Fecha Registro
                        </TableCell>
                      )}
                      {visibleColumnsConductores.documentos && (
                        <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                          Documentos
                        </TableCell>
                      )}
                      {visibleColumnsConductores.conectado && (
                        <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                          Conectado
                        </TableCell>
                      )}
                      {visibleColumnsConductores.acciones && (
                        <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                          Acciones
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={Object.values(visibleColumnsConductores).filter(Boolean).length} align="center">
                      <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                        Cargando trabajadores...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : conductoresFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={Object.values(visibleColumnsConductores).filter(Boolean).length} align="center">
                      <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                        {trabajadores.length === 0 ? "No hay trabajadores registrados" : "No hay resultados para la búsqueda"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  conductoresPaginados.map((trabajador) => (
                    <TableRow key={trabajador.id} hover>
                      {visibleColumnsConductores.foto && (
                        <TableCell>
                          <Avatar
                            src={trabajador.perfil?.foto || trabajador.perfil?.fotoUrl || trabajador.fotoUrl}
                            alt={trabajador.nombre || trabajador.perfil?.nombre || trabajador.perfil?.name || trabajador.name || trabajador.email}
                            sx={{ width: 40, height: 40, bgcolor: "#d7171a" }}
                          >
                            {(trabajador.nombre || trabajador.perfil?.nombre || trabajador.perfil?.name || trabajador.name || trabajador.email || "?")?.charAt(0).toUpperCase()}
                          </Avatar>
                        </TableCell>
                      )}
                      {visibleColumnsConductores.nombre && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                          {capitalizarNombre(trabajador.nombre || trabajador.perfil?.nombre || trabajador.perfil?.name || trabajador.name || trabajador.email || "Sin nombre")}
                        </TableCell>
                      )}
                      {visibleColumnsConductores.email && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {trabajador.email || "-"}
                        </TableCell>
                      )}
                      {visibleColumnsConductores.telefono && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <span>{trabajador.telefono || trabajador.phoneNumber || "-"}</span>
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
                      )}
                      {visibleColumnsConductores.flota && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {trabajador.flotaId 
                            ? flotas.find(f => f.id === trabajador.flotaId)?.nombre || "Flota no encontrada"
                            : "-"}
                        </TableCell>
                      )}
                      {visibleColumnsConductores.fecha && (
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {formatearFecha(trabajador.createdAt)}
                        </TableCell>
                      )}
                      {visibleColumnsConductores.documentos && (
                        <TableCell>
                          <Typography sx={{color: trabajador.documentos_aprobados ? "#d7171a" : "#bdbdbd", fontWeight: 600}}>
                            {trabajador.documentos_aprobados ? "Sí" : "No"}
                          </Typography>
                        </TableCell>
                      )}
                      {visibleColumnsConductores.conectado && (
                        <TableCell>
                          <Chip
                            icon={trabajador.online === true ? <WifiIcon /> : <WifiOffIcon />}
                            label={trabajador.online === true ? "En línea" : "Desconectado"}
                            size="small"
                            sx={{
                              color: trabajador.online === true ? "#2e7d32" : "#616161",
                              backgroundColor: trabajador.online === true ? "#e8f5e9" : "#f5f5f5",
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                            }}
                          />
                        </TableCell>
                      )}
                      {visibleColumnsConductores.acciones && (
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
                              onClick={() => handleOpenDeleteConductorDialog(trabajador)}
                              sx={{ color: "#d7171a" }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
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
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#000000", color: "white", display: "flex", alignItems: "center", gap: 1 }}>
          {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
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

          {(editingUser?._tipo === "pasajero" || editingUser?._tipo === "conductor") && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <Avatar
                src={editingUser.perfil?.foto || editingUser.perfil?.fotoUrl || editingUser.perfil?.photoUrl || editingUser.perfil?.photoURL || editingUser.photoURL || editingUser.photoUrl || editingUser.fotoUrl || editingUser.foto}
                alt={editingUser.perfil?.name || editingUser.name || editingUser.nombre}
                sx={{ width: 100, height: 100, bgcolor: "#d7171a", border: "3px solid #d7171a" }}
              >
                {(editingUser.perfil?.name || editingUser.name || editingUser.nombre || "?")?.charAt(0).toUpperCase()}
              </Avatar>
            </Box>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Sección 1: Información Base */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                Información Personal
              </Typography>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={editingUser !== null}
                error={editingUser === null && !formData.email}
                helperText={editingUser === null && !formData.email ? "Email requerido" : ""}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Nombre Completo"
                fullWidth
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                error={!formData.nombre}
                helperText={!formData.nombre ? "Nombre requerido" : ""}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Teléfono"
                fullWidth
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+591 XXXXXXXXX"
              />
            </Box>

            {!editingUser && (
              <>
                {/* Sección 2: Rol y Contraseña (Solo crear) */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                    Acceso
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
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
                  <TextField
                    label="Contraseña"
                    type="password"
                    fullWidth
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={!formData.password}
                    helperText={!formData.password ? "Contraseña requerida" : ""}
                  />
                </Box>
              </>
            )}

            {editingUser && !editingUser.modo && !editingUser.perfil && (
              <>
                {/* Sección 2: Rol (Solo editar admins) */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                    Acceso
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
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
                </Box>
              </>
            )}

            {editingUser?.modo === "pasajero" && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  Ubicación
                </Typography>
                <TextField
                  label="Departamento Actual"
                  fullWidth
                  value={formData.departamentoActual}
                  onChange={(e) => setFormData({ ...formData, departamentoActual: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Código de Referido"
                  fullWidth
                  value={formData.codigoReferido}
                  onChange={(e) => setFormData({ ...formData, codigoReferido: e.target.value })}
                />
              </Box>
            )}

            {editingUser?._tipo === "conductor" && (
              <>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                    Información del Conductor
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
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
                    value={formData.servicio}
                    disabled
                    inputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Categoría"
                    fullWidth
                    value={formData.categoria}
                    disabled
                    inputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Años de Experiencia"
                    type="number"
                    fullWidth
                    value={formData.anosexperiencia}
                    onChange={(e) => setFormData({ ...formData, anosexperiencia: e.target.value })}
                    inputProps={{ min: 0 }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                    Documentos
                  </Typography>
                  <TextField
                    label="Número de Licencia"
                    fullWidth
                    value={formData.numerolicencia}
                    onChange={(e) => setFormData({ ...formData, numerolicencia: e.target.value })}
                    placeholder="Ej: 123456789"
                    sx={{ mb: 2 }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#000", mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                    Datos del Vehículo
                  </Typography>
                  <TextField
                    label="Placa del Vehículo"
                    fullWidth
                    value={formData.placavehiculo}
                    onChange={(e) => setFormData({ ...formData, placavehiculo: e.target.value })}
                    placeholder="Ej: XYZ-1234"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Marca del Vehículo"
                    fullWidth
                    value={formData.marcavehiculo}
                    onChange={(e) => setFormData({ ...formData, marcavehiculo: e.target.value })}
                    placeholder="Ej: Toyota"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Modelo del Vehículo"
                    fullWidth
                    value={formData.modelovehiculo}
                    onChange={(e) => setFormData({ ...formData, modelovehiculo: e.target.value })}
                    placeholder="Ej: Prius 2020"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Color del Vehículo"
                    fullWidth
                    value={formData.colorvehiculo}
                    onChange={(e) => setFormData({ ...formData, colorvehiculo: e.target.value })}
                    placeholder="Ej: Negro"
                  />
                </Box>

                <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      />
                    }
                    label={formData.activo ? "Conductor Activo" : "Conductor Inactivo"}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e0e0e0" }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ color: "#484848", fontWeight: 600, textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            disabled={!formData.nombre || !formData.email || (editingUser === null && !formData.password)}
            sx={{
              bgcolor: "#d7171a",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              "&:hover": { bgcolor: "#b01217" },
              "&:disabled": { bgcolor: "#ccc" }
            }}
          >
            {editingUser ? "Actualizar Usuario" : "Crear Usuario"}
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

      {/* Dialog de confirmación para eliminar Admin */}
      <Dialog
        open={openDeleteAdminDialog}
        onClose={handleCloseDeleteAdminDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>
          ⚠️ Eliminar Admin
        </DialogTitle>
        <DialogContent sx={{ fontFamily: "Mulish, sans-serif", pt: 2 }}>
          <Typography sx={{ mb: 2 }}>
            ¿Deseas eliminar este administrador?
          </Typography>
          {adminToDelete && (
            <Box sx={{ backgroundColor: "#f5f5f5", p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: "#d7171a" }}>
                {adminToDelete.name || adminToDelete.email}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666" }}>
                {adminToDelete.email}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ color: "#666" }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteAdminDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDeleteAdmin} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar Conductor */}
      <Dialog
        open={openDeleteConductorDialog}
        onClose={handleCloseDeleteConductorDialog}
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
                {conductorToDelete.nombre || conductorToDelete.perfil?.name || conductorToDelete.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666" }}>
                {conductorToDelete.email || conductorToDelete.perfil?.email}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ color: "#666" }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteConductorDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDeleteConductor} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar Pasajero */}
      <Dialog
        open={openDeletePasajeroDialog}
        onClose={handleCloseDeletePasajeroDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>
          ⚠️ Eliminar Pasajero
        </DialogTitle>
        <DialogContent sx={{ fontFamily: "Mulish, sans-serif", pt: 2 }}>
          <Typography sx={{ mb: 2 }}>
            ¿Deseas eliminar este pasajero?
          </Typography>
          {pasajeroToDelete && (
            <Box sx={{ backgroundColor: "#f5f5f5", p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: "#d7171a" }}>
                {pasajeroToDelete.perfil?.name || pasajeroToDelete.perfil?.nombre || pasajeroToDelete.name || pasajeroToDelete.nombre}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666" }}>
                {pasajeroToDelete.perfil?.email || pasajeroToDelete.email}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ color: "#666" }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeletePasajeroDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDeletePasajero} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default GestionUsuarios;