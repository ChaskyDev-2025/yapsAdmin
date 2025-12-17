import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTendenciaOrdenes } from "../hooks/useTendenciaOrdenes";

export default function ChartOrdenesPorDia() {
  const { trendData, loading } = useTendenciaOrdenes();

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <TrendingUpIcon sx={{ mr: 1, color: "#d7171a", fontSize: 28 }} />
        <Typography variant="h6" fontWeight={700}>
          Órdenes por Día
        </Typography>
      </Box>
      {loading ? (
        <Typography color="textSecondary">Cargando datos...</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={trendData}>
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
            <Bar
              dataKey="ordenes"
              fill="#d7171a"
              radius={[8, 8, 0, 0]}
              name="Órdenes"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}
