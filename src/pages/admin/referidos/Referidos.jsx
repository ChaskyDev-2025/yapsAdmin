// src/pages/admin/referidos/Referidos.jsx
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";
import TableToolbar from "../usuarios/components/TableToolbar";
import { collection, getDocs } from "firebase/firestore";
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
  const [stats, setStats] = useState({
    total: 0,
    totalReferidos: 0,
    totalTickets: 0,
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
  const [sortByTrabajadores, setSortByTrabajadores] = useState("referidos-desc");
  const [visibleColumnsTrabajadores, setVisibleColumnsTrabajadores] = useState({
    ranking: true,
    usuario: true,
    codigo: true,
    referidos: true,
    acciones: true,
  });
  const [searchPasajeros, setSearchPasajeros] = useState("");
  const [sortByPasajeros, setSortByPasajeros] = useState("referidos-desc");
  const [visibleColumnsPasajeros, setVisibleColumnsPasajeros] = useState({
    ranking: true,
    usuario: true,
    codigo: true,
    referidos: true,
    acciones: true,
  });

  useEffect(() => {
    // Cargar datos en paralelo para optimizar (SOLO LECTURA)
    const inicializar = async () => {
      setLoading(true);
      try {
        // Ejecutar todas las cargas en paralelo
        await Promise.all([
          fetchReferidosData(),
          fetchCodigosPromo(),
        ]);
      } catch (error) {
        console.error("Error en inicialización:", error);
      } finally {
        setLoading(false);
      }
    };
    
    inicializar();
  }, []);

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
          nombre: trabajador.perfil?.name || trabajador.nombre || "Sin nombre",
          email: trabajador.perfil?.email || trabajador.email || "Sin email",
          codigo: trabajador.codigoReferido || "-",
          referidos: referidosCount,
          tickets: ticketsCount,
          ticketsMap: trabajador.tickets || {},
          photoUrl: trabajador.perfil?.photoUrl || null,
          referidosAplicados: trabajador.referidosAplicados || [],
          pasajerosMap: pasajerosMap,
          modo: "trabajador",
          tieneCodigoReferido: !!trabajador.codigoReferido,
        };
      });

      // Procesar pasajeros
      const dataPasajeros = pasajerosSnapshot.docs.map((doc) => {
        const pasajero = doc.data();
        
        const referidosCount = pasajero.referidosAplicados?.length || 0;
        const ticketsCount = typeof pasajero.tickets === 'object' && !Array.isArray(pasajero.tickets)
          ? Object.values(pasajero.tickets)
              .filter(v => typeof v === 'number')
              .reduce((sum, count) => sum + count, 0)
          : 0;

        totalReferidos += referidosCount;
        totalTickets += ticketsCount;

        return {
          id: doc.id,
          nombre: pasajero.perfil?.name || "Sin nombre",
          email: pasajero.perfil?.email || "Sin email",
          codigo: pasajero.codigoReferido || "-",
          referidos: referidosCount,
          tickets: ticketsCount,
          ticketsMap: pasajero.tickets || {},
          photoUrl: pasajero.perfil?.photoUrl || null,
          referidosAplicados: pasajero.referidosAplicados || [],
          pasajerosMap: pasajerosMap,
          modo: pasajero.modo || "pasajero",
          tieneCodigoReferido: !!pasajero.codigoReferido,
        };
      });

      // Combinar y ordenar
      const allData = [...data, ...dataPasajeros];
      allData.sort((a, b) => {
        if (b.referidos !== a.referidos) {
          return b.referidos - a.referidos;
        }
        return a.nombre.localeCompare(b.nombre);
      });

      setReferidosData(allData);
      setStats({
        total: allData.length,
        totalReferidos,
        totalTickets,
      });
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
      <StatsGrid stats={stats} loading={loading} />

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
                      { label: "↓ Sort by Referidos (DESC)", value: "referidos-desc" },
                    ]}
                    visibleColumns={visibleColumnsTrabajadores}
                    onColumnChange={(col, visible) => setVisibleColumnsTrabajadores(prev => ({ ...prev, [col]: visible }))}
                    showClearButton={searchTrabajadores !== ""}
                    onClear={() => {
                      setSearchTrabajadores("");
                      setSortByTrabajadores("referidos-desc");
                    }}
                  />
                </Box>
              </Box>
              {referidosData.filter(r => r.modo === "trabajador").length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#000000" }}>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Ranking</TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Usuario</TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Código</TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                          Referidos
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                          Tickets
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                          Acciones
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {referidosData
                        .filter(r => r.modo === "trabajador")
                        .map((referido, index) => (
                          <TableRow key={referido.id} hover>
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
                            <TableCell align="center">
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={referido.referidos > 0 ? "#d7171a" : "#bdbdbd"}
                              >
                                {referido.referidos}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={referido.tickets > 0 ? "#ff9800" : "#bdbdbd"}
                              >
                                {referido.tickets}
                              </Typography>
                            </TableCell>
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
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
                      { label: "↑ Sort by Referidos (ASC)", value: "referidos-asc" },
                      { label: "↓ Sort by Referidos (DESC)", value: "referidos-desc" },
                    ]}
                    visibleColumns={visibleColumnsPasajeros}
                    onColumnChange={(col, visible) => setVisibleColumnsPasajeros(prev => ({ ...prev, [col]: visible }))}
                    showClearButton={searchPasajeros !== ""}
                    onClear={() => {
                      setSearchPasajeros("");
                      setSortByPasajeros("referidos-desc");
                    }}
                  />
                </Box>
              </Box>
              {referidosData.filter(r => r.modo === "pasajero").length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#000000" }}>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Ranking</TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Usuario</TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Código</TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                          Referidos
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                          Tickets
                        </TableCell>
                        <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }} align="center">
                          Acciones
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {referidosData
                        .filter(r => r.modo === "pasajero")
                        .map((referido, index) => (
                          <TableRow key={referido.id} hover>
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
                            <TableCell align="center">
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={referido.referidos > 0 ? "#d7171a" : "#bdbdbd"}
                              >
                                {referido.referidos}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={referido.tickets > 0 ? "#ff9800" : "#bdbdbd"}
                              >
                                {referido.tickets}
                              </Typography>
                            </TableCell>
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
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                  No hay pasajeros registrados
                </Typography>
              )}
            </Box>
          )}

          {/* TABLA DE CÓDIGOS PROMOCIONALES */}
          {selectedTab === 2 && (
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