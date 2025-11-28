// src/pages/admin/banner/data/Columnas.jsx
// Centraliza la definición *completa* de columnas sin depender de columnTemplates.js
// Cada columna define aquí su ancho, renderer y propiedades.

import React from "react";
import startCase from "lodash/startCase";

import renderId       from "./columnas/Id";
import renderImagen   from "./columnas/Imagen";
import makeRenderEstado from "./columnas/Estado";
import renderAcciones from "./columnas/Acciones";

export const useBannerColumns = (handleEstadoChange, handleEdit, handleDelete, handleView) => {
  /* Render especializado para la columna Estado */
  const renderEstado = React.useMemo(
    () => makeRenderEstado(handleEstadoChange),
    [handleEstadoChange]
  );

  const renderAccionesWithHandlers = React.useMemo(
    () => (params) => renderAcciones(params, handleEdit, handleDelete, handleView),
    [handleEdit, handleDelete, handleView]
  );

  /* Configuración declarativa por campo */
  const columnConfig = React.useMemo(
    () => ({
      id: {
        label: "ID",
        width: 10,
        renderCell: renderId,
      },
      imagen: {
        label: "Imagen",
        flex: 1,
        sortable: false,
        filterable: false,
        renderCell: renderImagen,
      },
      estado: {
        label: "Estado",
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: renderEstado,
      },
      acciones: {
        label: "Acciones",
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: renderAccionesWithHandlers,
      },
    }),
    [renderEstado, renderAccionesWithHandlers]
  );

  /* Orden de las columnas en la tabla */
  const fields = React.useMemo(
    () => ["id", "imagen", "estado", "acciones"],
    []
  );

  /* Construcción final SIN usar columnTemplates */
  const columns = React.useMemo(
    () =>
      fields.map((field) => {
        const cfg = columnConfig[field] ?? {};
        return {
          field,
          headerName: cfg.label ?? startCase(field),
          disableColumnMenu: true,
          sortable: false,
          ...cfg,
        };
      }),
    [fields, columnConfig]
  );

  return columns;
};

export default useBannerColumns;
