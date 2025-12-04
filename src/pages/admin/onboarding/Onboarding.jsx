import { useCallback } from "react";
import { Typography, Paper, Stack } from "@mui/material";
import { Tabla2 } from "../../../shared/components/tablas/tabla";
import { Columns } from "./data/Columns";
import { Rows } from "./data/Rows";
import EditIcon   from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconActionButton from "../../../shared/components/botones/Botones";

const Onboarding = () => {
  // Ejemplo de renderer para la columna Acciones
  const renderAcciones = useCallback(
    (params) => {
      const row = params.row;

      const handleEdit   = () => {};
      const handleDelete = () => {};

      return (
        <Stack direction="row" spacing={1}>
          <IconActionButton
            icon={<EditIcon fontSize="small" />}
            color="primary"
            onClick={handleEdit}        // <-- acción definida aquí
          />
          <IconActionButton
            icon={<DeleteIcon fontSize="small" />}
            color="error"
            onClick={handleDelete}      // <-- otra acción
          />
        </Stack>
      );
    },
    []
  );

  // Ejecuta la función Columns y obtén el array de definiciones
  const columns = Columns(renderAcciones);

  return (
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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Onboarding
      </Typography>
      <Typography gutterBottom>
        Aquí puedes gestionar los banners del sistema.
      </Typography>

      <Tabla2
        rows={Rows}
        columns={columns}
        height="51vh"
        pageSize={3}
        showButton
        buttonLabel="Agregar Onboarding"
        onButtonClick={() => {}}
        onRowClick={() => {}}
      />
    </Paper>
  );
};

export default Onboarding;
