// src/pages/admin/radiotaxis/data/radiotaxisColumns.jsx
import { Chip, Switch, FormControlLabel, Tooltip, Box } from "@mui/material";
import { estado1 } from "./estadoColumns";

export const getRadiotaxisColumns = (customActionsRenderer, onToggleHabilitado, verificarDocumentosAprobados) => [
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
    field: 'online',
    headerName: 'Conectado',
    width: 120,
    sortable: true,
    filterable: true,
    renderCell: (params) => {
      const isOnline = params.row.online === true;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Chip
            label={isOnline ? "En línea" : "Desconectado"}
            color={isOnline ? "success" : "default"}
            variant={isOnline ? "filled" : "outlined"}
            size="small"
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#4caf50' : '#bdbdbd',
                  display: 'inline-block',
                }}
              />
            }
            sx={{
              fontWeight: 600,
              backgroundColor: isOnline ? '#e8f5e9' : 'transparent',
              color: isOnline ? '#2e7d32' : '#757575',
            }}
          />
        </Box>
      );
    },
  },
  {
    field: 'habilitado',
    headerName: 'Habilitado',
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      const documentosAprobados = verificarDocumentosAprobados(params.row.documentos);
      const deshabilitado = !documentosAprobados;

      return (
        <Tooltip 
          title={deshabilitado ? "No puede activar: documentos pendientes de aprobación" : ""}
          arrow
        >
          <div>
            <FormControlLabel
              control={
                <Switch
                  checked={params.row.activo !== false}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleHabilitado(params.row.firebaseId, e.target.checked, documentosAprobados);
                  }}
                  disabled={deshabilitado}
                  size="small"
                />
              }
              
              onClick={(e) => e.stopPropagation()}
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.85rem",
                  color: params.row.activo !== false ? "#4caf50" : "#9e9e9e",
                },
                opacity: deshabilitado ? 0.5 : 1,
              }}
            />
          </div>
        </Tooltip>
      );
    },
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
