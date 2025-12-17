import React from "react";
import {
  LocalTaxi,
  CheckCircle,
  CancelOutlined,
} from "@mui/icons-material";
import StatCard from "./StatCard";
import CardGrid from "./CardGrid";

const RequestMetrics = ({ metricas }) => (
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
  </CardGrid>
);

export default RequestMetrics;
