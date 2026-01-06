import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import {
  useReglasBonosConductores,
  useConductoresFlotaConViajes,
} from "../bonos/hooks/useBonosData";
import { aplicarBonoConductor } from "../bonos/services/bonosService";
import { useAuth } from "../../../auth/AuthContext";
import { DialogoAplicarBono } from "./components/DialogoAplicarBono";
import { TablaConductoresAplicarBono } from "./components/TablaConductoresAplicarBono";
import { EstadisticasCard } from "../bonos/components/EstadisticasCard";

const BonosAdmin = () => {
  // Estados para diálogo
  const [aplicarBonoDialogOpen, setAplicarBonoDialogOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState(null);
  const [selectedRegla, setSelectedRegla] = useState(null);

  // Obtener flota del admin actual
  const { userFlotaId } = useAuth();

  // Data hooks
  const {
    reglas,
    loading: reglasLoading,
    error: reglasError,
  } = useReglasBonosConductores();

  const {
    conductores,
    viajesConductores,
    loading: conductoresLoading,
    error: conductoresError,
    recargar: recargarConductores,
  } = useConductoresFlotaConViajes(userFlotaId);

  // Conductores que califican
  const conductoresQueCaificican = useMemo(() => {
    return conductores.filter((conductor) => {
      const totalViajes = viajesConductores[conductor.id] || 0;
      return reglas.some((regla) => totalViajes >= regla.viajes);
    });
  }, [conductores, viajesConductores, reglas]);

  // Reglas disponibles para un conductor
  const obtenerReglasDisponibles = (conductorId) => {
    const totalViajes = viajesConductores[conductorId] || 0;
    return reglas.filter((regla) => totalViajes >= regla.viajes);
  };

  // ============ MANEJO DE DIÁLOGO ============

  const handleAbrirAplicarBono = (conductor) => {
    setSelectedConductor(conductor);
    setSelectedRegla(null);
    setAplicarBonoDialogOpen(true);
  };

  const handleCerrarAplicarBono = () => {
    setAplicarBonoDialogOpen(false);
    setSelectedConductor(null);
    setSelectedRegla(null);
  };

  // ============ APLICAR BONO ============

  const handleConfirmarBono = async () => {
    if (!selectedConductor || !selectedRegla) {
      alert("Selecciona conductor y regla de bono");
      return;
    }

    try {
      const totalViajes = viajesConductores[selectedConductor.id];
      await aplicarBonoConductor(selectedConductor.id, selectedRegla, totalViajes);
      
      alert("Bono aplicado exitosamente");
      handleCerrarAplicarBono();
      await recargarConductores();
    } catch (error) {
      alert("Error al aplicar el bono");
      console.error(error);
    }
  };

  // Estadísticas para mostrar
  const estadisticas = useMemo(() => {
    return {
      totalConductoresCalifican: conductoresQueCaificican.length,
      totalViajesTotales: conductoresQueCaificican.reduce(
        (sum, c) => sum + (viajesConductores[c.id] || 0),
        0
      ),
      reglasDisponibles: reglas.length,
    };
  }, [conductoresQueCaificican, viajesConductores, reglas]);

  const isLoading = reglasLoading || conductoresLoading;

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
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
          💰 Asignar Bonos a Conductores
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#484848", mb: 3, fontFamily: "Mulish, sans-serif" }}
        >
          Aplica bonos a los conductores que han cumplido con los requisitos de viajes
        </Typography>

        {/* Errores */}
        {reglasError && <Alert severity="error">Error cargando reglas</Alert>}
        {conductoresError && (
          <Alert severity="error">Error cargando conductores</Alert>
        )}

        {/* Estadísticas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <EstadisticasCard
            title="Conductores que Califican"
            value={estadisticas.totalConductoresCalifican}
          />
          <EstadisticasCard
            title="Total Viajes"
            value={estadisticas.totalViajesTotales}
            bgColor="#e8f5e9"
          />
          <EstadisticasCard
            title="Reglas Disponibles"
            value={estadisticas.reglasDisponibles}
            bgColor="#fff3e0"
          />
        </Grid>

        {/* Tabla de conductores que califican */}
        <Box sx={{ backgroundColor: "white", borderRadius: 2, p: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              marginBottom: 2,
              color: "#000",
              fontFamily: "Mulish, sans-serif",
            }}
          >
            Conductores Disponibles
          </Typography>

          <TablaConductoresAplicarBono
            conductores={conductoresQueCaificican}
            viajesConductores={viajesConductores}
            reglas={reglas}
            onAsignar={handleAbrirAplicarBono}
          />
        </Box>
      </Paper>

      {/* Diálogo para aplicar bono */}
      <DialogoAplicarBono
        open={aplicarBonoDialogOpen}
        onClose={handleCerrarAplicarBono}
        onConfirmar={handleConfirmarBono}
        conductor={selectedConductor}
        reglasDisponibles={
          selectedConductor
            ? obtenerReglasDisponibles(selectedConductor.id)
            : []
        }
        reglaSeleccionada={selectedRegla}
        onReglaChange={setSelectedRegla}
      />
    </Box>
  );
};

export default BonosAdmin;
