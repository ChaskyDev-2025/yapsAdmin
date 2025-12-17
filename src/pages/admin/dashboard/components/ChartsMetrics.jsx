import React from "react";
import { Box, Paper, Typography, Grid } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTrendenciaTrabajadores } from "../hooks/useTrendenciaTrabajadores";

const COLORS = ["#d7171a", "#FF8042", "#00C49F", "#0088FE"];

export default function ChartsMetrics({ metricas }) {
  const { trendData, loading: trendLoading } = useTrendenciaTrabajadores();

  // Datos para gráfico de pie (órdenes por estado)
  const ordenesData = [
    { name: "Completadas", value: metricas.ordenes?.completadas || 0 },
    { name: "Canceladas", value: metricas.ordenes?.canceladas || 0 },
    { name: "En progreso", value: (metricas.ordenes?.total || 0) - (metricas.ordenes?.completadas || 0) - (metricas.ordenes?.canceladas || 0) },
  ];

  // Datos para gráfico de pie (documentos)
  const documentosData = [
    { name: "Aprobados", value: metricas.documentos?.aprobados || 0 },
    { name: "Pendientes", value: metricas.documentos?.pendientes || 0 },
    { name: "Rechazados", value: metricas.documentos?.rechazados || 0 },
  ];

  return (
    <Grid container spacing={3} sx={{ mt: 0 }}>
      {/* Gráfico de Línea - Tendencia de usuarios y trabajadores */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TrendingUpIcon sx={{ mr: 1, color: "#d7171a", fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              Tendencia de Trabajadores Registrados
            </Typography>
          </Box>
          {trendLoading ? (
            <Typography color="textSecondary">Cargando datos...</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d7171a",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="trabajadores"
                  stroke="#d7171a"
                  strokeWidth={3}
                  dot={{ fill: "#d7171a", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Trabajadores Registrados"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Grid>

      {/* Gráfico de Pie - Órdenes */}
      <Grid item xs={12} sm={6} lg={6}>
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Estado de Órdenes
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ordenesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ordenesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Gráfico de Pie - Documentos */}
      <Grid item xs={12} sm={6} lg={6}>
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Estado de Documentos
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={documentosData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {documentosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
}
