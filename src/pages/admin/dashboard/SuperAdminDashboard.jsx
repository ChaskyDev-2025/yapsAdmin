import React, { useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import LoadingState from "./components/LoadingState";
import CardGrid from "./components/CardGrid";
import StatCard from "./components/StatCard";
import SummaryCard from "./components/SummaryCard";
import ChartsMetricsSuperAdmin from "./components/ChartsMetricsSuperAdmin";
import ChartOrdenesPorDia from "./components/ChartOrdenesPorDia";
import {
  DirectionsCar,
  CheckCircle,
  People,
  WarningAmber,
  LocalTaxi,
  CancelOutlined,
  Description,
  FavoriteBorder,
} from "@mui/icons-material";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import { FormControl, Select, MenuItem, Box, Typography } from "@mui/material";

const SuperAdminDashboard = () => {
  const { metricas, cargando } = useDashboardMetrics();
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");

  if (cargando) {
    return <LoadingState />;
  }

  // Obtener lista de departamentos disponibles
  const departamentos = Object.keys(metricas.donaciones.porDepartamento || {}).sort();
  
  // Si no hay departamento seleccionado, seleccionar el primero
  if (!departamentoSeleccionado && departamentos.length > 0) {
    setDepartamentoSeleccionado(departamentos[0]);
  }

  const donacionesDepartamento = departamentoSeleccionado 
    ? metricas.donaciones.porDepartamento[departamentoSeleccionado] || 0
    : 0;

  return (
    <div style={{ padding: "24px", backgroundColor: "#f3f4f6", minHeight: "100vh", width: "100%" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Encabezado */}
        <DashboardHeader />

        {/* FILA 1: Radiotaxis */}
        <CardGrid columns={4}>
          <StatCard
            title="Total de Radiotaxis"
            value={metricas.radiotaxis.total}
            icon={DirectionsCar}
            color="#d7171a"
          />
          <StatCard
            title="Radiotaxis Activos"
            value={metricas.radiotaxis.activos}
            icon={CheckCircle}
            color="#000000"
          />
          <StatCard
            title="Radiotaxis Inactivos"
            value={metricas.radiotaxis.inactivos}
            icon={DirectionsCar}
            color="#484848"
          />
          <StatCard
            title="Total de Usuarios"
            value={metricas.usuarios.totalPasajeros}
            icon={People}
            color="#000000"
          />
        </CardGrid>

        {/* SECCIÓN: Donaciones por Departamento */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
              💰 Donaciones por Departamento
            </Typography>
            <FormControl sx={{ minWidth: 280 }}>
              <Select
                value={departamentoSeleccionado}
                onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
                label="Seleccionar Departamento"
                sx={{ 
                  fontSize: "0.95rem",
                  backgroundColor: "#ffffff",
                  borderRadius: 1,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e5e7eb"
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#d7171a"
                  }
                }}
              >
                {departamentos.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <CardGrid columns={1}>
            <Box sx={{
              p: 3,
              backgroundColor: "linear-gradient(135deg, #fff3f0 0%, #ffe0e0 100%)",
              borderRadius: 2,
              border: "2px solid #d7171a",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(215, 23, 26, 0.1)"
            }}>
              <Typography variant="body2" sx={{ color: "#666", mb: 1, fontWeight: 500 }}>
                Total de Donaciones - {departamentoSeleccionado}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#d7171a", mb: 0.5 }}>
                Bs. {donacionesDepartamento.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#999", fontSize: "0.85rem" }}>
                Acumulado en este departamento
              </Typography>
            </Box>
          </CardGrid>

          {/* Grid de todos los departamentos */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 2 }}>
            {departamentos.map((dept) => (
              <Box
                key={dept}
                onClick={() => setDepartamentoSeleccionado(dept)}
                sx={{
                  p: 2.5,
                  backgroundColor: departamentoSeleccionado === dept ? "#ffffff" : "#fafbfc",
                  border: departamentoSeleccionado === dept ? "2px solid #d7171a" : "1px solid #e5e7eb",
                  borderRadius: 1.5,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: departamentoSeleccionado === dept ? "0 4px 12px rgba(215, 23, 26, 0.15)" : "0 1px 2px rgba(0,0,0,0.05)",
                  "&:hover": {
                    borderColor: "#d7171a",
                    boxShadow: "0 4px 12px rgba(215, 23, 26, 0.1)",
                    transform: "translateY(-2px)"
                  }
                }}
              >
                <Typography variant="body2" sx={{ color: "#666", mb: 1, fontWeight: 600 }}>
                  {dept}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#d7171a" }}>
                  Bs. {metricas.donaciones.porDepartamento[dept]?.toFixed(2) || "0.00"}
                </Typography>
                {departamentoSeleccionado === dept && (
                  <Box sx={{ 
                    mt: 1.5, 
                    pt: 1.5, 
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5
                  }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#d7171a" }} />
                    <Typography variant="caption" sx={{ color: "#d7171a", fontWeight: 600 }}>
                      Seleccionado
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* FILA 2: Gráficos */}
        <ChartsMetricsSuperAdmin metricas={metricas} />

        {/* FILA 3: Órdenes */}
        <CardGrid columns={4}>
          <StatCard
            title="Total de Órdenes"
            value={metricas.ordenes.total}
            icon={LocalTaxi}
            color="#d7171a"
          />
          <StatCard
            title="Órdenes Completadas"
            value={metricas.ordenes.completadas}
            icon={CheckCircle}
            color="#000000"
          />
          <StatCard
            title="Órdenes Canceladas"
            value={metricas.ordenes.canceladas}
            icon={CancelOutlined}
            color="#d7171a"
          />
          <StatCard
            title="Total Donaciones"
            value={`Bs. ${metricas.donaciones.totalAcumuladas.toFixed(2)}`}
            icon={FavoriteBorder}
            color="#d7171a"
          />
        </CardGrid>

        {/* FILA 3: Documentos */}
        <CardGrid columns={4}>
          <StatCard
            title="Total de Documentos"
            value={metricas.documentos.total}
            icon={Description}
            color="#d7171a"
          />
          <StatCard
            title="Documentos Pendientes"
            value={metricas.documentos.pendientes}
            icon={Description}
            color="#d7171a"
          />
          <StatCard
            title="Documentos Aprobados"
            value={metricas.documentos.aprobados}
            icon={Description}
            color="#000000"
          />
          <StatCard
            title="Documentos Rechazados"
            value={metricas.documentos.rechazados}
            icon={Description}
            color="#484848"
          />
        </CardGrid>

        {/* FILA 4: Resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginTop: "20px" }}>
          <SummaryCard
            title="👥 Actividad de Usuarios"
            titleColor="linear-gradient(135deg, #d7171a 0%, #a01214 100%)"
            items={[
              { label: "Nuevos Hoy", value: metricas.usuarios.nuevosHoy, color: "#d7171a" },
              { label: "Esta Semana", value: metricas.usuarios.nuevosEstaSemana, color: "#000000" },
              { label: "Activos", value: metricas.actividad.usuariosActivos, color: "#484848" },
            ]}
          />
          <SummaryCard
            title="📊 Resumen de Órdenes"
            titleColor="linear-gradient(135deg, #1f2937 0%, #000000 100%)"
            items={[
              { label: "Completadas", value: metricas.ordenes.completadas, color: "#000000" },
              { label: "Canceladas", value: metricas.ordenes.canceladas, color: "#d7171a" },
              { label: "Precio Promedio", value: `Bs. ${metricas.ordenes.promedioCosto.toFixed(2)}`, color: "#484848" },
            ]}
          />
        </div>

        {/* FILA 5: Gráfico de Órdenes por Día */}
        <ChartOrdenesPorDia />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
