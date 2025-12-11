import React from "react";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import {
  DirectionsCar,
  People,
  Description,
  CheckCircle,
  Notifications,
  LocalTaxi,
  AssignmentTurnedIn,
  WarningAmber,
  CheckCircleOutline,
  CancelOutlined,
} from "@mui/icons-material";

const Dashboard = () => {
  const { metricas, cargando } = useDashboardMetrics();

  // Componente reutilizable para tarjetas de estadísticas
  const StatCard = ({ title, value, icon: Icon, color }) => {
    const getGradient = (baseColor) => {
      if (baseColor === "#d7171a") return "linear-gradient(135deg, #d7171a 0%, #a01214 100%)";
      if (baseColor === "#000000") return "linear-gradient(135deg, #1f2937 0%, #000000 100%)";
      if (baseColor === "#484848") return "linear-gradient(135deg, #6b7280 0%, #374151 100%)";
      return baseColor;
    };

    return (
      <div
        style={{
          background: getGradient(color),
          borderRadius: "12px",
          color: "white",
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "140px",
          width: "100%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ opacity: 0.9, marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
            {title}
          </p>
          <h3 style={{ fontWeight: "bold", fontSize: "36px", margin: 0 }}>{value}</h3>
        </div>
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: "10px",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "60px",
            minHeight: "60px",
            flexShrink: 0,
            backdropFilter: "blur(10px)",
          }}
        >
          <Icon style={{ fontSize: 32, color: "white" }} />
        </div>
      </div>
    );
  };

  // Componente reutilizable para grillas de tarjetas
  const CardGrid = ({ children, columns = 4 }) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "16px", marginBottom: "24px" }}>
      {children}
    </div>
  );

  // Componente reutilizable para items de resumen
  const SummaryItem = ({ label, value, color }) => (
    <div style={{ textAlign: "center", background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`, padding: "16px", borderRadius: "10px" }}>
      <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>{label}</p>
      <h4 style={{ fontSize: "30px", fontWeight: "bold", color, margin: 0 }}>
        {value}
      </h4>
    </div>
  );

  // Componente reutilizable para tarjetas de resumen
  const SummaryCard = ({ title, titleColor, items }) => (
    <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", background: titleColor, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", margin: "0 0 16px 0" }}>
        {title}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {items.map((item, idx) => (
          <SummaryItem key={idx} label={item.label} value={item.value} color={item.color} />
        ))}
      </div>
    </div>
  );

  if (cargando) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f3f4f6", minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280" }}>Cargando datos del dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f3f4f6", minHeight: "100vh", width: "100%" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Encabezado */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "900", marginBottom: "8px", color: "#111827" }}>
            Panel de Control
          </h1>
          <p style={{ color: "#6b7280" }}>
            Aquí puedes visualizar las métricas principales del sistema.
          </p>
        </div>

        {/* FILA 1: 4 Tarjetas principales */}
        <CardGrid columns={4}>
          <StatCard title="Total de Radiotaxis" value={metricas.radiotaxis.total} icon={DirectionsCar} color="#d7171a" />
          <StatCard title="Radiotaxis Activos" value={metricas.radiotaxis.activos} icon={CheckCircle} color="#000000" />
          <StatCard title="Total de Usuarios" value={metricas.usuarios.totalPasajeros} icon={People} color="#484848" />
          <StatCard title="Alertas Pendientes" value={metricas.actividad.alertas} icon={WarningAmber} color="#d7171a" />
        </CardGrid>

        {/* FILA 2: Métricas de Solicitudes */}
        <CardGrid columns={4}>
          <StatCard title="Solicitudes Completadas" value={metricas.solicitudes.completadas} icon={CheckCircleOutline} color="#000000" />
          <StatCard title="Solicitudes Canceladas" value={metricas.solicitudes.canceladas} icon={CancelOutlined} color="#d7171a" />
          <StatCard title="Solicitudes Pendientes" value={metricas.solicitudes.pendientes} icon={Notifications} color="#484848" />
          <StatCard title="Total de Solicitudes" value={metricas.solicitudes.total} icon={AssignmentTurnedIn} color="#000000" />
        </CardGrid>

        {/* FILA 3: Métricas de Órdenes y Documentos */}
        <CardGrid columns={4}>
          <StatCard title="Total de Órdenes" value={metricas.ordenes.total} icon={LocalTaxi} color="#d7171a" />
          <StatCard title="Órdenes Completadas" value={metricas.ordenes.completadas} icon={CheckCircle} color="#000000" />
          <StatCard title="Documentos Aprobados" value={metricas.documentos.aprobados} icon={Description} color="#484848" />
          <StatCard title="Documentos Pendientes" value={metricas.documentos.pendientes} icon={Description} color="#d7171a" />
        </CardGrid>

        {/* FILA 4: Resumen de Usuarios y Órdenes */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          <SummaryCard
            title="👥 Actividad de Usuarios"
            titleColor="linear-gradient(135deg, #d7171a 0%, #a01214 100%)"
            items={[
              { label: "Nuevos Hoy", value: metricas.usuarios.nuevosHoy, color: "#d7171a" },
              { label: "Esta Semana", value: metricas.usuarios.nuevosEstaSemana, color: "#000000" },
              { label: "Activos", value: metricas.actividad.usuariosActivos, color: "#484848" },
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
      </div>
    </div>
  );
};

export default Dashboard;
