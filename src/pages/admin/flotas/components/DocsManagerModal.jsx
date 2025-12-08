// src/pages/admin/flotas/components/DocsManagerModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../data/firebase/firebase';

const CIUDADES = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

export const DocsManagerModal = ({
  open,
  onClose,
  flota,
  onAssignTemplates,
}) => {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("");

  // Función para cargar templates
  const fetchTemplates = async () => {
    try {
      const templatesPorCiudad = {};
      
      // Cargar documentos de todas las ciudades EN PARALELO
      const promesasCiudades = CIUDADES.map(async (ciudad) => {
        const ciudadDocId = ciudad.toLowerCase().replace(/\s+/g, '') + "_doc";
        const docRef = doc(db, "crear-documentos", ciudadDocId);
        
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().documentosPorCiudad) {
            return { ciudad, documentos: docSnap.data().documentosPorCiudad || [] };
          }
        } catch (e) {
          console.warn(`Error cargando documentos de ${ciudad}:`, e);
        }
        return { ciudad, documentos: [] };
      });
      
      // Esperar a que todas las promesas se resuelvan
      const resultados = await Promise.all(promesasCiudades);
      resultados.forEach(({ ciudad, documentos }) => {
        templatesPorCiudad[ciudad] = documentos;
      });
      
      setTemplates(templatesPorCiudad);
    } catch (err) {
      console.error('Error cargando plantillas:', err);
    }
  };

  // Cargar templates cuando el componente monta (una sola vez)
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Verificar si todos los documentos están asignados
  useEffect(() => {
    if (open && templates && typeof templates === 'object') {
      const assignedCount = flota?.documentos?.length || 0;
      // Contar total de documentos en todas las ciudades
      let totalCount = 0;
      for (const ciudad in templates) {
        const docs = templates[ciudad];
        if (Array.isArray(docs)) {
          totalCount += docs.length;
        }
      }
      
      if (totalCount > 0) {
        if (assignedCount === totalCount) {
          setMessage({
            type: 'success',
            text: `✓ Todos los ${assignedCount} documentos disponibles están asignados`
          });
        } else if (assignedCount > 0) {
          setMessage({
            type: 'info',
            text: `${assignedCount} de ${totalCount} documentos asignados`
          });
        } else {
          setMessage(null);
        }
      }
    }
  }, [open, flota?.documentos, templates]);

  useEffect(() => {
    // Precargar selección si la flota ya tiene documentos asignados
    const assigned = flota?.documentos || [];
    setSelectedTemplates(assigned);
  }, [flota, open]);

  // Función para buscar el nombre y ciudad de un documento por su slug o ID
  const getDocInfo = (docIdentifier) => {
    if (!templates || typeof templates !== 'object') return { name: docIdentifier, ciudad: null };
    
    // Buscar en todas las ciudades
    for (const ciudad in templates) {
      const docs = templates[ciudad];
      if (Array.isArray(docs)) {
        const found = docs.find(t => {
          const slug = generateDocumentSlug(t.titulo || t.screenTitle || t.nombre || t.id);
          return slug === docIdentifier || t.id === docIdentifier;
        });
        if (found) {
          return {
            name: found.titulo || found.screenTitle || found.nombre || docIdentifier,
            ciudad
          };
        }
      }
    }
    return { name: docIdentifier, ciudad: null };
  };

  // Función para buscar el nombre de un documento por su ID
  const getDocName = (docId) => {
    const info = getDocInfo(docId);
    return info.name;
  };

  // Generar un identificador único basado en el nombre del documento (ej: envios_vagoneta)
  const generateDocumentSlug = (docName) => {
    return docName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#d7171a",
          color: "white",
          fontFamily: "Mulish, sans-serif",
          fontWeight: 700,
        }}
      >
        📂 Gestión de Documentos - {flota?.nombre}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {message && (
          <Alert 
            severity={message.type === 'success' ? 'success' : 'info'}
            sx={{ mb: 2, fontFamily: "Mulish, sans-serif" }}
          >
            {message.text}
          </Alert>
        )}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
            Plantillas de Documentos
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArticleIcon />}
            onClick={() => setAssignDialogOpen(true)}
            sx={{
              borderColor: "#1976d2",
              color: "#1976d2",
              fontFamily: "Mulish, sans-serif",
              fontWeight: 600,
              "&:hover": { borderColor: "#115293", bgcolor: "rgba(25,118,210,0.04)" },
            }}
          >
            {(flota?.documentos?.length || 0) > 0 ? 'Agregar más documentos' : 'Asignar Plantilla'}
          </Button>
        </Box>

        {(flota?.documentos && Array.isArray(flota.documentos) && flota.documentos.length > 0) ? (
          <Box>
            {CIUDADES.map(ciudad => {
              const docsEnCiudad = flota.documentos.filter(docId => {
                const info = getDocInfo(docId);
                return info.ciudad === ciudad;
              });
              
              if (docsEnCiudad.length === 0) return null;
              
              return (
                <Box key={ciudad} sx={{ mb: 2 }}>
                  <Typography 
                    variant="subtitle2"
                    sx={{
                      fontFamily: "Mulish, sans-serif",
                      fontWeight: 700,
                      color: '#d7171a',
                      mb: 1,
                      fontSize: '0.9rem'
                    }}
                  >
                    📍 {ciudad}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pl: 1 }}>
                    {docsEnCiudad.map((docIdentifier, i) => {
                      const docName = getDocName(docIdentifier);
                      return (
                        <Chip 
                          key={docIdentifier || i} 
                          label={docName} 
                          color="primary"
                          onDelete={() => {
                            const updated = flota.documentos.filter(d => d !== docIdentifier);
                            if (onAssignTemplates) onAssignTemplates(updated);
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Alert severity="info" sx={{ fontFamily: "Mulish, sans-serif" }}>
            No hay documentos asignados. Haz clic en "Agregar documentos" para comenzar.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600, color: "#484848" }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>

    {/* Dialogo para asignar plantillas */}
    <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar Documentos a {flota?.nombre}</DialogTitle>
      <DialogContent>
        {CIUDADES.length > 0 && (
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontFamily: "Mulish, sans-serif",
                fontWeight: 600,
                mb: 1,
              }}
            >
              Filtrar por Departamento:
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Chip
                label="Todos"
                onClick={() => setCiudadSeleccionada("")}
                color={ciudadSeleccionada === "" ? "primary" : "default"}
                variant={ciudadSeleccionada === "" ? "filled" : "outlined"}
                sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
              />
              {CIUDADES.map((ciudad) => (
                <Chip
                  key={ciudad}
                  label={ciudad}
                  onClick={() => setCiudadSeleccionada(ciudad)}
                  color={ciudadSeleccionada === ciudad ? "primary" : "default"}
                  variant={ciudadSeleccionada === ciudad ? "filled" : "outlined"}
                  sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
                />
              ))}
            </Box>
          </Box>
        )}
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : !templates || typeof templates !== 'object' || Object.keys(templates).length === 0 ? (
            <Typography sx={{ fontFamily: 'Mulish, sans-serif' }}>No hay documentos disponibles</Typography>
          ) : (
            CIUDADES.filter(ciudad => !ciudadSeleccionada || ciudadSeleccionada === ciudad).map((ciudad) => {
              const docsEnCiudad = templates[ciudad] || [];
              if (docsEnCiudad.length === 0) return null;
              
              return (
                <Box key={ciudad} sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: 'Mulish, sans-serif', 
                      fontWeight: 700,
                      color: '#d7171a',
                      mb: 1,
                      borderBottom: '1px solid #ddd',
                      pb: 1
                    }}
                  >
                    📍 {ciudad}
                  </Typography>
                  {docsEnCiudad.map((tpl) => {
                    const docSlug = generateDocumentSlug(tpl.titulo || tpl.screenTitle || tpl.nombre || tpl.id);
                    const isSelected = selectedTemplates.includes(docSlug);
                    const docName = tpl.titulo || tpl.screenTitle || tpl.nombre || tpl.id;
                    return (
                      <Box 
                        key={tpl.id} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          py: 0.8,
                          pl: 1,
                          borderRadius: '4px',
                          '&:hover': { bgcolor: 'rgba(215, 23, 26, 0.05)' }
                        }}
                      >
                        <Typography sx={{ fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem' }}>{docName}</Typography>
                        <Button 
                          size="small" 
                          variant={isSelected ? 'contained' : 'outlined'} 
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTemplates(prev => prev.filter(id => id !== docSlug));
                            } else {
                              setSelectedTemplates(prev => [...prev, docSlug]);
                            }
                          }}
                          sx={{
                            ...(isSelected && {
                              bgcolor: '#d7171a',
                              '&:hover': { bgcolor: '#b01117' }
                            })
                          }}
                        >
                          {isSelected ? <><CheckIcon fontSize="small" sx={{ mr: .5 }} />Seleccionado</> : 'Seleccionar'}
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              );
            })
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAssignDialogOpen(false)} startIcon={<CloseIcon />}>Cancelar</Button>
        <Button 
          onClick={() => {
            // Pasar los IDs de documentos seleccionados al padre
            if (onAssignTemplates) onAssignTemplates(selectedTemplates);
            setAssignDialogOpen(false);
          }} 
          variant="contained"
        >
          Asignar
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default DocsManagerModal;
