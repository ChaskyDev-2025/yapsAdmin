// src/pages/admin/referidos/Referidos.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Avatar,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Button,
  Pagination,
  Select,
  MenuItem,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";
import TableToolbar from "../usuarios/components/TableToolbar";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
import { obtenerTodosLosCodeigos } from "../../../services/codigosPromoService";

// Componentes modulares
import ReferidosHeader from "./components/ReferidosHeader";
import StatsGrid from "./components/StatsGrid";
import HistorialModal from "./components/HistorialModal";
import ModalCodigoPromo from "./components/ModalCodigoPromo";

const Referidos = () => {
  const [referidosData, setReferidosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [pasajerosDonaciones, setPasajerosDonaciones] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    totalReferidos: 0,
    totalTickets: 0,
    totalDonaciones: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [historialModalOpen, setHistorialModalOpen] = useState(false);
  const [selectedReferido, setSelectedReferido] = useState(null);
  const [historialReferidos, setHistorialReferidos] = useState([]);
  const [codigosPromo, setCodigosPromo] = useState([]);
  const [modalPromoOpen, setModalPromoOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [searchTrabajadores, setSearchTrabajadores] = useState("");
  const [sortByTrabajadores, setSortByTrabajadores] = useState("tickets-desc");
  const [visibleColumnsTrabajadores, setVisibleColumnsTrabajadores] = useState({
    ranking: true,
    usuario: true,
    codigo: true,
    referidos: true,
    tickets: true,
    acciones: true,
  });
  const [searchPasajeros, setSearchPasajeros] = useState("");
  const [sortByPasajeros, setSortByPasajeros] = useState("tickets-desc");
  const [visibleColumnsPasajeros, setVisibleColumnsPasajeros] = useState({
    ranking: true,
    usuario: true,
    codigo: true,
    referidos: true,
    tickets: true,
    acciones: true,
  });
  const [searchDonaciones, setSearchDonaciones] = useState("");
  const [sortByDonaciones, setSortByDonaciones] = useState("donaciones-desc");
  const [filterDepartamentoDonaciones, setFilterDepartamentoDonaciones] = useState("todos");
  const [departamentosDisponibles, setDepartamentosDisponibles] = useState([]);
  const [visibleColumnsDonaciones, setVisibleColumnsDonaciones] = useState({
    usuario: true,
    donacionesAcumuladas: true,
    ultimaDonacion: true,
    monto: true,
  });

  // Estados para paginación
  const ITEMS_PER_PAGE = 10;
  const [pageTrabajadores, setPageTrabajadores] = useState(0);
  const [pagePasajeros, setPagePasajeros] = useState(0);
  const [pageDonaciones, setPageDonaciones] = useState(0);

  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setPageTrabajadores(0);
  }, [searchTrabajadores]);

  useEffect(() => {
    setPagePasajeros(0);
  }, [searchPasajeros]);

  useEffect(() => {
    setPageDonaciones(0);
  }, [searchDonaciones]);

  useEffect(() => {
    setPageDonaciones(0);
  }, [filterDepartamentoDonaciones]);

  useEffect(() => {
    // Listeners en tiempo real
    setLoading(true);
    let unsubscribePasajeros = null;
    let unsubscribeTrabajadores = null;
    let pasajerosMap = {};
    let trabajadoresSnapshot = null;
    let isInitialLoad = true;

    try {
      // Listener para pasajeros - se actualiza en tiempo real
      unsubscribePasajeros = onSnapshot(
        collection(db, "pasajeros"),
        (snapshot) => {
          pasajerosMap = {};
          snapshot.docs.forEach((doc) => {
            pasajerosMap[doc.id] = doc.data();
          });

          // Procesar datos de donaciones
          const donacionesData = snapshot.docs
            .map((doc) => {
              const pasajero = doc.data();
              return {
                id: doc.id,
                nombre: pasajero.perfil?.name || pasajero.perfil?.nombre || pasajero.nombre || "Sin nombre",
                email: pasajero.perfil?.email || "Sin email",
                photoUrl: pasajero.perfil?.photoURL || pasajero.perfil?.photoUrl || pasajero.perfil?.foto || null,
                donacionesAcumuladas: pasajero.donacionesAcumuladas || 0,
                ultimaDonacion: pasajero.ultimaDonacion || null,
                departamento: pasajero.departamentoActual || "-",
              };
            })
            .filter(p => p.donacionesAcumuladas > 0)
            .sort((a, b) => b.donacionesAcumuladas - a.donacionesAcumuladas);

          // Extraer departamentos únicos
          const departamentosUnicos = [...new Set(donacionesData.map(p => p.departamento))].filter(d => d !== "-").sort();
          setDepartamentosDisponibles(departamentosUnicos);

          setPasajerosDonaciones(donacionesData);

          // Si ya tenemos datos de trabajadores, actualizar referidos
          if (trabajadoresSnapshot) {
            fetchReferidosDataRealtime(trabajadoresSnapshot, pasajerosMap);
          }

          if (isInitialLoad) {
            isInitialLoad = false;
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error en listener de pasajeros:", error);
          setLoading(false);
        }
      );

      // Listener para trabajadores - usado en la pestaña de referidos
      unsubscribeTrabajadores = onSnapshot(
        collection(db, "trabajadores"),
        (snapshot) => {
          trabajadoresSnapshot = snapshot;
          fetchReferidosDataRealtime(snapshot, pasajerosMap);
        },
        (error) => {
          console.error("Error en listener de trabajadores:", error);
        }
      );

      // Cargar códigos promo de forma async
      fetchCodigosPromo();
    } catch (error) {
      console.error("Error en setup de listeners:", error);
      setLoading(false);
    }

    // Retornar función de cleanup
    return () => {
      if (unsubscribePasajeros) unsubscribePasajeros();
      if (unsubscribeTrabajadores) unsubscribeTrabajadores();
    };
  }, []);

  const fetchReferidosDataRealtime = (trabajadoresSnapshot, pasajerosMap) => {
    try {
      let totalReferidos = 0;
      let totalTickets = 0;

      // Procesar trabajadores
      const data = trabajadoresSnapshot.docs.map((doc) => {
        const trabajador = doc.data();
        
        const referidosCount = trabajador.referidosAplicados?.length || 0;
        const ticketsCount = typeof trabajador.tickets === 'object' && !Array.isArray(trabajador.tickets)
          ? Object.values(trabajador.tickets)
              .filter(v => typeof v === 'number')
              .reduce((sum, count) => sum + count, 0)
          : 0;

        totalReferidos += referidosCount;
        totalTickets += ticketsCount;

        return {
          id: doc.id,
          nombre: trabajador.perfil?.name || trabajador.perfil?.nombre || trabajador.nombre || "Sin nombre",
          email: trabajador.perfil?.email || trabajador.email || "Sin email",
          codigo: trabajador.codigoReferido || "-",
          referidos: referidosCount,
          tickets: ticketsCount,
          ticketsMap: trabajador.tickets || {},
          photoUrl: trabajador.perfil?.photoURL || trabajador.perfil?.photoUrl || trabajador.perfil?.foto || null,
          referidosAplicados: trabajador.referidosAplicados || [],
          pasajerosMap: pasajerosMap,
          modo: "trabajador",
          tieneCodigoReferido: !!trabajador.codigoReferido,
        };
      });

      // Procesar pasajeros desde pasajerosMap
      const dataPasajeros = Object.entries(pasajerosMap).map(([id, pasajero]) => {
        const referidosCount = pasajero.referidosAplicados?.length || 0;
        const ticketsCount = typeof pasajero.tickets === 'object' && !Array.isArray(pasajero.tickets)
          ? Object.values(pasajero.tickets)
              .filter(v => typeof v === 'number')
              .reduce((sum, count) => sum + count, 0)
          : 0;

        totalReferidos += referidosCount;
        totalTickets += ticketsCount;

        return {
          id: id,
          nombre: pasajero.perfil?.name || pasajero.perfil?.nombre || pasajero.nombre || "Sin nombre",
          email: pasajero.perfil?.email || "Sin email",
          codigo: pasajero.codigoReferido || "-",
          referidos: referidosCount,
          tickets: ticketsCount,
          ticketsMap: pasajero.tickets || {},
          photoUrl: pasajero.perfil?.photoURL || pasajero.perfil?.photoUrl || pasajero.perfil?.foto || null,
          referidosAplicados: pasajero.referidosAplicados || [],
          pasajerosMap: pasajerosMap,
          modo: pasajero.modo || "pasajero",
          tieneCodigoReferido: !!pasajero.codigoReferido,
        };
      });

      // Calcular total de donaciones
      const totalDonaciones = Object.values(pasajerosMap).reduce((sum, pasajero) => {
        return sum + (pasajero.donacionesAcumuladas || 0);
      }, 0);

      // Combinar y ordenar
      const allData = [...data, ...dataPasajeros];
      allData.sort((a, b) => {
        if (b.tickets !== a.tickets) {
          return b.tickets - a.tickets;
        }
        return a.nombre.localeCompare(b.nombre);
      });

      setReferidosData(allData);
      setStats({
        total: allData.length,
        totalReferidos,
        totalTickets,
        totalDonaciones,
      });
    } catch (error) {
      console.error("Error al procesar datos de referidos en tiempo real:", error);
    }
  };

  const fetchReferidosData = async () => {
    try {
      // Cargar pasajeros y trabajadores EN PARALELO (SOLO LECTURA)
      const [pasajerosSnapshot, trabajadoresSnapshot] = await Promise.all([
        getDocs(collection(db, "pasajeros")),
        getDocs(collection(db, "trabajadores")),
      ]);

      const pasajerosMap = {};
      pasajerosSnapshot.docs.forEach((doc) => {
        pasajerosMap[doc.id] = doc.data();
      });

      fetchReferidosDataRealtime(trabajadoresSnapshot, pasajerosMap);
    } catch (error) {
      console.error("Error al cargar referidos:", error);
    }
  };

  const fetchCodigosPromo = async () => {
    try {
      const codigos = await obtenerTodosLosCodeigos();
      setCodigosPromo(codigos);
    } catch (error) {
      console.error("Error al cargar códigos promocionales:", error);
    }
  };

  const copyToClipboard = (codigo) => {
    navigator.clipboard.writeText(codigo);
    alert(`Código ${codigo} copiado al portapapeles`);
  };

  // Calcular estadísticas por pestaña
  const getTabStats = useMemo(() => {
    if (selectedTab === 0) {
      // Conductores
      const conductores = referidosData.filter(r => r.modo === "trabajador");
      let totalReferidos = 0;
      let totalTickets = 0;
      conductores.forEach(c => {
        totalReferidos += c.referidos;
        totalTickets += c.tickets;
      });
      return {
        total: conductores.length,
        totalReferidos,
        totalTickets,
      };
    } else if (selectedTab === 1) {
      // Pasajeros
      const pasajeros = referidosData.filter(r => r.modo === "pasajero");
      let totalReferidos = 0;
      let totalTickets = 0;
      pasajeros.forEach(p => {
        totalReferidos += p.referidos;
        totalTickets += p.tickets;
      });
      return {
        total: pasajeros.length,
        totalReferidos,
        totalTickets,
      };
    } else if (selectedTab === 2) {
      // Donaciones - no tiene stats específicas por ahora
      return stats;
    } else {
      // Códigos Promo
      return stats;
    }
  }, [selectedTab, referidosData, stats]);

  // Filtrar y ordenar trabajadores
  const filteredTrabajadores = useMemo(() => {
    let result = referidosData.filter(r => r.modo === "trabajador");
    
    // Filtrar por búsqueda
    if (searchTrabajadores.trim()) {
      const search = searchTrabajadores.toLowerCase();
      result = result.filter(ref =>
        (ref.nombre || "").toLowerCase().includes(search) ||
        (ref.codigo || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenar por tickets (no por referidos, ya que referidos están incluidos en tickets)
    if (sortByTrabajadores === "tickets-asc") {
      result.sort((a, b) => a.tickets - b.tickets);
    } else if (sortByTrabajadores === "tickets-desc") {
      result.sort((a, b) => b.tickets - a.tickets);
    }
    
    return result;
  }, [referidosData, searchTrabajadores, sortByTrabajadores]);

  // Filtrar y ordenar pasajeros
  const filteredPasajeros = useMemo(() => {
    let result = referidosData.filter(r => r.modo === "pasajero");
    
    // Filtrar por búsqueda
    if (searchPasajeros.trim()) {
      const search = searchPasajeros.toLowerCase();
      result = result.filter(ref =>
        (ref.nombre || "").toLowerCase().includes(search) ||
        (ref.codigo || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenar por tickets (no por referidos, ya que referidos están incluidos en tickets)
    if (sortByPasajeros === "tickets-asc") {
      result.sort((a, b) => a.tickets - b.tickets);
    } else if (sortByPasajeros === "tickets-desc") {
      result.sort((a, b) => b.tickets - a.tickets);
    }
    
    return result;
  }, [referidosData, searchPasajeros, sortByPasajeros]);

  // Datos paginados para Trabajadores
  const trabajadoresPaginados = useMemo(() => {
    const start = pageTrabajadores * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredTrabajadores.slice(start, end);
  }, [filteredTrabajadores, pageTrabajadores]);

  const totalPagesTrabajadores = Math.ceil(filteredTrabajadores.length / ITEMS_PER_PAGE);

  // Datos paginados para Pasajeros
  const pasajerosPaginados = useMemo(() => {
    const start = pagePasajeros * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredPasajeros.slice(start, end);
  }, [filteredPasajeros, pagePasajeros]);

  const totalPagesPasajeros = Math.ceil(filteredPasajeros.length / ITEMS_PER_PAGE);

  // Calcular colSpan dinámico para trabajadores
  const getColSpanTrabajadores = useMemo(() => {
    return Object.values(visibleColumnsTrabajadores).filter(Boolean).length;
  }, [visibleColumnsTrabajadores]);

  // Calcular colSpan dinámico para pasajeros
  const getColSpanPasajeros = useMemo(() => {
    return Object.values(visibleColumnsPasajeros).filter(Boolean).length;
  }, [visibleColumnsPasajeros]);

  // Calcular colSpan dinámico para donaciones
  const getColSpanDonaciones = useMemo(() => {
    // Usuario incluye 3 celdas (usuario, email, departamento) si está visible
    // donacionesAcumuladas incluye 1 celda
    // ultimaDonacion incluye 2 celdas (ultimaDonacion, monto) si está visible
    let count = 0;
    if (visibleColumnsDonaciones.usuario) count += 3; // usuario, email, departamento
    if (visibleColumnsDonaciones.donacionesAcumuladas) count += 1;
    if (visibleColumnsDonaciones.ultimaDonacion) count += 2; // ultimaDonacion, monto
    return count > 0 ? count : 1;
  }, [visibleColumnsDonaciones]);

  const handleOpenHistorial = (referido) => {
    setSelectedReferido(referido);
    // Cargar los datos de los pasajeros referidos
    const historial = referido.referidosAplicados
      .map((uid) => {
        const pasajero = referido.pasajerosMap[uid];
        if (pasajero) {
          return {
            nombre: pasajero.perfil?.name || "Sin nombre",
            email: pasajero.perfil?.email || "Sin email",
          };
        }
        return null;
      })
      .filter((item) => item !== null);
    
    setHistorialReferidos(historial);
    setHistorialModalOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        {/* Encabezado */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <div>
            <ReferidosHeader />
          </div>
        </Box>

      {/* Estadísticas generales */}
      <StatsGrid stats={getTabStats} loading={loading} />

      {/* Pestañas */}
      <Box sx={{ borderBottom: 2, borderColor: "divider", mt: 4, mb: 2 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "none",
              minWidth: 180,
              color: "#484848",
            },
            "& .MuiTab-root.Mui-selected": {
              color: "#d7171a",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#d7171a",
            },
          }}
        >
          <Tab label="👷 Trabajadores" icon={undefined} />
          <Tab label="👤 Pasajeros" icon={undefined} />
          <Tab label="💝 Donaciones" icon={undefined} />
          <Tab label="🎟️ Códigos Promocionales" icon={undefined} />
        </Tabs>
      </Box>

      {/* Contenido de las pestañas */}
      {!loading && (
        <Box>
          {/* TABLA DE TRABAJADORES */}
          {selectedTab === 0 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TableToolbar
                    searchValue={searchTrabajadores}
                    onSearchChange={setSearchTrabajadores}
                    sortValue={sortByTrabajadores}
                    onSortChange={setSortByTrabajadores}
                    sortOptions={[
                      { label: "↑ Sort by Referidos (ASC)", value: "referidos-asc" },
                      { label: "↑ Sort by Tickets (ASC)", value: "tickets-asc" },
                      { label: "↓ Sort by Tickets (DESC)", value: "tickets-desc" },
                    ]}
                    visibleColumns={visibleColumnsTrabajadores}
                    onColumnChange={(col, visible) => setVisibleColumnsTrabajadores(prev => ({ ...prev, [col]: visible }))}
                    showClearButton={searchTrabajadores !== ""}
                    onClear={() => {
                      setSearchTrabajadores("");
                      setSortByTrabajadores("tickets-desc");
                    }}
                  />
                </Box>
              </Box>
              {filteredTrabajadores.length > 0 ? (
                <Paper sx={{ boxShadow: 0 }}>
                  <TableContainer>
                    <Table>
                    <TableHead sx={{ backgroundColor: "#000000" }}>
                      <TableRow>
                        {visibleColumnsTrabajadores.ranking && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Ranking</TableCell>
                        )}
                        {visibleColumnsTrabajadores.usuario && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Usuario</TableCell>
                        )}
                        {visibleColumnsTrabajadores.codigo && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Código</TableCell>
                        )}
                        {visibleColumnsTrabajadores.referidos && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                            Referidos
                          </TableCell>
                        )}
                        {visibleColumnsTrabajadores.tickets && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                            Tickets
                          </TableCell>
                        )}
                        {visibleColumnsTrabajadores.acciones && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                            Acciones
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trabajadoresPaginados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={getColSpanTrabajadores} align="center">
                            <Typography sx={{ py: 2, color: "#484848" }}>No hay datos para mostrar</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        trabajadoresPaginados.map((referido, index) => (
                          <TableRow key={referido.id} hover>
                            {visibleColumnsTrabajadores.ranking && (
                              <TableCell>
                                <Chip
                                  icon={index < 3 && referido.referidos > 0 ? <EmojiEventsIcon /> : undefined}
                                  label={`#${index + 1}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    bgcolor:
                                      index === 0 && referido.referidos > 0
                                        ? "#ffd700"
                                        : index === 1 && referido.referidos > 0
                                        ? "#c0c0c0"
                                        : index === 2 && referido.referidos > 0
                                        ? "#cd7f32"
                                        : "#e0e0e0",
                                    color: index < 3 && referido.referidos > 0 ? "white" : "#484848",
                                  }}
                                />
                              </TableCell>
                            )}
                            {visibleColumnsTrabajadores.usuario && (
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar
                                    src={referido.photoUrl}
                                    sx={{
                                      bgcolor: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
                                      width: 40,
                                      height: 40,
                                    }}
                                  >
                                    {referido.nombre.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body1" fontWeight={600}>
                                      {referido.nombre}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {referido.email}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                            )}
                            {visibleColumnsTrabajadores.codigo && (
                              <TableCell>
                                <Chip
                                  label={referido.codigo}
                                  sx={{
                                    fontFamily: "monospace",
                                    fontWeight: 700,
                                    bgcolor: referido.tieneCodigoReferido ? "#ffe0e0" : "#f5f5f5",
                                    color: referido.tieneCodigoReferido ? "#b01217" : "#757575",
                                  }}
                                />
                              </TableCell>
                            )}
                            {visibleColumnsTrabajadores.referidos && (
                              <TableCell align="center">
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  color={referido.referidos > 0 ? "#d7171a" : "#bdbdbd"}
                                >
                                  {referido.referidos}
                                </Typography>
                              </TableCell>
                            )}
                            {visibleColumnsTrabajadores.tickets && (
                              <TableCell align="center">
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  color={referido.tickets > 0 ? "#ff9800" : "#bdbdbd"}
                                >
                                  {referido.tickets}
                                </Typography>
                              </TableCell>
                            )}
                            {visibleColumnsTrabajadores.acciones && (
                              <TableCell align="center">
                                {referido.tieneCodigoReferido && (
                                  <Tooltip title="Copiar código">
                                    <IconButton
                                      onClick={() => copyToClipboard(referido.codigo)}
                                      size="small"
                                      sx={{ color: "#d7171a", mr: 1 }}
                                    >
                                      <ContentCopyIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {referido.referidos > 0 && (
                                  <Tooltip title="Ver historial de referidos">
                                    <IconButton
                                      onClick={() => handleOpenHistorial(referido)}
                                      size="small"
                                      sx={{ color: "#d7171a" }}
                                    >
                                      <HistoryIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </TableContainer>
                  {filteredTrabajadores.length > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
                      <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                        Mostrando {trabajadoresPaginados.length > 0 ? (pageTrabajadores * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pageTrabajadores + 1) * ITEMS_PER_PAGE, filteredTrabajadores.length)} de {filteredTrabajadores.length}
                      </Typography>
                      <Pagination 
                        count={totalPagesTrabajadores}
                        page={pageTrabajadores + 1}
                        onChange={(e, page) => setPageTrabajadores(page - 1)}
                        sx={{
                          "& .MuiPaginationItem-root": {
                            fontFamily: "Mulish, sans-serif",
                          }
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              ) : (
                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                  No hay trabajadores registrados
                </Typography>
              )}
            </Box>
          )}

          {/* TABLA DE PASAJEROS */}
          {selectedTab === 1 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TableToolbar
                    searchValue={searchPasajeros}
                    onSearchChange={setSearchPasajeros}
                    sortValue={sortByPasajeros}
                    onSortChange={setSortByPasajeros}
                    sortOptions={[
                      { label: "↑ Sort by Tickets (ASC)", value: "tickets-asc" },
                      { label: "↓ Sort by Tickets (DESC)", value: "tickets-desc" },
                    ]}
                    visibleColumns={visibleColumnsPasajeros}
                    onColumnChange={(col, visible) => setVisibleColumnsPasajeros(prev => ({ ...prev, [col]: visible }))}
                    showClearButton={searchPasajeros !== ""}
                    onClear={() => {
                      setSearchPasajeros("");
                      setSortByPasajeros("tickets-desc");
                    }}
                  />
                </Box>
              </Box>
              {filteredPasajeros.length > 0 ? (
                <Paper sx={{ boxShadow: 0 }}>
                  <TableContainer>
                    <Table>
                    <TableHead sx={{ backgroundColor: "#000000" }}>
                      <TableRow>
                        {visibleColumnsPasajeros.ranking && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Ranking</TableCell>
                        )}
                        {visibleColumnsPasajeros.usuario && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Usuario</TableCell>
                        )}
                        {visibleColumnsPasajeros.codigo && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Código</TableCell>
                        )}
                        {visibleColumnsPasajeros.referidos && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                            Referidos
                          </TableCell>
                        )}
                        {visibleColumnsPasajeros.tickets && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                            Tickets
                          </TableCell>
                        )}
                        {visibleColumnsPasajeros.acciones && (
                          <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                            Acciones
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pasajerosPaginados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={getColSpanPasajeros} align="center">
                            <Typography sx={{ py: 2, color: "#484848" }}>No hay datos para mostrar</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        pasajerosPaginados.map((referido, index) => (
                          <TableRow key={referido.id} hover>
                            {visibleColumnsPasajeros.ranking && (
                              <TableCell>
                                <Chip
                                  icon={index < 3 && referido.referidos > 0 ? <EmojiEventsIcon /> : undefined}
                                  label={`#${index + 1}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    bgcolor:
                                      index === 0 && referido.referidos > 0
                                        ? "#ffd700"
                                        : index === 1 && referido.referidos > 0
                                        ? "#c0c0c0"
                                        : index === 2 && referido.referidos > 0
                                        ? "#cd7f32"
                                        : "#e0e0e0",
                                    color: index < 3 && referido.referidos > 0 ? "white" : "#484848",
                                  }}
                                />
                              </TableCell>
                            )}
                            {visibleColumnsPasajeros.usuario && (
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar
                                    src={referido.photoUrl}
                                    sx={{
                                      background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
                                      width: 40,
                                      height: 40,
                                    }}
                                  >
                                    {referido.nombre.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body1" fontWeight={600}>
                                      {referido.nombre}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {referido.email}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                            )}
                            {visibleColumnsPasajeros.codigo && (
                              <TableCell>
                                <Chip
                                  label={referido.codigo}
                                  sx={{
                                    fontFamily: "monospace",
                                    fontWeight: 700,
                                    bgcolor: referido.tieneCodigoReferido ? "#ffe0e0" : "#f5f5f5",
                                    color: referido.tieneCodigoReferido ? "#b01217" : "#757575",
                                  }}
                                />
                              </TableCell>
                            )}
                            {visibleColumnsPasajeros.referidos && (
                              <TableCell align="center">
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  color={referido.referidos > 0 ? "#d7171a" : "#bdbdbd"}
                                >
                                  {referido.referidos}
                                </Typography>
                              </TableCell>
                            )}
                            {visibleColumnsPasajeros.tickets && (
                              <TableCell align="center">
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  color={referido.tickets > 0 ? "#ff9800" : "#bdbdbd"}
                                >
                                  {referido.tickets}
                                </Typography>
                              </TableCell>
                            )}
                            {visibleColumnsPasajeros.acciones && (
                              <TableCell align="center">
                                {referido.tieneCodigoReferido && (
                                  <Tooltip title="Copiar código">
                                    <IconButton
                                      onClick={() => copyToClipboard(referido.codigo)}
                                      size="small"
                                      sx={{ color: "#d7171a", mr: 1 }}
                                    >
                                      <ContentCopyIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {referido.referidos > 0 && (
                                  <Tooltip title="Ver historial de referidos">
                                    <IconButton
                                      onClick={() => handleOpenHistorial(referido)}
                                      size="small"
                                      sx={{ color: "#d7171a" }}
                                    >
                                      <HistoryIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </TableContainer>
                  {filteredPasajeros.length > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
                      <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                        Mostrando {pasajerosPaginados.length > 0 ? (pagePasajeros * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pagePasajeros + 1) * ITEMS_PER_PAGE, filteredPasajeros.length)} de {filteredPasajeros.length}
                      </Typography>
                      <Pagination 
                        count={totalPagesPasajeros}
                        page={pagePasajeros + 1}
                        onChange={(e, page) => setPagePasajeros(page - 1)}
                        sx={{
                          "& .MuiPaginationItem-root": {
                            fontFamily: "Mulish, sans-serif",
                          }
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              ) : (
                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                  No hay pasajeros registrados
                </Typography>
              )}
            </Box>
          )}

          {/* TABLA DE DONACIONES */}
          {selectedTab === 2 && (
            <Box>
              <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TableToolbar
                    searchValue={searchDonaciones}
                    onSearchChange={setSearchDonaciones}
                    searchPlaceholder="Nombre, Email, Departamento"
                    sortOptions={[
                      { label: "Donaciones (Mayor)", value: "donaciones-desc" },
                      { label: "Donaciones (Menor)", value: "donaciones-asc" },
                      { label: "Nombre (A-Z)", value: "nombre-asc" },
                      { label: "Nombre (Z-A)", value: "nombre-desc" },
                      { label: "Departamento (A-Z)", value: "departamento-asc" },
                      { label: "Departamento (Z-A)", value: "departamento-desc" },
                    ]}
                    sortValue={sortByDonaciones}
                    onSortChange={setSortByDonaciones}
                    visibleColumns={visibleColumnsDonaciones}
                    onColumnChange={(col, visible) => setVisibleColumnsDonaciones(prev => ({ ...prev, [col]: visible }))}
                    showClearButton={false}
                  />
                </Box>

                {/* Filtro de Departamento */}
                <Select
                  value={filterDepartamentoDonaciones}
                  onChange={(e) => {
                    setFilterDepartamentoDonaciones(e.target.value);
                    setPageDonaciones(0);
                  }}
                  sx={{
                    minWidth: 220,
                    height: 40,
                    fontFamily: "Mulish, sans-serif",
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: "#d7171a",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#d7171a",
                      },
                    },
                  }}
                >
                  <MenuItem value="todos">
                    <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                      Todos
                    </Typography>
                  </MenuItem>
                  {departamentosDisponibles.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      <Typography sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {dept}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {pasajerosDonaciones.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#000000" }}>
                      <TableRow>
                        {visibleColumnsDonaciones.usuario && (
                          <>
                            <TableCell sx={{ color: "white", fontWeight: 700 }}>Usuario</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 700 }}>Email</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 700 }}>Departamento</TableCell>
                          </>
                        )}
                        {visibleColumnsDonaciones.donacionesAcumuladas && (
                          <TableCell sx={{ color: "white", fontWeight: 700 }}>Donaciones Acumuladas</TableCell>
                        )}
                        {visibleColumnsDonaciones.ultimaDonacion && (
                          <>
                            <TableCell sx={{ color: "white", fontWeight: 700 }}>Última Donación</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 700 }}>Monto</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pasajerosDonaciones
                        .filter(p => {
                          const search = searchDonaciones.toLowerCase();
                          return (
                            (p.nombre.toLowerCase().includes(search) ||
                            p.email.toLowerCase().includes(search) ||
                            p.departamento.toLowerCase().includes(search)) &&
                            (filterDepartamentoDonaciones === "todos" || p.departamento === filterDepartamentoDonaciones)
                          );
                        })
                        .sort((a, b) => {
                          if (sortByDonaciones === "donaciones-desc") {
                            return b.donacionesAcumuladas - a.donacionesAcumuladas;
                          }
                          if (sortByDonaciones === "donaciones-asc") {
                            return a.donacionesAcumuladas - b.donacionesAcumuladas;
                          }
                          if (sortByDonaciones === "nombre-asc") {
                            return a.nombre.localeCompare(b.nombre);
                          }
                          if (sortByDonaciones === "nombre-desc") {
                            return b.nombre.localeCompare(a.nombre);
                          }
                          if (sortByDonaciones === "departamento-asc") {
                            return a.departamento.localeCompare(b.departamento);
                          }
                          if (sortByDonaciones === "departamento-desc") {
                            return b.departamento.localeCompare(a.departamento);
                          }
                          return 0;
                        })
                        .slice(pageDonaciones * ITEMS_PER_PAGE, (pageDonaciones + 1) * ITEMS_PER_PAGE)
                        .map((pasajero) => (
                          <TableRow key={pasajero.id} hover>
                            {visibleColumnsDonaciones.usuario && (
                              <>
                                <TableCell>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Avatar
                                      src={pasajero.photoUrl}
                                      sx={{ width: 36, height: 36, bgcolor: "#d7171a" }}
                                    >
                                      {pasajero.nombre?.charAt(0).toUpperCase() || "?"}
                                    </Avatar>
                                    <Typography sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                                      {pasajero.nombre}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                                  {pasajero.email}
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                                  {pasajero.departamento}
                                </TableCell>
                              </>
                            )}
                            {visibleColumnsDonaciones.donacionesAcumuladas && (
                              <TableCell>
                                <Chip
                                  label={`Bs. ${pasajero.donacionesAcumuladas.toFixed(2)}`}
                                  sx={{
                                    backgroundColor: "#d7171a",
                                    color: "white",
                                    fontWeight: 700,
                                    fontFamily: "Mulish, sans-serif",
                                  }}
                                />
                              </TableCell>
                            )}
                            {visibleColumnsDonaciones.ultimaDonacion && (
                              <>
                                <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                                  {pasajero.ultimaDonacion ? (
                                    pasajero.ultimaDonacion.fecha?.toDate
                                      ? pasajero.ultimaDonacion.fecha.toDate().toLocaleDateString("es-ES", {
                                          year: "numeric",
                                          month: "2-digit",
                                          day: "2-digit",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : new Date(pasajero.ultimaDonacion.fecha).toLocaleDateString("es-ES", {
                                          year: "numeric",
                                          month: "2-digit",
                                          day: "2-digit",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                                  {pasajero.ultimaDonacion?.monto ? `Bs. ${pasajero.ultimaDonacion.monto.toFixed(2)}` : "-"}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                  No hay pasajeros con donaciones
                </Typography>
              )}

              {pasajerosDonaciones.length > ITEMS_PER_PAGE && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Pagination
                    count={Math.ceil(
                      pasajerosDonaciones.filter(p => {
                        const search = searchDonaciones.toLowerCase();
                        return (
                          (p.nombre.toLowerCase().includes(search) ||
                          p.email.toLowerCase().includes(search) ||
                          p.departamento.toLowerCase().includes(search)) &&
                          (filterDepartamentoDonaciones === "todos" || p.departamento === filterDepartamentoDonaciones)
                        );
                      }).length / ITEMS_PER_PAGE
                    )}
                    page={pageDonaciones + 1}
                    onChange={(e, value) => setPageDonaciones(value - 1)}
                    color="standard"
                  />
                </Box>
              )}
            </Box>
          )}

          {/* TABLA DE CÓDIGOS PROMOCIONALES */}
          {selectedTab === 3 && (
            <Box>
              <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  sx={{ background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)", "&:hover": { background: "linear-gradient(135deg, #b01217 0%, #a01012 100%)" } }}
                  onClick={() => {
                    setSelectedPromo(null);
                    setModalPromoOpen(true);
                  }}
                >
                  + Nuevo Código
                </Button>
              </Box>

              {codigosPromo.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
                  <Table>
                    <TableHead sx={{ background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)" }}>
                      <TableRow>
                        <TableCell sx={{ color: "white", fontWeight: 700 }}>Código</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 700 }}>Departamento</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 700 }}>Descripción</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                          Descuento
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                          Usos
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                          Activo
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                          Acciones
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {codigosPromo.map((codigo) => (
                        <TableRow key={codigo.id} hover>
                          <TableCell>
                            <Chip
                              label={codigo.codigo}
                              sx={{
                                fontFamily: "monospace",
                                fontWeight: 700,
                                bgcolor: "#ffe0e0",
                                color: "#b01217",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {codigo.departamento || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 250 }}>
                              {codigo.descripcion || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${codigo.descuentoPorcentaje}%`}
                              sx={{
                                bgcolor: "#ffe0e0",
                                color: "#b01217",
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {codigo.usosActuales || 0}/{codigo.usosMaximos || "∞"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={codigo.activo ? "Activo" : "Inactivo"}
                              sx={{
                                bgcolor: codigo.activo ? "#ffe0e0" : "#ffcdd2",
                                color: codigo.activo ? "#b01217" : "#c62828",
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Editar">
                              <IconButton
                                onClick={() => {
                                  setSelectedPromo(codigo);
                                  setModalPromoOpen(true);
                                }}
                                size="small"
                                sx={{ color: "#d7171a" }}
                              >
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Copiar código">
                              <IconButton
                                onClick={() => copyToClipboard(codigo.codigo)}
                                size="small"
                                sx={{ color: "#d7171a" }}
                              >
                                <ContentCopyIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                  No hay códigos promocionales registrados
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Modal de historial */}
      <HistorialModal
        open={historialModalOpen}
        onClose={() => setHistorialModalOpen(false)}
        selectedReferido={selectedReferido}
        historialReferidos={historialReferidos}
      />

      {/* Modal de código promocional */}
      <ModalCodigoPromo
        open={modalPromoOpen}
        onClose={() => setModalPromoOpen(false)}
        codigoData={selectedPromo}
        onSaved={() => fetchCodigosPromo()}
        onDeleted={() => fetchCodigosPromo()}
      />

      {/* Snackbar de notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Paper>
    </Box>
  );
};

export default Referidos;