// src/pages/admin/banner/data/columnas/acciones.jsx
import { Stack } from "@mui/material";
import IconActionButton from "../../../../../shared/components/botones/Botones";
import Icons from "../../../../../shared/constants/Icons";

/**
 * Renderer para la columna «Acciones» de la tabla de Banners.
 * Solo contiene la lógica de los tres botones (Editar, Eliminar, Ver).
 * Se usa desde Columnas.jsx.
 */
const renderAcciones = (params, handleEdit, handleDelete, handleView) => {
  const { row } = params;

  const handleClick = (e, accion) => {
    e.stopPropagation();
  };

  return (
    <Stack direction="row" spacing={1}>
     {/*  <IconActionButton
        icon={<Icons.Edit fontSize="small" />} // ✏️ Editar
        color="primary"
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(row);
        }}
      /> */}
      <IconActionButton
        icon={<Icons.Delete fontSize="small" />} // 🗑️ Eliminar
        color="error"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row);
        }}
      />
      <IconActionButton
        icon={<Icons.View fontSize="small" />} // 👁️ Ver
        color="info"
        onClick={(e) => {
          e.stopPropagation();
          handleView(row);
        }}
      />
    </Stack>
  );
};

export default renderAcciones;
