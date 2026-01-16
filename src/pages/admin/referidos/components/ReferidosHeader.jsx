import React from "react";
import { Typography, Paper } from "@mui/material";

const ReferidosHeader = () => {
  return (
    <>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
        Sistema de Referidos
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 0 }}>
        Gestión de códigos de referido y estadísticas de invitaciones
      </Typography>
    </>
  );
};

export default ReferidosHeader;
