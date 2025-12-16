import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Typography, Paper, Stack, Alert, Box, Chip, Tabs, Tab, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, IconButton, Tooltip, Pagination
} from "@mui/material";
import { Tabla2 }        from "../../../shared/components/tablas/tabla";

import AddIcon           from "@mui/icons-material/Add";
import EditIcon          from "@mui/icons-material/Edit";
import DeleteIcon        from "@mui/icons-material/Delete";
import IconActionButton  from "../../../shared/components/botones/Botones";
import DocumentoModal    from "./components/modalCrearDocs/DocumentoModal";
import ModalEditDocs from "./components/modalEditDocs/ModalEditDocs";
import { useDocuments } from "../../../hooks/useDocuments";
import { useAuth } from "../../../auth/AuthContext";
import { TableToolbar } from "../usuarios/components/TableToolbar";
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
  
  // Estados para búsqueda y ordenamiento
  const [searchDocumentos, setSearchDocumentos] = useState("");
  const [sortByDocumentos, setSortByDocumentos] = useState("titulo-asc");
  
  // Estados para paginación
  const ITEMS_PER_PAGE = 10;
  const [pageDocumentos, setPageDocumentos] = useState(0);
  
  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setPageDocumentos(0);
  }, [searchDocumentos]);
  
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

  // Filtrar y ordenar documentos
  const filteredDocumentos = useMemo(() => {
    let result = [...documentosPorCiudad];
    
    // Filtrar por búsqueda
    if (searchDocumentos.trim()) {
      const search = searchDocumentos.toLowerCase();
      result = result.filter(doc =>
        (doc.titulo || "").toLowerCase().includes(search) ||
        (doc.screenTitle || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenar
    if (sortByDocumentos === "titulo-asc") {
      result.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
    } else if (sortByDocumentos === "titulo-desc") {
      result.sort((a, b) => (b.titulo || "").localeCompare(a.titulo || ""));
    }
    
    return result;
  }, [documentosPorCiudad, searchDocumentos, sortByDocumentos]);

  // Datos paginados para Documentos
  const documentosPaginados = useMemo(() => {
    const start = pageDocumentos * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredDocumentos.slice(start, end);
  }, [filteredDocumentos, pageDocumentos]);

  const totalPagesDocumentos = Math.ceil(filteredDocumentos.length / ITEMS_PER_PAGE);

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

  /* ── UI ─────────────────────────── */
  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={6}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: "#f9f9f9"
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <TableToolbar
              searchValue={searchDocumentos}
              onSearchChange={setSearchDocumentos}
              sortOptions={[
                { label: "↑ Sort by Título (ASC)", value: "titulo-asc" },
                { label: "↓ Sort by Título (DESC)", value: "titulo-desc" },
                { label: "↑ Sort by Fecha (ASC)", value: "fecha-asc" },
                { label: "↓ Sort by Fecha (DESC)", value: "fecha-desc" },
              ]}
              sortValue={sortByDocumentos}
              onSortChange={setSortByDocumentos}
              filterOptions={[]}
              visibleColumns={{}}
              onColumnChange={() => {}}
              showClearButton={true}
            />
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpen}
            sx={{ backgroundColor: "#d7171a", whiteSpace: "nowrap" }}
          >
            Crear Documento
          </Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: "#000000" }}>
              <TableRow>
                <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>ID</TableCell>
                <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Título</TableCell>
                <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Departamento</TableCell>
                <TableCell align="center" sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Activo</TableCell>
                <TableCell align="center" sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documentosPaginados.map((doc) => (
                <TableRow 
                  key={doc.firebaseId} 
                  hover
                  onClick={() => handleRowClick({ row: doc })}
                  sx={{ cursor: "pointer", borderBottom: "1px solid #d0d0d0" }}
                >
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>{doc.numero || "-"}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: "Mulish, sans-serif" }}>{doc.titulo}</TableCell>
                  <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>{doc.ciudad}</TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={!!doc.activo}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleActivo(doc.firebaseId, e.target.checked);
                      }}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#d7171a',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#d7171a',
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocSeleccionado(doc);
                          setOpenEdit(true);
                        }}
                        sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffb3b8" } }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(doc.firebaseId);
                        }}
                        sx={{ bgcolor: "#ffebee", color: "#d7171a", "&:hover": { bgcolor: "#ffcdd2" } }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredDocumentos.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
              Mostrando {documentosPaginados.length > 0 ? (pageDocumentos * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pageDocumentos + 1) * ITEMS_PER_PAGE, filteredDocumentos.length)} de {filteredDocumentos.length}
            </Typography>
            <Pagination 
              count={totalPagesDocumentos}
              page={pageDocumentos + 1}
              onChange={(e, page) => setPageDocumentos(page - 1)}
              sx={{
                "& .MuiPaginationItem-root": {
                  fontFamily: "Mulish, sans-serif",
                  color: "#000",
                }
              }}
            />
          </Box>
        )}
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
    </Box>
  );
};

export default Documentos;
