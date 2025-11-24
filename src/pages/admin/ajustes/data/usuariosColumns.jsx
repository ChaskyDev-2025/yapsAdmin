// src/pages/admin/ajustes/data/usuariosColumns.jsx
import { Chip } from "@mui/material";

export const getUsuariosColumns = (customActionsRenderer) => [
  {
    field: 'nro',
    headerName: 'ID',
    width: 70,
    sortable: false,
  },
  { field: 'nombreUsuario', headerName: 'Nombre Usuario', flex: 1 },
  { field: 'telefono', headerName: 'Teléfono', width: 150 },
  { field: 'email', headerName: 'Email', width: 200 },
  { 
    field: 'rol', 
    headerName: 'Rol', 
    width: 130,
    renderCell: (params) => (
      <Chip 
        label={params.value || 'Usuario'} 
        color={params.value === 'Admin' ? 'primary' : 'default'}
        size="small"
      />
    ),
  },
  { field: 'fechaRegistro', headerName: 'Fecha de Registro', width: 180 },
  {
    field: 'acciones',
    headerName: 'Acciones',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: customActionsRenderer,
  },
];
