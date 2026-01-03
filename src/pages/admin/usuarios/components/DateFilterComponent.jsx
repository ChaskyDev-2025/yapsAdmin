import React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Stack,
} from "@mui/material";

export default function DateFilterComponent({
  onFilterChange,
  onSortChange,
  currentSort = "recientes",
  currentDateFilter = "todos",
}) {
  const [dateFilter, setDateFilter] = React.useState(currentDateFilter || "todos");
  const [customStartDate, setCustomStartDate] = React.useState("");
  const [customEndDate, setCustomEndDate] = React.useState("");

  const handleDateFilterChange = (event) => {
    const value = event.target.value;
    setDateFilter(value);
    onFilterChange(value, null, null);
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const handleCustomDateStart = (e) => {
    const value = e.target.value;
    setCustomStartDate(value);
    if (value && customEndDate) {
      onFilterChange("custom", value, customEndDate);
    }
  };

  const handleCustomDateEnd = (e) => {
    const value = e.target.value;
    setCustomEndDate(value);
    if (customStartDate && value) {
      onFilterChange("custom", customStartDate, value);
    }
  };

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems="flex-end"
    >
      {/* Filtro por Período */}
      <FormControl sx={{ minWidth: 180 }} size="small">
        <InputLabel sx={{ fontSize: "0.875rem" }}>Período</InputLabel>
        <Select
          value={dateFilter}
          label="Período"
          onChange={handleDateFilterChange}
          size="small"
          displayEmpty
        >
          <MenuItem value="todos">Todos</MenuItem>
          <MenuItem value="hoy">Hoy</MenuItem>
          <MenuItem value="esta-semana">Esta Semana</MenuItem>
          <MenuItem value="este-mes">Este Mes</MenuItem>
          <MenuItem value="ultimos-7">Últimos 7 días</MenuItem>
          <MenuItem value="ultimos-30">Últimos 30 días</MenuItem>
          <MenuItem value="custom">Personalizado</MenuItem>
        </Select>
      </FormControl>

      {/* Inputs de Fecha Personalizado (si está seleccionado) */}
      {dateFilter === "custom" && (
        <>
          <TextField
            type="date"
            value={customStartDate}
            onChange={handleCustomDateStart}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ width: 140 }}
          />
          <TextField
            type="date"
            value={customEndDate}
            onChange={handleCustomDateEnd}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ width: 140 }}
          />
        </>
      )}
    </Stack>
  );
}
