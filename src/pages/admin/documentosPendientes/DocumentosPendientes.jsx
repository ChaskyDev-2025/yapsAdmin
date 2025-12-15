// src/pages/admin/documentosPendientes/DocumentosPendientes.jsx
import React, { useState, useMemo } from "react";
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
  const [visibleColumnsDocumentos, setVisibleColumnsDocumentos] = useState({
    foto: true,
    nombre: true,
    email: true,
    documentosPendientes: true,
    acciones: true,
  });

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
  }, [trabajadores, searchDocumentos, sortByDocumentos]);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <DocumentosHeader nombreFlota={nombreFlota} hasFlota={!!userFlotaId}>
          {userFlotaId && (
            <Box>
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
                sx={{ mb: 3 }}
                visibleColumns={visibleColumnsDocumentos}
                onColumnChange={(col, visible) => setVisibleColumnsDocumentos(prev => ({ ...prev, [col]: visible }))}
                showClearButton={searchDocumentos !== ""}
                onClear={() => {
                  setSearchDocumentos("");
                  setSortByDocumentos("nombre-asc");
                }}
              />

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
                      trabajadoresFiltrados.map((trabajador) => (
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
