import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Pagination,
} from "@mui/material";
import { doc, setDoc, collection, getDocs, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../data/firebase/firebase";
import { NotificationContext } from "../../../../context/NotificationContext";

const DEPARTAMENTOS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

const SorteosTab = () => {
  const { addNotification } = useContext(NotificationContext);
  
  // Estados para sorteos
  const [sorteos, setSorteos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState(null);
  const [datosSorteo, setDatosSorteo] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Estados para filtros de búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicioBusqueda, setFechaInicioBusqueda] = useState("");
  const [fechaFinBusqueda, setFechaFinBusqueda] = useState("");
  
  // Estados para el formulario de creación
  const [modalOpen, setModalOpen] = useState(false);
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [nuevoSorteo, setNuevoSorteo] = useState({
    id: "",
    descripcion: "",
    modo: "pasajero",
    fechaInicio: "",
    fechaFin: "",
    departamentos: [],
    categorias: [],
    imagenUrl: "",
  });
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);

  useEffect(() => {
    cargarSorteos();
    cargarCategorias();
  }, []);

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
      setImagenPreview(e.target.result);
    };
    reader.readAsDataURL(archivo);

    // Subir a Storage
    try {
      setImagenSubiendo(true);
      const timestamp = Date.now();
      const storageRef = ref(storage, `sorteos/${timestamp}_${archivo.name}`);
      await uploadBytes(storageRef, archivo);
      const url = await getDownloadURL(storageRef);
      
      setNuevoSorteo({ ...nuevoSorteo, imagenUrl: url });
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

  // Enriquecer cupones con datos de usuario (para pasajeros)
  const enriquecerCuponesConNombres = async (cupones) => {
    try {
      if (!cupones || cupones.length === 0) return cupones;

      // Obtener UIDs únicos de los cupones (buscar tanto uidUsuario como UidUsuario)
      const uidsUnicos = [...new Set(
        cupones
          .map(c => c.uidUsuario || c.UidUsuario)
          .filter(Boolean)
      )];

      if (uidsUnicos.length === 0) return cupones;

      console.log(`🔍 Enriqueciendo ${uidsUnicos.length} cupones con datos de pasajero...`);

      // Crear un mapa de UID -> nombre del pasajero
      const usuariosMap = {};

      // Buscar datos de pasajeros en Firebase
      for (const uid of uidsUnicos) {
        try {
          const pasajeroRef = doc(db, "pasajeros", uid);
          const pasajeroSnap = await getDoc(pasajeroRef);
          if (pasajeroSnap.exists()) {
            const pasajeroData = pasajeroSnap.data();
            const nombre = pasajeroData.perfil?.name || 
                           pasajeroData.perfil?.nombre || 
                           pasajeroData.name || 
                           pasajeroData.nombre || 
                           uid;
            usuariosMap[uid] = nombre;
          }
        } catch (e) {
          console.error(`Error obteniendo datos del pasajero ${uid}:`, e);
        }
      }

      // Enriquecer cupones con los nombres
      const cuponesEnriquecidos = cupones.map(cupon => {
        const uid = cupon.uidUsuario || cupon.UidUsuario;
        return {
          ...cupon,
          nombreUsuario: usuariosMap[uid] || uid || "Desconocido"
        };
      });

      console.log("✓ Cupones enriquecidos exitosamente");
      return cuponesEnriquecidos;
    } catch (error) {
      console.error("Error enriqueciendo cupones:", error);
      return cupones;
    }
  };

  // Cargar datos de un sorteo específico (cupones o participantes según el modo)
  const cargarDatosSorteo = async (sorteoId, modo) => {
    try {
      setLoadingDatos(true);
      
      // Determinar qué colección leer según el modo
      const nombreColeccion = modo === "trabajador" ? "participantes" : "cupones";
      
      const datosRef = collection(db, "sorteos", sorteoId, nombreColeccion);
      const datosSnap = await getDocs(datosRef);

      let datosArray = datosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Si es pasajero (cupones), enriquecer con nombres de pasajeros
      if (modo === "pasajero") {
        datosArray = await enriquecerCuponesConNombres(datosArray);
        
        // Ordenar por número de rifa descendente (más alto primero)
        datosArray.sort((a, b) => {
          const rifaA = parseInt(a.numeroRifa || a.NumeroRifa || 0);
          const rifaB = parseInt(b.numeroRifa || b.NumeroRifa || 0);
          return rifaB - rifaA;
        });
      }

      setDatosSorteo(datosArray);
    } catch (error) {
      console.error("Error cargando datos del sorteo:", error);
      addNotification({
        message: "Error al cargar los datos del sorteo",
        type: "error",
      });
    } finally {
      setLoadingDatos(false);
    }
  };

  // Manejar selección de sorteo
  const handleSeleccionarSorteo = (sorteo) => {
    setSorteoSeleccionado(sorteo);
    setPaginaActual(1);
    setDepartamentoSeleccionado(0);
    setBusqueda("");
    setFechaInicioBusqueda("");
    setFechaFinBusqueda("");
    cargarDatosSorteo(sorteo.id, sorteo.modo);
  };

  // Volver al listado de sorteos
  const handleVolverListado = () => {
    setSorteoSeleccionado(null);
    setDatosSorteo([]);
  };

  // Cargar sorteos desde Firebase
  const cargarSorteos = async () => {
    try {
      setLoading(true);
      const sorteosRef = collection(db, "sorteos");
      const sorteosSnap = await getDocs(sorteosRef);

      const sorteosArray = sorteosSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          descripcion: data.descripcion || "",
          modo: data.modo || "pasajero",
          estado: data.estado || "inactivo",
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          departamentos: data.departamentos || [],
          categorias: data.categorias || [],
          imagenUrl: data.imagenUrl || "",
          creadoEn: data.creadoEn,
        };
      });

      setSorteos(sorteosArray);
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

  // Cargar categorías disponibles
  const cargarCategorias = async () => {
    try {
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

  const handleCrearSorteo = async () => {
    if (!nuevoSorteo.id.trim()) {
      addNotification({
        message: "Por favor ingresa un ID para el sorteo",
        type: "error",
      });
      return;
    }

    try {
      const modo = nuevoSorteo.modo || "pasajero";

      // Crear nuevo sorteo
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

      // Resetear formulario y cerrar modal
      setNuevoSorteo({ 
        id: "", 
        descripcion: "", 
        modo: "pasajero", 
        fechaInicio: "", 
        fechaFin: "", 
        departamentos: [], 
        categorias: [], 
        imagenUrl: "" 
      });
      setImagenPreview(null);
      setModalOpen(false);
      
      // Recargar sorteos
      cargarSorteos();
    } catch (error) {
      console.error("Error guardando sorteo:", error);
      addNotification({
        message: "Error al crear el sorteo",
        type: "error",
      });
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

      {/* Vista de detalle del sorteo seleccionado */}
      {sorteoSeleccionado ? (
        <Box>
          {/* Encabezado del detalle */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: "#f9f9f9" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={handleVolverListado}
                sx={{ borderColor: "#d7171a", color: "#d7171a" }}
              >
                ← Volver
              </Button>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {sorteoSeleccionado.id}
              </Typography>
              <Chip
                label={sorteoSeleccionado.estado === "activo" ? "Activo" : "Inactivo"}
                color={sorteoSeleccionado.estado === "activo" ? "success" : "default"}
              />
              <Chip
                label={sorteoSeleccionado.modo === "trabajador" ? "🚗 Trabajador" : "👤 Pasajero"}
                sx={{
                  backgroundColor: sorteoSeleccionado.modo === "trabajador" ? "#ff9800" : "#2196f3",
                  color: "white",
                }}
              />
            </Box>
            {sorteoSeleccionado.descripcion && (
              <Typography variant="body2" color="textSecondary">
                {sorteoSeleccionado.descripcion}
              </Typography>
            )}
          </Paper>

          {/* Filtros de búsqueda */}
          {sorteoSeleccionado.modo === "pasajero" && (
            <Paper sx={{ p: 2, mb: 3, backgroundColor: "#fafafa" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Buscar por nombre o N° rifa"
                  placeholder="Ej: Juan Pérez o 000123"
                  size="small"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value.toLowerCase());
                    setPaginaActual(1);
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                    }
                  }}
                />
                <TextField
                  label="Fecha inicio"
                  type="date"
                  size="small"
                  value={fechaInicioBusqueda}
                  onChange={(e) => {
                    setFechaInicioBusqueda(e.target.value);
                    setPaginaActual(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                    }
                  }}
                />
                <TextField
                  label="Fecha fin"
                  type="date"
                  size="small"
                  value={fechaFinBusqueda}
                  onChange={(e) => {
                    setFechaFinBusqueda(e.target.value);
                    setPaginaActual(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                    }
                  }}
                />
              </Box>
            </Paper>
          )}

          {/* Datos organizados por departamento */}
          {loadingDatos ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress sx={{ color: "#d7171a" }} />
            </Box>
          ) : datosSorteo.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="textSecondary">
                No hay {sorteoSeleccionado.modo === "trabajador" ? "participantes" : "cupones"} en este sorteo todavía.
              </Typography>
            </Paper>
          ) : (() => {
            // Aplicar filtros de búsqueda y período para pasajeros
            let datosFiltrados = datosSorteo;
            
            if (sorteoSeleccionado.modo === "pasajero") {
              datosFiltrados = datosSorteo.filter(item => {
                // Filtro de búsqueda por nombre o rifa
                const nombreCumple = !busqueda || 
                  (item.nombreUsuario && item.nombreUsuario.toLowerCase().includes(busqueda)) ||
                  (item.numeroRifa && String(item.numeroRifa).includes(busqueda)) ||
                  (item.NumeroRifa && String(item.NumeroRifa).includes(busqueda));

                // Filtro de período
                if (!nombreCumple) return false;
                
                if (!fechaInicioBusqueda && !fechaFinBusqueda) return true;
                
                let fechaCupon;
                if (item.creadoEn && item.creadoEn.seconds) {
                  fechaCupon = new Date(item.creadoEn.seconds * 1000);
                } else {
                  return true;
                }

                if (fechaInicioBusqueda) {
                  const fechaInicio = new Date(fechaInicioBusqueda);
                  fechaInicio.setHours(0, 0, 0, 0);
                  if (fechaCupon < fechaInicio) return false;
                }

                if (fechaFinBusqueda) {
                  const fechaFin = new Date(fechaFinBusqueda);
                  fechaFin.setHours(23, 59, 59, 999);
                  if (fechaCupon > fechaFin) return false;
                }

                return true;
              });
            }

            // Organizar por departamento
            const departamentosUnicos = [...new Set(
              datosFiltrados.map(item => item.departamento || item.Departamento).filter(Boolean)
            )];

            if (departamentosUnicos.length === 0) {
              return (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="textSecondary">
                    No hay datos con departamento definido.
                  </Typography>
                </Paper>
              );
            }

            const datosPorDepartamento = datosFiltrados.filter(
              item => (item.departamento || item.Departamento) === departamentosUnicos[departamentoSeleccionado]
            );

            // Ordenar trabajadores por CantidadViajes
            const datosOrdenados = sorteoSeleccionado.modo === "trabajador"
              ? [...datosPorDepartamento].sort((a, b) => {
                  const cantidadA = a.CantidadViajes || a.cantidadViajes || 0;
                  const cantidadB = b.CantidadViajes || b.cantidadViajes || 0;
                  return Number(cantidadB) - Number(cantidadA);
                })
              : datosPorDepartamento;

            return (
              <Box>
                {/* Tabs por departamento */}
                <Tabs
                  value={departamentoSeleccionado}
                  onChange={(e, newValue) => {
                    setDepartamentoSeleccionado(newValue);
                    setPaginaActual(1);
                  }}
                  sx={{
                    borderBottom: 2,
                    borderColor: "divider",
                    backgroundColor: "#fafafa",
                    mb: 2,
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#d7171a",
                      height: "4px"
                    }
                  }}
                >
                  {departamentosUnicos.map((dept, idx) => {
                    const count = datosFiltrados.filter(
                      item => (item.departamento || item.Departamento) === dept
                    ).length;
                    return (
                      <Tab
                        key={idx}
                        label={`${dept} (${count})`}
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          color: departamentoSeleccionado === idx ? "#d7171a" : "#666",
                          textTransform: "none",
                          "&:hover": {
                            color: "#d7171a",
                            backgroundColor: "rgba(215, 23, 26, 0.05)"
                          }
                        }}
                      />
                    );
                  })}
                </Tabs>

                {/* Tabla con formato especial para trabajadores */}
                {sorteoSeleccionado.modo === "trabajador" ? (
                  <>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead sx={{ backgroundColor: "#1a1a1a" }}>
                        <TableRow>
                          <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Ranking</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Nombre</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700, textAlign: "center" }}>Viajes</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Departamento</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Actualizado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {datosOrdenados
                          .slice((paginaActual - 1) * ITEMS_PER_PAGE, paginaActual * ITEMS_PER_PAGE)
                          .map((fila, index) => {
                          const bgColor = index === 0 ? "#fff8f0" : index === 1 ? "#f5f5f5" : index === 2 ? "#fafafa" : "#fff";
                          const badgeBg = index === 0 ? "#d7171a" : index === 1 ? "#ff9800" : index === 2 ? "#2196f3" : "#999";
                          
                          return (
                            <TableRow
                              key={fila.id}
                              sx={{
                                backgroundColor: bgColor,
                                borderLeft: index < 3 ? `5px solid ${badgeBg}` : "5px solid transparent",
                                "&:hover": { 
                                  backgroundColor: index < 3 ? bgColor : "#f0f0f0",
                                  transform: "scale(1.01)",
                                  transition: "all 0.2s ease"
                                },
                              }}
                            >
                              <TableCell sx={{ textAlign: "center" }}>
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    backgroundColor: badgeBg,
                                    color: "#fff",
                                    fontWeight: 800,
                                  }}
                                >
                                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {fila.Nombre || fila.nombre || "N/A"}
                              </TableCell>
                              <TableCell sx={{ textAlign: "center" }}>
                                <Box
                                  sx={{
                                    display: "inline-block",
                                    backgroundColor: badgeBg,
                                    color: "#fff",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    fontWeight: 800,
                                    fontSize: "1.1rem",
                                  }}
                                >
                                  {fila.CantidadViajes || fila.cantidadViajes || 0}
                                </Box>
                              </TableCell>
                              <TableCell>{fila.Departamento || fila.departamento || "N/A"}</TableCell>
                              <TableCell sx={{ fontSize: "0.85rem", color: "#999" }}>
                                {fila.UpdatedAt && fila.UpdatedAt.seconds
                                  ? new Date(fila.UpdatedAt.seconds * 1000).toLocaleDateString("es-ES")
                                  : "N/A"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 3 }}>
                    <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
                      Mostrando {datosOrdenados.length > 0 ? (paginaActual - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(paginaActual * ITEMS_PER_PAGE, datosOrdenados.length)} de {datosOrdenados.length}
                    </Typography>
                    <Pagination
                      count={Math.ceil(datosOrdenados.length / ITEMS_PER_PAGE)}
                      page={paginaActual}
                      onChange={(e, page) => setPaginaActual(page)}
                      color="standard"
                      size="small"
                    />
                  </Box>
                  </>
                ) : (
                  <>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead sx={{ backgroundColor: "#1a1a1a" }}>
                        <TableRow>
                          <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Usuario</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Fecha</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 600 }}>N° Rifa</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Departamento</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Tipo Origen</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {datosOrdenados
                          .slice((paginaActual - 1) * ITEMS_PER_PAGE, paginaActual * ITEMS_PER_PAGE)
                          .map((fila, index) => {
                          // Formatear fecha
                          let fechaFormateada = "N/A";
                          if (fila.creadoEn && fila.creadoEn.seconds) {
                            const fecha = new Date(fila.creadoEn.seconds * 1000);
                            fechaFormateada = fecha.toLocaleDateString("es-ES");
                          }

                          return (
                            <TableRow
                              key={fila.id}
                              sx={{
                                backgroundColor: index % 2 === 0 ? "#fafafa" : "#fff",
                                "&:hover": { backgroundColor: "#f0f0f0" },
                              }}
                            >
                              <TableCell sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#000" }}>
                                {fila.nombreUsuario || "N/A"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {fechaFormateada}
                              </TableCell>
                              <TableCell sx={{ fontSize: "1rem", fontWeight: 800 }}>
                                <Box
                                  sx={{
                                    display: "inline-block",
                                    backgroundColor: "#d7171a",
                                    color: "#fff",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    fontFamily: "monospace",
                                    fontWeight: 900,
                                    fontSize: "1.1rem",
                                    boxShadow: "0 2px 8px rgba(215, 23, 26, 0.3)",
                                  }}
                                >
                                  {fila.numeroRifa || fila.NumeroRifa || "N/A"}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {fila.departamento || fila.Departamento || "N/A"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {fila.tipoOrigen || fila.TipoOrigen || "N/A"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 3 }}>
                    <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
                      Mostrando {datosOrdenados.length > 0 ? (paginaActual - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(paginaActual * ITEMS_PER_PAGE, datosOrdenados.length)} de {datosOrdenados.length}
                    </Typography>
                    <Pagination
                      count={Math.ceil(datosOrdenados.length / ITEMS_PER_PAGE)}
                      page={paginaActual}
                      onChange={(e, page) => setPaginaActual(page)}
                      color="standard"
                      size="small"
                    />
                  </Box>
                  </>
                )}
              </Box>
            );
          })()}
        </Box>
      ) : (
        /* Listado de sorteos */
        loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress sx={{ color: "#d7171a" }} />
        </Box>
      ) : sorteos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", backgroundColor: "#f9f9f9" }}>
          <Typography variant="body1" color="textSecondary">
            No hay sorteos creados todavía.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Crea tu primer sorteo usando el botón de arriba.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 3 }}>
          {sorteos.map((sorteo) => (
            <Paper
              key={sorteo.id}
              onClick={() => handleSeleccionarSorteo(sorteo)}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transform: "translateY(-2px)",
                  borderColor: "#d7171a",
                },
              }}
            >
              {/* Imagen del sorteo */}
              {sorteo.imagenUrl && (
                <Box
                  sx={{
                    width: "100%",
                    height: 180,
                    borderRadius: 2,
                    mb: 2,
                    backgroundImage: `url(${sorteo.imagenUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}

              {/* Información del sorteo */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {sorteo.id}
                </Typography>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: sorteo.estado === "activo" ? "#4caf50" : "#999",
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {sorteo.estado === "activo" ? "Activo" : "Inactivo"}
                </Box>
              </Box>

              {sorteo.descripcion && (
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {sorteo.descripcion}
                </Typography>
              )}

              <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: sorteo.modo === "trabajador" ? "#ff9800" : "#2196f3",
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  {sorteo.modo === "trabajador" ? "👷 Trabajador" : "👤 Pasajero"}
                </Box>
              </Box>

              {sorteo.departamentos && sorteo.departamentos.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "#666", display: "block", mb: 0.5 }}>
                    Departamentos:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {sorteo.departamentos.slice(0, 3).map((dept) => (
                      <Box
                        key={dept}
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 0.5,
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          fontSize: "0.7rem",
                        }}
                      >
                        {dept}
                      </Box>
                    ))}
                    {sorteo.departamentos.length > 3 && (
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 0.5,
                          backgroundColor: "#f5f5f5",
                          color: "#666",
                          fontSize: "0.7rem",
                        }}
                      >
                        +{sorteo.departamentos.length - 3}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {sorteo.fechaInicio && (
                <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                  📅 Inicio: {new Date(sorteo.fechaInicio.seconds * 1000).toLocaleDateString("es-ES")}
                </Typography>
              )}
              {sorteo.fechaFin && (
                <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                  📅 Fin: {new Date(sorteo.fechaFin.seconds * 1000).toLocaleDateString("es-ES")}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )
      )}

      {/* Modal para crear sorteo */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#d7171a", color: "white", fontWeight: "bold" }}>
          🎲 Crear Nuevo Sorteo
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
              helperText="Usa caracteres alfanuméricos y guiones bajos. Este será el ID del documento."
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
              {imagenPreview && (
                <Box sx={{ mb: 2 }}>
                  <img
                    src={imagenPreview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                    }}
                  />
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
          <Button onClick={() => setModalOpen(false)} sx={{ color: "#666" }}>
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
            Crear Sorteo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SorteosTab;
