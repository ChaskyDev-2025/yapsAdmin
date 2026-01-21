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

const PasajeroTable = ({ datos, page, itemsPerPage, onPageChange }) => (
  <>
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ backgroundColor: "#1a1a1a" }}>
          <TableRow>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Usuario</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Fecha</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>N° Rifa</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Departamento</TableCell>
            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Tipo Origen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datos
            .slice((page - 1) * itemsPerPage, page * itemsPerPage)
            .map((fila, index) => {
              let fechaFormateada = "N/A";
              if (fila.creadoEn && fila.creadoEn.seconds) {
                const fecha = new Date(fila.creadoEn.seconds * 1000);
                fechaFormateada = fecha.toLocaleDateString("es-ES");
              }

              return (
                <TableRow
                  key={fila.id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? "#fafafa" : "#fff",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  <TableCell sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#000" }}>
                    {fila.nombreUsuario || "N/A"}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem" }}>
                    {fechaFormateada}
                  </TableCell>
                  <TableCell sx={{ fontSize: "1rem", fontWeight: 800 }}>
                    <Box
                      sx={{
                        display: "inline-block",
                        backgroundColor: "#d7171a",
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontFamily: "monospace",
                        fontWeight: 900,
                        fontSize: "1.1rem",
                        boxShadow: "0 2px 8px rgba(215, 23, 26, 0.3)",
                      }}
                    >
                      {fila.numeroRifa || fila.NumeroRifa || "N/A"}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem" }}>
                    {fila.departamento || fila.Departamento || "N/A"}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem" }}>
                    {fila.tipoOrigen || fila.TipoOrigen || "N/A"}
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

export default PasajeroTable;
