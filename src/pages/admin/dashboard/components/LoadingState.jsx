import React from "react";

const LoadingState = () => (
  <div
    style={{
      padding: "24px",
      backgroundColor: "#f3f4f6",
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <p style={{ color: "#6b7280" }}>Cargando datos del dashboard...</p>
  </div>
);

export default LoadingState;
