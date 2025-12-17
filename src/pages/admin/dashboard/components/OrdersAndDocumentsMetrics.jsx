import React from "react";
import {
  Description,
} from "@mui/icons-material";
import StatCard from "./StatCard";
import CardGrid from "./CardGrid";

const OrdersAndDocumentsMetrics = ({ metricas }) => (
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
);

export default OrdersAndDocumentsMetrics;
