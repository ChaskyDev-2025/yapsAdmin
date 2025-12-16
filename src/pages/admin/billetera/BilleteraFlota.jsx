import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Card,
  CardContent,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Pagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { TableToolbar } from "../usuarios/components/TableToolbar";
import { useAuth } from "../../../auth/AuthContext";
import {
  obtenerSolicitudesFlota,
  obtenerHistorialTransacciones,
  crearSolicitudRecarga,
  escucharSolicitudesFlota,
  escucharHistorialTransacciones,
  escucharSaldoFlota,
} from "../../../services/solicitudesRecargaService";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";

const BilleteraFlota = () => {
  const { userFlotaId } = useAuth();
  const flotaId = userFlotaId;
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
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
  const [searchHistorial, setSearchHistorial] = useState("");
  const [sortByHistorial, setSortByHistorial] = useState("fecha-desc");

  const cargarDatos = useCallback(async () => {
    if (!flotaId) {
      setLoading(false);
      return;
    }

    const getSaldo = async () => {
      try {
        const billeteraRef = doc(db, "flotas", flotaId, "billetera", "saldo");
        const docSnapshot = await getDoc(billeteraRef);

        if (docSnapshot.exists()) {
          return docSnapshot.data().monto || 0;
        }
        return 0;
      } catch (error) {
        console.error("Error al obtener saldo:", error);
        return 0;
      }
    };

    try {
      setLoading(true);

      const [solicitudesData, historialData, saldoData] = await Promise.all([
        obtenerSolicitudesFlota(flotaId),
        obtenerHistorialTransacciones(flotaId),
        getSaldo(),
      ]);

      setSolicitudes(solicitudesData);
      setHistorial(historialData);
      setSaldoActual(saldoData);
    } catch (error) {
      mostrarSnackbar("Error al cargar datos", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [flotaId]);

  useEffect(() => {
    if (!flotaId) {
      setLoading(false);
      return;
    }

    cargarDatos();

    // Listener en tiempo real para solicitudes
    const unsubscribeSolicitudes = escucharSolicitudesFlota(flotaId, (solicitudesActualizadas) => {
      setSolicitudes(solicitudesActualizadas);
    });

    // Listener en tiempo real para historial de transacciones
    const unsubscribeHistorial = escucharHistorialTransacciones(flotaId, (historialActualizado) => {
      setHistorial(historialActualizado);
      
      // Cuando el historial se actualiza, también actualizar el saldo
      const refrescarSaldo = async () => {
        try {
          const billeteraRef = doc(db, "flotas", flotaId, "billetera", "saldo");
          const docSnapshot = await getDoc(billeteraRef);
          if (docSnapshot.exists()) {
            setSaldoActual(docSnapshot.data().monto || 0);
          }
        } catch (error) {
          console.error("Error refrescando saldo:", error);
        }
      };
      refrescarSaldo();
    });

    // Listener en tiempo real para saldo
    const unsubscribeSaldo = escucharSaldoFlota(flotaId, (saldoActualizado) => {
      setSaldoActual(saldoActualizado);
    });

    // Cleanup
    return () => {
      if (unsubscribeSolicitudes) unsubscribeSolicitudes();
      if (unsubscribeHistorial) unsubscribeHistorial();
      if (unsubscribeSaldo) unsubscribeSaldo();
    };
  }, [cargarDatos, flotaId]);

  // Reset página de solicitudes al cambiar búsqueda
  useEffect(() => {
    setPageSolicitudes(0);
  }, [searchSolicitudes]);

  // Reset página de historial al cambiar búsqueda
  useEffect(() => {
    setPageHistorial(0);
  }, [searchHistorial]);

  const mostrarSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAbrirModal = () => {
    setMonto("");
    setConcepto("recarga");
    setNotas("");
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleSubmitSolicitud = async () => {
    try {
      if (!monto || parseFloat(monto) <= 0) {
        mostrarSnackbar("Ingresa un monto válido", "error");
        return;
      }

      setSubmitting(true);

      await crearSolicitudRecarga(
        flotaId,
        parseFloat(monto),
        concepto,
        notas
      );

      mostrarSnackbar("Solicitud enviada al superadmin", "success");
      handleModalClose();
      // NO recargar - el listener actualizará automáticamente
    } catch (error) {
      mostrarSnackbar(error.message || "Error al crear solicitud", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "warning";
      case "aprobada":
        return "success";
      case "rechazada":
        return "error";
      default:
        return "default";
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
    
    // Filtro por búsqueda
    if (searchSolicitudes) {
      const search = searchSolicitudes.toLowerCase();
      filtered = filtered.filter(s =>
        (s.concepto || "").toLowerCase().includes(search) ||
        (s.notas || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenamiento
    const sorted = [...filtered];
    switch (sortBySolicitudes) {
      case "fecha-asc":
        sorted.sort((a, b) => new Date(a.fechaSolicitud?.toDate?.() || 0) - new Date(b.fechaSolicitud?.toDate?.() || 0));
        break;
      case "fecha-desc":
        sorted.sort((a, b) => new Date(b.fechaSolicitud?.toDate?.() || 0) - new Date(a.fechaSolicitud?.toDate?.() || 0));
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
  }, [solicitudes, searchSolicitudes, sortBySolicitudes]);

  // Paginación para solicitudes
  const solicitudesPaginadas = useMemo(() => {
    const start = pageSolicitudes * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return solicitudesFiltradas.slice(start, end);
  }, [solicitudesFiltradas, pageSolicitudes]);

  const totalPagesSolicitudes = Math.ceil(solicitudesFiltradas.length / ITEMS_PER_PAGE);

  // Filtrado y ordenamiento para historial
  const historialFiltrado = useMemo(() => {
    let filtered = historial;
    
    // Filtro por búsqueda
    if (searchHistorial) {
      const search = searchHistorial.toLowerCase();
      filtered = filtered.filter(h =>
        (h.concepto || "").toLowerCase().includes(search) ||
        (h.tipo || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByHistorial) {
      case "fecha-asc":
        sorted.sort((a, b) => new Date(a.fechaRegistro || 0) - new Date(b.fechaRegistro || 0));
        break;
      case "fecha-desc":
        sorted.sort((a, b) => new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0));
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
  }, [historial, searchHistorial, sortByHistorial]);

  // Paginación para historial
  const historialPaginado = useMemo(() => {
    const start = pageHistorial * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return historialFiltrado.slice(start, end);
  }, [historialFiltrado, pageHistorial]);

  const totalPagesHistorial = Math.ceil(historialFiltrado.length / ITEMS_PER_PAGE);

  if (!flotaId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tienes asociada una flota. Contacta al administrador.</Alert>
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
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#000000" }}>
          💳 Mi Billetera
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", mb: 3, fontFamily: "Mulish, sans-serif" }}>
          Gestiona tu saldo y solicitudes de recarga
        </Typography>

        {/* Tarjeta de Saldo */}
        <Card sx={{ mb: 4, background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)" }}>
          <CardContent>
            <Typography sx={{ color: "#fff", opacity: 0.8, mb: 1, fontFamily: "Mulish, sans-serif" }}>
              Saldo Disponible
            </Typography>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "2rem", fontFamily: "Mulish, sans-serif" }}>
              ${saldoActual.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>

        {/* Botón para nueva solicitud */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAbrirModal}
            sx={{ 
              backgroundColor: "#d7171a", 
              color: "white", 
              fontWeight: 600,
              fontFamily: "Mulish, sans-serif",
              "&:hover": { backgroundColor: "#b01217" }
            }}
          >
            Solicitar Recarga
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
            <Tab label="📊 Historial de Transacciones" />
          </Tabs>
        </Box>

        {/* TAB 1: SOLICITUDES */}
        {tabValue === 0 && (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
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
                />
              </Box>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table stickyHeader>
                <TableHead sx={{ backgroundColor: "#000000" }}>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Fecha</TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Monto</TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Concepto</TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Estado</TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Notas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solicitudesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                          No hay solicitudes de recarga
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    solicitudesPaginadas.map((solicitud) => (
                      <TableRow key={solicitud.id} sx={{ borderBottom: "1px solid #d0d0d0" }}>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          {solicitud.fechaSolicitud?.toDate?.().toLocaleDateString("es-ES") ||
                            "N/A"}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                          ${solicitud.monto.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>{solicitud.concepto}</TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          <Chip
                            label={getEstadoLabel(solicitud.estado)}
                            size="small"
                            sx={{
                              bgcolor: solicitud.estado === "aprobada" ? "#d7171a" : 
                                      solicitud.estado === "rechazada" ? "#ff5252" :
                                      "#ffc107",
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontSize: "0.9rem" }}>
                          {solicitud.estado === "rechazada" && solicitud.razonRechazo
                            ? `Rechazada: ${solicitud.razonRechazo}`
                            : solicitud.notas || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {solicitudesFiltradas.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                  Mostrando {pageSolicitudes * ITEMS_PER_PAGE + 1} - {Math.min((pageSolicitudes + 1) * ITEMS_PER_PAGE, solicitudesFiltradas.length)} de {solicitudesFiltradas.length}
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

        {/* TAB 2: HISTORIAL */}
        {tabValue === 1 && (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TableToolbar
                  searchValue={searchHistorial}
                  onSearchChange={setSearchHistorial}
                  sortValue={sortByHistorial}
                  onSortChange={setSortByHistorial}
                  sortOptions={[
                    { label: "↑ Fecha (Más antigua)", value: "fecha-asc" },
                    { label: "↓ Fecha (Más reciente)", value: "fecha-desc" },
                    { label: "↑ Monto (Menor)", value: "monto-asc" },
                    { label: "↓ Monto (Mayor)", value: "monto-desc" },
                  ]}
                />
              </Box>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table stickyHeader>
                <TableHead sx={{ backgroundColor: "#000000" }}>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Fecha</TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Tipo</TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Monto</TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Concepto</TableCell>
                    <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Saldo Posterior</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialFiltrado.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                          No hay transacciones registradas
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    historialPaginado.map((tx) => (
                      <TableRow key={tx.id} sx={{ borderBottom: "1px solid #d0d0d0" }}>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>{tx.fechaRegistro}</TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                          <Chip
                            label={
                              tx.tipo === "deposito" ? "Depósito" : "Retiro"
                            }
                            size="small"
                            sx={{
                              bgcolor: tx.tipo === "deposito" ? "#d7171a" : "#ff5252",
                              color: "#fff",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                          ${Math.abs(tx.monto).toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>{tx.concepto}</TableCell>
                        <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600, color: "#d7171a" }}>
                          ${tx.saldoNuevo.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {historialFiltrado.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                  Mostrando {pageHistorial * ITEMS_PER_PAGE + 1} - {Math.min((pageHistorial + 1) * ITEMS_PER_PAGE, historialFiltrado.length)} de {historialFiltrado.length}
                </Typography>
                <Pagination
                  count={totalPagesHistorial}
                  page={pageHistorial + 1}
                  onChange={(e, page) => setPageHistorial(page - 1)}
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

        {/* MODAL NUEVA SOLICITUD */}
        <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
          <DialogTitle>Solicitar Recarga</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
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
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Cancelar</Button>
            <Button
              onClick={handleSubmitSolicitud}
              variant="contained"
              disabled={submitting}
              sx={{ 
                backgroundColor: "#d7171a",
                "&:hover": { backgroundColor: "#b01217" }
              }}
            >
              {submitting ? "Enviando..." : "Enviar Solicitud"}
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
      </Paper>

      </Box>
  );
};

export default BilleteraFlota;
