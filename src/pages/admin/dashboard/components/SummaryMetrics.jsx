import React from "react";
import SummaryCard from "./SummaryCard";

const SummaryMetrics = ({ metricas, isSuperAdmin }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginTop: "20px" }}>
    {isSuperAdmin && (
      <SummaryCard        title="👥 Actividad de Usuarios"
        titleColor="linear-gradient(135deg, #d7171a 0%, #a01214 100%)"
        items={[
          { label: "Nuevos Hoy", value: metricas.usuarios.nuevosHoy, color: "#d7171a" },
          { label: "Esta Semana", value: metricas.usuarios.nuevosEstaSemana, color: "#000000" },
          { label: "Activos", value: metricas.actividad.usuariosActivos, color: "#484848" },
        ]}
      />
    )}
    {!isSuperAdmin && (
      <SummaryCard        title="� Actividad de Radiotaxis"
        titleColor="linear-gradient(135deg, #d7171a 0%, #a01214 100%)"
        items={[
          { label: "Total", value: metricas.radiotaxis.total, color: "#d7171a" },
          { label: "Activos", value: metricas.radiotaxis.activos, color: "#000000" },
          { label: "Inactivos", value: metricas.radiotaxis.inactivos, color: "#484848" },
        ]}
      />
    )}
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
);

export default SummaryMetrics;
