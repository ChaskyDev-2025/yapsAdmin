// src/pages/admin/flotas/GestionFlotasRefactored.jsx
import React, { useState } from "react";
import { Box, Paper, Typography, Button, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../../../data/firebase/firebase";

// Hooks personalizados
import { useFlotas } from "./hooks/useFlotas";
import { useAdministradores } from "./hooks/useAdministradores";
import { useServicios } from "./hooks/useServicios";
import { useDocumentos } from "./hooks/useDocumentos";

// Componentes modulares
import { FlotasTable } from "./components/FlotasTable";
import { FlotaFormDialog } from "./components/FlotaFormDialog";
import { DocumentModal } from "./components/DocumentModal";
import { DocsManagerModal } from "./components/DocsManagerModal";

const GestionFlotas = () => {
  // Hooks personalizados
  const { flotas, loading: flotasLoading, fetchFlotas, createFlota, updateFlota, deleteFlota, toggleHabilitado } = useFlotas();
  const { administradores } = useAdministradores();
  const { serviciosDisponibles } = useServicios();
  const { docFile, docFormData, setDocFormData, handleDocFileChange, uploadDocument, resetDocForm } = useDocumentos();

  // Debug: Verificar datos cargados en el componente principal
  console.log('🏢 GestionFlotas - Administradores:', administradores);
  console.log('🏢 GestionFlotas - Servicios:', serviciosDisponibles);
  console.log('🏢 GestionFlotas - Flotas:', flotas);

  // Estados locales
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFlota, setCurrentFlota] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openDocModal, setOpenDocModal] = useState(false);
  const [openDocsManagerModal, setOpenDocsManagerModal] = useState(false);
  const [selectedFlotaForDocs, setSelectedFlotaForDocs] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    imageUrl: "",
    nit: "",
    representanteLegal: "",
    telefono: "",
    fotoNit: "",
    otrosDocumentos: [],
    uidPropietarios: [],
    servicios: [],
    habilitado: true,
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, flotaId: null, flotaNombre: "" });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Funciones de manejo de formulario
  const handleOpenDialog = (flota = null) => {
    if (flota) {
      setEditMode(true);
      setCurrentFlota(flota);
      setFormData({
        nombre: flota.nombre || "",
        imageUrl: flota.imageUrl || "",
        nit: flota.perfilFlota?.nit || flota.documentosFlota?.nit || "",
        representanteLegal: flota.perfilFlota?.representanteLegal || "",
        telefono: flota.perfilFlota?.telefono || "",
        fotoNit: flota.documentosFlota?.fotoNit || "",
        otrosDocumentos: flota.documentosFlota?.otrosDocumentos || [],
        uidPropietarios: flota.uidPropietarios || [],
        servicios: flota.servicios || [],
        habilitado: flota.habilitado !== undefined ? flota.habilitado : true,
      });
      setImagePreview(flota.imageUrl || null);
      setImageFile(null);
    } else {
      setEditMode(false);
      setCurrentFlota(null);
      setFormData({
        nombre: "",
        imageUrl: "",
        nit: "",
        representanteLegal: "",
        telefono: "",
        fotoNit: "",
        otrosDocumentos: [],
        uidPropietarios: [],
        servicios: [],
        habilitado: true,
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentFlota(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToStorage = async (file, flotaId) => {
    if (!auth.currentUser) {
      throw new Error("Debes estar autenticado para subir imágenes");
    }
    const timeStamp = Date.now();
    const fileName = `flotas/${flotaId}_${timeStamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!formData.nombre.trim()) {
      showSnackbar("El nombre de la flota es obligatorio", "error");
      return;
    }
    if (!formData.nit.trim()) {
      showSnackbar("El NIT es obligatorio", "error");
      return;
    }
    if (!formData.uidPropietarios || formData.uidPropietarios.length === 0) {
      showSnackbar("Debe seleccionar al menos un administrador", "error");
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const flotaId = editMode ? currentFlota.id : `temp_${Date.now()}`;
        imageUrl = await uploadImageToStorage(imageFile, flotaId);
      }

      const primerAdminUid = formData.uidPropietarios[0];
      const adminSeleccionado = administradores.find((a) => a.uid === primerAdminUid);

      if (!adminSeleccionado) {
        showSnackbar("No se encontró el administrador seleccionado", "error");
        setIsSaving(false);
        return;
      }

      const perfilFlota = {
        nombreFlota: formData.nombre,
        representanteLegal: formData.representanteLegal,
        telefono: formData.telefono,
        correo: adminSeleccionado.email || adminSeleccionado.correo || "",
        contrasena: adminSeleccionado.password || adminSeleccionado.contrasena || "",
      };

      const flotaData = {
        nombre: formData.nombre,
        imageUrl: imageUrl || "",
        perfilFlota: perfilFlota,
        documentosFlota: {
          nit: formData.nit,
          fotoNit: formData.fotoNit,
          otrosDocumentos: formData.otrosDocumentos || [],
        },
        uidPropietarios: formData.uidPropietarios,
        servicios: formData.servicios,
        habilitado: formData.habilitado,
      };

      if (editMode && currentFlota) {
        await updateFlota(currentFlota.id, flotaData);
        // Actualizar flotaId en usuarios
        for (const uid of formData.uidPropietarios) {
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, { flotaId: currentFlota.id, updatedAt: serverTimestamp() });
        }
        showSnackbar("Flota actualizada exitosamente", "success");
      } else {
        const nuevaFlotaId = await createFlota(flotaData);
        // Actualizar flotaId en usuarios
        for (const uid of formData.uidPropietarios) {
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, { flotaId: nuevaFlotaId, updatedAt: serverTimestamp() });
        }
        showSnackbar("Flota creada exitosamente", "success");
      }

      await fetchFlotas();
      handleCloseDialog();
    } catch (error) {
      console.error("Error al guardar flota:", error);
      showSnackbar("Error al guardar la flota: " + error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (flotaId, flotaNombre) => {
    setConfirmDialog({ open: true, flotaId, flotaNombre });
  };

  const handleConfirmDelete = async () => {
    const { flotaId } = confirmDialog;
    setConfirmDialog({ open: false, flotaId: null, flotaNombre: "" });

    try {
      await deleteFlota(flotaId);
      showSnackbar("Flota eliminada exitosamente", "success");
    } catch (error) {
      console.error("Error al eliminar flota:", error);
      showSnackbar("Error al eliminar la flota", "error");
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, flotaId: null, flotaNombre: "" });
  };

  // Funciones de documentos
  const handleOpenDocModal = () => {
    resetDocForm();
    setOpenDocModal(true);
  };

  const handleCloseDocModal = () => {
    setOpenDocModal(false);
    resetDocForm();
  };

  const handleAddDocument = async () => {
    if (openDocsManagerModal) {
      return handleAddDocToFlota();
    }

    try {
      const nuevoDoc = await uploadDocument();
      setFormData({ ...formData, otrosDocumentos: [...formData.otrosDocumentos, nuevoDoc] });
      showSnackbar("Documento agregado", "success");
      handleCloseDocModal();
    } catch (error) {
      console.error("Error al agregar documento:", error);
      showSnackbar(error.message || "Error al agregar documento", "error");
    }
  };

  const handleDeleteDocument = (index) => {
    const doc = formData.otrosDocumentos[index];
    const confirmar = window.confirm(
      `¿Estás seguro de que quieres eliminar el documento "${doc.nombre || doc.tipo}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmar) return;
    const nuevosDocumentos = formData.otrosDocumentos.filter((_, i) => i !== index);
    setFormData({ ...formData, otrosDocumentos: nuevosDocumentos });
    showSnackbar("Documento eliminado", "info");
  };

  const handleViewDocument = (url) => {
    window.open(url, "_blank");
  };

  // Funciones para gestión de documentos por flota
  const handleOpenDocsManager = (flota) => {
    setSelectedFlotaForDocs(flota);
    setOpenDocsManagerModal(true);
  };

  const handleCloseDocsManagerModal = () => {
    setOpenDocsManagerModal(false);
    setSelectedFlotaForDocs(null);
  };

  const handleSaveFlotaDocs = async () => {
    if (!selectedFlotaForDocs) return;

    try {
      const flotaRef = doc(db, "flotas", selectedFlotaForDocs.id);
      await updateDoc(flotaRef, {
        "documentosFlota.otrosDocumentos": selectedFlotaForDocs.documentosFlota?.otrosDocumentos || [],
        updatedAt: serverTimestamp(),
      });

      showSnackbar("Documentos actualizados exitosamente", "success");
      await fetchFlotas();
      handleCloseDocsManagerModal();
    } catch (error) {
      console.error("Error al actualizar documentos:", error);
      showSnackbar("Error al actualizar documentos: " + error.message, "error");
    }
  };

  const handleAddDocToFlota = async () => {
    try {
      const nuevoDoc = await uploadDocument();
      const updatedDocs = [...(selectedFlotaForDocs.documentosFlota?.otrosDocumentos || []), nuevoDoc];

      setSelectedFlotaForDocs({
        ...selectedFlotaForDocs,
        documentosFlota: {
          ...selectedFlotaForDocs.documentosFlota,
          otrosDocumentos: updatedDocs,
        },
      });

      showSnackbar("Documento agregado", "success");
      handleCloseDocModal();
    } catch (error) {
      console.error("Error al agregar documento:", error);
      showSnackbar(error.message || "Error al agregar documento", "error");
    }
  };

  const handleDeleteDocFromFlota = async (index, docNombre) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que quieres eliminar el documento "${docNombre}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      const updatedDocs = selectedFlotaForDocs.documentosFlota?.otrosDocumentos?.filter((_, i) => i !== index) || [];
      const flotaRef = doc(db, "flotas", selectedFlotaForDocs.id);
      await updateDoc(flotaRef, {
        "documentosFlota.otrosDocumentos": updatedDocs,
        updatedAt: serverTimestamp(),
      });

      setSelectedFlotaForDocs({
        ...selectedFlotaForDocs,
        documentosFlota: {
          ...selectedFlotaForDocs.documentosFlota,
          otrosDocumentos: updatedDocs,
        },
      });

      await fetchFlotas();
      showSnackbar("Documento eliminado exitosamente", "success");
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      showSnackbar("Error al eliminar documento: " + error.message, "error");
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 4, px: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: "#fff" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 900, color: "#000" }}>
            Gestión de Flotas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: "#d7171a",
              fontFamily: "Mulish, sans-serif",
              fontWeight: 700,
              "&:hover": { backgroundColor: "#a00000" },
            }}
          >
            Nueva Flota
          </Button>
        </Box>

        <FlotasTable
          flotas={flotas}
          administradores={administradores}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          onToggleHabilitado={toggleHabilitado}
          onManageDocs={handleOpenDocsManager}
        />
      </Paper>

      {/* Diálogo de crear/editar flota */}
      <FlotaFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        formData={formData}
        onInputChange={handleInputChange}
        onImageChange={handleImageChange}
        imagePreview={imagePreview}
        administradores={administradores}
        serviciosDisponibles={serviciosDisponibles}
        onSave={handleSave}
        isSaving={isSaving}
        editMode={editMode}
        onFormDataChange={setFormData}
        onOpenDocModal={handleOpenDocModal}
        onDeleteDocument={handleDeleteDocument}
        onViewDocument={handleViewDocument}
      />

      {/* Modal de agregar documento */}
      <DocumentModal
        open={openDocModal}
        onClose={handleCloseDocModal}
        docFormData={docFormData}
        docFile={docFile}
        onDocFormDataChange={setDocFormData}
        onDocFileChange={handleDocFileChange}
        onAdd={handleAddDocument}
      />

      {/* Modal de gestión de documentos por flota */}
      <DocsManagerModal
        open={openDocsManagerModal}
        onClose={handleCloseDocsManagerModal}
        flota={selectedFlotaForDocs}
        onOpenDocModal={handleOpenDocModal}
        onSave={handleSaveFlotaDocs}
        onDeleteDoc={handleDeleteDocFromFlota}
        onViewDoc={handleViewDocument}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={confirmDialog.open} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar la flota <strong>{confirmDialog.flotaNombre}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} sx={{ color: "#484848" }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{ backgroundColor: "#D32F2F", "&:hover": { backgroundColor: "#B71C1C" } }}
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionFlotas;
