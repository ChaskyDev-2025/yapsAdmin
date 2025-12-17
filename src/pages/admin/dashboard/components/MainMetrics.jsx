import React from "react";
import {
  DirectionsCar,
  CheckCircle,
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
      title="Radiotaxis Inactivos"
      value={metricas.radiotaxis.inactivos}
      icon={DirectionsCar}
      color="#484848"
    />
  </CardGrid>
);

export default MainMetrics;
