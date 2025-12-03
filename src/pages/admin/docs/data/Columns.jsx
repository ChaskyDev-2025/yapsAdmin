// src/pages/admin/docs/data/Columns.jsx
import { Switch } from "@mui/material";

/**
 * Recibe:
 *   onToggle(id, nuevoValor) → cambia “activo”
 *   renderAcciones           → botones Editar / Borrar
 */
export const Columns = (onToggle, renderAcciones) => [
  { field: "numero", headerName: "ID", width: 10 },
  { field: "titulo", headerName: "Título", flex: 1 },

  { field: "ciudad", headerName: "Departamento", width: 150 },

  {
    field: "activo",
    headerName: "Activo",
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: ({ row }) => (
      <Switch
        checked={!!row.activo}
        /* ✋ 1) Detenemos el click que lanza onRowClick */
        onClick={(e) => e.stopPropagation()}
        /* ✋ 2) También detenemos la propagación del change */
        onChange={(e) => {
          e.stopPropagation();                          // <- clave
          onToggle(row.firebaseId, e.target.checked);   // tu callback
        }}
      />
    ),
  },

  {
    field: "acciones",
    headerName: "Acciones",
    width: 160,
    sortable: false,
    filterable: false,
    renderCell: renderAcciones,
  },
];
