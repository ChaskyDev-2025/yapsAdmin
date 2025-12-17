import React from "react";
import DashboardHeader from "./components/DashboardHeader";
import LoadingState from "./components/LoadingState";
import CardGrid from "./components/CardGrid";
import StatCard from "./components/StatCard";
import SummaryCard from "./components/SummaryCard";
import ChartsMetrics from "./components/ChartsMetrics";
import { useFlotaInfo } from "./hooks/useFlotaInfo";
import {
  DirectionsCar,
  CheckCircle,
  LocalTaxi,
  CancelOutlined,
  Description,
} from "@mui/icons-material";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";

const FlotaAdminDashboard = () => {
  const { metricas, cargando } = useDashboardMetrics();
  const { flota, loading: flotaLoading } = useFlotaInfo();

  if (cargando || flotaLoading) {
    return <LoadingState />;
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f3f4f6", minHeight: "100vh", width: "100%" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Encabezado */}
        <DashboardHeader flota={flota} />

        {/* FILA 1: Radiotaxis */}
        <CardGrid columns={3}>
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

        {/* FILA 2: Órdenes */}
        <CardGrid columns={3}>
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

        {/* FILA 3: Documentos */}
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

        {/* FILA 4: Resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginTop: "20px" }}>
          <SummaryCard
            title="🚕 Actividad de Radiotaxis"
            titleColor="linear-gradient(135deg, #d7171a 0%, #a01214 100%)"
            items={[
              { label: "Total", value: metricas.radiotaxis.total, color: "#d7171a" },
              { label: "Activos", value: metricas.radiotaxis.activos, color: "#000000" },
              { label: "Inactivos", value: metricas.radiotaxis.inactivos, color: "#484848" },
            ]}
          />
          <SummaryCard
            title="📊 Resumen de Órdenes"
            titleColor="linear-gradient(135deg, #1f2937 0%, #000000 100%)"
            items={[
              { label: "Completadas", value: metricas.ordenes.completadas, color: "#000000" },
              { label: "Canceladas", value: metricas.ordenes.canceladas, color: "#d7171a" },
              { label: "Precio Promedio", value: `Bs. ${metricas.ordenes.promedioCosto.toFixed(2)}`, color: "#484848" },
            ]}
          />
        </div>

        {/* FILA 5: Gráficos */}
        <ChartsMetrics metricas={metricas} />
      </div>
    </div>
  );
};

export default FlotaAdminDashboard;
