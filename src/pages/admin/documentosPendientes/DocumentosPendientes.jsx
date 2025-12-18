// src/pages/admin/documentosPendientes/DocumentosPendientes.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useAuth } from "../../../auth/AuthContext";
import { useUserFlota, useDocumentosPendientes } from "./hooks/useDocumentosPendientes";
import DocumentosHeader from "./components/DocumentosHeader";
import DocumentosModal from "./components/DocumentosModal";
import { TableToolbar } from "../usuarios/components/TableToolbar";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileCopyIcon from "@mui/icons-material/FileCopy";

const DocumentosPendientes = () => {
  const { user } = useAuth();
  const { userFlotaId, nombreFlota } = useUserFlota(user?.uid);
  const { trabajadores, loading } = useDocumentosPendientes(userFlotaId);
  
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchDocumentos, setSearchDocumentos] = useState("");
  const [sortByDocumentos, setSortByDocumentos] = useState("nombre-asc");
  const [filterEstadoDocumentos, setFilterEstadoDocumentos] = useState("todos");
  const [visibleColumnsDocumentos, setVisibleColumnsDocumentos] = useState({
    foto: true,
    nombre: true,
    email: true,
    documentosPendientes: true,
    acciones: true,
  });
  const [pageDocumentos, setPageDocumentos] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setPageDocumentos(0);
  }, [searchDocumentos]);

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

  // Obtener documentos pendientes
  const getDocumentosPendientes = (documentos) => {
    const docs = documentos || [];
    let docsArray = [];
    if (Array.isArray(docs)) {
      docsArray = docs;
    } else if (typeof docs === 'object' && docs !== null) {
      docsArray = Object.keys(docs)
        .filter(key => docs[key] && typeof docs[key] !== 'boolean')
        .map(key => docs[key]);
    }
    return docsArray.filter((d) => {
      if (typeof d === 'string') {
        return true;
      }
      return d && typeof d === 'object' && d.estado !== "aprobado" && d.estado !== "rechazado";
    });
  };

  // Filtrado y ordenamiento
  const trabajadoresFiltrados = useMemo(() => {
    let filtered = trabajadores;

    // Filtro por estado de documentos
    if (filterEstadoDocumentos !== "todos") {
      filtered = filtered.filter(t => {
        const documentos = t.documentos || {};
        const tieneDocumentos = Object.keys(documentos).length > 0;
        
        if (!tieneDocumentos) return false;
        
        if (filterEstadoDocumentos === "pendientes") {
          const docsPendientes = getDocumentosPendientes(documentos);
          return docsPendientes.length > 0;
        } else if (filterEstadoDocumentos === "aprobados") {
          const docsAprobados = Object.values(documentos).filter(
            d => d && typeof d === 'object' && d.estado === "aprobado"
          );
          return docsAprobados.length > 0;
        } else if (filterEstadoDocumentos === "rechazados") {
          const docsRechazados = Object.values(documentos).filter(
            d => d && typeof d === 'object' && d.estado === "rechazado"
          );
          return docsRechazados.length > 0;
        } else if (filterEstadoDocumentos === "sin-docs") {
          return !tieneDocumentos || Object.keys(documentos).length === 0;
        }
        return true;
      });
    }

    // Búsqueda
    if (searchDocumentos) {
      const search = searchDocumentos.toLowerCase();
      filtered = filtered.filter(t =>
        (t.perfil?.name || "").toLowerCase().includes(search) ||
        (t.perfil?.email || "").toLowerCase().includes(search)
      );
    }

    const sorted = [...filtered];
    switch (sortByDocumentos) {
      case "nombre-asc":
        sorted.sort((a, b) => (a.perfil?.name || "").localeCompare(b.perfil?.name || ""));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => (b.perfil?.name || "").localeCompare(a.perfil?.name || ""));
        break;
      case "pendientes-desc":
        sorted.sort((a, b) => getDocumentosPendientes(b.documentos).length - getDocumentosPendientes(a.documentos).length);
        break;
      default:
        break;
    }

    return sorted;
  }, [trabajadores, searchDocumentos, sortByDocumentos, filterEstadoDocumentos]);

  // Paginación
  const trabajadoresPaginados = useMemo(() => {
    const start = pageDocumentos * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return trabajadoresFiltrados.slice(start, end);
  }, [trabajadoresFiltrados, pageDocumentos]);

  const totalPagesDocumentos = Math.ceil(trabajadoresFiltrados.length / ITEMS_PER_PAGE);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <DocumentosHeader nombreFlota={nombreFlota} hasFlota={!!userFlotaId}>
          {userFlotaId && (
            <Box>
              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "flex-end" }}>
                <Box sx={{ flex: 1 }}>
                  <TableToolbar
                    searchValue={searchDocumentos}
                    onSearchChange={setSearchDocumentos}
                    sortValue={sortByDocumentos}
                    onSortChange={setSortByDocumentos}
                    sortOptions={[
                      { label: "↑ Sort by Nombre (ASC)", value: "nombre-asc" },
                      { label: "↓ Sort by Nombre (DESC)", value: "nombre-desc" },
                      { label: "↓ Sort by Documentos Pendientes", value: "pendientes-desc" },
                    ]}
                    placeholder="Buscar por nombre o email..."
                    visibleColumns={visibleColumnsDocumentos}
                    onColumnChange={(col, visible) => setVisibleColumnsDocumentos(prev => ({ ...prev, [col]: visible }))}
                    showClearButton={searchDocumentos !== ""}
                    onClear={() => {
                      setSearchDocumentos("");
                      setSortByDocumentos("nombre-asc");
                      setFilterEstadoDocumentos("todos");
                    }}
                  />
                </Box>
                <FormControl sx={{ minWidth: 200 }} size="small">
                  <InputLabel sx={{ fontSize: "0.875rem" }}>Estado de Documentos</InputLabel>
                  <Select
                    value={filterEstadoDocumentos}
                    label="Estado de Documentos"
                    onChange={(e) => setFilterEstadoDocumentos(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="pendientes">Con Documentos Pendientes</MenuItem>
                    <MenuItem value="aprobados">Con Documentos Aprobados</MenuItem>
                    <MenuItem value="rechazados">Con Documentos Rechazados</MenuItem>
                    <MenuItem value="sin-docs">Sin Documentos</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: "#000000" }}>
                    <TableRow>
                      <TableCell sx={{ 
                        backgroundColor: "#000000", 
                        color: "white", 
                        fontWeight: 700, 
                        fontFamily: "Mulish, sans-serif", 
                        fontSize: "0.95rem"
                      }}>Foto</TableCell>
                      <TableCell sx={{ 
                        backgroundColor: "#000000", 
                        color: "white", 
                        fontWeight: 700, 
                        fontFamily: "Mulish, sans-serif", 
                        fontSize: "0.95rem"
                      }}>Nombre</TableCell>
                      <TableCell sx={{ 
                        backgroundColor: "#000000", 
                        color: "white", 
                        fontWeight: 700, 
                        fontFamily: "Mulish, sans-serif", 
                        fontSize: "0.95rem"
                      }}>Email</TableCell>
                      <TableCell sx={{ 
                        backgroundColor: "#000000", 
                        color: "white", 
                        fontWeight: 700, 
                        fontFamily: "Mulish, sans-serif", 
                        fontSize: "0.95rem",
                        textAlign: "center"
                      }}>Documentos Pendientes</TableCell>
                      <TableCell sx={{ 
                        backgroundColor: "#000000", 
                        color: "white", 
                        fontWeight: 700, 
                        fontFamily: "Mulish, sans-serif", 
                        fontSize: "0.95rem",
                        textAlign: "center"
                      }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: "center", py: 3 }}>
                          <Typography>Cargando documentos...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : trabajadoresFiltrados.length > 0 ? (
                      trabajadoresPaginados.map((trabajador) => (
                        <TableRow
                          key={trabajador.id}
                          sx={{
                            borderBottom: "1px solid #d0d0d0",
                            "&:hover": { backgroundColor: "#f9f9f9" }
                          }}
                        >
                          <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                            <Avatar
                              src={trabajador.perfil?.photoUrl}
                              alt={trabajador.perfil?.name}
                              sx={{ width: 40, height: 40, bgcolor: "#d7171a" }}
                            >
                              {(trabajador.perfil?.name || "?")?.charAt(0).toUpperCase()}
                            </Avatar>
                          </TableCell>
                          <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                            {trabajador.perfil?.name || "Sin nombre"}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                            {trabajador.perfil?.email || "-"}
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            <Chip
                              label={`${getDocumentosPendientes(trabajador.documentos).length} pendiente${getDocumentosPendientes(trabajador.documentos).length !== 1 ? "s" : ""}`}
                              sx={{
                                backgroundColor: "#fff3cd",
                                color: "#856404",
                                fontWeight: 600,
                                fontFamily: "Mulish, sans-serif",
                              }}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(trabajador)}
                              title="Ver documentos"
                              sx={{ color: "#d7171a" }}
                            >
                              <FileCopyIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: "center", py: 3 }}>
                          No hay trabajadores con documentos pendientes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {trabajadoresFiltrados.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
                  <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                    Mostrando {pageDocumentos * ITEMS_PER_PAGE + 1} - {Math.min((pageDocumentos + 1) * ITEMS_PER_PAGE, trabajadoresFiltrados.length)} de {trabajadoresFiltrados.length}
                  </Typography>
                  <Pagination
                    count={totalPagesDocumentos}
                    page={pageDocumentos + 1}
                    onChange={(e, page) => setPageDocumentos(page - 1)}
                    sx={{
                      "& .MuiButtonBase-root": {
                        fontFamily: "Mulish, sans-serif",
                        color: "#000",
                      },
                      "& .Mui-selected": {
                        backgroundColor: "#aaaaaa !important",
                        color: "white",
                      },
                    }}
                  />
                </Box>
              )}
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
      </Paper>
    </Box>
  );
};

export default DocumentosPendientes;
