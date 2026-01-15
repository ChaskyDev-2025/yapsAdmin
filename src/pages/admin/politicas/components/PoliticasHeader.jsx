import React from "react";
import { Box, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

const PoliticasHeader = ({ onEditClick }) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
      <h1 style={{ fontWeight: "bold", margin: 0 }}>Políticas de Privacidad</h1>
      <Button
        variant="contained"
        startIcon={<EditIcon />}
        onClick={onEditClick}
        sx={{
          background: "linear-gradient(90deg, #D61319 0%, #A30E13 50%, #700A09 100%)",
          color: "#fff",
          "&:hover": {
            opacity: 0.9,
          },
        }}
      >
        Editar
      </Button>
    </Box>
  );
};

export default PoliticasHeader;
