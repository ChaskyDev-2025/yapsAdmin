import React from "react";

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
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 12px rgba(0, 0, 0, 0.15)",
        },
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

export default StatCard;
