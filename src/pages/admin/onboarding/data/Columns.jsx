// import { Columns } from "./data/Columns";
// import { Rows } from "./data/Rows";
import { Box } from "@mui/material";

export const Columns = (customActionsRenderer) => [
  { field: 'id', headerName: 'ID', width: 10 },
  {
    field: "imagen",
    headerName: "Imagen",
    flex: 1,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box
        component="img"
        src={params.value}
        alt="banner"
        sx={{
          width: "100px",     // llena el ancho de la celda
          height: "100%",    // llena la altura
          objectFit: "contain",   // ⬅️ No recorta ni deforma
          p: 0.1,                // pequeño padding interior
          bgcolor: "#5f272702",    // fondo gris claro para letter-box
          borderRadius: 1,
        }}
      />
    ),
  },
  { field: 'estado', headerName: 'Estado', width: 130, sortable: false, filterable: false },
  {
    field: 'acciones',
    headerName: 'Acciones',
    width: 160,
    sortable: false,
    filterable: false,
    renderCell: customActionsRenderer,
  },
];

/* Para que la columna acciones aparesca.
import EditIcon   from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const renderAcciones = useCallback(
  (params) => {
    const row = params.row;

    const handleEdit   = () => console.log("Editar",   row.id);

    return (
      <Stack direction="row" spacing={1}>
        <IconActionButton
          icon={<EditIcon fontSize="small" />}
          color="primary"
          onClick={handleEdit}        // <-- acción definida aquí
        />
      </Stack>
    );
  },
  []
);
const columns = Columns(renderAcciones);
*/
