import { useState, useCallback, useEffect } from "react";
import {
  Typography, Paper, Stack, Alert, Box, Chip, Tabs, Tab
} from "@mui/material";
import { Tabla2 }        from "../../../shared/components/tablas/tabla";
import { Columns }       from "./data/Columns";

import EditIcon          from "@mui/icons-material/Edit";
import DeleteIcon        from "@mui/icons-material/Delete";
import IconActionButton  from "../../../shared/components/botones/Botones";
import DocumentoModal    from "./components/modalCrearDocs/DocumentoModal";
import ModalEditDocs from "./components/modalEditDocs/ModalEditDocs";
import { useDocuments } from "../../../hooks/useDocuments";
import { useAuth } from "../../../auth/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";

const CIUDADES = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

const Documentos = () => {
  const { userFlotaId } = useAuth();
  const [flotaInfo, setFlotaInfo] = useState(null);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("La Paz");
  const isSuperAdmin = !userFlotaId; // SuperAdmin no tiene flotaId
  
  /* ── estado del modal ───────────── */
  const { rows, loading, create, update, remove, toggleActivo } = useDocuments();
  const [openCreate, setOpenCreate] = useState(false);
  const handleOpen  = () => setOpenCreate(true);
  const handleClose = () => setOpenCreate(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [docSeleccionado, setDocSeleccionado] = useState(null);

  // Cargar información de la flota si es admin
  useEffect(() => {
    const loadFlotaInfo = async () => {
      if (userFlotaId) {
        // Admin: cargar solo su flota
        try {
          const flotaDoc = await getDoc(doc(db, "flotas", userFlotaId));
          if (flotaDoc.exists()) {
            setFlotaInfo(flotaDoc.data());
          }
        } catch (error) {
          console.error("Error cargando info de flota:", error);
        }
      }
    };
    loadFlotaInfo();
  }, [userFlotaId]);

  // Filtrar documentos por ciudad seleccionada
  const documentosPorCiudad = rows.filter(
    (doc) => doc.ciudad === ciudadSeleccionada
  );

  const handleSave = async (nuevoDoc) => {
    try {
      await create({ 
        ...nuevoDoc, 
        titulo: nuevoDoc.screenTitle,
        ciudad: ciudadSeleccionada
        // No pasar flotaId - los documentos por ciudad se asignan a flotas en GestionFlotas
      });
      handleClose();            // cierra el modal
    } catch (err) {
      console.error("❌ Error al guardar documento:", err);
    }
  };

  // ── Actualizar documento ────
  const handleUpdate = async (docEditado) => {
    try {
      await update(docEditado.id, docEditado);

      setOpenEdit(false);                 // cierra el modal
    } catch (e) {
      console.error("❌ Error al actualizar:", e);
    }
  };

  // dentro de Documentos
  const handleToggleActivo = (id, nuevoValor) => {
    toggleActivo(id, nuevoValor).catch((err) =>
      console.error("❌ Error al cambiar activo:", err)
    );
  };


  /* ── Cli en el Row ─── */
  const handleRowClick = useCallback((params) => {
    setDocSeleccionado(params.row);
    setOpenEdit(true);
  }, []);

  /* ── botones de acción por fila ─── */
  const renderAcciones = useCallback(({ row }) => (
    <Stack direction="row" spacing={1}>
      <IconActionButton
        icon={<EditIcon fontSize="small" />}
        color="primary"
        onClick={(e) => {
          e.stopPropagation(); 
          setDocSeleccionado(row);
          setOpenEdit(true);
        }}
      />
      <IconActionButton
        icon={<DeleteIcon fontSize="small" />}
        color="error"
        onClick={async (e) => {
          e.stopPropagation();
          const confirm = window.confirm(`¿Eliminar "${row.titulo}"?`);
          if (!confirm) return;
            await remove(row.id);
          try {
            
          } catch (err) {
            console.error("❌ Error al eliminar:", err);
          }
        }}
      />
    </Stack>
  ), [remove]);

  const columns = Columns(handleToggleActivo, renderAcciones);

  /* ── UI ─────────────────────────── */
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
          border: "0.1px solid rgba(146,144,144,.6)"
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Documentos por Ciudad
          </Typography>
          
          {isSuperAdmin ? (
            <Alert 
              severity="success" 
              sx={{ 
                mt: 2,
                backgroundColor: "#c8e6c9",
                "& .MuiAlert-icon": { color: "#2e7d32" }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  👑 Modo SuperAdmin - Gestiona documentos de cualquier flota
                </Typography>
              </Box>
            </Alert>
          ) : (
            userFlotaId && flotaInfo && (
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2,
                  backgroundColor: "#e3f2fd",
                  "& .MuiAlert-icon": { color: "#1976d2" }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    📂 Gestionando documentos de la flota:
                  </Typography>
                  <Chip
                    label={flotaInfo.nombre}
                    sx={{
                      bgcolor: "#d7171a",
                      color: "white",
                      fontWeight: 600,
                      fontFamily: "Mulish, sans-serif"
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "#666", fontStyle: "italic" }}>
                    (Solo puedes ver y modificar documentos de tu flota)
                  </Typography>
                </Box>
              </Alert>
            )
          )}

          <Typography color="text.secondary" mt={2}>
            Selecciona una ciudad para gestionar los documentos específicos de esa región.
          </Typography>
        </Box>

        {/* Pestañas por ciudad */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs 
            value={ciudadSeleccionada}
            onChange={(e, newCity) => setCiudadSeleccionada(newCity)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                fontFamily: "Mulish, sans-serif",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.95rem"
              },
              "& .MuiTab-root.Mui-selected": {
                color: "#d7171a",
                fontWeight: 700
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#d7171a"
              }
            }}
          >
            {CIUDADES.map((ciudad) => (
              <Tab 
                key={ciudad}
                label={ciudad} 
                value={ciudad}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tabla con documentos de la ciudad seleccionada */}
        <Tabla2
          rows={documentosPorCiudad}
          columns={columns}
          height="51vh"
          pageSize={10}
          loading={loading}
          showButton
          buttonLabel="Crear documento"
          onButtonClick={handleOpen}
          onRowClick={handleRowClick}
        />
      </Paper>

      {/* Modal separado y reutilizable */}
      <DocumentoModal
        open={openCreate}
        onClose={handleClose}
        onSave={handleSave}
        ciudadSeleccionada={ciudadSeleccionada}
      />
      <ModalEditDocs
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        documento={docSeleccionado}
        onSave={handleUpdate}
      />
    </>
  );
};

export default Documentos;
