import React from "react";
import {
  CheckCircleOutline,
  CancelOutlined,
  Notifications,
  AssignmentTurnedIn,
} from "@mui/icons-material";
import StatCard from "./StatCard";
import CardGrid from "./CardGrid";

const RequestMetrics = ({ metricas }) => (
  <CardGrid columns={4}>
    <StatCard
      title="Solicitudes Completadas"
      value={metricas.solicitudes.completadas}
      icon={CheckCircleOutline}
      color="#000000"
    />
    <StatCard
      title="Solicitudes Canceladas"
      value={metricas.solicitudes.canceladas}
      icon={CancelOutlined}
      color="#d7171a"
    />
    <StatCard
      title="Solicitudes Pendientes"
      value={metricas.solicitudes.pendientes}
      icon={Notifications}
      color="#484848"
    />
    <StatCard
      title="Total de Solicitudes"
      value={metricas.solicitudes.total}
      icon={AssignmentTurnedIn}
      color="#000000"
    />
  </CardGrid>
);

export default RequestMetrics;
