import { Avatar, Stack, Chip } from "@mui/material";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import IconActionButton from "../../../../shared/components/botones/Botones";

export const getDocumentosColumns = (onViewDocuments) => [
  {
    field: "nro",
    headerName: "ID",
    width: 60,
    sortable: true,
  },
  {
    field: "perfil",
    headerName: "Foto",
    width: 70,
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
    minWidth: 150,
    sortable: true,
    valueGetter: (value, row) => row.perfil?.name || "Sin nombre",
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1,
    minWidth: 200,
    sortable: true,
    valueGetter: (value, row) => row.perfil?.email || "-",
  },
  {
    field: "docsPendientes",
    headerName: "Documentos Pendientes",
    width: 160,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      const docsPendientes = (() => {
        const docs = params.row.documentos || [];
        
        // Convertir a array si es un objeto
        let docsArray = [];
        if (Array.isArray(docs)) {
          docsArray = docs;
        } else if (typeof docs === 'object' && docs !== null) {
          // Es un objeto, extraer todos los valores que no sean booleanos (documentos_aprobados)
          docsArray = Object.keys(docs)
            .filter(key => docs[key] && typeof docs[key] !== 'boolean')
            .map(key => docs[key]);
        }
        
        // Filtrar documentos pendientes
        // Si son strings, todos son pendientes
        // Si son objetos, filtrar por estado
        return docsArray.filter((d) => {
          if (typeof d === 'string') {
            return true; // Los strings son siempre pendientes
          }
          return d && typeof d === 'object' && d.estado !== "aprobado" && d.estado !== "rechazado";
        });
      })();
      
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
    width: 100,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Stack direction="row" spacing={0.5}>
        <IconActionButton
          icon={<FileCopyIcon fontSize="small" />}
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            onViewDocuments(params.row);
          }}
        />
      </Stack>
    ),
  },
];
