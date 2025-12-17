import React from "react";
import { BusinessIcon } from "@mui/icons-material";
import { Avatar } from "@mui/material";

const DashboardHeader = ({ flota }) => (
  <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <h1 style={{ fontSize: "36px", fontWeight: "900", marginBottom: "8px", color: "#111827" }}>
        Panel de Control
      </h1>
      <p style={{ color: "#6b7280" }}>
        Aquí puedes visualizar las métricas principales del sistema.
      </p>
    </div>
    {flota && (
      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 28px", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", minWidth: "320px" }}>
        {flota.imageUrl ? (
          <img
            src={flota.imageUrl}
            alt={flota.nombre}
            style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover" }}
          />
        ) : (
          <Avatar
            sx={{
              width: 80,
              height: 80,
              backgroundColor: "#d7171a",
              fontSize: "32px",
              fontWeight: "bold"
            }}
          >
            {flota.nombre?.charAt(0).toUpperCase()}
          </Avatar>
        )}
        <div>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0", textTransform: "uppercase" }}>Flota Actual</p>
          <p style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "4px 0 0 0" }}>
            {flota.nombre}
          </p>
        </div>
      </div>
    )}
  </div>
);

export default DashboardHeader;
