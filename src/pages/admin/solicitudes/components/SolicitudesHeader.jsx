import React from "react";
import { Box, Typography } from "@mui/material";

const SolicitudesHeader = () => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gestión de Solicitudes
      </Typography>
      <Typography color="text.secondary">
        Administra todas las solicitudes de servicios del sistema
      </Typography>
    </Box>
  );
};

export default SolicitudesHeader;
