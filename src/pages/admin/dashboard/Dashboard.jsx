import React from "react";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import DashboardHeader from "./components/DashboardHeader";
import LoadingState from "./components/LoadingState";
import MainMetrics from "./components/MainMetrics";
import RequestMetrics from "./components/RequestMetrics";
import OrdersAndDocumentsMetrics from "./components/OrdersAndDocumentsMetrics";
import SummaryMetrics from "./components/SummaryMetrics";

const Dashboard = () => {
  const { metricas, cargando } = useDashboardMetrics();

  if (cargando) {
    return <LoadingState />;
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f3f4f6", minHeight: "100vh", width: "100%" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Encabezado */}
        <DashboardHeader />

        {/* FILA 1: 4 Tarjetas principales */}
        <MainMetrics metricas={metricas} />

        {/* FILA 2: Métricas de Solicitudes */}
        <RequestMetrics metricas={metricas} />

        {/* FILA 3: Métricas de Órdenes y Documentos */}
        <OrdersAndDocumentsMetrics metricas={metricas} />

        {/* FILA 4: Resumen de Usuarios y Órdenes */}
        <SummaryMetrics metricas={metricas} />
      </div>
    </div>
  );
};

export default Dashboard;
