import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  Chip,
  Avatar,
  Typography,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

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

export const TablaCarreras = ({ trabajadores }) => {
  return (
    <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#000000" }}>
          <TableRow>
            <TableCell sx={TABLE_HEAD_STYLE}>Trabajador</TableCell>
            <TableCell align="center" sx={TABLE_HEAD_STYLE}>
              Total de Viajes
            </TableCell>
            <TableCell sx={TABLE_HEAD_STYLE}>Flota</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trabajadores.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align="center" sx={{ padding: 3 }}>
                <Typography variant="body2" sx={{ color: "#999" }}>
                  No hay trabajadores activos
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            trabajadores.map((trabajador) => (
              <TableRow key={trabajador.id}>
                <TableCell sx={TABLE_CELL_STYLE}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={trabajador.foto}
                      alt={trabajador.nombre}
                      sx={{ width: 40, height: 40 }}
                    >
                      {trabajador.nombre.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: "500" }}>
                        {trabajador.nombre}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#999" }}>
                        {trabajador.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={trabajador.totalViajes}
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={trabajador.flota}
                    variant="outlined"
                    sx={{
                      backgroundColor: "#f0f0f0",
                      borderColor: "#d7171a",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
