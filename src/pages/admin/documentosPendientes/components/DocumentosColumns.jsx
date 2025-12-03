// src/pages/admin/documentosPendientes/components/DocumentosColumns.jsx
import React from "react";
import { Stack, Avatar, Chip } from "@mui/material";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import IconActionButton from "../../../../shared/components/botones/Botones";

export const getDocumentosColumns = (onViewClick) => [
  {
    field: "nro",
    headerName: "ID",
    width: 70,
    sortable: true,
  },
  {
    field: "foto",
    headerName: "Foto",
    width: 80,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Avatar
        src={params.row.perfil?.photoUrl}
        alt={params.row.perfil?.name}
        sx={{ width: 40, height: 40, bgcolor: "#d7171a" }}
      >
        {(params.row.perfil?.name || "?")?.charAt(0).toUpperCase()}
      </Avatar>
    ),
  },
  {
    field: "nombre",
    headerName: "Nombre",
    flex: 1,
    sortable: true,
    valueGetter: (value, row) => row.perfil?.name || "Sin nombre",
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1,
    sortable: true,
    valueGetter: (value, row) => row.perfil?.email || "-",
  },
  {
    field: "docsPendientes",
    headerName: "Documentos Pendientes",
    width: 180,
    sortable: true,
    filterable: false,
    renderCell: (params) => {
      const docsPendientes = (params.row.documentos || []).filter(
        (d) => d.estado !== "aprobado" && d.estado !== "rechazado"
      );
      return (
        <Chip
          label={`${docsPendientes.length} pendiente${docsPendientes.length !== 1 ? "s" : ""}`}
          size="small"
          sx={{
            bgcolor: "#fff3cd",
            color: "#856404",
            fontWeight: 600,
            fontFamily: "Mulish, sans-serif",
          }}
        />
      );
    },
  },
  {
    field: "acciones",
    headerName: "Acciones",
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Stack direction="row" spacing={1}>
        <IconActionButton
          icon={<FileCopyIcon fontSize="small" />}
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            onViewClick(params.row);
          }}
        />
      </Stack>
    ),
  },
];
