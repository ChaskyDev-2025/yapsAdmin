import React, { useState, useMemo } from "react";
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
  Paper,
  Pagination,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Typography } from "@mui/material";

const TABLE_HEAD_STYLE = {
  backgroundColor: "#000000",
  color: "white",
  fontWeight: 700,
  fontFamily: "Mulish, sans-serif",
  fontSize: "0.95rem",
};

const ITEMS_PER_PAGE = 10;

export const TablaConductoresAplicarBono = ({
  conductores,
  viajesConductores,
  reglas,
  onAsignar,
}) => {
  const [page, setPage] = useState(0);

  const obtenerReglasDisponibles = (conductorId) => {
    const totalViajes = viajesConductores[conductorId] || 0;
    return reglas.filter((regla) => totalViajes >= regla.viajes);
  };

  const puedeCaliificar = (conductorId) => {
    const reglasDisp = obtenerReglasDisponibles(conductorId);
    return reglasDisp.length > 0;
  };

  const conductoresPaginados = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return conductores.slice(start, end);
  }, [conductores, page]);

  const totalPages = Math.ceil(conductores.length / ITEMS_PER_PAGE);

  return (
    <>
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
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
                <TableCell colSpan={4} align="center">
                  <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                    No hay conductores en la flota
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              conductoresPaginados.map((conductor) => {
                const reglasDisp = obtenerReglasDisponibles(conductor.id);
                const calificia = puedeCaliificar(conductor.id);
                return (
                  <TableRow 
                    key={conductor.id} 
                    hover 
                    sx={{ 
                      borderBottom: "1px solid #d0d0d0",
                      opacity: calificia ? 1 : 0.7 
                    }}
                  >
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600, color: "#000000" }}>
                      <Box>
                        <Typography sx={{ fontWeight: "700", color: "#000000", fontFamily: "Mulish, sans-serif", fontSize: "1rem" }}>
                          {conductor.nombre}
                        </Typography>
                        <Typography sx={{ color: "#000000", fontFamily: "Mulish, sans-serif", fontSize: "0.85rem", fontWeight: 500 }}>
                          {conductor.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: "Mulish, sans-serif" }}>
                      <Chip
                        icon={<TrendingUpIcon />}
                        label={viajesConductores[conductor.id]}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                        {reglasDisp.length > 0 ? (
                          reglasDisp.map((regla) => (
                            <Chip
                              key={regla.id}
                              label={`${regla.viajes} viajes - $${regla.monto}`}
                              variant="outlined"
                              size="small"
                              sx={{
                                backgroundColor: "#f0f0f0",
                                borderColor: "#d7171a",
                                fontFamily: "Mulish, sans-serif",
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="caption" sx={{ color: "#484848", fontStyle: "italic", fontFamily: "Mulish, sans-serif" }}>
                            No cumple requisitos
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => onAsignar(conductor)}
                        disabled={!calificia}
                        startIcon={<CheckCircleIcon />}
                        sx={{
                          backgroundColor: calificia ? "#d7171a" : "#cccccc",
                          color: "white",
                          fontFamily: "Mulish, sans-serif",
                          fontWeight: 600,
                          "&:hover": { 
                            backgroundColor: calificia ? "#a80a12" : "#cccccc"
                          },
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

      {conductores.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
            Mostrando {page * ITEMS_PER_PAGE + 1} - {Math.min((page + 1) * ITEMS_PER_PAGE, conductores.length)} de {conductores.length}
          </Typography>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(e, pageNum) => setPage(pageNum - 1)}
            sx={{
              "& .MuiButtonBase-root": {
                fontFamily: "Mulish, sans-serif",
                color: "#000",
              },
              "& .Mui-selected": {
                backgroundColor: "#aaaaaa !important",
                color: "white",
              },
            }}
          />
        </Box>
      )}
    </>
  );
};
