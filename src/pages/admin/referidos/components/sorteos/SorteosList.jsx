import React from "react";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import SorteoCard from "./SorteoCard";

const SorteosList = ({ sorteos, loading, onSelect, onEdit }) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress sx={{ color: "#d7171a" }} />
      </Box>
    );
  }

  if (!sorteos || sorteos.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", backgroundColor: "#f9f9f9" }}>
        <Typography variant="body1" color="textSecondary">
          No hay sorteos creados todavía.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Crea tu primer sorteo usando el botón de arriba.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 3 }}>
      {sorteos.map((sorteo) => (
        <SorteoCard key={sorteo.id} sorteo={sorteo} onSelect={onSelect} onEdit={onEdit} />
      ))}
    </Box>
  );
};

export default SorteosList;
