import React, { useMemo } from "react";
import { Box, Button, Chip, CircularProgress, Paper, Typography, Switch, FormControlLabel } from "@mui/material";
import PasajeroFilters from "./PasajeroFilters";
import DepartmentTabs from "./DepartmentTabs";
import TrabajadorTable from "./TrabajadorTable";
import PasajeroTable from "./PasajeroTable";

const SorteoDetail = ({
  sorteo,
  datosSorteo,
  loadingDatos,
  busqueda,
  onBusquedaChange,
  fechaInicioBusqueda,
  onFechaInicioChange,
  fechaFinBusqueda,
  onFechaFinChange,
  departamentoSeleccionado,
  onDepartamentoChange,
  paginaActual,
  onPageChange,
  itemsPerPage,
  onVolver,
  onToggleEstado,
}) => {
  const handleBusquedaChange = (value) => {
    onBusquedaChange(value);
    onPageChange(1);
  };

  const handleFechaInicioChange = (value) => {
    onFechaInicioChange(value);
    onPageChange(1);
  };

  const handleFechaFinChange = (value) => {
    onFechaFinChange(value);
    onPageChange(1);
  };

  const handleDepartamentoChange = (value) => {
    onDepartamentoChange(value);
    onPageChange(1);
  };

  const datosFiltrados = useMemo(() => {
    if (sorteo.modo !== "pasajero") return datosSorteo;

    return datosSorteo.filter((item) => {
      const nombreCumple =
        !busqueda ||
        (item.nombreUsuario && item.nombreUsuario.toLowerCase().includes(busqueda)) ||
        (item.numeroRifa && String(item.numeroRifa).includes(busqueda)) ||
        (item.NumeroRifa && String(item.NumeroRifa).includes(busqueda));

      if (!nombreCumple) return false;
      if (!fechaInicioBusqueda && !fechaFinBusqueda) return true;

      let fechaCupon;
      if (item.creadoEn && item.creadoEn.seconds) {
        fechaCupon = new Date(item.creadoEn.seconds * 1000);
      } else {
        return true;
      }

      if (fechaInicioBusqueda) {
        const fechaInicio = new Date(fechaInicioBusqueda);
        fechaInicio.setHours(0, 0, 0, 0);
        if (fechaCupon < fechaInicio) return false;
      }

      if (fechaFinBusqueda) {
        const fechaFin = new Date(fechaFinBusqueda);
        fechaFin.setHours(23, 59, 59, 999);
        if (fechaCupon > fechaFin) return false;
      }

      return true;
    });
  }, [datosSorteo, busqueda, fechaInicioBusqueda, fechaFinBusqueda, sorteo.modo]);

  const departamentosUnicos = useMemo(
    () => [...new Set(datosFiltrados.map((item) => item.departamento || item.Departamento).filter(Boolean))],
    [datosFiltrados]
  );

  const departamentosInfo = useMemo(
    () =>
      departamentosUnicos.map((dept) => ({
        name: dept,
        count: datosFiltrados.filter((item) => (item.departamento || item.Departamento) === dept).length,
      })),
    [departamentosUnicos, datosFiltrados]
  );

  const datosPorDepartamento = useMemo(() => {
    const dept = departamentosUnicos[departamentoSeleccionado];
    return datosFiltrados.filter((item) => (item.departamento || item.Departamento) === dept);
  }, [datosFiltrados, departamentosUnicos, departamentoSeleccionado]);

  const datosOrdenados = useMemo(() => {
    if (sorteo.modo !== "trabajador") return datosPorDepartamento;

    return [...datosPorDepartamento].sort((a, b) => {
      const cantidadA = a.CantidadViajes || a.cantidadViajes || 0;
      const cantidadB = b.CantidadViajes || b.cantidadViajes || 0;
      return Number(cantidadB) - Number(cantidadA);
    });
  }, [datosPorDepartamento, sorteo.modo]);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, backgroundColor: "#f9f9f9" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Button variant="outlined" onClick={onVolver} sx={{ borderColor: "#d7171a", color: "#d7171a" }}>
            ← Volver
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {sorteo.id}
          </Typography>
          <Chip label={sorteo.estado === "activo" ? "Activo" : "Inactivo"} color={sorteo.estado === "activo" ? "success" : "default"} />
          <Chip
            label={sorteo.modo === "trabajador" ? "🚗 Trabajador" : "👤 Pasajero"}
            sx={{
              backgroundColor: sorteo.modo === "trabajador" ? "#ff9800" : "#2196f3",
              color: "white",
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={sorteo.estado === "activo"}
                onChange={(e) => onToggleEstado(sorteo, e.target.checked ? "activo" : "inactivo")}
                color="success"
              />
            }
            label={sorteo.estado === "activo" ? "Activo" : "Inactivo"}
          />
        </Box>
        {sorteo.descripcion && (
          <Typography variant="body2" color="textSecondary">
            {sorteo.descripcion}
          </Typography>
        )}
      </Paper>

      {loadingDatos ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress sx={{ color: "#d7171a" }} />
        </Box>
      ) : datosSorteo.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="textSecondary">
            No hay {sorteo.modo === "trabajador" ? "participantes" : "cupones"} en este sorteo todavía.
          </Typography>
        </Paper>
      ) : departamentosUnicos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="textSecondary">
            No hay datos con departamento definido.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {sorteo.modo === "pasajero" && (
            <PasajeroFilters
              busqueda={busqueda}
              onBusquedaChange={handleBusquedaChange}
              fechaInicio={fechaInicioBusqueda}
              onFechaInicioChange={handleFechaInicioChange}
              fechaFin={fechaFinBusqueda}
              onFechaFinChange={handleFechaFinChange}
            />
          )}

          <DepartmentTabs
            departamentos={departamentosInfo}
            selected={departamentoSeleccionado}
            onChange={handleDepartamentoChange}
          />

          {sorteo.modo === "trabajador" ? (
            <TrabajadorTable
              datos={datosOrdenados}
              page={paginaActual}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
            />
          ) : (
            <PasajeroTable
              datos={datosOrdenados}
              page={paginaActual}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default SorteoDetail;
