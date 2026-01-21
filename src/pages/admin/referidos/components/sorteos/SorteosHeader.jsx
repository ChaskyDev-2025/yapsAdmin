import React from "react";
import { Box, Button, Typography } from "@mui/material";

const SorteosHeader = ({ onOpenModal }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
      🎲 Gestión de Sorteos
    </Typography>
    <Button
      variant="contained"
      sx={{
        background: "linear-gradient(135deg, #d7171a 0%, #b01217 100%)",
        "&:hover": {
          background: "linear-gradient(135deg, #b01217 0%, #a01012 100%)",
        },
        fontWeight: 600,
      }}
      onClick={onOpenModal}
    >
      + Nuevo Sorteo
    </Button>
  </Box>
);

export default SorteosHeader;
