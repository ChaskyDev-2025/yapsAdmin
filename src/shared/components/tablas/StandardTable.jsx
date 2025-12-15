import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

/**
 * Componente de tabla estándar reutilizable
 * Utiliza el estilo corporativo de Gestión de Flotas
 */
export const StandardTable = ({
  columns = [],
  data = [],
  renderRow,
  visibleColumns = {},
  emptyMessage = "No hay registros",
  maxHeight = "calc(100vh - 400px)",
  boxShadow = 3,
}) => {
  // Contar columnas visibles
  const visibleColumnCount = columns.filter(col =>
    !visibleColumns || visibleColumns[col.id] !== false
  ).length;

  return (
    <TableContainer component={Paper} sx={{ boxShadow, maxHeight }}>
      <Table stickyHeader>
        <TableHead sx={{ backgroundColor: "#000000" }}>
          <TableRow>
            {columns.map((column) => {
              // Si hay control de visibilidad, respetar
              if (visibleColumns && visibleColumns[column.id] === false) {
                return null;
              }

              return (
                <TableCell
                  key={column.id}
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontFamily: "Mulish, sans-serif",
                    fontSize: "0.95rem",
                    textAlign: column.align || "left",
                  }}
                  align={column.align}
                >
                  {column.label}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumnCount} align="center">
                <Typography
                  sx={{
                    py: 3,
                    color: "#484848",
                    fontFamily: "Mulish, sans-serif",
                    fontSize: "1rem",
                  }}
                >
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={row.id || index} hover>
                {renderRow(row, index)}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StandardTable;
