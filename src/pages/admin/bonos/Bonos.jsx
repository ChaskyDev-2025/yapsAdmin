import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  useReglasBonosConductores,
  useHistorialBonos,
  useTrabajadoresActivosConViajes,
} from "./hooks/useBonosData";
import {
  crearReglaBonosConductores,
  actualizarReglaBonosConductores,
  eliminarReglaBonosConductores,
} from "./services/bonosService";
import { DialogoReglaBonosConductores } from "./components/DialogoReglaBonosConductores";
import { TablaReglasBonosConductores } from "./components/TablaReglasBonosConductores";
import { TablaHistorialBonos } from "./components/TablaHistorialBonos";
import { TablaCarreras } from "./components/TablaCarreras";
import { EstadisticasCard } from "./components/EstadisticasCard";

const ITEMS_PER_PAGE = 10;

const Bonos = () => {
  const [tabValue, setTabValue] = useState(0);

  // Estados para diálogo de reglas
  const [reglasDialogOpen, setReglasDialogOpen] = useState(false);
  const [editingRegla, setEditingRegla] = useState(null);
  const [reglasForm, setReglasForm] = useState({ viajes: "", monto: "" });
  const [procesando, setProcesando] = useState(false);

  // Estados para paginación
  const [pageBonos, setPageBonos] = useState(0);

  // Data hooks
  const {
    reglas,
    loading: reglesLoading,
    error: reglasError,
    recargar: recargarReglas,
  } = useReglasBonosConductores();

  const {
    historial,
    loading: historialLoading,
    error: historialError,
  } = useHistorialBonos();

  const {
    trabajadores,
    loading: trabajadoresLoading,
    error: trabajadoresError,
  } = useTrabajadoresActivosConViajes();

  // ============ MANEJO DE REGLAS ============

  const handleAbrirReglasDialog = (regla = null) => {
    if (regla) {
      setEditingRegla(regla);
      setReglasForm({ viajes: regla.viajes, monto: regla.monto });
    } else {
      setEditingRegla(null);
      setReglasForm({ viajes: "", monto: "" });
    }
    setReglasDialogOpen(true);
  };

  const handleCerrarReglasDialog = () => {
    setReglasDialogOpen(false);
    setEditingRegla(null);
    setReglasForm({ viajes: "", monto: "" });
  };

  const handleFormChange = (field, value) => {
    setReglasForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGuardarRegla = async () => {
    if (!reglasForm.viajes || !reglasForm.monto) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      setProcesando(true);
      if (editingRegla) {
        await actualizarReglaBonosConductores(
          editingRegla.id,
          reglasForm.viajes,
          reglasForm.monto
        );
        alert("Regla actualizada exitosamente");
      } else {
        await crearReglaBonosConductores(reglasForm.viajes, reglasForm.monto);
        alert("Regla creada exitosamente");
      }
      handleCerrarReglasDialog();
      await recargarReglas();
    } catch (error) {
      alert("Error al guardar la regla");
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminarRegla = async (reglaId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta regla?"))
      return;

    try {
      setProcesando(true);
      await eliminarReglaBonosConductores(reglaId);
      await recargarReglas();
    } catch (error) {
      alert("Error al eliminar la regla");
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  // ============ CÁLCULOS DE ESTADÍSTICAS ============

  const estadisticas = useMemo(() => {
    return {
      totalBonosaplicados: historial.length,
      montoTotalAplicado: historial.reduce(
        (sum, b) => sum + (b.montoAplicado || 0),
        0
      ),
      conductoresConBonoEsta: new Set(
        historial
          .filter((b) => {
            const fechaAplicacion = new Date(b.fechaAplicacion);
            return fechaAplicacion.getMonth() === new Date().getMonth();
          })
          .map((b) => b.conductorId)
      ).size,
    };
  }, [historial]);

  // ============ PAGINACIÓN ============

  const historialPaginado = useMemo(() => {
    const start = pageBonos * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return historial.slice(start, end);
  }, [historial, pageBonos]);

  const totalPagesBonos = Math.ceil(historial.length / ITEMS_PER_PAGE);

  const isLoading = reglesLoading || historialLoading || trabajadoresLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        {/* Header */}
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 700,
            color: "#000000",
            fontFamily: "Mulish, sans-serif",
          }}
        >
          🎁 Bonos y Recompensas
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#484848", mb: 3, fontFamily: "Mulish, sans-serif" }}
        >
          Gestiona las reglas de bonos por rendimiento de conductores
        </Typography>

        {/* Errores */}
        {reglasError && <Alert severity="error">Error cargando reglas</Alert>}
        {historialError && (
          <Alert severity="error">Error cargando historial</Alert>
        )}
        {trabajadoresError && (
          <Alert severity="error">Error cargando trabajadores</Alert>
        )}

        {/* Estadísticas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <EstadisticasCard
            title="Bonos Aplicados"
            value={estadisticas.totalBonosaplicados}
          />
          <EstadisticasCard
            title="Monto Total"
            value={`Bs. ${estadisticas.montoTotalAplicado.toFixed(2)}`}
            bgColor="#e8f5e9"
          />
          <EstadisticasCard
            title="Este Mes"
            value={estadisticas.conductoresConBonoEsta}
            bgColor="#fff3e0"
          />
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="📋 Reglas de Bonos" />
            <Tab label="📊 Historial" />
            <Tab label="🏃 Carreras" />
          </Tabs>
        </Box>

        {/* TAB 1: Reglas de Bonos */}
        {tabValue === 0 && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ backgroundColor: "#d7171a" }}
                onClick={() => handleAbrirReglasDialog()}
                disabled={procesando}
              >
                Nueva Regla
              </Button>
            </Box>

            <TablaReglasBonosConductores
              reglas={reglas}
              onEditar={handleAbrirReglasDialog}
              onEliminar={handleEliminarRegla}
            />
          </Box>
        )}

        {/* TAB 2: Historial */}
        {tabValue === 1 && (
          <Box>
            <TablaHistorialBonos historial={historialPaginado} />

            {historial.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={totalPagesBonos}
                  page={pageBonos + 1}
                  onChange={(e, page) => setPageBonos(page - 1)}
                />
              </Box>
            )}
          </Box>
        )}

        {/* TAB 3: Carreras */}
        {tabValue === 2 && (
          <Box>
            <TablaCarreras trabajadores={trabajadores} />
          </Box>
        )}
      </Paper>

      {/* Diálogo para reglas */}
      <DialogoReglaBonosConductores
        open={reglasDialogOpen}
        onClose={handleCerrarReglasDialog}
        onGuardar={handleGuardarRegla}
        editando={!!editingRegla}
        formData={reglasForm}
        onFormChange={handleFormChange}
      />
    </Box>
  );
};

export default Bonos;
