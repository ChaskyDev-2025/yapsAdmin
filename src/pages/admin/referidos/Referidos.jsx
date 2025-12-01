// src/pages/admin/referidos/Referidos.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";

const Referidos = () => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalReferidos: 0,
    totalTickets: 0,
  });

  useEffect(() => {
    fetchTrabajadores();
  }, []);

  const fetchTrabajadores = async () => {
    try {
      setLoading(true);
      const trabajadoresRef = collection(db, "trabajadores");
      const snapshot = await getDocs(trabajadoresRef);

      let totalReferidos = 0;
      let totalTickets = 0;

      const data = snapshot.docs.map((doc) => {
        const trabajador = doc.data();
        totalReferidos += trabajador.referidosCount || 0;
        totalTickets += trabajador.tickets || 0;

        return {
          id: doc.id,
          nombre: trabajador.name || trabajador.nombre || trabajador.perfil?.name || "Sin nombre",
          email: trabajador.email || trabajador.perfil?.email || "Sin email",
          codigo: trabajador.codigoReferido || "N/A",
          referidos: trabajador.referidosCount || 0,
          tickets: trabajador.tickets || 0,
          photoUrl: trabajador.photoUrl || trabajador.perfil?.photoUrl || null,
        };
      });

      // Ordenar por más referidos
      data.sort((a, b) => b.referidos - a.referidos);

      setTrabajadores(data);
      setStats({
        total: data.length,
        totalReferidos,
        totalTickets,
      });
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (codigo) => {
    navigator.clipboard.writeText(codigo);
    alert(`Código ${codigo} copiado al portapapeles`);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid #e0e0e0",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 2,
              p: 1.5,
              display: "flex",
            }}
          >
            <Icon sx={{ fontSize: 32, color: "white" }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Paper elevation={6} sx={{ p: 3, borderRadius: 3, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Sistema de Referidos
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Gestión de códigos de referido y estadísticas de invitaciones
      </Typography>

      {/* Estadísticas generales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Trabajadores"
            value={loading ? "..." : stats.total}
            subtitle="Con código asignado"
            icon={PeopleIcon}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Referidos"
            value={loading ? "..." : stats.totalReferidos}
            subtitle="Invitaciones exitosas"
            icon={TrendingUpIcon}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tickets Generados"
            value={loading ? "..." : stats.totalTickets}
            subtitle="Para sorteos"
            icon={CardGiftcardIcon}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Promedio"
            value={
              loading
                ? "..."
                : stats.total > 0
                ? (stats.totalReferidos / stats.total).toFixed(1)
                : "0"
            }
            subtitle="Referidos por trabajador"
            icon={EmojiEventsIcon}
            color="#f44336"
          />
        </Grid>
      </Grid>

      {/* Tabla de trabajadores */}
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#484848" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>Ranking</TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>Trabajador</TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>Código</TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                Referidos
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                Tickets
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : trabajadores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay trabajadores registrados
                </TableCell>
              </TableRow>
            ) : (
              trabajadores.map((trabajador, index) => (
                <TableRow key={trabajador.id} hover>
                  <TableCell>
                    <Chip
                      icon={index < 3 ? <EmojiEventsIcon /> : undefined}
                      label={`#${index + 1}`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor:
                          index === 0
                            ? "#ffd700"
                            : index === 1
                            ? "#c0c0c0"
                            : index === 2
                            ? "#cd7f32"
                            : "#e0e0e0",
                        color: index < 3 ? "white" : "#484848",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={trabajador.photoUrl}
                        sx={{ bgcolor: "#d7171a", width: 40, height: 40 }}
                      >
                        {trabajador.nombre.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {trabajador.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trabajador.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={trabajador.codigo}
                      sx={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        bgcolor: "#f5f5f5",
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" fontWeight="bold" color="#4caf50">
                      {trabajador.referidos}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" fontWeight="bold" color="#ff9800">
                      {trabajador.tickets}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Copiar código">
                      <IconButton
                        onClick={() => copyToClipboard(trabajador.codigo)}
                        size="small"
                        sx={{ color: "#484848" }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default Referidos;