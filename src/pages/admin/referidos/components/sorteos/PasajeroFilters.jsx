import React from "react";
import { Box, Paper, TextField } from "@mui/material";

const PasajeroFilters = ({
  busqueda,
  onBusquedaChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFin,
  onFechaFinChange,
}) => (
  <Paper sx={{ p: 2, mb: 3, backgroundColor: "#fafafa" }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
      <TextField
        label="Buscar por nombre o N° rifa"
        placeholder="Ej: Juan Pérez o 000123"
        size="small"
        value={busqueda}
        onChange={(e) => onBusquedaChange(e.target.value.toLowerCase())}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#fff",
          },
        }}
      />
      <TextField
        label="Fecha inicio"
        type="date"
        size="small"
        value={fechaInicio}
        onChange={(e) => onFechaInicioChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#fff",
          },
        }}
      />
      <TextField
        label="Fecha fin"
        type="date"
        size="small"
        value={fechaFin}
        onChange={(e) => onFechaFinChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#fff",
          },
        }}
      />
    </Box>
  </Paper>
);

export default PasajeroFilters;
