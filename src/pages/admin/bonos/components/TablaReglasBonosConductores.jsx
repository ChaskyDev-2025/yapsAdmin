import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

export const TablaReglasBonosConductores = ({
  reglas,
  onEditar,
  onEliminar,
}) => {
  return (
    <TableContainer sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#000000" }}>
          <TableRow>
            <TableCell sx={TABLE_HEAD_STYLE}>Viajes Requeridos</TableCell>
            <TableCell sx={TABLE_HEAD_STYLE}>Monto Bono (Bs.)</TableCell>
            <TableCell sx={{ ...TABLE_HEAD_STYLE, textAlign: "center" }}>
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reglas.map((regla) => (
            <TableRow key={regla.id}>
              <TableCell sx={TABLE_CELL_STYLE}>{regla.viajes} viajes</TableCell>
              <TableCell sx={TABLE_CELL_STYLE}>
                Bs. {regla.monto.toFixed(2)}
              </TableCell>
              <TableCell sx={{ textAlign: "center" }}>
                <IconButton
                  size="small"
                  onClick={() => onEditar(regla)}
                  sx={{ color: "#d7171a" }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onEliminar(regla.id)}
                  sx={{ color: "#f44336" }}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
