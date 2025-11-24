// src/shared/components/tablas/tabla.jsx
import { useState, useMemo } from "react";
import { Box, TextField, Button, InputAdornment } from "@mui/material";   // ← aquí
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

const defaultStyles = {
  border: 0,
  borderRadius: 2,
  backgroundColor: "#fff",
  fontFamily: "Roboto, sans-serif",
  fontSize: "0.95rem",
  boxShadow: 3,
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#f0f0f0",
    color: "#000",
    fontWeight: "bold",
    fontSize: "1rem",
    borderBottom: "2px solid #d7171a",
  },
  "& .MuiDataGrid-cell": {
    color: "#333",
    borderBottom: "1px solid #e0e0e0",
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "#f9f9f9",
    transform: "scale(1.008)",
    cursor: "pointer",
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: "1px solid #ddd",
    backgroundColor: "#fafafa",
  },
  "& .MuiTablePagination-root": {
    fontSize: "0.85rem",
  },
};

const Tabla1 = ({
  rows = [],
  columns = [],
  height = 400,
  sx = {},
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 20, 50],
}) => {
  const [searchText, setSearchText] = useState("");
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [rows, searchText]);

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <TextField
          label="Buscar"
          variant="outlined"
          size="small"
          sx={{ width: 250 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </Box>

      <Box sx={{ height }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          pagination
          paginationModel={{ pageSize: pageSizeState, page: 0 }}
          onPaginationModelChange={(model) => setPageSizeState(model.pageSize)}
          pageSizeOptions={rowsPerPageOptions}
          disableRowSelectionOnClick
          sx={{ ...defaultStyles, ...sx }}
        />
      </Box>
    </Box>
  );
};

export default Tabla1;

/* Ejemplo de uso:
<Tabla2
  rows={Rows}
  columns={columns}
  height="51vh"
  pageSize={3}
  showButton
  buttonLabel="Agregar Onboarding"
  onButtonClick={() => console.log("Crear banner")}
  onRowClick={() => console.log("Row Clickeado")}
/>
*/

export const Tabla2 = ({
  rows = [],
  columns = [],
  height = 400,
  sx = {},
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 20, 50],
  showButton = false,
  buttonLabel = "Nuevo",
  onButtonClick = () => {},
  onRowClick   = () => {},
}) => {
  const [searchText, setSearchText] = useState("");
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: pageSize,   // valor inicial que recibís por props
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [rows, searchText]);

  const customStyles = {
    border: "none",
    backgroundColor: "#f3f3f3ff", // f5f5f5
    fontFamily: "Arial, sans-serif",
    fontSize: "0.9rem",

    "& .MuiDataGrid-columnHeaders": {
      background: "linear-gradient(to right, #1976d2, #42a5f5)",
      color: "#000",
      fontWeight: 600,
      fontSize: "1rem",
      /* 1) pon el borde exterior fino para no notar escalones */
      border: "1px solid #727272",
      boxShadow: "0px 1px 5px rgba(0, 0, 0, 0.4)",
      borderRadius: "8px 8px",
      overflow: "hidden",               // 2) recorta los separadores internos
    },

    /* 3) saca el borde-derecho de cada celda header para que no duplique */
    "& .MuiDataGrid-columnHeader": {
      borderRight: "none !important",
    },
    
    "& .MuiDataGrid-columnSeparator": {
      display: "block !important",     // que no se oculte
      width: "1px !important",         // grosor
      backgroundColor: "#727272ff !important", // mismo color que el borde
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.51)",
      opacity: 1,                      // totalmente opaco
    },
    "& .MuiDataGrid-row": {
      borderRadius: "12px",
      margin: "8px 0px 0px 8px",
      backgroundColor: "#fff",
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.51)", // sombra más suave
      border: "1px solid rgba(0, 0, 0, 0.21)",    // borde sutil de 1px
      transition: "transform 0.2s ease-in-out, box-shadow 0.2s",
      width: "calc(100% - 58px)",
    },

    "& .MuiDataGrid-row:hover": {
      backgroundColor: "#dceffdff",
      transform: "scale(1.008)",
    },

    "& .MuiDataGrid-cell": {
      border: "none",
      padding: "0px 16px",
      display: "flex",
      alignItems: "center",
    },

    "& .MuiDataGrid-cell:focus": {
      outline: "none",
    },

    "& .MuiDataGrid-footerContainer": {
      backgroundColor: "#fafafa",
      borderTop: "1px solid #9c9c9cff",
    },

    "& .MuiTablePagination-root": {
      fontSize: "0.85rem",
    },

    // Remove row separator lines
    "& .MuiDataGrid-row.MuiDataGrid-row--lastVisible": {
      borderBottom: "none",
    },

    // Optional: remove border from whole grid
    "& .MuiDataGrid-virtualScrollerRenderZone": {
      display: "flex",
      flexDirection: "column",
      gap: "0px",
    },
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Barra superior con flex entre botón (izq) y buscador (der) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        {/* Botón opcional */}
{showButton ? (
  <Button
    variant="contained"
    startIcon={
      <AddIcon
        fontSize="inherit"          // sin clase tamaño MUI
        sx={{ width: 32, height: 32 }}
      />
    }
    onClick={onButtonClick}
    sx={{
      px: 3.4,                // padding horizontal 24 px
      py: 1.4,                // padding vertical 8 px
      borderRadius: 8,      // bordes redondeados
      fontSize: "1.1rem",
      color: "#fff",
      fontWeight: 500,
      textTransform: "none",
      background: "linear-gradient(90deg, #1976d2 0%, #0896b9ff 100%)",
      boxShadow: "0 3px 6px rgba(0, 0, 0, 0.83)",
      transition: "all 0.2s ease",
      "&:hover": {
        background: "linear-gradient(90deg, #1565c0 0%, #2196f3 100%)",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.52)",
        px: 3.5,                // padding horizontal 24 px
        py: 1.5,
      },
    }}
  >
    {buttonLabel}
  </Button>
) : (
  <Box />
)}

        {/* Buscador */}
        <TextField
          placeholder="Buscar…"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#727272ff" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 260,
            bgcolor: "#fff",
            borderRadius: "25px",
            "& .MuiOutlinedInput-root": {
              borderRadius: "25px",
              pl: 1,
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#727272ff",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#1976d2",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#1976d2",
              boxShadow: "0 0 5px rgba(13, 71, 161, 0.4)",
            },
          }}
        />
      </Box>

      {/* DataGrid */}
      <Box sx={{ height }}>
<DataGrid
  rows={filteredRows}
  columns={columns}
  getRowId={(row) => row.id}
  pagination
  paginationModel={paginationModel}                 // ← usa el estado
  onPaginationModelChange={(m) => setPaginationModel(m)} // ← guarda page y pageSize
  pageSizeOptions={rowsPerPageOptions}
  disableRowSelectionOnClick
  onRowClick={onRowClick}
  sx={{ ...customStyles, ...sx }}
/>
      </Box>
    </Box>
  );
};
