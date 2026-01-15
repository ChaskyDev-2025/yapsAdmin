import React, { useState } from "react";
import { Box, Container, Paper, Alert, CircularProgress } from "@mui/material";
import { usePoliticas } from "./hooks/usePoliticas";
import PoliticasHeader from "./components/PoliticasHeader";
import PoliticasViewer from "./components/PoliticasViewer";
import PoliticasEditor from "./components/PoliticasEditor";
import PoliticasConfirmDialog from "./components/PoliticasConfirmDialog";

const Politicas = () => {
  const [editMode, setEditMode] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const {
    contenido,
    setContenido,
    loading,
    saving,
    message,
    cargarPoliticas,
    guardarPoliticas,
    limpiarMensaje,
  } = usePoliticas();

  // Cargar políticas al montar el componente
  React.useEffect(() => {
    cargarPoliticas();
  }, [cargarPoliticas]);

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    cargarPoliticas();
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmar = async () => {
    const success = await guardarPoliticas(contenido);
    if (success) {
      setEditMode(false);
      setOpenDialog(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {!editMode && <PoliticasHeader onEditClick={handleEditClick} />}

      {message.text && (
        <Alert
          severity={message.type}
          onClose={limpiarMensaje}
          sx={{ mb: 2 }}
        >
          {message.text}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          sx={{
            p: 3,
            backgroundColor: "#f5f5f5",
            minHeight: "500px",
          }}
        >
          {editMode ? (
            <PoliticasEditor
              contenido={contenido}
              onChange={setContenido}
              onSave={handleOpenDialog}
              onCancel={handleCancel}
              saving={saving}
            />
          ) : (
            <PoliticasViewer contenido={contenido} />
          )}
        </Paper>
      )}

      <PoliticasConfirmDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmar}
        saving={saving}
      />
    </Container>
  );
};

export default Politicas;
