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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { useContext } from "react";
import { NotificationContext } from "../../../context/NotificationContext";

const Sorteos = () => {
  const { addNotification } = useContext(NotificationContext);
  const ITEMS_PER_PAGE = 10;
  const [cupones, setCupones] = useState([]);
  const [cuponesFiltrados, setCuponesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchNumero, setSearchNumero] = useState("");
  const [usuariosCache, setUsuariosCache] = useState({});
  const [pagina, setPagina] = useState(0);
  const [filterDepartamento, setFilterDepartamento] = useState("");
  const [filterRol, setFilterRol] = useState("");
  const [filterTipoOrigen, setFilterTipoOrigen] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("reciente");
  const [departamentos, setDepartamentos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tiposOrigen, setTiposOrigen] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoSorteo, setNuevoSorteo] = useState({
    nombre: "",
    descripcion: "",
  });
  const [sorteoActual, setSorteoActual] = useState(null);

  useEffect(() => {
    cargarCupones();
    cargarSorteoActual();
  }, []);

  const cargarSorteoActual = async () => {
    try {
      const sorteoDoc = await getDoc(doc(db, "sorteos", "sorteo_apertura"));
      if (sorteoDoc.exists()) {
        setSorteoActual(sorteoDoc.data());
      }
    } catch (error) {
      console.error("Error cargando sorteo actual:", error);
    }
  };

  const cargarCupones = async () => {
    try {
      setLoading(true);
      const cuponesRef = collection(db, "sorteos", "sorteo_apertura", "cupones");
      const snapshot = await getDocs(cuponesRef);

      const cuponesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Obtener UIDs únicos
      const uidsUnicos = [...new Set(cuponesData.map(c => c.uidUsuario).filter(uid => uid))];

      // Cargar datos de usuarios EN PARALELO
      const usuariosTemp = {};
      if (uidsUnicos.length > 0) {
        const promesasUsuarios = uidsUnicos.map(async (uid) => {
          try {
            const userRef = doc(db, "pasajeros", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              usuariosTemp[uid] = userSnap.data().perfil?.name || userSnap.data().nombre || "Sin nombre";
            } else {
              usuariosTemp[uid] = "Usuario no encontrado";
            }
          } catch (error) {
            console.error("Error cargando usuario:", error);
            usuariosTemp[uid] = "Error al cargar";
          }
        });
        await Promise.all(promesasUsuarios);
      }

      setUsuariosCache(usuariosTemp);
      setCupones(cuponesData);
      
      // Ordenar por más reciente por defecto
      const cuponesOrdenados = [...cuponesData].sort((a, b) => {
        const dateA = a.creadoEn?.seconds ? a.creadoEn.seconds * 1000 : new Date(a.creadoEn).getTime();
        const dateB = b.creadoEn?.seconds ? b.creadoEn.seconds * 1000 : new Date(b.creadoEn).getTime();
        return dateB - dateA;
      });
      setCuponesFiltrados(cuponesOrdenados);

      // Extraer departamentos y roles únicos
      const deptosUnicos = [...new Set(cuponesData.map(c => c.departamento).filter(d => d))].sort();
      const rolesUnicos = [...new Set(cuponesData.map(c => c.rol).filter(r => r))].sort();
      const tiposUnicos = [...new Set(cuponesData.map(c => c.tipoOrigen).filter(t => t))].sort();
      setDepartamentos(deptosUnicos);
      setRoles(rolesUnicos);
      setTiposOrigen(tiposUnicos);
    } catch (error) {
      console.error("Error cargando cupones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (valor) => {
    setSearchNumero(valor);
    setPagina(0); // Resetear página al buscar
    aplicarFiltros(valor, filterDepartamento, filterRol, filterTipoOrigen, ordenarPor);
  };

  const aplicarFiltros = (numero, departamento, rol, tipoOrigen, orden) => {
    let filtrados = cupones;

    // Filtro por número de rifa y nombre
    if (numero.trim()) {
      const busqueda = numero.toLowerCase();
      filtrados = filtrados.filter((cupon) => {
        const numeroRifaMatch = cupon.numeroRifa?.toLowerCase().includes(busqueda);
        const nombreMatch = usuariosCache[cupon.uidUsuario]?.toLowerCase().includes(busqueda);
        return numeroRifaMatch || nombreMatch;
      });
    }

    // Filtro por departamento
    if (departamento) {
      filtrados = filtrados.filter((cupon) => cupon.departamento === departamento);
    }

    // Filtro por rol
    if (rol) {
      filtrados = filtrados.filter((cupon) => cupon.rol === rol);
    }

    // Filtro por tipo origen
    if (tipoOrigen) {
      filtrados = filtrados.filter((cupon) => cupon.tipoOrigen === tipoOrigen);
    }

    // Ordenamiento
    if (orden === "reciente") {
      filtrados.sort((a, b) => {
        const dateA = a.creadoEn?.seconds ? a.creadoEn.seconds * 1000 : new Date(a.creadoEn).getTime();
        const dateB = b.creadoEn?.seconds ? b.creadoEn.seconds * 1000 : new Date(b.creadoEn).getTime();
        return dateB - dateA;
      });
    } else if (orden === "antiguo") {
      filtrados.sort((a, b) => {
        const dateA = a.creadoEn?.seconds ? a.creadoEn.seconds * 1000 : new Date(a.creadoEn).getTime();
        const dateB = b.creadoEn?.seconds ? b.creadoEn.seconds * 1000 : new Date(b.creadoEn).getTime();
        return dateA - dateB;
      });
    }

    setCuponesFiltrados(filtrados);
  };

  const handleFilterChange = (tipo, valor) => {
    const nuevoNumero = tipo === "numero" ? valor : searchNumero;
    const nuevoDepartamento = tipo === "departamento" ? valor : filterDepartamento;
    const nuevoRol = tipo === "rol" ? valor : filterRol;
    const nuevoTipoOrigen = tipo === "tipoOrigen" ? valor : filterTipoOrigen;
    const nuevoOrden = tipo === "orden" ? valor : ordenarPor;

    if (tipo === "departamento") setFilterDepartamento(valor);
    if (tipo === "rol") setFilterRol(valor);
    if (tipo === "tipoOrigen") setFilterTipoOrigen(valor);
    if (tipo === "orden") setOrdenarPor(valor);

    setPagina(0);
    aplicarFiltros(nuevoNumero, nuevoDepartamento, nuevoRol, nuevoTipoOrigen, nuevoOrden);
  };

  const handleCrearSorteo = async () => {
    if (!nuevoSorteo.nombre.trim()) {
      addNotification({
        message: "Por favor ingresa un nombre para el sorteo",
        type: "error",
      });
      return;
    }

    try {
      // Obtener sorteo actual (si existe) y desactivarlo
      const sorteoActualDoc = await getDoc(doc(db, "sorteos", "sorteo_apertura"));
      if (sorteoActualDoc.exists()) {
        // Cambiar sorteo actual a inactivo
        await updateDoc(doc(db, "sorteos", "sorteo_apertura"), {
          estado: "inactivo",
          desactivadoEn: new Date(),
        });
      }

      // Crear nuevo sorteo activo
      await setDoc(doc(db, "sorteos", "sorteo_apertura"), {
        nombre: nuevoSorteo.nombre,
        descripcion: nuevoSorteo.descripcion,
        estado: "activo",
        creadoEn: new Date(),
        ultimoNumero: 0,
        cupones: {},
      });

      addNotification({
        message: "Sorteo creado exitosamente",
        type: "success",
      });

      // Resetear formulario y cerrar modal
      setNuevoSorteo({ nombre: "", descripcion: "" });
      setModalOpen(false);
      
      // Recargar datos
      cargarSorteoActual();
      cargarCupones();
    } catch (error) {
      console.error("Error creando sorteo:", error);
      addNotification({
        message: "Error al crear el sorteo",
        type: "error",
      });
    }
  };

  const getRolColor = (rol) => {
    const colores = {
      pasajero: "#2196f3",
      conductor: "#4caf50",
      trabajador: "#ff9800",
    };
    return colores[rol] || "#9c27b0";
  };

  const getRolLabel = (rol) => {
    const labels = {
      pasajero: "Pasajero",
      conductor: "Conductor",
      trabajador: "Trabajador",
    };
    return labels[rol] || rol;
  };

  const getTipoOrigenLabel = (tipo) => {
    const labels = {
      viaje_completado: "Viaje Completado",
      envio_completado: "Envío Completado",
      referido: "Referido",
    };
    return labels[tipo] || tipo;
  };

  const capitalize = (str) => {
    if (!str) return str;
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Paginación
  const cuponePaginados = cuponesFiltrados.slice(
    pagina * ITEMS_PER_PAGE,
    (pagina + 1) * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(cuponesFiltrados.length / ITEMS_PER_PAGE);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: "#fff", border: "1px solid #e0e0e0" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
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

        {/* Buscador y Filtros */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: "#f5f5f5" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 1fr 1fr 1fr 1fr" }, gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar por número de rifa o nombre (ej: 000004 o Juan)"
              value={searchNumero}
              onChange={(e) => handleBuscar(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#d7171a" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Departamento</InputLabel>
              <Select
                value={filterDepartamento}
                onChange={(e) => handleFilterChange("departamento", e.target.value)}
                label="Departamento"
              >
                <MenuItem value="">Todos</MenuItem>
                {departamentos.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={filterRol}
                onChange={(e) => handleFilterChange("rol", e.target.value)}
                label="Rol"
              >
                <MenuItem value="">Todos</MenuItem>
                {roles.map((rol) => (
                  <MenuItem key={rol} value={rol}>
                    {rol === "pasajero" ? "Pasajero" : rol === "conductor" ? "Conductor" : "Trabajador"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Tipo Origen</InputLabel>
              <Select
                value={filterTipoOrigen}
                onChange={(e) => handleFilterChange("tipoOrigen", e.target.value)}
                label="Tipo Origen"
              >
                <MenuItem value="">Todos</MenuItem>
                {tiposOrigen.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {getTipoOrigenLabel(tipo)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={ordenarPor}
                onChange={(e) => handleFilterChange("orden", e.target.value)}
                label="Ordenar por"
              >
                <MenuItem value="reciente">Más Reciente</MenuItem>
                <MenuItem value="antiguo">Más Antiguo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Tabla de cupones */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress sx={{ color: "#d7171a" }} />
          </Box>
        ) : cuponesFiltrados.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography color="textSecondary">
              {searchNumero ? "No se encontraron cupones con ese número" : "No hay cupones disponibles"}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ borderRadius: 1, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#1a1a1a" }}>
                    <TableCell sx={{ color: "#fff", fontWeight: 700, py: 2 }}>Número Rifa</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700, py: 2 }}>Usuario</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700, py: 2 }}>Departamento</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700, py: 2 }}>Rol</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700, py: 2 }}>Tipo Origen</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700, py: 2 }}>Fecha Creación</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 700, py: 2 }}>Estado Sorteo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cuponePaginados.map((cupon, idx) => (
                    <TableRow
                      key={cupon.id}
                      sx={{
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9f9f9",
                        "&:hover": { backgroundColor: "#f0f0f0" },
                        transition: "background-color 0.2s",
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: "#d7171a", py: 2 }}>
                        {cupon.numeroRifa}
                      </TableCell>
                      <TableCell sx={{ py: 2, fontWeight: 500 }}>
                        {capitalize(usuariosCache[cupon.uidUsuario]) || "Cargando..."}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={cupon.departamento || "-"}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "#d7171a",
                            color: "#d7171a",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={getRolLabel(cupon.rol)}
                          size="small"
                          sx={{
                            backgroundColor: getRolColor(cupon.rol),
                            color: "#fff",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontSize: "0.9rem", fontWeight: 500 }}>
                          {getTipoOrigenLabel(cupon.tipoOrigen)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2, fontSize: "0.9rem" }}>
                        {cupon.creadoEn
                          ? new Date(
                              cupon.creadoEn.seconds
                                ? cupon.creadoEn.seconds * 1000
                                : cupon.creadoEn
                            ).toLocaleDateString("es-ES")
                          : "N/A"}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={sorteoActual?.estado === "activo" ? "Activo" : "Inactivo"}
                          size="small"
                          color={sorteoActual?.estado === "activo" ? "success" : "default"}
                          sx={{
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {!loading && cuponesFiltrados.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                  Mostrando {cuponePaginados.length > 0 ? (pagina * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pagina + 1) * ITEMS_PER_PAGE, cuponesFiltrados.length)} de {cuponesFiltrados.length}
                </Typography>
                <Pagination 
                  count={totalPages}
                  page={pagina + 1}
                  onChange={(e, page) => setPagina(page - 1)}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      fontFamily: "Mulish, sans-serif",
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Modal Crear Nuevo Sorteo */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#d7171a", color: "white", fontWeight: "bold" }}>
          🎲 Crear Nuevo Sorteo
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Nombre del Sorteo"
              fullWidth
              value={nuevoSorteo.nombre}
              onChange={(e) => setNuevoSorteo({ ...nuevoSorteo, nombre: e.target.value })}
              placeholder="Ej: Sorteo de Navidad 2025"
              size="small"
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
            <Box sx={{ p: 2, backgroundColor: "#fff3cd", borderRadius: 1, border: "1px solid #ffc107" }}>
              <Typography variant="body2" sx={{ color: "#856404", fontWeight: 500 }}>
                ⚠️ Nota: Al crear este nuevo sorteo, el sorteo anterior será desactivado automáticamente.
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
            }}
          >
            Crear Sorteo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sorteos;
