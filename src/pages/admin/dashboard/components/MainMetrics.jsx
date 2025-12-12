import React from "react";
import {
  DirectionsCar,
  CheckCircle,
  People,
  WarningAmber,
} from "@mui/icons-material";
import StatCard from "./StatCard";
import CardGrid from "./CardGrid";

const MainMetrics = ({ metricas }) => (
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
      title="Total de Usuarios"
      value={metricas.usuarios.totalPasajeros}
      icon={People}
      color="#484848"
    />
    <StatCard
      title="Alertas Pendientes"
      value={metricas.actividad.alertas}
      icon={WarningAmber}
      color="#d7171a"
    />
  </CardGrid>
);

export default MainMetrics;
