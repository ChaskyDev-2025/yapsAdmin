import React, { useState, useEffect, useMemo, useCallback, useContext, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Pagination,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import InfoIcon from "@mui/icons-material/Info";
import { TableToolbar } from "../usuarios/components/TableToolbar";
import DateFilterComponent from "../usuarios/components/DateFilterComponent";
import { useAuth } from "../../../auth/AuthContext";
import {
  uploadImageToApi,
  saveFlotaQrImageUrl,
  uploadComprobanteFlota,
  uploadQrFlotaToStorage,
} from "../../../services/imageUploadService";
import {
  obtenerSolicitudesFlota,
  obtenerHistorialConductores,
  crearSolicitudRecarga,
  escucharSolicitudesFlota,
  escucharHistorialTransacciones,
  escucharSaldoFlota,
} from "../../../services/solicitudesRecargaService";
import {
  getDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
  collectionGroup,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { NotificationContext } from "../../../context/NotificationContext";

const BilleteraFlota = () => {
  const { userFlotaId, user } = useAuth();
  const { addNotification } = useContext(NotificationContext);
  const flotaId = userFlotaId;
  
  // Refs para comparar cambios
  const prevSolicitudesRef = useRef([]);
  const prevDocumentosRef = useRef([]);
  
  const [tabValue, setTabValue] = useState(0);
  const [subtabHistorialValue, setSubtabHistorialValue] = useState(0); // 0 = Flota, 1 = Conductores
  const [loading, setLoading] = useState(true);
  const [datosIniciales, setDatosIniciales] = useState(false); // Flag para primera carga
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesConductores, setSolicitudesConductores] = useState([]);
  const [documentosConductores, setDocumentosConductores] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [saldoActual, setSaldoActual] = useState(0);
  const [pageSolicitudes, setPageSolicitudes] = useState(0);
  const [pageHistorial, setPageHistorial] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("recarga");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchSolicitudes, setSearchSolicitudes] = useState("");
  const [sortBySolicitudes, setSortBySolicitudes] = useState("fecha-desc");
  const [periodFilterSolicitudes, setPeriodFilterSolicitudes] =
    useState("todos");
  const [searchHistorial, setSearchHistorial] = useState("");
  const [sortByHistorial, setSortByHistorial] = useState("fecha-desc");
  const [periodFilterHistorial, setPeriodFilterHistorial] = useState("todos");

  // Estados para tabla de solicitudes de conductores
  const [searchSolicitudesConductores, setSearchSolicitudesConductores] = useState("");
  const [filterEstadoConductores, setFilterEstadoConductores] = useState("todas");
  const [sortBySolicitudesConductores, setSortBySolicitudesConductores] = useState("fecha-desc");
  const [pageSolicitudesConductores, setPageSolicitudesConductores] = useState(0);

  // Estados para columnas visibles en Solicitudes
  const [visibleColumnsSolicitudes, setVisibleColumnsSolicitudes] = useState({
    fecha: true,
    monto: true,
    concepto: true,
    estado: true,
    notas: true,
    comprobante: true,
  });

  // Estados para columnas visibles en Historial
  const [visibleColumnsHistorial, setVisibleColumnsHistorial] = useState({
    fecha: true,
    tipo: true,
    monto: true,
    concepto: true,
    saldo: true,
    comprobante: true,
  });

  // Estados para el modal QR
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [qrImagePreview, setQrImagePreview] = useState(null);
  const [currentQrUrl, setCurrentQrUrl] = useState(null);
  const [qrUpdatedAt, setQrUpdatedAt] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [superAdminQr, setSuperAdminQr] = useState(null);
  const [superAdminQrUpdatedAt, setSuperAdminQrUpdatedAt] = useState(null);
  const [qrExpandedOpen, setQrExpandedOpen] = useState(false);

  // Estados para comprobante de pago
  const [comprobanteImage, setComprobanteImage] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [nroComprobante, setNroComprobante] = useState("");

  // Estados para comprobante expandido
  const [comprobanteExpandidoOpen, setComprobanteExpandidoOpen] =
    useState(false);
  const [comprobanteExpandidoUrl, setComprobanteExpandidoUrl] = useState(null);

  // Estados para modal de validación de solicitudes
  const [validacionOpen, setValidacionOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [procesando, setProcesando] = useState(false);

  // Estados para modal de información de solicitud
  const [infoSolicitudOpen, setInfoSolicitudOpen] = useState(false);
  const [solicitudInfo, setSolicitudInfo] = useState(null);

  // Estado para modal de saldo insuficiente
  const [saldoInsuficienteOpen, setSaldoInsuficienteOpen] = useState(false);
  const [montoFaltante, setMontoFaltante] = useState(0);

  // Función para cargar solicitudes de conductores (definida con useCallback para ser accesible en handlers)
  const cargarSolicitudesConductores = useCallback(async () => {
    if (!flotaId) return;

    try {
      // Primero obtener los trabajadores de mi flota
      const trabajadoresRef = collection(db, "trabajadores");
      const qTrabajadores = query(
        trabajadoresRef,
        where("flotaId", "==", flotaId)
      );
      const trabajadoresSnapshot = await getDocs(qTrabajadores);

      const todasSolicitudes = [];

      // Para cada trabajador, obtener su historial de billetera
      for (const trabajadorDoc of trabajadoresSnapshot.docs) {
        const trabajadorId = trabajadorDoc.id;
        const trabajadorData = trabajadorDoc.data();

        const historialRef = collection(
          db,
          "trabajadores",
          trabajadorId,
          "historial-billetera"
        );

        const historialSnapshot = await getDocs(historialRef);

        historialSnapshot.docs.forEach((historialDoc) => {
          todasSolicitudes.push({
            id: historialDoc.id,
            conductorId: trabajadorId,
            conductorNombre:
              trabajadorData.nombre ||
              trabajadorData.displayName ||
              "Conductor",
            ...historialDoc.data(),
          });
        });
      }

      // Ordenar por timestamp descendente (más nuevas primero)
      todasSolicitudes.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setSolicitudesConductores(todasSolicitudes);
    } catch (error) {
      console.error("Error cargando solicitudes de conductores:", error);
    }
  }, [flotaId]);

  const cargarDocumentosConductores = useCallback(async () => {
    if (!flotaId) return;

    try {
      // Obtener los trabajadores de mi flota
      const trabajadoresRef = collection(db, "trabajadores");
      const qTrabajadores = query(
        trabajadoresRef,
        where("flotaId", "==", flotaId)
      );
      const trabajadoresSnapshot = await getDocs(qTrabajadores);

      const todosDocumentos = [];

      // Para cada trabajador, obtener sus documentos
      for (const trabajadorDoc of trabajadoresSnapshot.docs) {
        const trabajadorId = trabajadorDoc.id;
        const trabajadorData = trabajadorDoc.data();

        const documentosRef = collection(
          db,
          "trabajadores",
          trabajadorId,
          "documentos"
        );

        const documentosSnapshot = await getDocs(documentosRef);

        documentosSnapshot.docs.forEach((docDoc) => {
          todosDocumentos.push({
            id: docDoc.id,
            conductorId: trabajadorId,
            conductorNombre:
              trabajadorData.nombre ||
              trabajadorData.displayName ||
              "Conductor",
            ...docDoc.data(),
          });
        });
      }

      setDocumentosConductores(todosDocumentos);
    } catch (error) {
      console.error("Error cargando documentos de conductores:", error);
    }
  }, [flotaId]);

  useEffect(() => {
    if (!flotaId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Cargar datos iniciales
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const [solicitudesData, historialData] = await Promise.all([
          obtenerSolicitudesFlota(flotaId),
          obtenerHistorialConductores(flotaId),
        ]);

        if (isMounted) {
          setSolicitudes(solicitudesData);
          setHistorial(historialData);

          // También intentar cargar el saldo inicial
          try {
            const billeteraRef = doc(
              db,
              "flotas",
              flotaId,
              "billetera",
              "saldo"
            );
            const billeteraSnapshot = await getDoc(billeteraRef);
            if (billeteraSnapshot.exists()) {
              setSaldoActual(billeteraSnapshot.data().monto || 0);
            }
          } catch (err) {
            // Error silencioso
          }
        }
      } catch (error) {
        // Error silencioso
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();

    // Listener EN TIEMPO REAL para el saldo - punto único de verdad
    const unsubscribeSaldo = escucharSaldoFlota(flotaId, (saldoActualizado) => {
      if (isMounted) {
        setSaldoActual(saldoActualizado);
      }
    });

    // Listener para solicitudes
    const unsubscribeSolicitudes = escucharSolicitudesFlota(
      flotaId,
      (solicitudesActualizadas) => {
        if (isMounted) {
          setSolicitudes(solicitudesActualizadas);
        }
      }
    );

    // Listener para historial
    const unsubscribeHistorial = escucharHistorialTransacciones(
      flotaId,
      (historialActualizado) => {
        if (isMounted) {
          setHistorial(historialActualizado);
        }
      }
    );

    // Cargar solicitudes de conductores inicialmente
    const loadInitialSolicitudes = async () => {
      await cargarSolicitudesConductores();
      await cargarDocumentosConductores();
      // Marcar que ya se cargaron los datos iniciales
      setDatosIniciales(true);
    };
    
    loadInitialSolicitudes();

    // Listener en tiempo real para cambios en trabajadores
    const unsubscribeConductores = onSnapshot(
      query(collection(db, "trabajadores"), where("flotaId", "==", flotaId)),
      () => {
        cargarSolicitudesConductores();
        cargarDocumentosConductores();
      }
    );

    // Listener en tiempo real para historial de billetera usando collectionGroup
    // Listener en tiempo real para historial (SOLO de mi flota)
    const unsubscribeSolicitudesRT = onSnapshot(
      query(
        collectionGroup(db, "historial-billetera"),
        // No podemos filtrar directamente por flotaId aquí porque está en trabajadores
        // Así que validamos en el callback
      ),
      (snapshot) => {
        if (isMounted) {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added" || change.type === "modified") {
              try {
                // Nuevo historial agregado o modificado
                const docPath = change.doc.ref.path;
                // Extraer trabajadorId del path: trabajadores/{trabajadorId}/historial-billetera/{historialId}
                const pathParts = docPath.split("/");
                const trabajadorId = pathParts[1]; // El índice 1 es el trabajadorId
                
                // Verificar que este trabajador pertenece a mi flota
                const trabajadorRef = doc(db, "trabajadores", trabajadorId);
                const trabajadorSnap = await getDoc(trabajadorRef);
                
                if (trabajadorSnap.exists() && trabajadorSnap.data().flotaId === flotaId) {
                  cargarSolicitudesConductores();
                }
              } catch (error) {
                console.error("Error verificando historial:", error);
              }
            }
          });
        }
      }
    );

    // Listener en tiempo real para documentos (SOLO de mi flota)
    const unsubscribeDocumentosRT = onSnapshot(
      query(collectionGroup(db, "documentos")),
      (snapshot) => {
        if (isMounted) {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              try {
                // Nuevo documento agregado
                const docPath = change.doc.ref.path;
                // Extraer trabajadorId del path: trabajadores/{trabajadorId}/documentos/{docId}
                const pathParts = docPath.split("/");
                const trabajadorId = pathParts[1]; // El índice 1 es el trabajadorId
                
                // Verificar que este trabajador pertenece a mi flota
                const trabajadorRef = doc(db, "trabajadores", trabajadorId);
                const trabajadorSnap = await getDoc(trabajadorRef);
                
                if (trabajadorSnap.exists() && trabajadorSnap.data().flotaId === flotaId) {
                  cargarDocumentosConductores();
                }
              } catch (error) {
                console.error("Error verificando documento:", error);
              }
            }
          });
        }
      }
    );

    // Cleanup: desuscribir de todos los listeners
    return () => {
      isMounted = false;
      if (unsubscribeSaldo) unsubscribeSaldo();
      if (unsubscribeSolicitudes) unsubscribeSolicitudes();
      if (unsubscribeHistorial) unsubscribeHistorial();
      if (unsubscribeConductores) unsubscribeConductores();
      if (unsubscribeSolicitudesRT) unsubscribeSolicitudesRT();
      if (unsubscribeDocumentosRT) unsubscribeDocumentosRT();
    };
  }, [flotaId, cargarSolicitudesConductores, cargarDocumentosConductores]);

  // Reset página de solicitudes al cambiar búsqueda
  useEffect(() => {
    setPageSolicitudes(0);
  }, [searchSolicitudes]);

  // Reset página de historial al cambiar búsqueda
  useEffect(() => {
    setPageHistorial(0);
  }, [searchHistorial]);

  // Reset página de solicitudes de conductores al cambiar búsqueda o filtros
  useEffect(() => {
    setPageSolicitudesConductores(0);
  }, [searchSolicitudesConductores, filterEstadoConductores]);

  // Cuando se cargan los datos iniciales, actualizar los refs sin enviar notificaciones
  useEffect(() => {
    if (datosIniciales) {
      // Actualizar los refs para que no envíe notificaciones de solicitudes/documentos antiguos
      prevSolicitudesRef.current = solicitudesConductores;
      prevDocumentosRef.current = documentosConductores;
    }
  }, [datosIniciales]);

  // Detectar nuevas solicitudes de conductores
  useEffect(() => {
    // Solo enviar notificaciones DESPUÉS de que se cargaron los datos iniciales
    if (!datosIniciales) {
      return; // Todavía está cargando datos iniciales
    }

    // Comparar con el estado anterior
    const prevSolicitudes = prevSolicitudesRef.current;
    
    // Solo procesar si el array cambió de verdad (longitud diferente)
    if (prevSolicitudes.length === solicitudesConductores.length) {
      // Misma cantidad de solicitudes = sin cambios
      return;
    }

    // Si aumentó la cantidad, buscar cuáles son nuevas
    if (solicitudesConductores.length > prevSolicitudes.length) {
      const prevIds = new Set(prevSolicitudes.map(s => s.id));
      const nuevasSolicitudes = solicitudesConductores.filter(
        s => !prevIds.has(s.id)
      );

      // Enviar notificación para cada nueva solicitud
      nuevasSolicitudes.forEach((solicitud) => {
        addNotification({
          message: `Nueva solicitud: ${solicitud.conductorNombre} solicita Bs. ${solicitud.monto || solicitud.amount || 0}`,
          type: "warning",
        });
        playNotificationSound();
      });
    }

    // Actualizar el ref con las solicitudes actuales
    prevSolicitudesRef.current = solicitudesConductores;
  }, [solicitudesConductores, datosIniciales, addNotification]);

  // Detectar nuevos documentos de conductores
  useEffect(() => {
    // Solo enviar notificaciones DESPUÉS de que se cargaron los datos iniciales
    if (!datosIniciales) {
      return; // Todavía está cargando datos iniciales
    }

    // Comparar con el estado anterior
    const prevDocumentos = prevDocumentosRef.current;
    
    // Solo procesar si el array cambió de verdad (longitud diferente)
    if (prevDocumentos.length === documentosConductores.length) {
      // Misma cantidad de documentos = sin cambios
      return;
    }

    // Si aumentó la cantidad, buscar cuáles son nuevos
    if (documentosConductores.length > prevDocumentos.length) {
      const prevIds = new Set(prevDocumentos.map(d => d.id));
      const nuevosDocumentos = documentosConductores.filter(
        d => !prevIds.has(d.id)
      );

      // Enviar notificación para cada nuevo documento
      nuevosDocumentos.forEach((documento) => {
        const tipoDoc = documento.tipo || "Documento";
        const estado = documento.estado || "pendiente";
        
        addNotification({
          message: `Nuevo documento: ${documento.conductorNombre} - ${tipoDoc} (${estado})`,
          type: "info",
        });
        playNotificationSound();
      });
    }

    // Actualizar el ref con los documentos actuales
    prevDocumentosRef.current = documentosConductores;
  }, [documentosConductores, datosIniciales, addNotification]);

  const mostrarSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const playNotificationSound = () => {
    try {
      // Crear un sonido simple de notificación usando Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      
      // Sonido de notificación: dos tonos
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Error reproduciendo sonido
    }
  };

  // Funciones para validar solicitudes de conductores
  const handleAbrirValidacion = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMotivoRechazo("");
    setValidacionOpen(true);
  };

  const handleVerInfoSolicitud = (solicitud) => {
    setSolicitudInfo(solicitud);
    setInfoSolicitudOpen(true);
  };

  const handleCerrarValidacion = () => {
    setValidacionOpen(false);
    setSolicitudSeleccionada(null);
    setMotivoRechazo("");
  };

  const handleAprobarSolicitud = async () => {
    try {
      setProcesando(true);

      // Convertir monto a número (quitar " BOB" si está)
      const montoNumerico = typeof solicitudSeleccionada.monto === 'string'
        ? parseFloat(solicitudSeleccionada.monto.replace(' BOB', '').replace(',', '.'))
        : parseFloat(solicitudSeleccionada.monto);

      // Validar saldo de la flota
      const flotaBilleteraRef = doc(
        db,
        "flotas",
        flotaId,
        "billetera",
        "saldo"
      );
      const flotaBilleteraSnapshot = await getDoc(flotaBilleteraRef);
      const saldoFlota = flotaBilleteraSnapshot.exists()
        ? flotaBilleteraSnapshot.data().monto || 0
        : 0;

      // Verificar si la flota tiene saldo suficiente
      if (saldoFlota < montoNumerico) {
        const faltante = montoNumerico - saldoFlota;
        setMontoFaltante(faltante);
        setSaldoInsuficienteOpen(true);
        setProcesando(false);
        handleCerrarValidacion();
        return;
      }

      // Obtener saldo actual del trabajador
      const billeteraRef = doc(
        db,
        "trabajadores",
        solicitudSeleccionada.conductorId,
        "billetera",
        "data"
      );
      const billeteraSnapshot = await getDoc(billeteraRef);

      const saldoActual = billeteraSnapshot.exists()
        ? billeteraSnapshot.data().saldo || 0
        : 0;
      const nuevoSaldo = saldoActual + montoNumerico;

      // Crear o actualizar saldo del trabajador
      await setDoc(
        billeteraRef,
        {
          saldo: nuevoSaldo,
          updatedAt: serverTimestamp(),
          createdAt: billeteraSnapshot.exists()
            ? billeteraSnapshot.data().createdAt
            : serverTimestamp(),
        },
        { merge: true }
      );

      // Crear entrada en el historial del trabajador
      const historialRef = collection(
        db,
        "trabajadores",
        solicitudSeleccionada.conductorId,
        "historial-billetera"
      );

      // Actualizar el documento existente del historial con el estado de aprobación
      const historialDocRef = doc(historialRef, solicitudSeleccionada.id);
      await updateDoc(historialDocRef, {
        estado: "aprobada",
        fechaAprobacion: serverTimestamp(),
        descripcion: "Recarga de saldo aprobada",
      });

      // Descontar saldo de la flota
      const nuevoSaldoFlota = saldoFlota - montoNumerico;
      await updateDoc(flotaBilleteraRef, {
        monto: nuevoSaldoFlota,
        updatedAt: serverTimestamp(),
      });

      mostrarSnackbar(
        `Solicitud aprobada. Saldo actualizado: $${nuevoSaldo.toFixed(2)}`,
        "success"
      );

      // Recargar lista de solicitudes después de aprobar
      await cargarSolicitudesConductores();
      await cargarDocumentosConductores();

      handleCerrarValidacion();
    } catch (error) {
      console.error("Error aprobando solicitud:", error);
      mostrarSnackbar(`Error: ${error.message}`, "error");
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazarSolicitud = async () => {
    try {
      if (!motivoRechazo.trim()) {
        mostrarSnackbar("Debes indicar el motivo del rechazo", "error");
        return;
      }

      setProcesando(true);

      // Crear entrada en el historial del trabajador

      // Crear entrada en el historial del trabajador
      const historialRef = collection(
        db,
        "trabajadores",
        solicitudSeleccionada.conductorId,
        "historial-billetera"
      );

      // Actualizar el documento existente del historial con el estado de rechazo
      const historialDocRef = doc(historialRef, solicitudSeleccionada.id);
      await updateDoc(historialDocRef, {
        estado: "rechazada",
        fechaRechazo: serverTimestamp(),
        motivoRechazo: motivoRechazo,
        descripcion: `Motivo: ${motivoRechazo}`,
      });

      mostrarSnackbar("Solicitud rechazada", "success");

      // Recargar lista de solicitudes después de rechazar
      await cargarSolicitudesConductores();
      await cargarDocumentosConductores();

      handleCerrarValidacion();
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
      mostrarSnackbar("Error al rechazar la solicitud", "error");
    } finally {
      setProcesando(false);
    }
  };

  // Cargar QR actual de la flota
  const cargarQrActual = async () => {
    if (!flotaId) return;
    try {
      const flotaDoc = await getDoc(doc(db, "flotas", flotaId));
      if (flotaDoc.exists()) {
        const flotaData = flotaDoc.data();
        setCurrentQrUrl(flotaData.qrImage || null);
        setQrUpdatedAt(flotaData.qrImageUpdatedAt || null);
      }
    } catch (error) {
      console.error("Error cargando QR actual:", error);
    }
  };

  // Cargar QR del SuperAdmin
  const cargarQrSuperAdmin = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "superadmin"));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const superAdminDoc = querySnapshot.docs[0];
        const superAdminData = superAdminDoc.data();
        setSuperAdminQr(superAdminData.qrImage || null);
        setSuperAdminQrUpdatedAt(superAdminData.qrImageUpdatedAt || null);
      }
    } catch (error) {
      console.error("Error cargando QR del SuperAdmin:", error);
    }
  };

  // Cargar QRs al montar el componente
  useEffect(() => {
    cargarQrActual();
    cargarQrSuperAdmin();
  }, [flotaId]);

  const handleOpenQrModal = () => {
    setQrImage(null);
    setQrImagePreview(null);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = () => {
    setQrModalOpen(false);
    setQrImage(null);
    setQrImagePreview(null);
  };

  const handleQrImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        mostrarSnackbar("Por favor selecciona un archivo de imagen", "error");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        mostrarSnackbar("La imagen no debe superar los 5MB", "error");
        return;
      }

      setQrImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitQr = async () => {
    if (!qrImage) {
      mostrarSnackbar("Por favor selecciona una imagen", "error");
      return;
    }

    if (!flotaId) {
      mostrarSnackbar("No se pudo identificar la flota", "error");
      return;
    }

    try {
      setUploadingQr(true);

      // Subir imagen a Firebase Storage en carpeta qr/{flotaId}
      const uploadResult = await uploadQrFlotaToStorage(qrImage, flotaId);
      const imageUrl = uploadResult.url;

      // Guardar URL en Firebase (documento de la flota)
      await saveFlotaQrImageUrl(flotaId, imageUrl);

      // Actualizar estado local
      setCurrentQrUrl(imageUrl);
      setQrUpdatedAt(new Date().toISOString());

      mostrarSnackbar("QR actualizado exitosamente", "success");
      handleCloseQrModal();
    } catch (error) {
      console.error("Error subiendo QR:", error);
      mostrarSnackbar(error.message || "Error al subir la imagen", "error");
    } finally {
      setUploadingQr(false);
    }
  };

  const handleAbrirModal = () => {
    setMonto("");
    setConcepto("recarga");
    setNotas("");
    setComprobanteImage(null);
    setComprobantePreview(null);
    setNroComprobante("");
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleComprobanteChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        mostrarSnackbar("Por favor selecciona un archivo de imagen", "error");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        mostrarSnackbar("La imagen no debe superar los 5MB", "error");
        return;
      }

      setComprobanteImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitSolicitud = async () => {
    try {
      if (!monto || parseFloat(monto) <= 0) {
        mostrarSnackbar("Ingresa un monto válido", "error");
        return;
      }

      setSubmitting(true);

      let comprobanteUrl = null;

      // Subir comprobante si existe
      if (comprobanteImage) {
        try {
          const comprobanteData = await uploadComprobanteFlota(
            comprobanteImage,
            flotaId
          );
          comprobanteUrl = comprobanteData.url;
        } catch (error) {
          console.error("Error subiendo comprobante:", error);
          mostrarSnackbar(
            "Error al subir el comprobante, pero se creará la solicitud",
            "warning"
          );
        }
      }

      await crearSolicitudRecarga(
        flotaId,
        parseFloat(monto),
        concepto,
        notas,
        comprobanteUrl,
        nroComprobante,
        saldoActual,
        user?.uid
      );

      mostrarSnackbar("Solicitud enviada al superadmin", "success");
      handleModalClose();
    } catch (error) {
      mostrarSnackbar(error.message || "Error al crear solicitud", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "aprobada":
        return "Aprobada";
      case "rechazada":
        return "Rechazada";
      default:
        return estado;
    }
  };

  // Filtrado y ordenamiento para solicitudes
  const solicitudesFiltradas = useMemo(() => {
    let filtered = solicitudes;

    // Filtro por período
    if (periodFilterSolicitudes !== "todos") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((s) => {
        if (!s.timestamp) return false;

        let fechaDate;
        if (
          s.timestamp?.toDate &&
          typeof s.timestamp.toDate === "function"
        ) {
          fechaDate = s.timestamp.toDate();
        } else if (typeof s.timestamp === "string") {
          fechaDate = new Date(s.timestamp);
        } else if (s.timestamp instanceof Date) {
          fechaDate = s.timestamp;
        } else if (s.timestamp?.seconds) {
          fechaDate = new Date(s.timestamp.seconds * 1000);
        } else {
          return false;
        }

        // Obtener solo la fecha (ignorar hora)
        const registroDate = new Date(
          fechaDate.getFullYear(),
          fechaDate.getMonth(),
          fechaDate.getDate()
        );

        switch (periodFilterSolicitudes) {
          case "hoy":
            return registroDate.getTime() === today.getTime();
          case "esta-semana": {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return registroDate >= startOfWeek && registroDate <= today;
          }
          case "este-mes": {
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
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

    // Filtro por búsqueda
    if (searchSolicitudes) {
      const search = searchSolicitudes.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.concepto || "").toLowerCase().includes(search) ||
          (s.notas || "").toLowerCase().includes(search)
      );
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortBySolicitudes) {
      case "fecha-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.timestamp?.toDate?.() || 0) -
            new Date(b.timestamp?.toDate?.() || 0)
        );
        break;
      case "fecha-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.timestamp?.toDate?.() || 0) -
            new Date(a.timestamp?.toDate?.() || 0)
        );
        break;
      case "monto-asc":
        sorted.sort((a, b) => a.monto - b.monto);
        break;
      case "monto-desc":
        sorted.sort((a, b) => b.monto - a.monto);
        break;
      default:
        break;
    }

    return sorted;
  }, [
    solicitudes,
    searchSolicitudes,
    sortBySolicitudes,
    periodFilterSolicitudes,
  ]);

  // Paginación para solicitudes
  const solicitudesPaginadas = useMemo(() => {
    const start = pageSolicitudes * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return solicitudesFiltradas.slice(start, end);
  }, [solicitudesFiltradas, pageSolicitudes]);

  const totalPagesSolicitudes = Math.ceil(
    solicitudesFiltradas.length / ITEMS_PER_PAGE
  );

  // Filtrado y ordenamiento para historial
  const historialFiltrado = useMemo(() => {
    let filtered = historial;

    // Filtro por subtab (flota vs conductores)
    if (subtabHistorialValue === 0) {
      // Recargas a Flota - excluir recargas a conductores
      filtered = filtered.filter(
        (h) => !h.concepto || !h.concepto.toLowerCase().includes("conductor")
      );
    } else if (subtabHistorialValue === 1) {
      // Recargas a Conductores
      filtered = filtered.filter(
        (h) => h.concepto && h.concepto.toLowerCase().includes("conductor")
      );
    }

    // Filtro por período
    if (periodFilterHistorial !== "todos") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((h) => {
        if (!h.timestamp && !h.fechaRegistro) return false;

        // Usar timestamp o fechaRegistro
        let fechaDate;
        const fecha = h.timestamp || h.fechaRegistro;
        if (fecha?.toDate && typeof fecha.toDate === "function") {
          fechaDate = fecha.toDate();
        } else if (typeof fecha === "string") {
          fechaDate = new Date(fecha);
        } else if (fecha instanceof Date) {
          fechaDate = fecha;
        } else if (fecha?.seconds) {
          fechaDate = new Date(fecha.seconds * 1000);
        } else {
          return false;
        }

        // Obtener solo la fecha (ignorar hora)
        const registroDate = new Date(
          fechaDate.getFullYear(),
          fechaDate.getMonth(),
          fechaDate.getDate()
        );

        switch (periodFilterHistorial) {
          case "hoy":
            return registroDate.getTime() === today.getTime();
          case "esta-semana": {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return registroDate >= startOfWeek && registroDate <= today;
          }
          case "este-mes": {
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
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

    // Filtro por búsqueda
    if (searchHistorial) {
      const search = searchHistorial.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          (h.concepto || "").toLowerCase().includes(search) ||
          (h.tipo || "").toLowerCase().includes(search)
      );
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByHistorial) {
      case "fecha-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.fechaRegistro || 0) - new Date(b.fechaRegistro || 0)
        );
        break;
      case "fecha-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0)
        );
        break;
      case "monto-asc":
        sorted.sort((a, b) => a.monto - b.monto);
        break;
      case "monto-desc":
        sorted.sort((a, b) => b.monto - a.monto);
        break;
      default:
        break;
    }

    return sorted;
  }, [historial, searchHistorial, sortByHistorial, periodFilterHistorial, subtabHistorialValue]);

  // Paginación para historial
  const historialPaginado = useMemo(() => {
    const start = pageHistorial * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return historialFiltrado.slice(start, end);
  }, [historialFiltrado, pageHistorial]);

  const totalPagesHistorial = Math.ceil(
    historialFiltrado.length / ITEMS_PER_PAGE
  );

  // Filtrado y ordenamiento para solicitudes de conductores
  const solicitudesConductoresFiltradas = useMemo(() => {
    let filtered = solicitudesConductores;

    // Filtro por estado
    if (filterEstadoConductores !== "todas") {
      filtered = filtered.filter((s) => s.estado === filterEstadoConductores);
    }

    // Filtro por búsqueda
    if (searchSolicitudesConductores) {
      const search = searchSolicitudesConductores.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.conductorNombre || "").toLowerCase().includes(search) ||
          (s.referencia || "").toLowerCase().includes(search)
      );
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortBySolicitudesConductores) {
      case "fecha-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.timestamp?.toDate?.() || 0) -
            new Date(b.timestamp?.toDate?.() || 0)
        );
        break;
      case "fecha-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.timestamp?.toDate?.() || 0) -
            new Date(a.timestamp?.toDate?.() || 0)
        );
        break;
      case "monto-asc":
        sorted.sort((a, b) => a.monto - b.monto);
        break;
      case "monto-desc":
        sorted.sort((a, b) => b.monto - a.monto);
        break;
      default:
        break;
    }

    return sorted;
  }, [
    solicitudesConductores,
    searchSolicitudesConductores,
    filterEstadoConductores,
    sortBySolicitudesConductores,
  ]);

  // Paginación para solicitudes de conductores
  const solicitudesConductoresPaginadas = useMemo(() => {
    const start = pageSolicitudesConductores * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return solicitudesConductoresFiltradas.slice(start, end);
  }, [solicitudesConductoresFiltradas, pageSolicitudesConductores]);

  const totalPagesSolicitudesConductores = Math.ceil(
    solicitudesConductoresFiltradas.length / ITEMS_PER_PAGE
  );

  if (!flotaId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes asociada una flota. Contacta al administrador.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={6}
        sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 1, fontWeight: 700, color: "#000000" }}
        >
          💳 Mi Billetera
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#666", mb: 3, fontFamily: "Mulish, sans-serif" }}
        >
          Gestiona tu saldo y solicitudes de recarga
        </Typography>

        {/* Tarjeta de Saldo Disponible */}
        <Paper
          key={`saldo-${saldoActual}`}
          elevation={3}
          sx={{
            mb: 4,
            p: 3,
            background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
            borderRadius: 2,
            color: "#fff",
            maxWidth: "500px",
            width: "fit-content",
          }}
        >
          <Typography
            variant="body2"
            sx={{ opacity: 0.9, mb: 1, fontFamily: "Mulish, sans-serif" }}
          >
            Saldo Disponible de la Flota
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, fontFamily: "Mulish, sans-serif", color: "#fff" }}
          >
            Bs. {(typeof saldoActual === 'number' && saldoActual !== undefined ? saldoActual : 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
          </Typography>
        </Paper>

        {/* Botones para nueva solicitud y QR */}
        <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAbrirModal}
            sx={{
              backgroundColor: "#d7171a",
              color: "white",
              fontWeight: 600,
              fontFamily: "Mulish, sans-serif",
              "&:hover": { backgroundColor: "#b01217" },
            }}
          >
            Solicitar Recarga
          </Button>

          <Button
            variant="contained"
            startIcon={<QrCodeIcon />}
            onClick={handleOpenQrModal}
            sx={{
              background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
              color: "#fff",
              fontWeight: 600,
              fontFamily: "Mulish, sans-serif",
              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(76, 175, 80, 0.4)",
              },
            }}
          >
            Mi QR
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 2, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                color: "#484848",
                "&.Mui-selected": {
                  color: "#d7171a",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#d7171a",
              },
            }}
          >
            <Tab label="📋 Mis Solicitudes" />
            <Tab label="👥 Solicitudes de Conductores" />
          </Tabs>
        </Box>

        {/* TAB 1: SOLICITUDES */}
        {tabValue === 0 && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <TableToolbar
                  searchValue={searchSolicitudes}
                  onSearchChange={setSearchSolicitudes}
                  sortValue={sortBySolicitudes}
                  onSortChange={setSortBySolicitudes}
                  sortOptions={[
                    { label: "↑ Fecha (Más antigua)", value: "fecha-asc" },
                    { label: "↓ Fecha (Más reciente)", value: "fecha-desc" },
                    { label: "↑ Monto (Menor)", value: "monto-asc" },
                    { label: "↓ Monto (Mayor)", value: "monto-desc" },
                  ]}
                  visibleColumns={visibleColumnsSolicitudes}
                  onColumnChange={(col, visible) =>
                    setVisibleColumnsSolicitudes((prev) => ({
                      ...prev,
                      [col]: visible,
                    }))
                  }
                />
              </Box>
              <DateFilterComponent
                onFilterChange={setPeriodFilterSolicitudes}
                currentDateFilter={periodFilterSolicitudes}
              />
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table stickyHeader>
                <TableHead sx={{ backgroundColor: "#000000" }}>
                  <TableRow>
                    {visibleColumnsSolicitudes.fecha && (
                      <TableCell
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Fecha
                      </TableCell>
                    )}
                    {visibleColumnsSolicitudes.monto && (
                      <TableCell
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Monto
                      </TableCell>
                    )}
                    {visibleColumnsSolicitudes.concepto && (
                      <TableCell
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Concepto
                      </TableCell>
                    )}
                    {visibleColumnsSolicitudes.estado && (
                      <TableCell
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Estado
                      </TableCell>
                    )}
                    {visibleColumnsSolicitudes.notas && (
                      <TableCell
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Notas
                      </TableCell>
                    )}
                    {visibleColumnsSolicitudes.comprobante && (
                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "#000000",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "Mulish, sans-serif",
                          fontSize: "0.95rem",
                        }}
                      >
                        Comprobante
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solicitudesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography
                          sx={{
                            py: 3,
                            color: "#484848",
                            fontFamily: "Mulish, sans-serif",
                          }}
                        >
                          No hay solicitudes de recarga
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    solicitudesPaginadas.map((solicitud) => (
                      <TableRow
                        key={solicitud.id}
                        sx={{ borderBottom: "1px solid #d0d0d0" }}
                      >
                        {visibleColumnsSolicitudes.fecha && (
                          <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              {/* Fecha Solicitud */}
                              <Box>
                                <Typography variant="caption" sx={{ color: "#666", fontSize: "0.75rem" }}>
                                  Solicitado:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {(() => {
                                    if (!solicitud.fechaSolicitud) return "N/A";
                                    let date;
                                    if (solicitud.fechaSolicitud?.toDate && typeof solicitud.fechaSolicitud.toDate === 'function') {
                                      date = solicitud.fechaSolicitud.toDate();
                                    } else if (typeof solicitud.fechaSolicitud === 'string') {
                                      date = new Date(solicitud.fechaSolicitud);
                                    } else if (solicitud.fechaSolicitud instanceof Date) {
                                      date = solicitud.fechaSolicitud;
                                    } else if (solicitud.fechaSolicitud?.seconds) {
                                      date = new Date(solicitud.fechaSolicitud.seconds * 1000);
                                    } else {
                                      return "N/A";
                                    }
                                    return date.toLocaleString("es-ES", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    });
                                  })()}
                                </Typography>
                              </Box>

                              {/* Fecha Aprobación */}
                              {solicitud.fechaAprobacion && (
                                <Box>
                                  <Typography variant="caption" sx={{ color: "#666", fontSize: "0.75rem" }}>
                                    Aprobado:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {(() => {
                                      let date;
                                      if (solicitud.fechaAprobacion?.toDate && typeof solicitud.fechaAprobacion.toDate === 'function') {
                                        date = solicitud.fechaAprobacion.toDate();
                                      } else if (typeof solicitud.fechaAprobacion === 'string') {
                                        date = new Date(solicitud.fechaAprobacion);
                                      } else if (solicitud.fechaAprobacion instanceof Date) {
                                        date = solicitud.fechaAprobacion;
                                      } else if (solicitud.fechaAprobacion?.seconds) {
                                        date = new Date(solicitud.fechaAprobacion.seconds * 1000);
                                      } else {
                                        return "N/A";
                                      }
                                      return date.toLocaleString("es-ES", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      });
                                    })()}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                        )}
                        {visibleColumnsSolicitudes.monto && (
                          <TableCell
                            sx={{
                              fontFamily: "Mulish, sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            $
                            {(() => {
                              const montoNumerico = typeof solicitud.monto === 'string'
                                ? parseFloat(solicitud.monto.replace(' BOB', '').replace(',', '.'))
                                : parseFloat(solicitud.monto);
                              return isNaN(montoNumerico) ? "N/A" : montoNumerico.toLocaleString("es-ES", {
                                minimumFractionDigits: 2,
                              });
                            })()}
                          </TableCell>
                        )}
                        {visibleColumnsSolicitudes.concepto && (
                          <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                            {solicitud.concepto}
                          </TableCell>
                        )}
                        {visibleColumnsSolicitudes.estado && (
                          <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                            <Chip
                              label={getEstadoLabel(solicitud.estado)}
                              size="small"
                              sx={{
                                bgcolor:
                                  solicitud.estado === "aprobada"
                                    ? "#4caf50"
                                    : solicitud.estado === "rechazada"
                                      ? "#f44336"
                                      : "#ffc107",
                                color: "#fff",
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                        )}
                        {visibleColumnsSolicitudes.notas && (
                          <TableCell
                            sx={{
                              fontFamily: "Mulish, sans-serif",
                              fontSize: "0.9rem",
                            }}
                          >
                            {solicitud.estado === "rechazada" &&
                            solicitud.razonRechazo
                              ? `Rechazada: ${solicitud.razonRechazo}`
                              : solicitud.notas || "-"}
                          </TableCell>
                        )}
                        {visibleColumnsSolicitudes.comprobante && (
                          <TableCell align="center">
                            {solicitud.comprobanteUrl ? (
                              <Tooltip title="Ver comprobante">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setComprobanteExpandidoUrl(
                                      solicitud.comprobanteUrl
                                    );
                                    setComprobanteExpandidoOpen(true);
                                  }}
                                  sx={{
                                    bgcolor: "#e3f2fd",
                                    color: "#1976d2",
                                    "&:hover": { bgcolor: "#bbdefb" },
                                  }}
                                >
                                  <ImageIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#999",
                                  fontFamily: "Mulish, sans-serif",
                                }}
                              >
                                Sin comprobante
                              </Typography>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {solicitudesFiltradas.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 2,
                  gap: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "Mulish, sans-serif" }}
                >
                  Mostrando {pageSolicitudes * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(
                    (pageSolicitudes + 1) * ITEMS_PER_PAGE,
                    solicitudesFiltradas.length
                  )}{" "}
                  de {solicitudesFiltradas.length}
                </Typography>
                <Pagination
                  count={totalPagesSolicitudes}
                  page={pageSolicitudes + 1}
                  onChange={(e, page) => setPageSolicitudes(page - 1)}
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
          </>
        )}

        {/* TAB 2: SOLICITUDES DE CONDUCTORES */}
        {tabValue === 1 && (
          <>
            
            
            {/* Barra de herramientas con filtros y búsqueda */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <TableToolbar
                  searchValue={searchSolicitudesConductores}
                  onSearchChange={setSearchSolicitudesConductores}
                  sortValue={sortBySolicitudesConductores}
                  onSortChange={setSortBySolicitudesConductores}
                  sortOptions={[
                    { label: "Fecha más reciente", value: "fecha-desc" },
                    { label: "Fecha más antigua", value: "fecha-asc" },
                    { label: "Monto menor", value: "monto-asc" },
                    { label: "Monto mayor", value: "monto-desc" },
                  ]}
                  placeholder="Buscar por conductor o referencia..."
                />
              </Box>
              
              {/* Filtro por estado */}
              <Box sx={{ minWidth: 200 }}>
                <TextField
                  select
                  label="Estado"
                  value={filterEstadoConductores}
                  onChange={(e) => setFilterEstadoConductores(e.target.value)}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="aprobada">Aprobada</MenuItem>
                  <MenuItem value="rechazada">Rechazada</MenuItem>
                </TextField>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table stickyHeader>
                <TableHead sx={{ backgroundColor: "#000000" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        backgroundColor: "#000000",
                        color: "white",
                        fontWeight: 700,
                        fontFamily: "Mulish, sans-serif",
                      }}
                    >
                      Conductor
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#000000",
                        color: "white",
                        fontWeight: 700,
                        fontFamily: "Mulish, sans-serif",
                      }}
                    >
                      Monto
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#000000",
                        color: "white",
                        fontWeight: 700,
                        fontFamily: "Mulish, sans-serif",
                      }}
                    >
                      Referencia
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#000000",
                        color: "white",
                        fontWeight: 700,
                        fontFamily: "Mulish, sans-serif",
                      }}
                    >
                      Estado
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#000000",
                        color: "white",
                        fontWeight: 700,
                        fontFamily: "Mulish, sans-serif",
                      }}
                    >
                      Fecha
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor: "#000000",
                        color: "white",
                        fontWeight: 700,
                        fontFamily: "Mulish, sans-serif",
                      }}
                    >
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solicitudesConductoresFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography
                          sx={{
                            py: 3,
                            color: "#484848",
                            fontFamily: "Mulish, sans-serif",
                          }}
                        >
                          No hay solicitudes de conductores
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    solicitudesConductoresPaginadas.map((solicitud) => (
                      <TableRow key={solicitud.id} hover>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {solicitud.conductorNombre || "Conductor"}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Mulish, sans-serif",
                            fontWeight: 700,
                            color: "#d7171a",
                          }}
                        >
                          $
                          {(() => {
                            const montoNumerico = typeof solicitud.monto === 'string'
                              ? parseFloat(solicitud.monto.replace(' BOB', '').replace(',', '.'))
                              : parseFloat(solicitud.monto);
                            return isNaN(montoNumerico) ? "N/A" : montoNumerico.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                            });
                          })()}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {solicitud.referencia || "-"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getEstadoLabel(solicitud.estado)}
                            size="small"
                            sx={{
                              bgcolor:
                                solicitud.estado === "aprobada"
                                  ? "#4caf50"
                                  : solicitud.estado === "rechazada"
                                    ? "#f44336"
                                    : "#ff9800",
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {/* Timestamp (Fecha Solicitud) */}
                            <Box>
                              <Typography variant="caption" sx={{ color: "#666", fontSize: "0.75rem" }}>
                                Solicitado:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {(() => {
                                  if (!solicitud.timestamp) return "N/A";
                                  let date;
                                  if (solicitud.timestamp?.toDate && typeof solicitud.timestamp.toDate === 'function') {
                                    date = solicitud.timestamp.toDate();
                                  } else if (typeof solicitud.timestamp === 'string') {
                                    date = new Date(solicitud.timestamp);
                                  } else if (solicitud.timestamp instanceof Date) {
                                    date = solicitud.timestamp;
                                  } else if (solicitud.timestamp?.seconds) {
                                    date = new Date(solicitud.timestamp.seconds * 1000);
                                  } else {
                                    return "N/A";
                                  }
                                  return date.toLocaleString("es-ES", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  });
                                })()}
                              </Typography>
                            </Box>

                            {/* Fecha Aprobación o Rechazo */}
                            {(solicitud.fechaAprobacion || solicitud.fechaRechazo) && (
                              <Box>
                                <Typography variant="caption" sx={{ color: "#666", fontSize: "0.75rem" }}>
                                  {solicitud.fechaAprobacion ? "Aprobado:" : "Rechazado:"}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {(() => {
                                    const fecha = solicitud.fechaAprobacion || solicitud.fechaRechazo;
                                    let date;
                                    if (fecha?.toDate && typeof fecha.toDate === 'function') {
                                      date = fecha.toDate();
                                    } else if (typeof fecha === 'string') {
                                      date = new Date(fecha);
                                    } else if (fecha instanceof Date) {
                                      date = fecha;
                                    } else if (fecha?.seconds) {
                                      date = new Date(fecha.seconds * 1000);
                                    } else {
                                      return "N/A";
                                    }
                                    return date.toLocaleString("es-ES", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    });
                                  })()}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleVerInfoSolicitud(solicitud)}
                              sx={{
                                bgcolor: "#e3f2fd",
                                color: "#1976d2",
                                "&:hover": { bgcolor: "#bbdefb" },
                                mr: 1,
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                          {solicitud.comprobanteUrl ? (
                            <Tooltip title="Ver comprobante">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setComprobanteExpandidoUrl(
                                    solicitud.comprobanteUrl
                                  );
                                  setComprobanteExpandidoOpen(true);
                                }}
                                sx={{ color: "#1976d2", mr: 1 }}
                              >
                                <ImageIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Sin comprobante adjunto">
                              <IconButton
                                size="small"
                                disabled
                                sx={{ color: "#ccc", mr: 1 }}
                              >
                                <ImageIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {solicitud.estado === "pendiente" && (
                            <>
                              <Tooltip title="Aprobar">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleAbrirValidacion(solicitud)
                                  }
                                  sx={{
                                    bgcolor: "#e8f5e8",
                                    color: "#2e7d32",
                                    "&:hover": { bgcolor: "#c8e6c9" },
                                    mr: 1,
                                  }}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rechazar">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleAbrirValidacion(solicitud)
                                  }
                                  sx={{
                                    bgcolor: "#ffebee",
                                    color: "#d32f2f",
                                    "&:hover": { bgcolor: "#ffcdd2" },
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Paginación */}
            {solicitudesConductoresFiltradas.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 3,
                  gap: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "Mulish, sans-serif" }}
                >
                  Mostrando {pageSolicitudesConductores * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(
                    (pageSolicitudesConductores + 1) * ITEMS_PER_PAGE,
                    solicitudesConductoresFiltradas.length
                  )}{" "}
                  de {solicitudesConductoresFiltradas.length}
                </Typography>
                <Pagination
                  count={totalPagesSolicitudesConductores}
                  page={pageSolicitudesConductores + 1}
                  onChange={(event, page) =>
                    setPageSolicitudesConductores(page - 1)
                  }
                  color="standard"
                  variant="outlined"
                />
              </Box>
            )}
          </>
        )}

        {/* MODAL NUEVA SOLICITUD */}
        <Dialog
          open={modalOpen}
          onClose={handleModalClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}
          >
            Solicitar Recarga
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {/* Mostrar QR del SuperAdmin si existe */}
            {superAdminQr && (
              <Box
                sx={{
                  mb: 3,
                  textAlign: "center",
                  p: 2,
                  bgcolor: "#f5f5f5",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: "#666",
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  📱 Realiza la transferencia escaneando este QR:
                </Typography>
                <Box
                  component="img"
                  src={superAdminQr}
                  alt="QR SuperAdmin"
                  onClick={() => setQrExpandedOpen(true)}
                  sx={{
                    maxWidth: "250px",
                    maxHeight: "250px",
                    border: "3px solid #d7171a",
                    borderRadius: 2,
                    objectFit: "contain",
                    cursor: "pointer",
                  }}
                />
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL NUEVA SOLICITUD */}
        <Dialog
          open={modalOpen}
          onClose={handleModalClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}
          >
            Solicitar Recarga
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {/* Mostrar QR del SuperAdmin si existe */}
            {superAdminQr && (
              <Box
                sx={{
                  mb: 3,
                  textAlign: "center",
                  p: 2,
                  bgcolor: "#f5f5f5",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: "#666",
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  📱 Realiza la transferencia escaneando este QR:
                </Typography>
                <Box
                  component="img"
                  src={superAdminQr}
                  alt="QR SuperAdmin"
                  onClick={() => setQrExpandedOpen(true)}
                  sx={{
                    maxWidth: "250px",
                    maxHeight: "250px",
                    border: "3px solid #d7171a",
                    borderRadius: 2,
                    objectFit: "contain",
                    boxShadow: "0 4px 12px rgba(215, 23, 26, 0.2)",
                    mx: "auto",
                    display: "block",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: "0 6px 20px rgba(215, 23, 26, 0.3)",
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1.5,
                    color: "#999",
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  Haz clic en el QR para expandir • Después de realizar la
                  transferencia, completa el formulario abajo
                </Typography>
                {superAdminQrUpdatedAt && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      color: "#999",
                      fontStyle: "italic",
                      fontFamily: "Mulish, sans-serif",
                    }}
                  >
                    Última edición:{" "}
                    {superAdminQrUpdatedAt
                      ? new Date(superAdminQrUpdatedAt).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </Typography>
                )}
              </Box>
            )}

            <TextField
              fullWidth
              label="Monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              inputProps={{ step: "0.01", min: "0" }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              sx={{ mb: 2 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="recarga">Recarga General</option>
              <option value="comisiones">Pago de Comisiones</option>
              <option value="incentivo">Incentivo</option>
              <option value="bonus">Bonus</option>
              <option value="otro">Otro</option>
            </TextField>
            <TextField
              fullWidth
              label="Notas (opcional)"
              multiline
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Transferencia realizada desde cuenta xxx-xxx"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Nro de Comprobante"
              value={nroComprobante}
              onChange={(e) => setNroComprobante(e.target.value)}
              placeholder="Ej: 123456789"
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 50 }}
            />

            {/* Sección de comprobante */}
            <Box
              sx={{
                p: 2,
                bgcolor: "#f5f5f5",
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: "#666",
                  fontWeight: 600,
                  fontFamily: "Mulish, sans-serif",
                }}
              >
                Comprobante de Pago
              </Typography>

              {comprobantePreview && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    component="img"
                    src={comprobantePreview}
                    alt="Preview Comprobante"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      border: "2px solid #d7171a",
                      borderRadius: 2,
                      objectFit: "contain",
                      boxShadow: "0 4px 12px rgba(215, 23, 26, 0.2)",
                    }}
                  />
                </Box>
              )}

              <input
                accept="image/*"
                style={{ display: "none" }}
                id="comprobante-upload"
                type="file"
                onChange={handleComprobanteChange}
              />
              <label htmlFor="comprobante-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    borderColor: "#d7171a",
                    color: "#d7171a",
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
                    px: 3,
                    py: 1,
                    "&:hover": {
                      borderColor: "#b01217",
                      backgroundColor: "rgba(215, 23, 26, 0.04)",
                    },
                  }}
                >
                  {comprobanteImage
                    ? "Cambiar Comprobante"
                    : "Subir Comprobante"}
                </Button>
              </label>

              {comprobanteImage && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    color: "#666",
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  {comprobanteImage.name} (
                  {(comprobanteImage.size / 1024).toFixed(2)} KB)
                </Typography>
              )}

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1,
                  color: "#999",
                  fontFamily: "Mulish, sans-serif",
                }}
              >
                Formatos: JPG, PNG, GIF (Máx. 5MB)
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleModalClose}
              sx={{ fontFamily: "Mulish, sans-serif" }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitSolicitud}
              variant="contained"
              disabled={submitting}
              sx={{
                backgroundColor: "#d7171a",
                fontFamily: "Mulish, sans-serif",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#b01217" },
              }}
            >
              {submitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL QR DE LA FLOTA */}
        <Dialog
          open={qrModalOpen}
          onClose={handleCloseQrModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
              color: "#fff",
              fontWeight: 700,
              fontFamily: "Mulish, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <QrCodeIcon />
            Mi Código QR
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {/* Mostrar QR actual si existe */}
            {currentQrUrl && !qrImagePreview && (
              <Box sx={{ mb: 3, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: "#666",
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  QR Actual:
                </Typography>
                <Box
                  component="img"
                  src={currentQrUrl}
                  alt="QR Actual"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    border: "2px solid #e0e0e0",
                    borderRadius: 2,
                    objectFit: "contain",
                  }}
                />
                {qrUpdatedAt && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 1,
                      color: "#999",
                      fontStyle: "italic",
                      fontFamily: "Mulish, sans-serif",
                    }}
                  >
                    Última edición:{" "}
                    {qrUpdatedAt
                      ? new Date(qrUpdatedAt).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </Typography>
                )}
              </Box>
            )}

            {/* Preview de nueva imagen */}
            {qrImagePreview && (
              <Box sx={{ mb: 3, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    color: "#666",
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  Vista Previa:
                </Typography>
                <Box
                  component="img"
                  src={qrImagePreview}
                  alt="Preview"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    border: "2px solid #4caf50",
                    borderRadius: 2,
                    objectFit: "contain",
                    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)",
                  }}
                />
              </Box>
            )}

            {/* Botón de selección de archivo */}
            <Box sx={{ textAlign: "center" }}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="qr-image-upload-flota"
                type="file"
                onChange={handleQrImageChange}
              />
              <label htmlFor="qr-image-upload-flota">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    borderColor: "#4caf50",
                    color: "#4caf50",
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
                    px: 3,
                    py: 1.5,
                    "&:hover": {
                      borderColor: "#388e3c",
                      backgroundColor: "rgba(76, 175, 80, 0.04)",
                    },
                  }}
                >
                  {qrImage ? "Cambiar Imagen" : "Seleccionar Imagen"}
                </Button>
              </label>

              {qrImage && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    color: "#666",
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  {qrImage.name} ({(qrImage.size / 1024).toFixed(2)} KB)
                </Typography>
              )}
            </Box>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 2,
                color: "#999",
                textAlign: "center",
                fontFamily: "Mulish, sans-serif",
              }}
            >
              Formatos aceptados: JPG, PNG, GIF (Máx. 5MB)
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={handleCloseQrModal}
              sx={{ color: "#666", fontFamily: "Mulish, sans-serif" }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitQr}
              variant="contained"
              disabled={!qrImage || uploadingQr}
              sx={{
                background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                color: "#fff",
                fontWeight: 600,
                fontFamily: "Mulish, sans-serif",
                px: 3,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)",
                },
                "&:disabled": {
                  background: "#e0e0e0",
                  color: "#999",
                },
              }}
            >
              {uploadingQr ? "Subiendo..." : "Guardar QR"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal Comprobante Expandido */}
        <Dialog
          open={comprobanteExpandidoOpen}
          onClose={() => setComprobanteExpandidoOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.9)",
              boxShadow: "none",
            },
          }}
        >
          <DialogContent
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              component="img"
              src={comprobanteExpandidoUrl}
              alt="Comprobante Expandido"
              sx={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 2,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "#fff",
                mt: 2,
                fontFamily: "Mulish, sans-serif",
              }}
            >
              Haz clic fuera de la imagen para cerrar
            </Typography>
          </DialogContent>
        </Dialog>

        {/* MODAL INFORMACIÓN DE SOLICITUD */}
        <Dialog
          open={infoSolicitudOpen}
          onClose={() => setInfoSolicitudOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontFamily: "Mulish, sans-serif",
              fontWeight: 700,
              color: "#d7171a",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <InfoIcon />
            Información Completa de la Solicitud
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {solicitudInfo && (
              <Box>
                {/* Información del Conductor */}
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: "#f8f9fa",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      color: "#d7171a",
                      fontFamily: "Mulish, sans-serif",
                    }}
                  >
                    👨‍💼 Información del Conductor
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 40, color: "#6c757d" }} />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        {solicitudInfo.conductorNombre}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ fontFamily: "Mulish, sans-serif" }}
                      >
                        ID: {solicitudInfo.conductorId}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Detalles de la Solicitud */}
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: "#f8f9fa",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      color: "#d7171a",
                      fontFamily: "Mulish, sans-serif",
                    }}
                  >
                    📝 Detalles de la Solicitud
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Monto Solicitado:
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: "#d7171a",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        $
                        {(() => {
                          const montoNumerico = typeof solicitudInfo.monto === 'string'
                            ? parseFloat(solicitudInfo.monto.replace(' BOB', '').replace(',', '.'))
                            : parseFloat(solicitudInfo.monto);
                          return isNaN(montoNumerico) ? "N/A" : montoNumerico.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          });
                        })()}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Estado:
                      </Typography>
                      <Chip
                        label={getEstadoLabel(solicitudInfo.estado)}
                        sx={{
                          bgcolor:
                            solicitudInfo.estado === "aprobada"
                              ? "#4caf50"
                              : solicitudInfo.estado === "rechazada"
                                ? "#f44336"
                                : "#ff9800",
                          color: "#fff",
                          fontWeight: 600,
                          fontFamily: "Mulish, sans-serif",
                        }}
                      />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Referencia/Comprobante:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: "Mulish, sans-serif" }}
                      >
                        {solicitudInfo.referencia || "Sin referencia"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Fecha de Solicitud:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: "Mulish, sans-serif" }}
                      >
                        {(() => {
                          if (!solicitudInfo.timestamp) return "N/A";
                          let date;
                          if (solicitudInfo.timestamp?.toDate && typeof solicitudInfo.timestamp.toDate === 'function') {
                            date = solicitudInfo.timestamp.toDate();
                          } else if (typeof solicitudInfo.timestamp === 'string') {
                            date = new Date(solicitudInfo.timestamp);
                          } else if (solicitudInfo.timestamp instanceof Date) {
                            date = solicitudInfo.timestamp;
                          } else if (solicitudInfo.timestamp?.seconds) {
                            date = new Date(solicitudInfo.timestamp.seconds * 1000);
                          } else {
                            return "N/A";
                          }
                          return date.toLocaleString("es-ES");
                        })()}
                      </Typography>
                    </Box>
                  </Box>

                  {solicitudInfo.notas && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Notas Adicionales:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "Mulish, sans-serif",
                          fontStyle: "italic",
                        }}
                      >
                        {solicitudInfo.notas}
                      </Typography>
                    </Box>
                  )}

                  {solicitudInfo.descripcion && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Descripción:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        {solicitudInfo.descripcion}
                      </Typography>
                    </Box>
                  )}

                  {solicitudInfo.etiqueta && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Etiqueta:
                      </Typography>
                      <Chip
                        label={solicitudInfo.etiqueta}
                        variant="outlined"
                        sx={{ fontFamily: "Mulish, sans-serif" }}
                      />
                    </Box>
                  )}

                  {solicitudInfo.solicitudId && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        ID de Solicitud:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "Mulish, sans-serif",
                          wordBreak: "break-all",
                        }}
                      >
                        {solicitudInfo.solicitudId}
                      </Typography>
                    </Box>
                  )}

                  {solicitudInfo.iniciador && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Iniciador:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        {solicitudInfo.iniciador}
                      </Typography>
                    </Box>
                  )}

                  {solicitudInfo.timestamp && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Timestamp:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        {solicitudInfo.timestamp ? (typeof solicitudInfo.timestamp.toDate === 'function' ? solicitudInfo.timestamp.toDate().toLocaleString("es-ES") : new Date(solicitudInfo.timestamp).toLocaleString("es-ES")) : "N/A"}
                      </Typography>
                    </Box>
                  )}

                  {solicitudInfo.fechaAprobacion && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#495057",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Fecha de Aprobación:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        {solicitudInfo.fechaAprobacion ? (typeof solicitudInfo.fechaAprobacion.toDate === 'function' ? solicitudInfo.fechaAprobacion.toDate().toLocaleString("es-ES") : new Date(solicitudInfo.fechaAprobacion).toLocaleString("es-ES")) : "N/A"}
                      </Typography>
                    </Box>
                  )}

                  {solicitudInfo.motivoRechazo && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#ffebee",
                        borderRadius: 1,
                        border: "1px solid #ffcdd2",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#d32f2f",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Motivo del Rechazo:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "Mulish, sans-serif",
                          color: "#d32f2f",
                        }}
                      >
                        {solicitudInfo.motivoRechazo}
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Comprobante */}
                {solicitudInfo.comprobanteUrl && (
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "#f8f9fa",
                      border: "1px solid #e9ecef",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: "#d7171a",
                        fontFamily: "Mulish, sans-serif",
                      }}
                    >
                      📎 Comprobante de Pago
                    </Typography>
                    <Box sx={{ textAlign: "center" }}>
                      <Box
                        component="img"
                        src={solicitudInfo.comprobanteUrl}
                        alt="Comprobante"
                        sx={{
                          maxWidth: "100%",
                          maxHeight: "300px",
                          border: "2px solid #d7171a",
                          borderRadius: 2,
                          objectFit: "contain",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(215, 23, 26, 0.2)",
                        }}
                        onClick={() => {
                          setComprobanteExpandidoUrl(
                            solicitudInfo.comprobanteUrl
                          );
                          setComprobanteExpandidoOpen(true);
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mt: 1,
                          color: "#6c757d",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Haz clic en la imagen para verla en tamaño completo
                      </Typography>
                    </Box>
                  </Paper>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setInfoSolicitudOpen(false)}
              variant="contained"
              sx={{
                bgcolor: "#d7171a",
                color: "white",
                fontFamily: "Mulish, sans-serif",
                fontWeight: 600,
                "&:hover": { bgcolor: "#b01217" },
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL VALIDACIÓN DE SOLICITUDES */}
        <Dialog
          open={validacionOpen}
          onClose={handleCerrarValidacion}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontFamily: "Mulish, sans-serif",
              fontWeight: 700,
              color: "#d7171a",
            }}
          >
            Validar Solicitud de Recarga
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {solicitudSeleccionada && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    p: 2,
                    bgcolor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40, color: "#d7171a" }} />
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, fontFamily: "Mulish, sans-serif" }}
                    >
                      {solicitudSeleccionada.conductorNombre}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ fontFamily: "Mulish, sans-serif" }}
                    >
                      ID: {solicitudSeleccionada.conductorId}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ mb: 2, fontFamily: "Mulish, sans-serif" }}
                >
                  <strong>Monto solicitado:</strong> $
                  {(() => {
                    const montoNumerico = typeof solicitudSeleccionada.monto === 'string'
                      ? parseFloat(solicitudSeleccionada.monto.replace(' BOB', '').replace(',', '.'))
                      : parseFloat(solicitudSeleccionada.monto);
                    return isNaN(montoNumerico) ? "N/A" : montoNumerico.toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                    });
                  })()}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mb: 2, fontFamily: "Mulish, sans-serif" }}
                >
                  <strong>Referencia:</strong>{" "}
                  {solicitudSeleccionada.referencia || "Sin referencia"}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mb: 2, fontFamily: "Mulish, sans-serif" }}
                >
                  <strong>Fecha de solicitud:</strong>{" "}
                  {solicitudSeleccionada.fechaSolicitud
                    ? (typeof solicitudSeleccionada.fechaSolicitud.toDate === 'function'
                        ? solicitudSeleccionada.fechaSolicitud.toDate().toLocaleString("es-ES")
                        : new Date(solicitudSeleccionada.fechaSolicitud).toLocaleString("es-ES"))
                    : "N/A"}
                </Typography>

                {solicitudSeleccionada.comprobanteUrl && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontFamily: "Mulish, sans-serif" }}
                    >
                      <strong>Comprobante:</strong>
                    </Typography>
                    <Box
                      component="img"
                      src={solicitudSeleccionada.comprobanteUrl}
                      alt="Comprobante"
                      sx={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        border: "2px solid #d7171a",
                        borderRadius: 1,
                        objectFit: "contain",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setComprobanteExpandidoUrl(
                          solicitudSeleccionada.comprobanteUrl
                        );
                        setComprobanteExpandidoOpen(true);
                      }}
                    />
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Motivo del rechazo (opcional para aprobar, requerido para rechazar)"
                  multiline
                  rows={3}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Explica el motivo si vas a rechazar la solicitud..."
                  sx={{ mt: 2, fontFamily: "Mulish, sans-serif" }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={handleCerrarValidacion}
              sx={{ fontFamily: "Mulish, sans-serif" }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRechazarSolicitud}
              variant="contained"
              disabled={procesando}
              sx={{
                bgcolor: "#f44336",
                color: "white",
                fontFamily: "Mulish, sans-serif",
                fontWeight: 600,
                "&:hover": { bgcolor: "#d32f2f" },
              }}
            >
              {procesando ? "Procesando..." : "Rechazar"}
            </Button>
            <Button
              onClick={handleAprobarSolicitud}
              variant="contained"
              disabled={procesando}
              sx={{
                bgcolor: "#4caf50",
                color: "white",
                fontFamily: "Mulish, sans-serif",
                fontWeight: 600,
                "&:hover": { bgcolor: "#388e3c" },
              }}
            >
              {procesando ? "Procesando..." : "Aprobar y Acreditar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>

        {/* MODAL QR EXPANDIDO */}
        <Dialog
          open={qrExpandedOpen}
          onClose={() => setQrExpandedOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.9)",
              boxShadow: "none",
            },
          }}
        >
          <DialogContent
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              component="img"
              src={superAdminQr}
              alt="QR SuperAdmin Expandido"
              sx={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 2,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "#fff",
                mt: 2,
                fontFamily: "Mulish, sans-serif",
              }}
            >
              Haz clic fuera de la imagen para cerrar
            </Typography>
            {superAdminQrUpdatedAt && (
              <Typography
                variant="caption"
                sx={{
                  color: "#fff",
                  mt: 1,
                  fontStyle: "italic",
                  fontFamily: "Mulish, sans-serif",
                  opacity: 0.8,
                }}
              >
                Última edición:{" "}
                {new Date(superAdminQrUpdatedAt).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL SALDO INSUFICIENTE */}
        <Dialog
          open={saldoInsuficienteOpen}
          onClose={() => setSaldoInsuficienteOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
              color: "#fff",
              fontWeight: 700,
              fontFamily: "Mulish, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: "2rem",
              }}
            >
              ⚠️
            </Box>
            Saldo Insuficiente
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  fontFamily: "Mulish, sans-serif",
                  color: "#333",
                }}
              >
                No tienes saldo suficiente
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  fontFamily: "Mulish, sans-serif",
                  color: "#666",
                }}
              >
                Para aprobar esta solicitud necesitas recargar saldo con el
                administrador de la aplicación.
              </Typography>

              <Box
                sx={{
                  p: 2,
                  bgcolor: "#fff3cd",
                  borderRadius: 2,
                  mb: 3,
                  border: "1px solid #ffc107",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Mulish, sans-serif",
                    color: "#856404",
                  }}
                >
                  <strong>Saldo actual:</strong> Bs. {saldoActual.toFixed(2)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Mulish, sans-serif",
                    color: "#856404",
                  }}
                >
                  <strong>Saldo faltante:</strong> Bs.{" "}
                  {montoFaltante.toFixed(2)}
                </Typography>
              </Box>

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontFamily: "Mulish, sans-serif",
                  color: "#999",
                  fontStyle: "italic",
                }}
              >
                Una vez recargado tu saldo, podrás aprobar solicitudes de tus
                conductores
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
            <Button
              onClick={() => setSaldoInsuficienteOpen(false)}
              sx={{
                fontFamily: "Mulish, sans-serif",
                color: "#666",
              }}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setSaldoInsuficienteOpen(false);
                handleAbrirModal();
              }}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                color: "#fff",
                fontWeight: 600,
                fontFamily: "Mulish, sans-serif",
                px: 3,
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)",
                },
              }}
            >
              Solicitar Recarga
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default BilleteraFlota;
