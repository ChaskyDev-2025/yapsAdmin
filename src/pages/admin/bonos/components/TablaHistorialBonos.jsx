import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

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

export const TablaHistorialBonos = ({ historial }) => {
  return (
    <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#000000" }}>
          <TableRow>
            <TableCell sx={TABLE_HEAD_STYLE}>Conductor</TableCell>
            <TableCell sx={TABLE_HEAD_STYLE} align="center">
              Viajes
            </TableCell>
            <TableCell sx={TABLE_HEAD_STYLE} align="center">
              Monto (Bs.)
            </TableCell>
            <TableCell sx={TABLE_HEAD_STYLE}>Fecha</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {historial.map((bono) => (
            <TableRow key={bono.id}>
              <TableCell sx={TABLE_CELL_STYLE}>{bono.conductorNombre}</TableCell>
              <TableCell sx={{ ...TABLE_CELL_STYLE, textAlign: "center" }}>
                {bono.viajesTotales}
              </TableCell>
              <TableCell sx={{ ...TABLE_CELL_STYLE, textAlign: "center" }}>
                Bs. {bono.montoAplicado.toFixed(2)}
              </TableCell>
              <TableCell sx={TABLE_CELL_STYLE}>
                {new Date(bono.fechaAplicacion).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
