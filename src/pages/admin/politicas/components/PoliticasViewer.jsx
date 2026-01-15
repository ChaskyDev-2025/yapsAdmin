import React from "react";
import { Typography } from "@mui/material";

const PoliticasViewer = ({ contenido }) => {
  return (
    <Typography
      variant="body1"
      sx={{
        whiteSpace: "pre-wrap",
        lineHeight: 1.8,
        color: "#333",
        fontSize: "0.95rem",
      }}
    >
      {contenido || "No hay contenido de políticas configurado. Haz clic en Editar para agregar contenido."}
    </Typography>
  );
};

export default PoliticasViewer;
