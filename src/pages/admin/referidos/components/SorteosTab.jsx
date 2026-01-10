import React, { useState, useEffect } from "react";
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
  TextField,
  CircularProgress,
  Chip,
  InputAdornment,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../../../../data/firebase/firebase";
import { storage } from "../../../../data/firebase/firebase";
import { useContext } from "react";
import { NotificationContext } from "../../../../context/NotificationContext";

const DEPARTAMENTOS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

const SorteosTab = () => {
  const { addNotification } = useContext(NotificationContext);
  const ITEMS_PER_PAGE = 10;
  
  // Estados para cupones
  const [loading, setLoading] = useState(true);
  
  // Estados para sorteos
  const [sorteos, setSorteos] = useState([]);

  const [sorteoSeleccionado, setSorteoSeleccionado] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // ID del sorteo que se está editando
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [nuevoSorteo, setNuevoSorteo] = useState({
    id: "", // ID único del sorteo
    descripcion: "",
    modo: "pasajero", // pasajero o trabajador
    fechaInicio: "",
    fechaFin: "",
    departamentos: [], // Departamentos donde estará disponible
    categorias: [], // Categorías aplicables
    imagenUrl: "", // URL de la imagen de promoción
  });
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [gananoresEstimados, setGanadores] = useState(null); // Ganadores calculados
  const [dialogoFinalizarOpen, setDialogoFinalizarOpen] = useState(false); // Diálogo para finalizar
  const [finalizandoSorteo, setFinalizandoSorteo] = useState(false);
  const [cantidadGanadores, setCantidadGanadores] = useState(3); // Cantidad de ganadores a mostrar
  const [tipoTabla, setTipoTabla] = useState("cupones"); // Nombre de la subcollection a mostrar
  const [subcoleccionesDisponibles, setSubcoleccionesDisponibles] = useState([]); // Subcollections que existen
  const [paginaSubcoleccion, setPaginaSubcoleccion] = useState(0); // Paginación por subcollection
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(0); // Index del tab de departamento seleccionado

  useEffect(() => {
    cargarSorteos();
    cargarCategorias();
  }, []);

  // Enriquecer participantes de trabajador cuando se selecciona
  useEffect(() => {
    if (
      sorteoSeleccionado && 
      sorteoSeleccionado.modo === "trabajador" && 
      sorteoSeleccionado.infoAdicional?.participantes &&
      sorteoSeleccionado.infoAdicional.participantes.length > 0
    ) {
      // Verificar si ya tienen código
      const necesitaEnriquecimiento = sorteoSeleccionado.infoAdicional.participantes.some(p => !p.codigoReferido);
      
      if (necesitaEnriquecimiento) {
        enriquecerParticipantesConCodigos(sorteoSeleccionado.id, sorteoSeleccionado.infoAdicional.participantes);
      }
    }
  }, [sorteoSeleccionado?.id, tipoTabla]);


  // Cargar lista de todos los sorteos (incluyendo sorteo_apertura)
  const cargarSorteos = async () => {
    try {
      setLoading(true);
      const sorteosRef = collection(db, "sorteos");
      const snapshot = await getDocs(sorteosRef);

      let sorteosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Si no existe modo en los sorteos, asignar modo por defecto
      sorteosData = sorteosData.map(sorteo => ({
        ...sorteo,
        modo: sorteo.modo || "pasajero",
        estado: sorteo.estado || "activo"
      }));

      // Cargar información adicional de subcolecciones
      sorteosData = await cargarInformacionAdicionalSorteos(sorteosData);

      setSorteos(sorteosData);

      // Si no hay sorteo seleccionado, seleccionar el primero o sorteo_apertura
      if (!sorteoSeleccionado && sorteosData.length > 0) {
        const sorteoApertura = sorteosData.find(s => s.id === "sorteo_apertura");
        const sorteoACargar = sorteoApertura || sorteosData[0];
        setSorteoSeleccionado(sorteoACargar);
        // Cargar información adicional del sorteo inicial
        if (sorteoACargar?.id) {
          setTimeout(() => cargarInfoSorteoSeleccionado(sorteoACargar.id), 100);
        }
      }
    } catch (error) {
      console.error("Error cargando sorteos:", error);
      addNotification({
        message: "Error al cargar los sorteos",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar carga de imagen
  const handleImagenChange = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validar que sea imagen
    if (!archivo.type.startsWith("image/")) {
      addNotification({
        message: "Por favor selecciona una imagen válida",
        type: "error",
      });
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagenPreview(e.target?.result);
    };
    reader.readAsDataURL(archivo);

    // Subir a Storage
    try {
      setImagenSubiendo(true);
      const nombreArchivo = `sorteos/${Date.now()}_${archivo.name}`;
      const storageRef = ref(storage, nombreArchivo);
      
      await uploadBytes(storageRef, archivo);
      const urlDescarga = await getDownloadURL(storageRef);
      
      setNuevoSorteo({ ...nuevoSorteo, imagenUrl: urlDescarga });
      
      addNotification({
        message: "Imagen subida exitosamente",
        type: "success",
      });
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      addNotification({
        message: "Error al subir la imagen",
        type: "error",
      });
    } finally {
      setImagenSubiendo(false);
    }
  };

  // Cargar categorías disponibles
  const cargarCategorias = async () => {
    try {
      // Categorías disponibles en el sistema
      const categoriasArray = [
        "Envios",
        "Viajes",
        "carga_internacional",
        "carga_local",
        "carga_nacional",
        "construccion",
        "maquinaria_y_gruas",
        "mudanza"
      ];
      setCategoriasDisponibles(categoriasArray);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  // Cargar información adicional de subcolecciones dentro de cada sorteo
  const cargarInformacionAdicionalSorteos = async (sorteosArray) => {
    try {
      // NO cargar todas las subcolecciones para todos los sorteos
      // Solo devolver los sorteos con referencias a subcolecciones vacías
      // Esto permite que la página cargue rápido
      const sorteosConInfo = sorteosArray.map((sorteo) => ({
        ...sorteo,
        infoAdicional: {}, // Vacío al inicio
        subcoleccionesDisponibles: []
      }));

      return sorteosConInfo;
    } catch (error) {
      console.error("Error en cargarInformacionAdicionalSorteos:", error);
      return sorteosArray.map((sorteo) => ({
        ...sorteo,
        infoAdicional: {},
        subcoleccionesDisponibles: []
      }));
    }
  };

  // Cargar información adicional del sorteo seleccionado (lazy loading)
  const cargarInfoSorteoSeleccionado = async (sorteoId) => {
    try {
      // Solo cargar las subcollections principales (más rápido)
      const subcoleccionesPrincipales = [
        "participantes",
        "cupones"
      ];

      let infoAdicional = {};
      let subcoleccionesEncontradas = [];

      // Cargar rápidamente solo las subcollections principales
      for (const nombreSubcoleccion of subcoleccionesPrincipales) {
        try {
          const subRef = collection(db, "sorteos", sorteoId, nombreSubcoleccion);
          const subSnap = await getDocs(subRef);
          
          if (subSnap.docs.length > 0) {
            infoAdicional[nombreSubcoleccion] = subSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            subcoleccionesEncontradas.push(nombreSubcoleccion);
            console.log(`✓ ${nombreSubcoleccion} cargados para ${sorteoId}:`, infoAdicional[nombreSubcoleccion].length);
          }
        } catch (e) {
          // Subcollection no existe, continuar
        }
      }

      console.log(`📊 ${sorteoId} tiene subcollections:`, subcoleccionesEncontradas);

      // Actualizar el sorteo seleccionado con la información adicional
      setSorteoSeleccionado(prev => prev && prev.id === sorteoId ? {
        ...prev,
        infoAdicional,
        subcoleccionesDisponibles: subcoleccionesEncontradas
      } : prev);

      // También actualizar en la lista de sorteos
      setSorteos(prev => prev.map(s => 
        s.id === sorteoId ? {
          ...s,
          infoAdicional,
          subcoleccionesDisponibles: subcoleccionesEncontradas
        } : s
      ));

      // Cargar subcollections adicionales en background (sin bloquear UI)
      setTimeout(() => cargarSubcoleccionesAdicionales(sorteoId), 500);
    } catch (error) {
      console.error("Error cargando info adicional para sorteo", sorteoId, error);
    }
  };

  // Enriquecer participantes con códigos de referido de forma optimizada
  const enriquecerParticipantesConCodigos = async (sorteoId, participantes) => {
    if (!participantes || participantes.length === 0) return participantes;

    try {
      // Solo enriquecer si hay participantes sin código
      const participantesParaEnriquecer = participantes.filter(p => !p.codigoReferido);
      if (participantesParaEnriquecer.length === 0) return participantes;

      const workerIds = participantesParaEnriquecer.map(p => p.uid).filter(Boolean);
      if (workerIds.length === 0) return participantes;

      // Consultar cupones que pertenezcan a estos workers específicamente
      const cuponesRef = collection(db, "cupones");
      const cuponesSnap = await getDocs(cuponesRef);
      
      const cuponesPorWorkerId = {};
      cuponesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.workerId && workerIds.includes(data.workerId)) {
          if (!cuponesPorWorkerId[data.workerId]) {
            cuponesPorWorkerId[data.workerId] = [];
          }
          cuponesPorWorkerId[data.workerId].push({
            codigo: doc.id,
            ...data
          });
        }
      });

      // Enriquecer participantes
      const participantesEnriquecidos = participantes.map(participante => ({
        ...participante,
        codigoReferido: participante.codigoReferido || (cuponesPorWorkerId[participante.uid]?.[0]?.codigo || "N/A")
      }));

      console.log("✓ Participantes enriquecidos con códigos de referido");
      
      // Actualizar el estado
      setSorteoSeleccionado(prev => {
        if (prev && prev.id === sorteoId && prev.infoAdicional.participantes) {
          return {
            ...prev,
            infoAdicional: {
              ...prev.infoAdicional,
              participantes: participantesEnriquecidos
            }
          };
        }
        return prev;
      });

      return participantesEnriquecidos;
    } catch (error) {
      console.error("Error enriqueciendo participantes con códigos:", error);
      return participantes;
    }
  };

  // Cargar subcollections adicionales sin bloquear la UI
  const cargarSubcoleccionesAdicionales = async (sorteoId) => {
    try {
      const subcoleccionesAdicionales = [
        "ganadores",
        "registros",
        "sorteo",
        "datos",
        "usuarios",
        "viajes",
        "trabajador",
        "trabajadores"
      ];

      let infoAdicional = {};
      let subcoleccionesEncontradas = [];

      for (const nombreSubcoleccion of subcoleccionesAdicionales) {
        try {
          const subRef = collection(db, "sorteos", sorteoId, nombreSubcoleccion);
          const subSnap = await getDocs(subRef);
          
          if (subSnap.docs.length > 0) {
            infoAdicional[nombreSubcoleccion] = subSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            subcoleccionesEncontradas.push(nombreSubcoleccion);
          }
        } catch (e) {
          // Continuar
        }
      }

      // Actualizar si aún es el mismo sorteo seleccionado
      setSorteoSeleccionado(prev => {
        if (prev && prev.id === sorteoId) {
          return {
            ...prev,
            infoAdicional: {
              ...prev.infoAdicional,
              ...infoAdicional
            },
            subcoleccionesDisponibles: [
              ...prev.subcoleccionesDisponibles,
              ...subcoleccionesEncontradas
            ]
          };
        }
        return prev;
      });
    } catch (error) {
      console.error("Error cargando subcollections adicionales para", sorteoId, error);
    }
  };

  const handleCrearSorteo = async () => {
    if (!nuevoSorteo.id.trim()) {
      addNotification({
        message: "Por favor ingresa un ID para el sorteo",
        type: "error",
      });
      return;
    }

    try {
      // Si no hay modo especificado, usar "pasajero" por defecto
      const modo = nuevoSorteo.modo || "pasajero";

      if (editandoId) {
        // Modo edición: actualizar sorteo existente
        await updateDoc(doc(db, "sorteos", editandoId), {
          descripcion: nuevoSorteo.descripcion,
          fechaInicio: nuevoSorteo.fechaInicio ? new Date(nuevoSorteo.fechaInicio) : null,
          fechaFin: nuevoSorteo.fechaFin ? new Date(nuevoSorteo.fechaFin) : null,
          departamentos: nuevoSorteo.departamentos || [],
          categorias: nuevoSorteo.categorias || [],
          imagenUrl: nuevoSorteo.imagenUrl || "",
        });

        addNotification({
          message: "Sorteo actualizado exitosamente",
          type: "success",
        });
      } else {
        // Modo creación: crear nuevo sorteo
        await setDoc(doc(db, "sorteos", nuevoSorteo.id), {
          descripcion: nuevoSorteo.descripcion,
          modo: modo,
          estado: "activo",
          fechaInicio: nuevoSorteo.fechaInicio ? new Date(nuevoSorteo.fechaInicio) : null,
          fechaFin: nuevoSorteo.fechaFin ? new Date(nuevoSorteo.fechaFin) : null,
          departamentos: nuevoSorteo.departamentos || [],
          categorias: nuevoSorteo.categorias || [],
          imagenUrl: nuevoSorteo.imagenUrl || "",
          creadoEn: new Date(),
        });

        addNotification({
          message: `Sorteo creado exitosamente para ${modo === "trabajador" ? "Trabajadores" : "Pasajeros"}`,
          type: "success",
        });
      }

      // Resetear formulario y cerrar modal
      setNuevoSorteo({ id: "", descripcion: "", modo: "pasajero", fechaInicio: "", fechaFin: "", departamentos: [], categorias: [], imagenUrl: "" });
      setImagenPreview(null);
      setEditandoId(null);
      setModalOpen(false);
      
      // Recargar sorteos
      cargarSorteos();
    } catch (error) {
      console.error("Error guardando sorteo:", error);
      addNotification({
        message: editandoId ? "Error al actualizar el sorteo" : "Error al crear el sorteo",
        type: "error",
      });
    }
  };

  const handleCambiarEstado = async (sorteoId, nuevoEstado) => {
    try {
      const sorteo = sorteos.find(s => s.id === sorteoId);
      if (!sorteo) return;

      // Cambiar estado del sorteo actual
      await updateDoc(doc(db, "sorteos", sorteoId), {
        estado: nuevoEstado,
        ultimoCambioEstado: new Date(),
      });

      // Actualizar el sorteo seleccionado localmente si es el que se está modificando
      if (sorteoSeleccionado?.id === sorteoId) {
        setSorteoSeleccionado({
          ...sorteoSeleccionado,
          estado: nuevoEstado
        });
      }

      addNotification({
        message: `Sorteo ${nuevoEstado === "activo" ? "activado" : "desactivado"}`,
        type: "success",
      });

      // Si se desactivó el sorteo seleccionado, cambiar a otro activo
      if (sorteoSeleccionado?.id === sorteoId && nuevoEstado === "inactivo") {
        setSorteoSeleccionado(null);
      }

      await cargarSorteos();
    } catch (error) {
      console.error("Error cambiando estado:", error);
      addNotification({
        message: "Error al cambiar el estado",
        type: "error",
      });
    }
  };

  const handleEditarSorteo = () => {
    if (!sorteoSeleccionado) return;
    
    // Convertir Timestamps de Firebase a string para el input datetime-local
    const convertirFecha = (fecha) => {
      if (!fecha) return "";
      if (fecha.toDate) {
        // Es un Timestamp de Firebase
        fecha = fecha.toDate();
      }
      if (!(fecha instanceof Date)) {
        fecha = new Date(fecha);
      }
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, "0");
      const day = String(fecha.getDate()).padStart(2, "0");
      const hours = String(fecha.getHours()).padStart(2, "0");
      const minutes = String(fecha.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setNuevoSorteo({
      id: sorteoSeleccionado.id,
      descripcion: sorteoSeleccionado.descripcion || "",
      modo: sorteoSeleccionado.modo || "pasajero",
      fechaInicio: convertirFecha(sorteoSeleccionado.fechaInicio),
      fechaFin: convertirFecha(sorteoSeleccionado.fechaFin),
      departamentos: sorteoSeleccionado.departamentos || [],
      categorias: sorteoSeleccionado.categorias || [],
      imagenUrl: sorteoSeleccionado.imagenUrl || "",
    });
    setImagenPreview(sorteoSeleccionado.imagenUrl || null);
    setEditandoId(sorteoSeleccionado.id);
    setModalOpen(true);
  };

  // Calcular ganadores globales (los N con más tickets, sin agrupar por departamento)
  const calcularGanadores = () => {
    const cupones = sorteoSeleccionado?.infoAdicional?.cupones || [];
    
    if (!cupones || cupones.length === 0) {
      addNotification({
        message: "No hay cupones para calcular ganadores",
        type: "warning",
      });
      return null;
    }

    // Contar tickets por usuario (globalmente, sin agrupar por departamento)
    const usuariosTickets = {};
    
    cupones.forEach((cupon) => {
      const uid = cupon.uidUsuario;
      const nombreUsuario = cupon.nombreUsuario || "Usuario desconocido";

      if (!usuariosTickets[uid]) {
        usuariosTickets[uid] = {
          nombre: nombreUsuario,
          tickets: 0,
          uid: uid,
        };
      }

      usuariosTickets[uid].tickets += 1;
    });

    // Ordenar y convertir a array
    const gananadoresOrdenados = Object.values(usuariosTickets)
      .sort((a, b) => b.tickets - a.tickets);

    setGanadores(gananadoresOrdenados);
    return gananadoresOrdenados;
  };

  // Finalizar sorteo y guardar ganadores
  const handleFinalizarSorteo = async (gananadoresSeleccionados) => {
    if (!sorteoSeleccionado || sorteoSeleccionado.modo !== "trabajador") {
      addNotification({
        message: "Solo se pueden finalizar sorteos en modo trabajador",
        type: "error",
      });
      return;
    }

    try {
      setFinalizandoSorteo(true);

      if (!gananadoresSeleccionados || gananadoresSeleccionados.length === 0) {
        addNotification({
          message: "Selecciona al menos un ganador",
          type: "warning",
        });
        return;
      }

      // Guardar ganadores en una subcolección "ganadores" dentro del sorteo
      const cupones = sorteoSeleccionado?.infoAdicional?.cupones || [];
      const gananadoresRef = doc(db, "sorteos", sorteoSeleccionado.id, "ganadores", "resumen");
      await setDoc(gananadoresRef, {
        fechaFinalizacion: new Date(),
        totalTickets: cupones.length,
        ganadoresList: gananadoresSeleccionados.map((u, idx) => ({
          posicion: idx + 1,
          uid: u.uid,
          nombre: u.nombre,
          tickets: u.tickets,
        })),
      });

      // Cambiar estado del sorteo a "finalizado"
      await updateDoc(doc(db, "sorteos", sorteoSeleccionado.id), {
        estado: "finalizado",
        fechaFinalizacion: new Date(),
      });

      addNotification({
        message: "Sorteo finalizado exitosamente. Ganadores guardados.",
        type: "success",
      });

      setDialogoFinalizarOpen(false);
      setGanadores(null);
      cargarSorteos();
    } catch (error) {
      console.error("Error finalizando sorteo:", error);
      addNotification({
        message: "Error al finalizar el sorteo",
        type: "error",
      });
    } finally {
      setFinalizandoSorteo(false);
    }
  };

  return (
    <Box>
      {/* Encabezado con botón de crear nuevo sorteo */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          🎲 Gestión de Sorteos
        </Typography>
        <Button
          variant="contained"
          sx={{
            background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #b01217 0%, #a01012 100%)",
            },
            fontWeight: 600,
          }}
          onClick={() => setModalOpen(true)}
        >
          + Nuevo Sorteo
        </Button>
      </Box>

      {/* Selector de sorteos */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: "#f9f9f9", border: "1px solid #e0e0e0" }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: "120px" }}>
            Seleccionar Sorteo:
          </Typography>
          
          {sorteos.length > 0 ? (
            <>
              <FormControl sx={{ minWidth: 300 }}>
                <Select
                  value={sorteoSeleccionado?.id || ""}
                  onChange={(e) => {
                    const selected = sorteos.find(s => s.id === e.target.value);
                    setSorteoSeleccionado(selected);
                    // Cargar información adicional del sorteo seleccionado (lazy loading)
                    if (selected?.id) {
                      cargarInfoSorteoSeleccionado(selected.id);
                    }
                  }}
                >
                  {sorteos.map((sorteo) => {
                    const nombre = sorteo.id;
                    const modo = sorteo.modo || "pasajero";
                    return (
                      <MenuItem key={sorteo.id} value={sorteo.id}>
                        {nombre} - {modo === "trabajador" ? "👷 Trabajador" : "👤 Pasajero"}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {sorteoSeleccionado && (
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Chip
                    label={sorteoSeleccionado.estado === "activo" ? "Activo" : sorteoSeleccionado.estado === "finalizado" ? "Finalizado" : "Inactivo"}
                    color={sorteoSeleccionado.estado === "activo" ? "success" : sorteoSeleccionado.estado === "finalizado" ? "warning" : "default"}
                    sx={{ fontWeight: 600 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={handleEditarSorteo}
                  >
                    ✏️ Editar
                  </Button>
                  {sorteoSeleccionado.modo === "trabajador" && sorteoSeleccionado.estado === "activo" && (
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        backgroundColor: "#ff9800",
                        "&:hover": {
                          backgroundColor: "#f57c00",
                        },
                      }}
                      onClick={() => {
                        calcularGanadores();
                        setDialogoFinalizarOpen(true);
                      }}
                    >
                      🏁 Finalizar Sorteo
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant={sorteoSeleccionado.estado === "activo" ? "outlined" : "contained"}
                    color={sorteoSeleccionado.estado === "activo" ? "error" : "success"}
                    onClick={() => handleCambiarEstado(
                      sorteoSeleccionado.id,
                      sorteoSeleccionado.estado === "activo" ? "inactivo" : "activo"
                    )}
                    disabled={sorteoSeleccionado.estado === "finalizado"}
                  >
                    {sorteoSeleccionado.estado === "activo" ? "Desactivar" : sorteoSeleccionado.estado === "finalizado" ? "Finalizado" : "Activar"}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography color="textSecondary" variant="body2">
              No hay sorteos creados. Haz clic en "+ Nuevo Sorteo"
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Información del sorteo seleccionado */}
      {sorteoSeleccionado && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: "#fafafa", border: "1px solid #e0e0e0" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                Nombre
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {sorteoSeleccionado.id}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                Descripción
              </Typography>
              <Typography variant="body2">
                {sorteoSeleccionado.descripcion || "Sin descripción"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                Modo
              </Typography>
              <Chip
                label={(sorteoSeleccionado.modo || "pasajero") === "trabajador" ? "👷 Trabajador" : "👤 Pasajero"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                Departamentos
              </Typography>
              {sorteoSeleccionado.departamentos && sorteoSeleccionado.departamentos.length > 0 ? (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                  {sorteoSeleccionado.departamentos.map((dept) => (
                    <Chip
                      key={dept}
                      label={dept}
                      size="small"
                      sx={{ fontWeight: 500, backgroundColor: "#e3f2fd", color: "#1976d2" }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "#999" }}>
                  Sin departamentos especificados
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                Categorías
              </Typography>
              {sorteoSeleccionado.categorias && sorteoSeleccionado.categorias.length > 0 ? (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                  {sorteoSeleccionado.categorias.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      size="small"
                      sx={{ fontWeight: 500, backgroundColor: "#f3e5f5", color: "#7b1fa2" }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "#999" }}>
                  Sin categorías especificadas
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#666" }}>
                Cupones Activos
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#d7171a" }}>
                {sorteoSeleccionado.ultimoNumero || 0}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Tabs para subcollections dinámicas */}
      {sorteoSeleccionado && sorteoSeleccionado.subcoleccionesDisponibles?.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {sorteoSeleccionado.subcoleccionesDisponibles.map(subcoleccion => (
              <Button
                key={subcoleccion}
                variant={tipoTabla === subcoleccion ? "contained" : "outlined"}
                size="small"
                onClick={() => {
                  setTipoTabla(subcoleccion);
                  setPaginaSubcoleccion(0);
                }}
                sx={{
                  backgroundColor: tipoTabla === subcoleccion ? "#d7171a" : "transparent",
                  borderColor: "#d7171a",
                  color: tipoTabla === subcoleccion ? "white" : "#d7171a",
                  textTransform: "capitalize"
                }}
              >
                {subcoleccion} ({sorteoSeleccionado.infoAdicional[subcoleccion]?.length || 0})
              </Button>
            ))}
          </Box>
        </Paper>
      )}

      {/* Tabla de Subcollection Dinámica */}
      {tipoTabla && sorteoSeleccionado && (
        loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress sx={{ color: "#d7171a" }} />
          </Box>
        ) : !sorteoSeleccionado?.infoAdicional?.[tipoTabla] || sorteoSeleccionado.infoAdicional[tipoTabla].length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography color="textSecondary">
              No hay datos en {tipoTabla}
            </Typography>
          </Box>
        ) : (
          (() => {
            // Obtener y procesar datos
            let datos = [...sorteoSeleccionado.infoAdicional[tipoTabla]];
            
            // Detectar si es tabla de trabajador: cuando modo es "trabajador" y tipoTabla es "participantes"
            const esTablaTrabajador = sorteoSeleccionado.modo === "trabajador" && tipoTabla === "participantes";
            
            // Si es tabla de trabajador, ordenar por CantidadViajes descendente
            if (esTablaTrabajador) {
              datos.sort((a, b) => {
                // Buscar el valor en ambas variaciones de mayúsculas/minúsculas
                const cantidadA = a.CantidadViajes || a.cantidadViajes || 0;
                const cantidadB = b.CantidadViajes || b.cantidadViajes || 0;
                // Convertir a número por si acaso son strings
                return Number(cantidadB) - Number(cantidadA);
              });
            }
            
            // Definir campos a mostrar según el tipo de tabla
            let campos = [];
            if (esTablaTrabajador) {
              // Para tabla de trabajador: mostrar específicamente estos campos
              campos = ["CantidadViajes", "Departamento", "Servicio", "UpdatedAt"];
            } else {
              // Para otras tablas: mostrar todos excepto id, foto y Nombre
              campos = datos.length > 0 
                ? Object.keys(datos[0])
                    .filter(key => key !== "id" && key !== "foto" && key !== "Nombre")
                    .sort()
                : [];
            }
            
            // Formatear datos si es tabla de trabajador
            const datosFormateados = esTablaTrabajador 
              ? datos.map(row => ({
                  ...row,
                  // Mapear los campos reales de Firebase a los nombres esperados
                  Nombre: row.Nombre || row.nombre || row.name || "N/A",
                  CantidadViajes: row.CantidadViajes || row.cantidadViajes || 0,
                  Departamento: row.Departamento || row.departamento || "N/A",
                  Servicio: row.Servicio || row.servicio || "N/A",
                  UpdatedAt: row.UpdatedAt || row.updatedAt ? new Date((row.UpdatedAt || row.updatedAt).seconds ? (row.UpdatedAt || row.updatedAt).seconds * 1000 : (row.UpdatedAt || row.updatedAt)).toLocaleDateString('es-ES') : "N/A"
                }))
              : datos;
            
            // Lógica para renderizar Tabs por departamento (solo para tabla de trabajador)
            const renderizarTabla = (datosParaTabla) => {
              return (
              <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: "auto" }}>
                <Table sx={{ tableLayout: "auto" }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#1a1a1a" }}>
                      {esTablaTrabajador ? (
                        <>
                          <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Ranking</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Nombre</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", textAlign: "center" }}>Viajes</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Departamento</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Código Referido</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>Actualizado</TableCell>
                        </>
                      ) : (
                        campos.map(key => (
                          <TableCell key={key} sx={{ color: "#fff", fontWeight: 600 }}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </TableCell>
                        ))
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosParaTabla
                      .slice(paginaSubcoleccion * ITEMS_PER_PAGE, (paginaSubcoleccion + 1) * ITEMS_PER_PAGE)
                      .map((fila, index) => {
                        // Colores para los primeros 3 lugares
                        let bgColor = "#fafafa";
                        let badgeColor = "#999";
                        let badgeBg = "#f0f0f0";
                        let viajesBadgeColor = "#fff";
                        let viajesBadgeBg = "#1a1a1a";
                        
                        if (index === 0) {
                          bgColor = "#fff8f0";
                          badgeColor = "#fff";
                          badgeBg = "#d7171a";
                          viajesBadgeColor = "#fff";
                          viajesBadgeBg = "#d7171a";
                        } else if (index === 1) {
                          bgColor = "#f5f5f5";
                          badgeColor = "#fff";
                          badgeBg = "#ff9800";
                          viajesBadgeColor = "#fff";
                          viajesBadgeBg = "#ff9800";
                        } else if (index === 2) {
                          bgColor = "#fafafa";
                          badgeColor = "#fff";
                          badgeBg = "#2196f3";
                          viajesBadgeColor = "#fff";
                          viajesBadgeBg = "#2196f3";
                        }

                        return (
                          <TableRow
                            key={fila.id}
                            sx={{
                              backgroundColor: bgColor,
                              "&:hover": { 
                                backgroundColor: index < 3 ? bgColor : "#f0f0f0",
                                transform: "scale(1.01)",
                                transition: "all 0.2s ease"
                              },
                              transition: "background-color 0.2s, transform 0.2s",
                              borderLeft: index < 3 ? `5px solid ${badgeBg}` : "5px solid transparent",
                            }}
                          >
                            {esTablaTrabajador ? (
                              <>
                                <TableCell sx={{ fontSize: "1.1rem", fontWeight: 800, textAlign: "center", py: 2 }}>
                                  <Box
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: 40,
                                      height: 40,
                                      borderRadius: "50%",
                                      backgroundColor: badgeBg,
                                      color: badgeColor,
                                      fontWeight: 800,
                                      fontSize: "1rem",
                                      boxShadow: `0 2px 8px ${badgeBg}40`
                                    }}
                                  >
                                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#333" }}>
                                  {fila.Nombre || "N/A"}
                                </TableCell>
                                <TableCell sx={{ fontSize: "1.15rem", fontWeight: 800, color: viajesBadgeColor, textAlign: "center", py: 2 }}>
                                  <Box
                                    sx={{
                                      display: "inline-block",
                                      backgroundColor: viajesBadgeBg,
                                      color: viajesBadgeColor,
                                      padding: "8px 16px",
                                      borderRadius: "8px",
                                      border: `2px solid ${viajesBadgeColor}`,
                                      minWidth: "60px",
                                      fontWeight: 800
                                    }}
                                  >
                                    {fila.CantidadViajes || 0}
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ fontSize: "0.9rem", color: "#666" }}>
                                  {fila.Departamento || "N/A"}
                                </TableCell>
                                <TableCell sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#1976d2" }}>
                                  <Box
                                    sx={{
                                      display: "inline-block",
                                      backgroundColor: "#e3f2fd",
                                      color: "#1976d2",
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: "6px",
                                      fontSize: "0.75rem",
                                      fontFamily: "monospace",
                                      border: "1px solid #90caf9"
                                    }}
                                  >
                                    {fila.codigoReferido || "N/A"}
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ fontSize: "0.85rem", color: "#999" }}>
                                  {fila.UpdatedAt}
                                </TableCell>
                              </>
                            ) : (
                              campos.map(key => (
                                <TableCell key={key} sx={{ fontSize: "0.85rem" }}>
                                  {typeof fila[key] === "object" 
                                    ? JSON.stringify(fila[key]) 
                                    : String(fila[key])}
                                </TableCell>
                              ))
                            )}
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
              );
            };
            if (esTablaTrabajador) {
              // Extraer departamentos únicos de los datos
              const departamentosUnicos = [...new Set(datosFormateados.map(p => p.Departamento || p.departamento).filter(Boolean))];
              
              // Filtrar datos por departamento seleccionado
              const datosDelDepartamento = datosFormateados.filter(
                p => (p.Departamento || p.departamento) === departamentosUnicos[departamentoSeleccionado]
              );
              
              return (
                <Box sx={{ width: "100%" }}>
                  {/* Tabs para departamentos */}
                  <Tabs
                    value={departamentoSeleccionado}
                    onChange={(e, newValue) => {
                      setDepartamentoSeleccionado(newValue);
                      setPaginaSubcoleccion(0); // Resetear paginación al cambiar departamento
                    }}
                    sx={{
                      borderBottom: 2,
                      borderColor: "divider",
                      backgroundColor: "#fafafa",
                      "& .MuiTabs-indicator": {
                        backgroundColor: "#d7171a",
                        height: "4px"
                      }
                    }}
                  >
                    {departamentosUnicos.map((dept, idx) => {
                      const countDept = datosFormateados.filter(
                        p => (p.Departamento || p.departamento) === dept
                      ).length;
                      return (
                        <Tab
                          key={idx}
                          label={`${dept} (${countDept})`}
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            color: departamentoSeleccionado === idx ? "#d7171a" : "#666",
                            textTransform: "none",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              color: "#d7171a",
                              backgroundColor: "rgba(215, 23, 26, 0.05)"
                            }
                          }}
                        />
                      );
                    })}
                  </Tabs>
                  
                  {/* Tabla del departamento seleccionado */}
                  <Box sx={{ mt: 2 }}>
                    {renderizarTabla(datosDelDepartamento)}
                  </Box>
                </Box>
              );
            }
            
            // Para otras tablas, renderizar sin Tabs
            return renderizarTabla(datosFormateados);
          })()
        )
      )}

      {/* Paginación para Subcollection */}
      {tipoTabla && sorteoSeleccionado?.infoAdicional?.[tipoTabla]?.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
            {sorteoSeleccionado.modo === "trabajador" && tipoTabla === "participantes" ? (
              // Para tabla de trabajador, mostrar datos del departamento seleccionado
              (() => {
                const datos = [...sorteoSeleccionado.infoAdicional[tipoTabla]];
                const departamentosUnicos = [...new Set(datos.map(p => p.Departamento || p.departamento).filter(Boolean))];
                const datosDelDeptSeleccionado = datos.filter(
                  p => (p.Departamento || p.departamento) === departamentosUnicos[departamentoSeleccionado]
                );
                return (
                  <>
                    Mostrando {paginaSubcoleccion * ITEMS_PER_PAGE + 1} - {Math.min((paginaSubcoleccion + 1) * ITEMS_PER_PAGE, datosDelDeptSeleccionado.length)} de {datosDelDeptSeleccionado.length}
                  </>
                );
              })()
            ) : (
              // Para otras tablas, mostrar todos los datos
              <>
                Mostrando {paginaSubcoleccion * ITEMS_PER_PAGE + 1} - {Math.min((paginaSubcoleccion + 1) * ITEMS_PER_PAGE, sorteoSeleccionado.infoAdicional[tipoTabla].length)} de {sorteoSeleccionado.infoAdicional[tipoTabla].length}
              </>
            )}
          </Typography>
          <Pagination 
            count={
              sorteoSeleccionado.modo === "trabajador" && tipoTabla === "participantes" ? (
                (() => {
                  const datos = [...sorteoSeleccionado.infoAdicional[tipoTabla]];
                  const departamentosUnicos = [...new Set(datos.map(p => p.Departamento || p.departamento).filter(Boolean))];
                  const datosDelDeptSeleccionado = datos.filter(
                    p => (p.Departamento || p.departamento) === departamentosUnicos[departamentoSeleccionado]
                  );
                  return Math.ceil(datosDelDeptSeleccionado.length / ITEMS_PER_PAGE);
                })()
              ) : (
                Math.ceil(sorteoSeleccionado.infoAdicional[tipoTabla].length / ITEMS_PER_PAGE)
              )
            }
            page={paginaSubcoleccion + 1}
            onChange={(e, page) => setPaginaSubcoleccion(page - 1)}
            sx={{
              "& .MuiPaginationItem-root": {
                fontFamily: "Mulish, sans-serif",
              }
            }}
          />
        </Box>
      )}




      {/* Modal para crear/editar sorteo */}
      <Dialog open={modalOpen} onClose={() => { setModalOpen(false); setEditandoId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#d7171a", color: "white", fontWeight: "bold" }}>
          {editandoId ? "✏️ Editar Sorteo" : "🎲 Crear Nuevo Sorteo"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="ID del Sorteo (identificador único)"
              fullWidth
              value={nuevoSorteo.id}
              onChange={(e) => setNuevoSorteo({ ...nuevoSorteo, id: e.target.value })}
              placeholder="Ej: sorteo_navidad_2025"
              size="small"
              disabled={editandoId ? true : false}
              helperText={editandoId ? "No puedes cambiar el ID en edición" : "Usa caracteres alfanuméricos y guiones bajos. Este será el ID del documento."}
            />
            <TextField
              label="Descripción (Opcional)"
              fullWidth
              multiline
              rows={3}
              value={nuevoSorteo.descripcion}
              onChange={(e) => setNuevoSorteo({ ...nuevoSorteo, descripcion: e.target.value })}
              placeholder="Describe los detalles del sorteo..."
              size="small"
            />
            <FormControl fullWidth>
              <InputLabel>Modo del Sorteo</InputLabel>
              <Select
                value={nuevoSorteo.modo}
                onChange={(e) => setNuevoSorteo({ ...nuevoSorteo, modo: e.target.value })}
                label="Modo del Sorteo"
                disabled={editandoId ? true : false}
              >
                <MenuItem value="pasajero">👤 Pasajero</MenuItem>
                <MenuItem value="trabajador">👷 Trabajador</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Departamentos Disponibles</InputLabel>
              <Select
                multiple
                value={nuevoSorteo.departamentos}
                onChange={(e) => setNuevoSorteo({ ...nuevoSorteo, departamentos: e.target.value })}
                label="Departamentos Disponibles"
              >
                {DEPARTAMENTOS.map((departamento) => (
                  <MenuItem key={departamento} value={departamento}>
                    {departamento}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Fecha de Inicio"
              fullWidth
              type="datetime-local"
              value={nuevoSorteo.fechaInicio}
              onChange={(e) => setNuevoSorteo({ ...nuevoSorteo, fechaInicio: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha de Finalización"
              fullWidth
              type="datetime-local"
              value={nuevoSorteo.fechaFin}
              onChange={(e) => setNuevoSorteo({ ...nuevoSorteo, fechaFin: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Categorías Aplicables (Opcional)</InputLabel>
              <Select
                multiple
                value={nuevoSorteo.categorias}
                onChange={(e) => setNuevoSorteo({ ...nuevoSorteo, categorias: e.target.value })}
                label="Categorías Aplicables (Opcional)"
              >
                {categoriasDisponibles.map((categoria) => (
                  <MenuItem key={categoria} value={categoria}>
                    {categoria}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Imagen de Promoción
              </Typography>
              {(imagenPreview || (editandoId && nuevoSorteo.imagenUrl)) && (
                <Box sx={{ mb: 2 }}>
                  {editandoId && !imagenPreview && (
                    <Typography variant="caption" sx={{ color: "#666", fontSize: "0.85rem" }}>
                      Imagen actual:
                    </Typography>
                  )}
                  <Box sx={{ mt: 1 }}>
                    <img
                      src={imagenPreview || nuevoSorteo.imagenUrl}
                      alt="Imagen"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </Box>
                  {editandoId && !imagenPreview && (
                    <Typography variant="caption" sx={{ color: "#666", fontSize: "0.85rem", mt: 1, display: "block" }}>
                      Sube una nueva imagen para reemplazarla:
                    </Typography>
                  )}
                </Box>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImagenChange}
                disabled={imagenSubiendo}
                style={{ width: "100%" }}
              />
              {imagenSubiendo && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={40} />
                </Box>
              )}
            </Box>
            <Box sx={{ p: 2, backgroundColor: "#fff3cd", borderRadius: 1, border: "1px solid #ffc107" }}>
              <Typography variant="body2" sx={{ color: "#856404", fontWeight: 500 }}>
                ⚠️ Nota: Si ya existe un sorteo activo para {nuevoSorteo.modo === "trabajador" ? "trabajadores" : "pasajeros"}, será desactivado automáticamente. Los cupones se almacenarán en una subcolección del documento.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setModalOpen(false); setEditandoId(null); }} sx={{ color: "#666" }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCrearSorteo}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #b01217 0%, #a01012 100%)",
              },
              fontWeight: 600,
            }}
          >
            {editandoId ? "Guardar Cambios" : "Crear Sorteo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Finalizar Sorteo */}
      <Dialog open={dialogoFinalizarOpen} onClose={() => setDialogoFinalizarOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#ff9800", color: "white", fontWeight: "bold" }}>
          🏁 Finalizar Sorteo - {sorteoSeleccionado?.id}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {gananoresEstimados && Array.isArray(gananoresEstimados) ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  label="Cantidad de Ganadores"
                  type="number"
                  inputProps={{ min: 1, max: gananoresEstimados.length }}
                  value={cantidadGanadores}
                  onChange={(e) => setCantidadGanadores(Math.min(Math.max(1, parseInt(e.target.value) || 1), gananoresEstimados.length))}
                  size="small"
                  sx={{ maxWidth: 150 }}
                />
                <Typography variant="body2" sx={{ color: "#666" }}>
                  (Máx: {gananoresEstimados.length} usuarios)
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Top {cantidadGanadores} Ganadores
              </Typography>
              
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {gananoresEstimados.slice(0, cantidadGanadores).map((usuario, idx) => (
                  <Paper
                    key={usuario.uid}
                    sx={{
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: idx === 0 ? "#fff3cd" : idx === 1 ? "#f0f0f0" : "#fafafa",
                      border: idx === 0 ? "2px solid #ff9800" : "1px solid #ddd",
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "1.2rem" }}>
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} #{idx + 1}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {usuario.nombre}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: "#999" }}>
                        ID: {usuario.uid}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${usuario.tickets} ticket${usuario.tickets !== 1 ? "s" : ""}`}
                      sx={{
                        backgroundColor: idx === 0 ? "#ff9800" : idx === 1 ? "#2196f3" : "#999",
                        color: "white",
                        fontWeight: 600,
                      }}
                    />
                  </Paper>
                ))}
              </Box>

              <Box sx={{ p: 2, backgroundColor: "#e8f5e9", borderRadius: 1, border: "1px solid #81c784" }}>
                <Typography variant="body2" sx={{ color: "#2e7d32", fontWeight: 500 }}>
                  ✅ Total de cupones: {sorteoSeleccionado?.infoAdicional?.cupones?.length || 0}
                </Typography>
              </Box>

              <Box sx={{ p: 2, backgroundColor: "#fff3cd", borderRadius: 1, border: "1px solid #ffc107" }}>
                <Typography variant="body2" sx={{ color: "#856404", fontWeight: 500 }}>
                  ⚠️ Al finalizar el sorteo:
                  <ul style={{ marginTop: "8px", marginBottom: 0 }}>
                    <li>Se guardarán los {cantidadGanadores} ganadores seleccionados</li>
                    <li>El estado del sorteo cambiará a "Finalizado"</li>
                    <li>No podrás crear más cupones para este sorteo</li>
                  </ul>
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <CircularProgress sx={{ color: "#ff9800" }} />
              <Typography variant="body2" sx={{ mt: 2, color: "#666" }}>
                Calculando ganadores...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setDialogoFinalizarOpen(false);
              setGanadores(null);
              setCantidadGanadores(3);
            }} 
            sx={{ color: "#666" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              const gananadoresSeleccionados = gananoresEstimados.slice(0, cantidadGanadores);
              handleFinalizarSorteo(gananadoresSeleccionados);
            }}
            variant="contained"
            sx={{
              backgroundColor: "#ff9800",
              "&:hover": {
                backgroundColor: "#f57c00",
              },
            }}
            disabled={!gananoresEstimados || finalizandoSorteo}
          >
            {finalizandoSorteo ? <CircularProgress size={20} sx={{ mr: 1, color: "white" }} /> : "✅ Confirmar y Finalizar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SorteosTab;
