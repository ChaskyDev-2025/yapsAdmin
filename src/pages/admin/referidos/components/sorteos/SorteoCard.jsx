import React from "react";
import { Box, Paper, Typography, Button } from "@mui/material";

const SorteoCard = ({ sorteo, onSelect, onEdit }) => (
  <Paper
    onClick={() => onSelect(sorteo)}
    sx={{
      p: 3,
      borderRadius: 2,
      border: "1px solid #e0e0e0",
      transition: "all 0.3s ease",
      cursor: "pointer",
      "&:hover": {
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        transform: "translateY(-2px)",
        borderColor: "#d7171a",
      },
    }}
  >
    <Box
      sx={{
        width: "100%",
        height: 180,
        borderRadius: 2,
        mb: 2,
        backgroundImage: `url(${sorteo.imagenUrl || "https://via.placeholder.com/400x180?text=Sin+Imagen"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: sorteo.imagenUrl ? "transparent" : "#f0f0f0",
      }}
    />

    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {sorteo.id}
      </Typography>
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          backgroundColor: sorteo.estado === "activo" ? "#4caf50" : "#999",
          color: "white",
          fontSize: "0.75rem",
          fontWeight: 600,
        }}
      >
        {sorteo.estado === "activo" ? "Activo" : "Inactivo"}
      </Box>
    </Box>

    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
      <Button
        variant="outlined"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(sorteo);
        }}
      >
        Editar
      </Button>
    </Box>

    {sorteo.descripcion && (
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        {sorteo.descripcion}
      </Typography>
    )}

    <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          backgroundColor: sorteo.modo === "trabajador" ? "#ff9800" : "#2196f3",
          color: "white",
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        {sorteo.modo === "trabajador" ? "👷 Trabajador" : "👤 Pasajero"}
      </Box>
    </Box>

    {sorteo.departamentos && sorteo.departamentos.length > 0 && (
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "#666", display: "block", mb: 0.5 }}>
          Departamentos:
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {sorteo.departamentos.slice(0, 3).map((dept) => (
            <Box
              key={dept}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
                fontSize: "0.7rem",
              }}
            >
              {dept}
            </Box>
          ))}
          {sorteo.departamentos.length > 3 && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                backgroundColor: "#f5f5f5",
                color: "#666",
                fontSize: "0.7rem",
              }}
            >
              +{sorteo.departamentos.length - 3}
            </Box>
          )}
        </Box>
      </Box>
    )}

    {sorteo.fechaInicio && (
      <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
        📅 Inicio: {sorteo.fechaInicio.seconds 
          ? new Date(sorteo.fechaInicio.seconds * 1000).toLocaleDateString("es-ES")
          : new Date(sorteo.fechaInicio).toLocaleDateString("es-ES")}
      </Typography>
    )}
    {sorteo.fechaFin && (
      <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
        📅 Fin: {sorteo.fechaFin.seconds 
          ? new Date(sorteo.fechaFin.seconds * 1000).toLocaleDateString("es-ES")
          : new Date(sorteo.fechaFin).toLocaleDateString("es-ES")}
      </Typography>
    )}
  </Paper>
);

export default SorteoCard;
