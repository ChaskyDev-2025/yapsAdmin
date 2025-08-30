// src/pages/admin/radiotaxis/data/radiotaxisColumns.jsx
import { Chip } from "@mui/material";
import { estado1 } from "./estadoColumns";

export const getRadiotaxisColumns = (customActionsRenderer) => [
  {
    field: 'nro',            // mostrará 1, 2, 3...
    headerName: 'ID',
    width: 10,
    sortable: false,
  },
  { field: 'nombreEmpresa', headerName: 'Nombre Empresa', flex: 1 },
  { field: 'telefono', headerName: 'Teléfono', width: 150 },
  { field: 'saldo', headerName: 'Saldo', width: 100 },
  estado1({ field: 'estado', headerName: 'Estado', width: 130 }),
  { field: 'fecha', headerName: 'Fecha de Envío', width: 200 },
  {
    field: 'acciones',
    headerName: 'Acciones',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: customActionsRenderer,
  },
];
