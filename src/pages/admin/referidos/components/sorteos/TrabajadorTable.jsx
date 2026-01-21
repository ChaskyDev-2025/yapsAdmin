import React from "react";
import {
  Box,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

const TrabajadorTable = ({ datos, page, itemsPerPage, onPageChange }) => (
  <>
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ backgroundColor: "#1a1a1a" }}>
          <TableRow>
            <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Ranking</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Nombre</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 700, textAlign: "center" }}>Viajes</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Departamento</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Actualizado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datos
            .slice((page - 1) * itemsPerPage, page * itemsPerPage)
            .map((fila, index) => {
              const bgColor = index === 0 ? "#fff8f0" : index === 1 ? "#f5f5f5" : index === 2 ? "#fafafa" : "#fff";
              const badgeBg = index === 0 ? "#d7171a" : index === 1 ? "#ff9800" : index === 2 ? "#2196f3" : "#999";

              return (
                <TableRow
                  key={fila.id}
                  sx={{
                    backgroundColor: bgColor,
                    borderLeft: index < 3 ? `5px solid ${badgeBg}` : "5px solid transparent",
                    "&:hover": {
                      backgroundColor: index < 3 ? bgColor : "#f0f0f0",
                      transform: "scale(1.01)",
                      transition: "all 0.2s ease",
                    },
                  }}
                >
                  <TableCell sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: badgeBg,
                        color: "#fff",
                        fontWeight: 800,
                      }}
                    >
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {fila.Nombre || fila.nombre || "N/A"}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        display: "inline-block",
                        backgroundColor: badgeBg,
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: 800,
                        fontSize: "1.1rem",
                      }}
                    >
                      {fila.CantidadViajes || fila.cantidadViajes || 0}
                    </Box>
                  </TableCell>
                  <TableCell>{fila.Departamento || fila.departamento || "N/A"}</TableCell>
                  <TableCell sx={{ fontSize: "0.85rem", color: "#999" }}>
                    {fila.UpdatedAt && fila.UpdatedAt.seconds
                      ? new Date(fila.UpdatedAt.seconds * 1000).toLocaleDateString("es-ES")
                      : "N/A"}
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </TableContainer>

    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 3 }}>
      <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
        Mostrando {datos.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} - {Math.min(page * itemsPerPage, datos.length)} de {datos.length}
      </Typography>
      <Pagination
        count={Math.ceil(datos.length / itemsPerPage)}
        page={page}
        onChange={(e, newPage) => onPageChange(newPage)}
        color="standard"
        size="small"
      />
    </Box>
  </>
);

export default TrabajadorTable;
