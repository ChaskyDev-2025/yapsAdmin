import React from "react";

const SummaryItem = ({ label, value, color }) => (
  <div
    style={{
      textAlign: "center",
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      padding: "16px",
      borderRadius: "10px",
    }}
  >
    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>{label}</p>
    <h4 style={{ fontSize: "30px", fontWeight: "bold", color, margin: 0 }}>
      {value}
    </h4>
  </div>
);

const SummaryCard = ({ title, titleColor, items }) => (
  <div
    style={{
      backgroundColor: "white",
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      padding: "24px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    }}
  >
    <h3
      style={{
        fontSize: "18px",
        fontWeight: "600",
        marginBottom: "16px",
        background: titleColor,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        margin: "0 0 16px 0",
      }}
    >
      {title}
    </h3>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
      {items.map((item, idx) => (
        <SummaryItem
          key={idx}
          label={item.label}
          value={item.value}
          color={item.color}
        />
      ))}
    </div>
  </div>
);

export default SummaryCard;
