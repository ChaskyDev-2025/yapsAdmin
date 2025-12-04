// src/shared/components/tablas/tabla.jsx
import { useState, useMemo } from "react";
import { Box, TextField, Button, InputAdornment } from "@mui/material";   // ← aquí
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import CustomModal from "./modal/modal";
import tablaStyles from "./tablaStyles/tablaStyles";

export const Tabla3 = ({
  rows = [],
  columns = [],
  height = 400,
  sx = {},
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 20, 50], // opciones de paginación
  buttons = [],
  onRowClick   = () => {},
}) => {
  const [searchText, setSearchText] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: pageSize,   // valor inicial que recibís por props
  });
  const [openModal, setOpenModal] = useState(false);
  const [ModalContent, setModalContent] = useState(null);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [rows, searchText]);
  const [modalTitle, setModalTitle] = useState("");
  const [modalFooterButtons, setModalFooterButtons] = useState([]);
  const [footerAlign, setFooterAlign]      = useState("flex-end");

  const estiloConTexto = {
  px: 3.4,
  py: 1.4,
  borderRadius: 8,
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
    px: 3.5,
    py: 1.5,
  },
};

const estiloSoloIcono = {
  minWidth: 40,
  height: 40,
  padding: 0,
  borderRadius: "50%",
  backgroundColor: "#1976d2",
  color: "#fff",
  boxShadow: "0 3px 6px rgba(0, 0, 0, 0.3)",
  "&:hover": {
    backgroundColor: "#1565c0",
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
{buttons.length > 0 ? (
  <Box sx={{ display: "flex", gap: 2 }}>
  {buttons.map((btn, i) => {
    const handleClick = () => {
      if (btn.renderModal) {
        const handleCloseModal = () => setOpenModal(false);

        setModalContent(() => btn.renderModal);
        setModalTitle(btn.title || "");
        setFooterAlign(btn.footerAlign || "flex-end");

        const footerBtns = typeof btn.footerButtons === "function"
          ? btn.footerButtons(handleCloseModal)
          : (btn.footerButtons ?? []);

        setModalFooterButtons(footerBtns);
        setOpenModal(true);
      } else if (btn.onClick) {
        btn.onClick();
      }
    };

    return (
      <Button
        key={i}
        variant="contained"
        startIcon={btn.label ? btn.icon : null}
        onClick={handleClick}
        sx={btn.label ? estiloConTexto : estiloSoloIcono}
      >
        {btn.label || btn.icon}
      </Button>
    );
  })}
  </Box>
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
          onRowClick={(params) => {
            const openModalFromRow = ({ renderModal, title, footerButtons, footerAlign }) => {
              setModalContent(() => renderModal);
              setModalTitle(title || "");
              setFooterAlign(footerAlign || "flex-end");

              const close = () => setOpenModal(false);
              const buttons = typeof footerButtons === "function"
                ? footerButtons(close)
                : (footerButtons ?? []);
                
              setModalFooterButtons(buttons);
              setOpenModal(true);
            };

            onRowClick(params.row, openModalFromRow); // ← PASAMOS `row` y la función
          }}
          sx={{ ...tablaStyles, ...sx }}
        />
        {openModal && ModalContent && (
          <CustomModal
            open={openModal}
            onClose={() => setOpenModal(false)}  // ← cerrar modal desde el "X"
            title={modalTitle}
            footerButtons={modalFooterButtons}
            footerAlign={footerAlign}
          >
            <ModalContent onClose={() => setOpenModal(false)} />
          </CustomModal>
        )}
      </Box>
    </Box>
  );
};

/* Ejemplo de uso:
import { useCallback } from "react";
import { Typography, Paper, Stack, Box } from "@mui/material";

<Tabla3
  rows={rows}
  columns={columns}
  pageSize={3}
  onRowClick={(row, openModal) =>
    openModal({
      title: "Editar banner",
      renderModal: () => <Box>Editar ID: {row.id}</Box>,
      footerButtons: (close) => [
        { label: "Cerrar", position: "left", onClick: close },
        { label: "Guardar", icon: <Icons.Save />, position: "right", onClick: () => alert("Guardado") },
      ],
    })
  }
  buttons={[
    {
      label: "Agregar",
      icon: <Icons.Add />,
      title: "Agregar nuevo banner",
      renderModal: () => <Box>Contenido del modal</Box>,
      footerButtons: (close) => [
        { label: "Cerrar", position: "left", onClick: close },
        { label: "Guardar", icon: <Icons.Save />, position: "right", onClick: () => alert("Guardado") },
      ],
    },
    {
      label: "Exportar",
      icon: <Icons.Download />,
      onClick: () => {},
    },
  ]}
/>
*/
