import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTrendenciaTrabajadores } from "../hooks/useTrendenciaTrabajadores";

const COLORS = ["#d7171a", "#FF8042", "#00C49F"];
const COLORS_SOLICITUDES = ["#FF0000", "#FF6B00", "#00D084", "#0088FF", "#FF00FF", "#FFD700", "#FF1493", "#00CED1"];

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

  // Datos para gráfico de pie (solicitudes - Desglosadas por estado)
  const solicitudesData = [
    { name: "Asignada", shortName: "Asign.", value: metricas.solicitudes?.asignada || 0 },
    { name: "Ofertado", shortName: "Ofer.", value: metricas.solicitudes?.ofertado || 0 },
    { name: "Aceptado", shortName: "Acept.", value: metricas.solicitudes?.aceptado || 0 },
    { name: "Conductor Asignado", shortName: "Cond.", value: metricas.solicitudes?.conductorAsignado || 0 },
    { name: "En Curso", shortName: "Curso", value: metricas.solicitudes?.enCurso || 0 },
    { name: "Finalizado", shortName: "Final.", value: metricas.solicitudes?.finalizado || 0 },
    { name: "Rechazadas/Canceladas", shortName: "Rech.", value: metricas.solicitudes?.rechazado || 0 },
    { name: "Solicitado", shortName: "Solid.", value: metricas.solicitudes?.solicitado || 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Gráfico de Línea - Tendencia de usuarios y trabajadores */}
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
          <ResponsiveContainer width="100%" height={400}>
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

      {/* Contenedor de Pie Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
        {/* Gráfico de Pie - Órdenes */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ textAlign: "center" }}>
            Estado de Órdenes
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={ordenesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ordenesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {ordenesData.map((item, idx) => (
              <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "2px",
                    backgroundColor: COLORS[idx],
                  }}
                />
                <Typography variant="body2">
                  {item.name}: {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Gráfico de Pie - Documentos */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ textAlign: "center" }}>
            Estado de Documentos
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={documentosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {documentosData.map((item, idx) => (
              <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "2px",
                    backgroundColor: COLORS[idx],
                  }}
                />
                <Typography variant="body2">
                  {item.name}: {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Gráfico de Barras - Solicitudes */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", gridColumn: "span 2" }}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ textAlign: "center" }}>
            Estado de Solicitudes
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={solicitudesData} margin={{ top: 20, right: 30, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="#888" />
              <Tooltip 
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <Box sx={{ backgroundColor: "#fff", border: "1px solid #ddd", p: 1, borderRadius: 1 }}>
                        <Typography variant="body2">
                          {payload[0].payload.name}: {payload[0].value}
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill="#FF6B6B" radius={[8, 8, 0, 0]}>
                {solicitudesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_SOLICITUDES[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </div>
    </div>
  );
}
