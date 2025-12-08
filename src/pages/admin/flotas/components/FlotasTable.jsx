// src/pages/admin/flotas/components/FlotasTable.jsx
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
  IconButton,
  Avatar,
  Chip,
  Box,
  Switch,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DescriptionIcon from "@mui/icons-material/Description";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

export const FlotasTable = ({
  flotas,
  administradores,
  servicios = [],
  onEdit,
  onDelete,
  onToggleHabilitado,
  onManageDocs,
  onManageServicios,
  visibleColumns = {},
}) => {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
      <Table>
        <TableHead sx={{ backgroundColor: "#000000" }}>
          <TableRow>
            {visibleColumns.logo && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Logo
              </TableCell>
            )}
            {visibleColumns.nombre && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Nombre de la Flota
              </TableCell>
            )}
            {visibleColumns.nit && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                NIT
              </TableCell>
            )}
            {visibleColumns.representante && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Representante Legal
              </TableCell>
            )}
            {visibleColumns.propietarios && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Propietarios
              </TableCell>
            )}
            {visibleColumns.servicios && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Servicios
              </TableCell>
            )}
            {visibleColumns.estado && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Estado
              </TableCell>
            )}
            {visibleColumns.fecha && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Fecha de Creación
              </TableCell>
            )}
            {visibleColumns.documentos && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Documentos Asignados
              </TableCell>
            )}
            {visibleColumns.acciones && (
              <TableCell sx={{ color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif" }}>
                Acciones
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {flotas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Object.values(visibleColumns).filter(v => v).length} align="center">
                <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                  No hay flotas registradas
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            flotas.map((flota) => (
              <TableRow key={flota.id} hover>
                {visibleColumns.logo && (
                  <TableCell>
                    <Avatar
                      src={flota.imageUrl}
                      alt={flota.nombre}
                      sx={{ width: 50, height: 50, bgcolor: "#d7171a" }}
                    >
                      {!flota.imageUrl && <DirectionsCarIcon />}
                    </Avatar>
                  </TableCell>
                )}
                {visibleColumns.nombre && (
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                    {flota.nombre}
                  </TableCell>
                )}
                {visibleColumns.nit && (
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                    {flota.documentosFlota?.nit || "-"}
                  </TableCell>
                )}
                {visibleColumns.representante && (
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                    {flota.perfilFlota?.representanteLegal || "-"}
                  </TableCell>
                )}
                {visibleColumns.propietarios && (
                  <TableCell>
                    {flota.uidPropietarios && flota.uidPropietarios.length > 0 ? (
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {flota.uidPropietarios.slice(0, 2).map((uid) => {
                          const admin = administradores.find((a) => a.uid === uid);
                          return (
                            <Chip
                              key={uid}
                              label={admin?.nombre || admin?.email?.split("@")[0] || "Admin"}
                              size="small"
                              sx={{
                                bgcolor: "#d7171a",
                                color: "white",
                                fontWeight: 600,
                                fontFamily: "Mulish, sans-serif",
                                fontSize: "0.7rem",
                              }}
                            />
                          );
                        })}
                        {flota.uidPropietarios.length > 2 && (
                          <Chip
                            label={`+${flota.uidPropietarios.length - 2}`}
                            size="small"
                            sx={{
                              bgcolor: "#484848",
                              color: "white",
                              fontWeight: 600,
                              fontFamily: "Mulish, sans-serif",
                              fontSize: "0.7rem",
                            }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif", color: "#484848" }}>
                        Sin propietarios
                      </Typography>
                    )}
                  </TableCell>
                )}
                {visibleColumns.servicios && (
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<LocalOfferIcon />}
                      onClick={() => onManageServicios(flota)}
                      sx={{
                        borderColor: "#d7171a",
                        color: "#d7171a",
                        fontFamily: "Mulish, sans-serif",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        "&:hover": {
                          borderColor: "#a00000",
                          bgcolor: "rgba(215, 23, 26, 0.04)",
                        },
                      }}
                    >
                      Servicios: {
                        typeof flota.servicios === 'object' && !Array.isArray(flota.servicios)
                          ? Object.values(flota.servicios || {}).reduce((total, deptServicios) => {
                              if (typeof deptServicios === 'object' && !Array.isArray(deptServicios)) {
                                return total + Object.keys(deptServicios).length;
                              }
                              return total + (Array.isArray(deptServicios) ? deptServicios.length : 0);
                            }, 0)
                          : (flota.servicios?.length || 0)
                      }
                    </Button>
                  </TableCell>
                )}
                {visibleColumns.estado && (
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Switch
                        checked={flota.habilitado !== undefined ? flota.habilitado : true}
                        onChange={() => onToggleHabilitado(flota.id, flota.habilitado !== undefined ? flota.habilitado : true)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#4caf50",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: "#4caf50",
                          },
                        }}
                      />
                      <Chip
                        label={flota.habilitado !== undefined && !flota.habilitado ? "Inactiva" : "Activa"}
                        size="small"
                        sx={{
                          bgcolor: flota.habilitado !== undefined && !flota.habilitado ? "#757575" : "#4caf50",
                          color: "white",
                          fontWeight: 600,
                          fontFamily: "Mulish, sans-serif",
                        }}
                      />
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.fecha && (
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                    {flota.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                  </TableCell>
                )}
                {visibleColumns.documentos && (
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DescriptionIcon />}
                      onClick={() => onManageDocs(flota)}
                      sx={{
                        borderColor: "#d7171a",
                        color: "#d7171a",
                        fontFamily: "Mulish, sans-serif",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        "&:hover": {
                          borderColor: "#a00000",
                          bgcolor: "rgba(215, 23, 26, 0.04)",
                        },
                      }}
                    >
                      Documentos: {flota.documentos?.length || flota.documentosFlota?.documentosAsignados?.length || 0}
                    </Button>
                  </TableCell>
                )}
                {visibleColumns.acciones && (
                  <TableCell>
                    <IconButton onClick={() => onEdit(flota)} sx={{ color: "#d7171a" }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => onDelete(flota.id, flota.nombre)} sx={{ color: "#484848" }}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
