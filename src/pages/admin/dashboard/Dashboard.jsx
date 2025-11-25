import { Typography, Box, Grid, Card, CardContent, Paper } from "@mui/material";
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
  // Datos de ejemplo - TODO: Conectar con base de datos real
  const metricas = {
    radiotaxis: { total: 145, activos: 132, inactivos: 13 },
    documentos: { pendientes: 28, aprobados: 412, rechazados: 15 },
    onboarding: { completados: 95, pendientes: 12 },
    finanzas: { saldoTotal: 45230.5, recargasHoy: 12, ingresosMes: 125400 },
    actividad: { nuevosHoy: 8, usuariosActivos: 234, alertas: 5 },
  };
  const { totalUsuarios, cargando } = useDashboardMetrics();

  // Componente reutilizable para mostrar cards de métricas
  const MetricCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        backgroundColor: "white",
        border: "0.1px solid rgba(146, 144, 144, 0.3)",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              color="text.secondary"
              gutterBottom
              variant="body2"
              sx={{ fontSize: "0.875rem" }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              sx={{ mb: 1, fontWeight: "bold" }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8rem" }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color || "#1976d2",
              borderRadius: "12px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ fontSize: 32, color: "white" }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Paper
      elevation={6}
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: "#f9f9f9",
        mx: "auto",
        maxWidth: 1400,
        border: "0.1px solid rgba(146, 144, 144, 1)",
        minHeight: "80vh",
      }}
    >
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>

      <Typography gutterBottom color="text.secondary" sx={{ mb: 3 }}>
        Aquí puedes visualizar las métricas principales del sistema.
      </Typography>

      {/* Sección 1: Métricas Principales */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{ mt: 3, mb: 2, fontWeight: 600 }}
      >
        Métricas Principales
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Radiotaxis"
            value={metricas.radiotaxis.total}
            subtitle={`${metricas.radiotaxis.activos} activos / ${metricas.radiotaxis.inactivos} inactivos`}
            icon={DirectionsCar}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Usuarios"
            value={cargando ? "..." : totalUsuarios.toLocaleString()}
            subtitle="Registrados en el sistema"
            icon={People}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Documentos Pendientes"
            value={metricas.documentos.pendientes}
            subtitle={`${metricas.documentos.aprobados} aprobados`}
            icon={Description}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Onboarding Completados"
            value={metricas.onboarding.completados}
            subtitle={`${metricas.onboarding.pendientes} pendientes`}
            icon={CheckCircle}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Sección 2: Métricas Financieras */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{ mt: 4, mb: 2, fontWeight: 600 }}
      >
        Métricas Financieras
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Saldo Total del Sistema"
            value={`S/. ${metricas.finanzas.saldoTotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
            subtitle="Saldo acumulado"
            icon={AccountBalanceWallet}
            color="#00bcd4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Recargas de Hoy"
            value={metricas.finanzas.recargasHoy}
            subtitle="Transacciones realizadas"
            icon={TrendingUp}
            color="#8bc34a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Ingresos del Mes"
            value={`S/. ${metricas.finanzas.ingresosMes.toLocaleString("es-PE")}`}
            subtitle="Noviembre 2025"
            icon={TrendingUp}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      {/* Sección 3: Actividad Reciente */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{ mt: 4, mb: 2, fontWeight: 600 }}
      >
        Actividad Reciente
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Nuevos Radiotaxis (24h)"
            value={metricas.actividad.nuevosHoy}
            subtitle="Registrados hoy"
            icon={DirectionsCar}
            color="#673ab7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Usuarios Activos Hoy"
            value={metricas.actividad.usuariosActivos}
            subtitle="Conectados recientemente"
            icon={People}
            color="#3f51b5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Alertas Pendientes"
            value={metricas.actividad.alertas}
            subtitle="Requieren atención"
            icon={Notifications}
            color="#f44336"
          />
        </Grid>
      </Grid>

      {/* Sección 4: Estado del Sistema */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{ mt: 4, mb: 2, fontWeight: 600 }}
      >
        Estado del Sistema
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              backgroundColor: "white",
              border: "0.1px solid rgba(146, 144, 144, 0.3)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Documentos por Estado
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Aprobados</Typography>
                  <Typography variant="body2" fontWeight="bold" color="#4caf50">
                    {metricas.documentos.aprobados}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Pendientes</Typography>
                  <Typography variant="body2" fontWeight="bold" color="#ff9800">
                    {metricas.documentos.pendientes}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Rechazados</Typography>
                  <Typography variant="body2" fontWeight="bold" color="#f44336">
                    {metricas.documentos.rechazados}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              backgroundColor: "white",
              border: "0.1px solid rgba(146, 144, 144, 0.3)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Estado de Radiotaxis
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Activos</Typography>
                  <Typography variant="body2" fontWeight="bold" color="#4caf50">
                    {metricas.radiotaxis.activos} (
                    {Math.round(
                      (metricas.radiotaxis.activos /
                        metricas.radiotaxis.total) *
                        100
                    )}
                    %)
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Inactivos</Typography>
                  <Typography variant="body2" fontWeight="bold" color="#f44336">
                    {metricas.radiotaxis.inactivos} (
                    {Math.round(
                      (metricas.radiotaxis.inactivos /
                        metricas.radiotaxis.total) *
                        100
                    )}
                    %)
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Total</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {metricas.radiotaxis.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Dashboard;
