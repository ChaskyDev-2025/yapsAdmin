// src/pages/admin/flotas/components/DocsManagerModal.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  const [selectedTemplates, setSelectedTemplates] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("");

  // Función para generar slug basado en el nombre del documento
  const generateDocSlug = (docName) => {
    return docName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
  };

  // Función para extraer la categoría del documento basada en su nombre
  const getDocCategory = (doc) => {
    const nombre = (doc.titulo || doc.screenTitle || doc.nombre || '').toLowerCase();
    
    // Palabras clave para categorías
    if (nombre.includes('foto') || nombre.includes('image') || nombre.includes('imagen')) {
      return 'Documentos de Identidad';
    }
    if (nombre.includes('licencia') || nombre.includes('conductor') || nombre.includes('cdla')) {
      return 'Licencia';
    }
    if (nombre.includes('seguro') || nombre.includes('poliza') || nombre.includes('responsabilidad')) {
      return 'Seguros';
    }
    if (nombre.includes('registro') || nombre.includes('tarjeta') || nombre.includes('rtv')) {
      return 'Registro y Documentación';
    }
    if (nombre.includes('circulacion') || nombre.includes('soat')) {
      return 'Circulación';
    }
    
    return 'Otros';
  };

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

  // Inicializar selectedTemplates desde flota.documentos cuando se abre el modal
  useEffect(() => {
    if (!open) {
      return;
    }
    
    if (flota?.documentos && typeof flota.documentos === 'object' && !Array.isArray(flota.documentos)) {
      const initialized = {};
      
      // Iterar sobre las ciudades en flota.documentos
      Object.entries(flota.documentos).forEach(([ciudad, docs]) => {
        // Ignorar índices numéricos (artefactos de serialización)
        if (isNaN(Number(ciudad))) {
          if (typeof docs === 'object' && !Array.isArray(docs)) {
            // Convertir de objeto a array: {slug: {id: docId}} -> [{slug, id, nombre}]
            const docsArray = Object.entries(docs).map(([slug, docInfo]) => {
              console.log('Convirtiendo documento de objeto a array:', { ciudad, slug, docInfo });
              return {
                slug,
                id: docInfo.id || docInfo,
                nombre: docInfo.nombre || slug.replace(/_/g, ' ')
              };
            });
            initialized[ciudad] = docsArray;
          } else if (Array.isArray(docs)) {
            // Ya está en formato array, usarlo directo
            initialized[ciudad] = docs;
          }
        }
      });
      
      console.log('SelectedTemplates inicializado correctamente:', initialized);
      setSelectedTemplates(initialized);
    } else {
      setSelectedTemplates({});
    }
  }, [open, flota?.documentos]);

  // Calcular mensaje de estado (memoizado)
  const mensaje = useMemo(() => {
    if (open && flota?.documentos && typeof flota.documentos === 'object') {
      let totalAssigned = 0;
      for (const ciudad in flota.documentos) {
        if (typeof flota.documentos[ciudad] === 'object' && !Array.isArray(flota.documentos[ciudad])) {
          totalAssigned += Object.keys(flota.documentos[ciudad]).length;
        }
      }
      
      let totalCount = 0;
      for (const ciudad in templates) {
        const docs = templates[ciudad];
        if (Array.isArray(docs)) {
          totalCount += docs.length;
        }
      }
      
      if (totalCount > 0) {
        if (totalAssigned === totalCount) {
          return {
            type: 'success',
            text: `✓ Todos los ${totalAssigned} documentos disponibles están asignados`
          };
        } else if (totalAssigned > 0) {
          return {
            type: 'info',
            text: `${totalAssigned} de ${totalCount} documentos asignados`
          };
        }
      }
    }
    return null;
  }, [open, flota?.documentos, templates]);

  // Establecer el mensaje
  useEffect(() => {
    setMessage(mensaje);
  }, [mensaje]);

  // Obtener información del documento por slug o ID
  const getDocInfo = (docIdentifier) => {
    if (!templates || typeof templates !== 'object') return { nombre: docIdentifier, ciudad: null };
    
    // Buscar en todas las ciudades
    for (const ciudad in templates) {
      const docs = templates[ciudad];
      if (Array.isArray(docs)) {
        const found = docs.find(t => {
          const slug = generateDocSlug(t.titulo || t.screenTitle || t.nombre || t.id);
          return slug === docIdentifier || t.id === docIdentifier;
        });
        if (found) {
          return {
            nombre: found.titulo || found.screenTitle || found.nombre || docIdentifier,
            ciudad
          };
        }
      }
    }
    return { nombre: docIdentifier, ciudad: null };
  };

  const getDocName = (docIdentifier) => {
    const info = getDocInfo(docIdentifier);
    return info.nombre;
  };

  // Handler optimizado para seleccionar/deseleccionar documentos
  const handleToggleDoc = useCallback((ciudad, docSlug, tpl, isSelected) => {
    setSelectedTemplates(prevState => {
      const updated = JSON.parse(JSON.stringify(prevState));
      
      // Inicializar la ciudad si no existe
      if (!updated[ciudad]) {
        updated[ciudad] = [];
      }
      
      // Siempre usar array para múltiples documentos
      if (!Array.isArray(updated[ciudad])) {
        // Convertir de objeto antiguo a array
        updated[ciudad] = [];
      }
      
      if (isSelected) {
        // Remover del array
        updated[ciudad] = updated[ciudad].filter(item => item.slug !== docSlug);
      } else {
        // Agregar al array
        updated[ciudad].push({
          slug: docSlug,
          id: tpl.id,
          nombre: tpl.titulo || tpl.screenTitle || tpl.nombre
        });
      }
      
      // Limpiar ciudad si el array está vacío
      if (updated[ciudad].length === 0) {
        delete updated[ciudad];
      }
      
      return updated;
    });
  }, []);

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
            {Object.keys(selectedTemplates).length > 0 ? 'Agregar más documentos' : 'Asignar Plantilla'}
          </Button>
        </Box>

        {(flota?.documentos && typeof flota.documentos === 'object' && !Array.isArray(flota.documentos) && Object.keys(flota.documentos).length > 0) ? (
          <Box>
            {CIUDADES.map(ciudad => {
              const docsEnCiudad = flota.documentos[ciudad] || {};
              
              if (typeof docsEnCiudad !== 'object' || !docsEnCiudad || Object.keys(docsEnCiudad).length === 0) return null;
              
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
                    {Object.entries(docsEnCiudad).map(([slug, docId]) => {
                      const docName = getDocName(slug) || slug;
                      return (
                        <Chip 
                          key={slug} 
                          label={docName} 
                          color="primary"
                          onDelete={() => {
                            const updated = { ...flota.documentos };
                            delete updated[ciudad][slug];
                            if (Object.keys(updated[ciudad]).length === 0) {
                              delete updated[ciudad];
                            }
                            // Actualizar estado local también
                            setSelectedTemplates(updated);
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
              
              // Agrupar documentos por categoría
              const docsPorCategoria = {};
              docsEnCiudad.forEach(doc => {
                const categoria = getDocCategory(doc);
                if (!docsPorCategoria[categoria]) {
                  docsPorCategoria[categoria] = [];
                }
                docsPorCategoria[categoria].push(doc);
              });

              return (
                <Box key={ciudad} sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: 'Mulish, sans-serif', 
                      fontWeight: 700,
                      color: '#d7171a',
                      mb: 2,
                      borderBottom: '1px solid #ddd',
                      pb: 1
                    }}
                  >
                    📍 {ciudad}
                  </Typography>
                  
                  {Object.keys(docsPorCategoria).sort().map((categoria) => (
                    <Box key={categoria} sx={{ mb: 2.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'Mulish, sans-serif',
                          fontWeight: 600,
                          color: '#555',
                          mb: 1,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {categoria}
                      </Typography>
                      
                      <Box sx={{ pl: 1 }}>
                        {docsPorCategoria[categoria].map((tpl) => {
                          const docSlug = generateDocSlug(tpl.titulo || tpl.screenTitle || tpl.nombre || tpl.id);
                          const docsEnCiudad = selectedTemplates[ciudad] || [];
                          const isSelected = Array.isArray(docsEnCiudad) 
                            ? docsEnCiudad.some(item => {
                                const match = item.slug === docSlug;
                                if (!match) {
                                  console.log('Comparando slugs:', {
                                    template: docSlug,
                                    saved: item.slug,
                                    match
                                  });
                                }
                                return match;
                              })
                            : false;
                          const docName = tpl.titulo || tpl.screenTitle || tpl.nombre || tpl.id;
                          
                          return (
                            <Box 
                              key={tpl.id} 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                py: 1,
                                px: 1.5,
                                mb: 0.5,
                                borderRadius: '4px',
                                border: '1px solid #f0f0f0',
                                '&:hover': { 
                                  bgcolor: 'rgba(215, 23, 26, 0.05)',
                                  borderColor: '#d7171a'
                                },
                                bgcolor: isSelected ? 'rgba(215, 23, 26, 0.08)' : 'transparent'
                              }}
                            >
                              <Typography sx={{ fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem' }}>{docName}</Typography>
                              <Button 
                                size="small" 
                                variant={isSelected ? 'contained' : 'outlined'} 
                                onClick={() => handleToggleDoc(ciudad, docSlug, tpl, isSelected)}
                                sx={{
                                  ...(isSelected && {
                                    bgcolor: '#d7171a',
                                    '&:hover': { bgcolor: '#b01117' }
                                  })
                                }}
                              >
                                {isSelected ? (
                                  <>
                                    <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    Asignado
                                  </>
                                ) : (
                                  'Asignar'
                                )}
                              </Button>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
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
            // Convertir array a objeto para guardado
            const documentosParaGuardar = {};
            Object.entries(selectedTemplates).forEach(([ciudad, documentos]) => {
              if (Array.isArray(documentos)) {
                documentosParaGuardar[ciudad] = {};
                documentos.forEach(doc => {
                  documentosParaGuardar[ciudad][doc.slug] = { 
                    id: doc.id,
                    nombre: doc.nombre 
                  };
                });
              } else {
                documentosParaGuardar[ciudad] = documentos;
              }
            });
            
            if (onAssignTemplates) onAssignTemplates(documentosParaGuardar);
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
