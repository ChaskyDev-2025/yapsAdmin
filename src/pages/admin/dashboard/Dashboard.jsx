import { Typography, Box, Grid, Card, CardContent } from "@mui/material";
import {
  DirectionsCar,
  People,
  Description,
  CheckCircle,
  AccountBalanceWallet,
  TrendingUp,
  Notifications,
} from "@mui/icons-material";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";

const Dashboard = () => {
  const metricas = {
    radiotaxis: { total: 145, activos: 132, inactivos: 13 },
    documentos: { pendientes: 28, aprobados: 412, rechazados: 15 },
    onboarding: { completados: 95, pendientes: 12 },
    finanzas: { saldoTotal: 45230.5, recargasHoy: 12, ingresosMes: 125400 },
    actividad: { nuevosHoy: 8, usuariosActivos: 234, alertas: 5 },
  };
  const { totalUsuarios, cargando } = useDashboardMetrics();

  // Componente para las tarjetas principales (style similar a la imagen)
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        borderRadius: 2,
        color: "white",
        p: 2.5,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 140,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          right: -20,
          top: -20,
          width: 120,
          height: 120,
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
        },
      }}
    >
      <Box sx={{ zIndex: 1 }}>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {value}
        </Typography>
      </Box>
      <Box
        sx={{
          zIndex: 1,
          backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: 2,
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ fontSize: 40, color: "white" }} />
      </Box>
    </Card>
  );

  // Componente para los gráficos (placeholder)
  const ChartPlaceholder = ({ title }) => (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid #e0e0e0" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          {title}
        </Typography>
        <Box
          sx={{
            height: 280,
            backgroundColor: "#f9f9f9",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed #ddd",
          }}
        >
          <Typography color="text.secondary">Espacio para gráfico</Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: "#fafafa", minHeight: "100vh", width: "100%" }}>
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        {/* Encabezado */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
            Panel de Control
          </Typography>
          <Typography color="text.secondary">
            Aquí puedes visualizar las métricas principales del sistema.
          </Typography>
        </Box>

        {/* FILA 1: 4 Tarjetas principales */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <StatCard
              title="Completados"
              value={metricas.onboarding.completados}
              icon={CheckCircle}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <StatCard
              title="Cancelados"
              value={metricas.radiotaxis.inactivos}
              icon={Notifications}
              color="#f44336"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <StatCard
              title="Comisiones Total"
              value={`Bs. ${(metricas.finanzas.ingresosMes / 10).toLocaleString("es-PE", { maximumFractionDigits: 2 })}`}
              icon={AccountBalanceWallet}
              color="#9c27b0"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={3}>
            <StatCard
              title="Recargas Total"
              value={`Bs. ${metricas.finanzas.saldoTotal.toLocaleString("es-PE", { maximumFractionDigits: 2 })}`}
              icon={TrendingUp}
              color="#00bcd4"
            />
          </Grid>
        </Grid>

        {/* FILA 2: Gráficos principales */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <ChartPlaceholder title="Comparativa Mensual: Viajes e Ingresos" />
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartPlaceholder title="Tendencia de Viajes por Mes" />
          </Grid>
        </Grid>

        {/* FILA 3: Resumen y más gráficos */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid #e0e0e0" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Estado Actual de Viajes
                </Typography>
                <Box
                  sx={{
                    height: 250,
                    backgroundColor: "#f9f9f9",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #ddd",
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      Gráfico circular
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          Completados
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#4caf50",
                          }}
                        >
                          {metricas.onboarding.completados}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          50% del total
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          Cancelados
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#f44336",
                          }}
                        >
                          {metricas.radiotaxis.inactivos}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          50% del total
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartPlaceholder title="Análisis Adicional" />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
