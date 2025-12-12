// src/pages/admin/flotas/GestionFlotasRefactored.jsx
import React, { useState, useMemo } from "react";
import { Box, Paper, Typography, Button, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../../../data/firebase/firebase";

// Hooks personalizados
import { useFlotas } from "./hooks/useFlotas";
import { useAdministradores } from "./hooks/useAdministradores";
import { useServicios } from "./hooks/useServicios";
import { useDocumentosPorCiudad } from "./hooks/useDocumentosPorCiudad";

// Componentes modulares
import { FlotasTable } from "./components/FlotasTable";
import { FlotaFormDialog } from "./components/FlotaFormDialog";
import { DocsManagerModal } from "./components/DocsManagerModal";
import ServiciosManagerModalNew from "./components/ServiciosManagerModalNew";
import { TableToolbar } from "../usuarios/components/TableToolbar";

const GestionFlotas = () => {
  // Hooks personalizados
  const { flotas, fetchFlotas, createFlota, updateFlota, deleteFlota, toggleHabilitado } = useFlotas();
  const { administradores } = useAdministradores();
  const { serviciosDisponibles, serviciosPorCiudad } = useServicios();
  const { documentosPorCiudad } = useDocumentosPorCiudad();

  // Estados locales
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFlota, setCurrentFlota] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openDocsManagerModal, setOpenDocsManagerModal] = useState(false);
  const [selectedFlotaForDocs, setSelectedFlotaForDocs] = useState(null);
  const [openServiciosManagerModal, setOpenServiciosManagerModal] = useState(false);
  const [selectedFlotaForServicios, setSelectedFlotaForServicios] = useState(null);
  
  // Estados para búsqueda y ordenamiento
  const [searchFlotas, setSearchFlotas] = useState("");
  const [sortByFlotas, setSortByFlotas] = useState("nombre-asc");
  const [filterEstadoFlotas, setFilterEstadoFlotas] = useState("todos");
  
  // Estados para columnas visibles
  const [visibleColumnsFlotas, setVisibleColumnsFlotas] = useState({
    logo: true,
    nombre: true,
    nit: true,
    representante: true,
    propietarios: true,
    servicios: true,
    estado: true,
    fecha: true,
    documentos: true,
    acciones: true,
  });

  const [formData, setFormData] = useState({
    nombre: "",
    imageUrl: "",
    nit: "",
    representanteLegal: "",
    telefono: "",
    emailContacto: "",
    domicilio: "",
    ruc: "",
    cedulaRepresentante: "",
    vigenciaLicenciaMunicipal: "",
    vigenciaSeguro: "",
    uidPropietarios: [],
    servicios: {},
    documentos: [],
    habilitado: true,
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, flotaId: null, flotaNombre: "" });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Filtrado y ordenamiento de flotas
  const flotasFiltradas = useMemo(() => {
    let filtered = flotas;
    
    // Filtro por búsqueda
    if (searchFlotas) {
      const search = searchFlotas.toLowerCase();
      filtered = filtered.filter(f =>
        (f.nombre || "").toLowerCase().includes(search) ||
        (f.documentosFlota?.nit || "").toLowerCase().includes(search) ||
        (f.perfilFlota?.representanteLegal || "").toLowerCase().includes(search)
      );
    }
    
    // Filtro por estado
    if (filterEstadoFlotas !== "todos") {
      filtered = filtered.filter(f => {
        if (filterEstadoFlotas === "habilitadas") return f.habilitado !== false;
        if (filterEstadoFlotas === "deshabilitadas") return f.habilitado === false;
        return true;
      });
    }
    
    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByFlotas) {
      case "nombre-asc":
        sorted.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => (b.nombre || "").localeCompare(a.nombre || ""));
        break;
      case "nit-asc":
        sorted.sort((a, b) => (a.documentosFlota?.nit || "").localeCompare(b.documentosFlota?.nit || ""));
        break;
      case "nit-desc":
        sorted.sort((a, b) => (b.documentosFlota?.nit || "").localeCompare(a.documentosFlota?.nit || ""));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [flotas, searchFlotas, filterEstadoFlotas, sortByFlotas]);

  // Funciones de manejo de formulario
  const handleOpenDialog = (flota = null) => {
    if (flota) {
      setEditMode(true);
      setCurrentFlota(flota);
      setFormData({
        nombre: flota.nombre || "",
        imageUrl: flota.imageUrl || "",
        nit: flota.documentosFlota?.nit || "",
        representanteLegal: flota.perfilFlota?.representanteLegal || "",
        telefono: flota.perfilFlota?.telefono || "",
        emailContacto: flota.documentosFlota?.emailContacto || "",
        domicilio: flota.documentosFlota?.domicilio || "",
        ruc: flota.documentosFlota?.ruc || "",
        cedulaRepresentante: flota.documentosFlota?.cedulaRepresentante || "",
        vigenciaLicenciaMunicipal: flota.documentosFlota?.vigenciaLicenciaMunicipal || "",
        vigenciaSeguro: flota.documentosFlota?.vigenciaSeguro || "",
        uidPropietarios: flota.uidPropietarios || [],
        servicios: typeof flota.servicios === 'object' && !Array.isArray(flota.servicios) ? flota.servicios : {},
        documentos: typeof flota.documentos === 'object' && !Array.isArray(flota.documentos) ? flota.documentos : {},
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
        emailContacto: "",
        domicilio: "",
        ruc: "",
        cedulaRepresentante: "",
        vigenciaLicenciaMunicipal: "",
        vigenciaSeguro: "",
        uidPropietarios: [],
        servicios: {},
        documentos: {},
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
        const idForImage = (editMode && currentFlota && currentFlota.id) ? currentFlota.id : Date.now();
        imageUrl = await uploadImageToStorage(imageFile, idForImage);
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
          ruc: formData.ruc || "",
          cedulaRepresentante: formData.cedulaRepresentante || "",
          vigenciaLicenciaMunicipal: formData.vigenciaLicenciaMunicipal || "",
          vigenciaSeguro: formData.vigenciaSeguro || "",
          emailContacto: formData.emailContacto || "",
          domicilio: formData.domicilio || "",
        },
        uidPropietarios: formData.uidPropietarios,
        servicios: formData.servicios,
        documentos: formData.documentos || [],
        habilitado: formData.habilitado,
      };

      if (editMode && currentFlota) {
        await updateFlota(currentFlota.id, flotaData);
        
        // Obtener los UIDs anteriores de los administradores
        const adminsAnteriores = currentFlota.uidPropietarios || [];
        
        // Actualizar flotaId en usuarios seleccionados
        for (const uid of formData.uidPropietarios) {
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, { flotaId: currentFlota.id, updatedAt: serverTimestamp() });
        }
        
        // Remover flotaId de los administradores que fueron desasignados
        const adminsDesasignados = adminsAnteriores.filter(uid => !formData.uidPropietarios.includes(uid));
        for (const uid of adminsDesasignados) {
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, { flotaId: null, updatedAt: serverTimestamp() });
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

  // Funciones para gestión de documentos por flota
  const handleOpenDocsManager = (flota) => {
    setSelectedFlotaForDocs(flota);
    setOpenDocsManagerModal(true);
  };

  const handleManageDocs = handleOpenDocsManager;

  const handleManageServicios = (flota) => {
    setSelectedFlotaForServicios(flota);
    setOpenServiciosManagerModal(true);
  };

  const handleSaveServicios = async (serviciosSeleccionados) => {
    if (!selectedFlotaForServicios) return;

    try {
      setIsSaving(true);
      
      // Actualizar la flota con los servicios seleccionados
      await updateFlota(selectedFlotaForServicios.id, {
        ...selectedFlotaForServicios,
        servicios: serviciosSeleccionados,
      });

      // Actualizar estado local
      await fetchFlotas();
      setOpenServiciosManagerModal(false);
      showSnackbar("Servicios actualizados exitosamente", "success");
    } catch (error) {
      console.error("Error actualizando servicios:", error);
      showSnackbar("Error al actualizar servicios", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseDocsManagerModal = () => {
    setOpenDocsManagerModal(false);
    setSelectedFlotaForDocs(null);
  };

  // Asignar plantillas globales (crear-documentos) a la flota seleccionada
  const handleAssignTemplatesToFlota = async (templatesSelected) => {
    if (!selectedFlotaForDocs) return;
    
    try {
      // templatesSelected ahora es un objeto con estructura: { ciudad: { slug: { id: "..." } } }
      // Permitir vacío para eliminar todos los documentos
      const flotaRef = doc(db, 'flotas', selectedFlotaForDocs.id);

      // Si templatesSelected está vacío, guardar objeto vacío o eliminar el campo
      const documentosAGuardar = (templatesSelected && typeof templatesSelected === 'object' && Object.keys(templatesSelected).length > 0) 
        ? templatesSelected 
        : {};

      // Actualizar con los nuevos documentos (estructura nueva: flota.documentos por departamento)
      await updateDoc(flotaRef, {
        documentos: documentosAGuardar,
        updatedAt: serverTimestamp(),
      });

      setSelectedFlotaForDocs({
        ...selectedFlotaForDocs,
        documentos: documentosAGuardar,
      });
      
      await fetchFlotas();
      showSnackbar('Documentos actualizados correctamente', 'success');
    } catch (error) {
      console.error('Error asignando plantillas a la flota:', error);
      showSnackbar('Error al actualizar documentos: ' + error.message, 'error');
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

        {/* Toolbar para Flotas */}
        <TableToolbar
          searchValue={searchFlotas}
          onSearchChange={setSearchFlotas}
          sortOptions={[
            { label: "↑ Sort by Nombre (ASC)", value: "nombre-asc" },
            { label: "↓ Sort by Nombre (DESC)", value: "nombre-desc" },
            { label: "↑ Sort by NIT (ASC)", value: "nit-asc" },
            { label: "↓ Sort by NIT (DESC)", value: "nit-desc" },
          ]}
          sortValue={sortByFlotas}
          onSortChange={setSortByFlotas}
          filterOptions={[
            {
              name: "estado",
              label: "Estado",
              defaultValue: "todos",
              options: [
                { label: "Todas", value: "todos" },
                { label: "Habilitadas", value: "habilitadas" },
                { label: "Deshabilitadas", value: "deshabilitadas" },
              ],
            },
          ]}
          filterValue={{ estado: filterEstadoFlotas }}
          onFilterChange={(name, value) => setFilterEstadoFlotas(value)}
          visibleColumns={visibleColumnsFlotas}
          onColumnChange={(col, visible) => setVisibleColumnsFlotas(prev => ({ ...prev, [col]: visible }))}
          showClearButton={true}
        />

        <FlotasTable
          flotas={flotasFiltradas}
          administradores={administradores}
          servicios={serviciosDisponibles}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          onToggleHabilitado={toggleHabilitado}
          onManageDocs={handleManageDocs}
          onManageServicios={handleManageServicios}
          visibleColumns={visibleColumnsFlotas}
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
        serviciosPorCiudad={serviciosPorCiudad}
        documentosPorCiudad={documentosPorCiudad}
        onSave={handleSave}
        isSaving={isSaving}
        editMode={editMode}
        onFormDataChange={setFormData}
        getAvailableAdministradores={(currentFlotaId) => {
          const selectedUids = formData.uidPropietarios || [];
          return administradores.filter((admin) => {
            // Si está en la selección actual, permitir deseleccionar
            if (selectedUids.includes(admin.uid)) return true;
            // Si el admin no tiene flota, está disponible
            if (!admin.flotaId) return true;
            // Si el admin ya está en otra flota, no lo muestra
            return false;
          });
        }}
      />

      {/* Modal de gestión de documentos por flota */}
      <DocsManagerModal
        open={openDocsManagerModal}
        onClose={handleCloseDocsManagerModal}
        flota={selectedFlotaForDocs}
        onAssignTemplates={handleAssignTemplatesToFlota}
      />

      {/* Modal de gestión de servicios por flota */}
      <ServiciosManagerModalNew
        open={openServiciosManagerModal}
        onClose={() => setOpenServiciosManagerModal(false)}
        flota={selectedFlotaForServicios}
        serviciosPorCiudad={serviciosPorCiudad}
        onSaveServicios={handleSaveServicios}
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
