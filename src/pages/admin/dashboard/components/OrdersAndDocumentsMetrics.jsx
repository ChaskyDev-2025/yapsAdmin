import React from "react";
import {
  LocalTaxi,
  CheckCircle,
  Description,
} from "@mui/icons-material";
import StatCard from "./StatCard";
import CardGrid from "./CardGrid";

const OrdersAndDocumentsMetrics = ({ metricas }) => (
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
      title="Documentos Aprobados"
      value={metricas.documentos.aprobados}
      icon={Description}
      color="#484848"
    />
    <StatCard
      title="Documentos Pendientes"
      value={metricas.documentos.pendientes}
      icon={Description}
      color="#d7171a"
    />
  </CardGrid>
);

export default OrdersAndDocumentsMetrics;
