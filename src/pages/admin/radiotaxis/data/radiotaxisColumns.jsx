// src/pages/admin/radiotaxis/data/radiotaxisColumns.jsx
import { Chip, Switch, FormControlLabel } from "@mui/material";
import { estado1 } from "./estadoColumns";

export const getRadiotaxisColumns = (customActionsRenderer, onToggleHabilitado) => [
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
    field: 'habilitado',
    headerName: 'Habilitado',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <FormControlLabel
        control={
          <Switch
            checked={params.row.activo !== false}
            onChange={(e) => {
              e.stopPropagation();
              onToggleHabilitado(params.row.firebaseId, e.target.checked);
            }}
            size="small"
          />
        }
        
        onClick={(e) => e.stopPropagation()}
        sx={{
          "& .MuiFormControlLabel-label": {
            fontSize: "0.85rem",
            color: params.row.activo !== false ? "#4caf50" : "#9e9e9e",
          },
        }}
      />
    ),
  },
  {
    field: 'acciones',
    headerName: 'Acciones',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: customActionsRenderer,
  },
];
