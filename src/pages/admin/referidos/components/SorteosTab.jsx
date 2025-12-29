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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

const SorteosTab = () => {
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

  useEffect(() => {
    cargarCupones();
  }, []);

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
      setCuponesFiltrados(cuponesData);

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
    <Box>
      {/* Buscador y Filtros en el mismo contenedor */}
      <Paper sx={{ p: 2, mb: 3 }}>
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
      </Paper>      {/* Tabla de cupones */}
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
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#1a1a1a" }}>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Número Rifa</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Usuario</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Departamento</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Rol</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Tipo Origen</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Fecha Creación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cuponePaginados.map((cupon, idx) => (
                <TableRow
                  key={cupon.id}
                  sx={{
                    "&:nth-of-type(odd)": { backgroundColor: "#f9f9f9" },
                    "&:hover": { backgroundColor: "#f0f0f0" },
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: "#d7171a" }}>
                    {cupon.numeroRifa}
                  </TableCell>
                  <TableCell>{capitalize(usuariosCache[cupon.uidUsuario]) || "Cargando..."}</TableCell>
                  <TableCell>
                    <Chip
                      label={cupon.departamento}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: "#d7171a",
                        color: "#d7171a",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getRolLabel(cupon.rol)}
                      size="small"
                      sx={{
                        backgroundColor: getRolColor(cupon.rol),
                        color: "#fff",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                      {getTipoOrigenLabel(cupon.tipoOrigen)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem" }}>
                    {cupon.creadoEn
                      ? new Date(
                          cupon.creadoEn.seconds
                            ? cupon.creadoEn.seconds * 1000
                            : cupon.creadoEn
                        ).toLocaleDateString("es-ES")
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
    </Box>
  );
};

export default SorteosTab;
