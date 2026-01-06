import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Box,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Typography } from "@mui/material";

const TABLE_HEAD_STYLE = {
  backgroundColor: "#000000",
  color: "white",
  fontWeight: 700,
  fontFamily: "Mulish, sans-serif",
};

const TABLE_CELL_STYLE = {
  fontFamily: "Mulish, sans-serif",
  fontWeight: 600,
};

export const TablaConductoresAplicarBono = ({
  conductores,
  viajesConductores,
  reglas,
  onAsignar,
}) => {
  const obtenerReglasDisponibles = (conductorId) => {
    const totalViajes = viajesConductores[conductorId] || 0;
    return reglas.filter((regla) => totalViajes >= regla.viajes);
  };

  return (
    <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#000000" }}>
          <TableRow>
            <TableCell sx={TABLE_HEAD_STYLE}>Conductor</TableCell>
            <TableCell align="center" sx={TABLE_HEAD_STYLE}>
              Viajes Realizados
            </TableCell>
            <TableCell sx={TABLE_HEAD_STYLE}>Reglas Disponibles</TableCell>
            <TableCell align="center" sx={TABLE_HEAD_STYLE}>
              Acción
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {conductores.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ padding: 3 }}>
                <Typography variant="body2" sx={{ color: "#999" }}>
                  No hay conductores que califiquen para bonos
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            conductores.map((conductor) => {
              const reglasDisp = obtenerReglasDisponibles(conductor.id);
              return (
                <TableRow key={conductor.id}>
                  <TableCell sx={TABLE_CELL_STYLE}>
                    <Box>
                      <Typography sx={{ fontWeight: "500" }}>
                        {conductor.nombre}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#999" }}>
                        {conductor.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<TrendingUpIcon />}
                      label={viajesConductores[conductor.id]}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {reglasDisp.map((regla) => (
                        <Chip
                          key={regla.id}
                          label={`${regla.viajes} viajes - $${regla.monto}`}
                          variant="outlined"
                          size="small"
                          sx={{
                            backgroundColor: "#f0f0f0",
                            borderColor: "#d7171a",
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onAsignar(conductor)}
                      startIcon={<CheckCircleIcon />}
                      sx={{
                        backgroundColor: "#d7171a",
                        color: "white",
                        "&:hover": { backgroundColor: "#a80a12" },
                      }}
                    >
                      Asignar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
