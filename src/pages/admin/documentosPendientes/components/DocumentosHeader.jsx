import React from "react";
import { Paper, Box, Avatar, Typography, Alert } from "@mui/material";
import FileCopyIcon from "@mui/icons-material/FileCopy";

const DocumentosHeader = ({ nombreFlota, hasFlota, children }) => {
  return (
    <Paper
      elevation={6}
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: "#f9f9f9",
        mx: "auto",
        maxWidth: 1400,
        border: "0.1px solid rgba(146, 144, 144, 1)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: "#d7171a", mr: 2 }}>
          <FileCopyIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: "Mulish, sans-serif" }}>
            {nombreFlota}
          </Typography>
          <Typography color="text.secondary" sx={{ fontFamily: "Mulish, sans-serif" }}>
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
    </Paper>
  );
};

export default DocumentosHeader;
