// src/pages/admin/ajustes/Ajustes.jsx
import { useState } from "react";
import { Typography, Paper, Stack, Box, Avatar } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Tabla2 } from "../../../shared/components/tablas/tabla";
import DetalleModal from "./components/ModalUsuario";
import { getUsuariosColumns } from "./data/usuariosColumns";
import IconActionButton from "../../../shared/components/botones/Botones";
import { useUsuarios } from "./hooks/useUsuarios";

const Ajustes = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  
  const { rows, cargando, error } = useUsuarios();

  const handleVer = (row) => {
    setSelectedRow(row);
    setOpenModal(true);
  };

  const handleEditar = (row) => {
    console.log("Editar usuario:", row);
    // Aquí puedes agregar la lógica para editar
  };

  const handleEliminar = (row) => {
    console.log("Eliminar usuario:", row);
    // Aquí puedes agregar la lógica para eliminar
  };

  const columns = getUsuariosColumns((params) => (
    <Stack direction="row" spacing={1}>
      <IconActionButton
        icon={<VisibilityIcon fontSize="small" />}
        color="primary"
        onClick={(e) => {
          e.stopPropagation();
          handleVer(params.row);
        }}
      />
      <IconActionButton
        icon={<EditIcon fontSize="small" />}
        color="warning"
        onClick={(e) => {
          e.stopPropagation();
          handleEditar(params.row);
        }}
      />
      <IconActionButton
        icon={<DeleteIcon fontSize="small" />}
        color="error"
        onClick={(e) => {
          e.stopPropagation();
          handleEliminar(params.row);
        }}
      />
    </Stack>
  ));

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: "#f9f9f9",
          mx: "auto",
          maxWidth: 1200,
          border: "0.1px solid rgba(146, 144, 144, 1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", mr: 2 }}>
            <BusinessIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {rows[0]?.nombreEmpresa || "Empresa"}
            </Typography>
            <Typography color="text.secondary">
              Gestión de usuarios del sistema
            </Typography>
          </Box>
        </Box>

        <Tabla2
          rows={rows}
          columns={columns}
          height="51vh"
          pageSize={10}
          loading={cargando}
          onRowClick={(params) => handleVer(params.row)}
        />

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Paper>

      <DetalleModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        rowData={selectedRow}
      />
    </>
  );
};

export default Ajustes;

