import { Chip } from "@mui/material";

// Mapea el valor del estado a un color de Chip
export const estadoColor = (value = "") => {
  const v = `${value}`.toLowerCase();
  if (v === "aprobado") return "success";
  if (v === "pendiente" || v === "") return "warning";
  if (v === "rechazado") return "error";
  return "default";
};

// Renderizador de celda reutilizable
export const renderEstadoCell = (params) => {
  const label = params?.value || "Pendiente";
  return (
    <Chip
      label={label}
      size="small"
      color={estadoColor(label)}
      variant="filled"
    />
  );
};

/**
 * Crea la columna de "Estado", permitiendo overrides.
 * Puedes sobreescribir field, headerName, width, y cualquier otra prop del DataGrid.
 */
export const estado1 = ({ field = "estado", headerName = "Estado", width = 130, ...rest } = {}) => ({
  field,
  headerName,
  width,
  sortable: false,
  renderCell: renderEstadoCell,
  ...rest,
});

/* Se puede usar así:
import { estado1 } from "./estadoColumns";
...
estado1({ field: 'estado', headerName: 'Estado', width: 130 })
*/
