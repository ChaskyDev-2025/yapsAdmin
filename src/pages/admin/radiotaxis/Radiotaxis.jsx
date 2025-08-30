// src/pages/admin/radiotaxis/Radiotaxis.jsx
import { useState } from "react";
import { Typography, Paper, Stack } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Tabla2 } from "../../../shared/components/tablas/tabla";
import DetalleModal from "./components/modalGenerico";
import { getRadiotaxisColumns } from "./data/radiotaxisColumns";
import IconActionButton from "../../../shared/components/botones/Botones";
// 👉 Datos desde el hook (Firebase)
import { useRadiotaxisRows } from "./datos";

const Radiotaxis = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  
  // 👉 Datos desde el hook (Firebase)
  const { rows, cargando, error } = useRadiotaxisRows();

  const handleVer = (row) => {
    setSelectedRow(row);
    setOpenModal(true);
  };

  const columns = getRadiotaxisColumns((params) => (
    <Stack direction="row" spacing={1}>
      <IconActionButton
        icon={<VisibilityIcon fontSize="small" />}
        color="primary"
        onClick={(e) => {
          e.stopPropagation();
          handleVer(params.row);
        }}
      />
    </Stack>
  ));

  return (
    <>
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
          Radiotaxis Registrados
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Aquí puedes gestionar los radiotaxis que han enviado sus documentos.
        </Typography>

        <Tabla2
          rows={rows}
          columns={columns}
          height="51vh"
          pageSize={3}
          loading={cargando}
          onRowClick={(params) => handleVer(params.row)}
        />

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Paper>

      <DetalleModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        rowData={selectedRow} // aquí tienes rowData.firebaseId si lo necesitas
      />
    </>
  );
};

export default Radiotaxis;
