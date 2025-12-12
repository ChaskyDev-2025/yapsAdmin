import React from "react";
import { Card, CardContent, CardHeader, Box } from "@mui/material";
import ReferidosTable from "./ReferidosTable";

const ReferidosCard = ({ title, tipo, data, loading, onCopyCode, onOpenHistorial, icon: Icon }) => {
  return (
    <Card sx={{ borderRadius: 2, mb: 3 }}>
      <CardHeader
        title={title}
        avatar={<Icon sx={{ fontSize: 28, color: tipo === "trabajador" ? "#1976d2" : "#9c27b0" }} />}
        sx={{
          bgcolor: tipo === "trabajador" ? "#e3f2fd" : "#f3e5f5",
          borderBottom: "1px solid #e0e0e0",
        }}
      />
      <CardContent sx={{ p: 0 }}>
        <ReferidosTable
          data={data}
          loading={loading}
          tipo={tipo}
          onCopyCode={onCopyCode}
          onOpenHistorial={onOpenHistorial}
        />
      </CardContent>
    </Card>
  );
};

export default ReferidosCard;
