// src/pages/admin/documentosPendientes/DocumentosPendientes.jsx
import React, { useState } from "react";
import { Box } from "@mui/material";
import { useAuth } from "../../../auth/AuthContext";
import { useUserFlota, useDocumentosPendientes } from "./hooks/useDocumentosPendientes";
import { getDocumentosColumns } from "./data/documentosColumns";
import DocumentosHeader from "./components/DocumentosHeader";
import DocumentosModal from "./components/DocumentosModal";
import { Tabla2 } from "../../../shared/components/tablas/tabla";

const DocumentosPendientes = () => {
  const { user } = useAuth();
  const { userFlotaId, nombreFlota } = useUserFlota(user?.uid);
  const { trabajadores, loading } = useDocumentosPendientes(userFlotaId);
  
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = (trabajador) => {
    setSelectedTrabajador(trabajador);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTrabajador(null);
  };

  const handleDocumentApproved = () => {
    // La tabla se actualizará automáticamente por el onSnapshot
  };

  const handleDocumentRejected = () => {
    // La tabla se actualizará automáticamente por el onSnapshot
  };

  const columns = getDocumentosColumns(handleOpenDialog);

  return (
    <>
      <DocumentosHeader nombreFlota={nombreFlota} hasFlota={!!userFlotaId}>
        {userFlotaId && (
          <Box>
            <Tabla2
              rows={trabajadores}
              columns={columns}
              height="51vh"
              pageSize={10}
              loading={loading}
              onRowClick={(params) => handleOpenDialog(params.row)}
            />
          </Box>
        )}
      </DocumentosHeader>

      <DocumentosModal
        open={dialogOpen}
        onClose={handleCloseDialog}
        selectedTrabajador={selectedTrabajador}
        onDocumentApproved={handleDocumentApproved}
        onDocumentRejected={handleDocumentRejected}
      />
    </>
  );
};

export default DocumentosPendientes;
