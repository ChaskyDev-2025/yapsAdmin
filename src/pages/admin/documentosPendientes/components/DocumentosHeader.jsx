import React from "react";
import { Box, Avatar, Typography, Alert } from "@mui/material";
import FileCopyIcon from "@mui/icons-material/FileCopy";

const DocumentosHeader = ({ nombreFlota, hasFlota, children }) => {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: "#d7171a", mr: 2 }}>
          <FileCopyIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: "Mulish, sans-serif", color: "#000000" }}>
            {nombreFlota}
          </Typography>
          <Typography color="text.secondary" sx={{ fontFamily: "Mulish, sans-serif", color: "#484848" }}>
            Gestión de documentos pendientes de conductores
          </Typography>
        </Box>
      </Box>

      {!hasFlota && (
        <Alert severity="info" sx={{ fontFamily: "Mulish, sans-serif", mt: 2 }}>
          No tienes una flota asignada. Contacta al SuperAdmin para asignarte una flota.
        </Alert>
      )}

      {children && (
        <Box sx={{ mt: 2 }}>
          {children}
        </Box>
      )}
    </Box>
  );
};

export default DocumentosHeader;
