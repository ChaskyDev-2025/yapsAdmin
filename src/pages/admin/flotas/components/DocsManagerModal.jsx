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

const CATEGORIAS_SERVICIO = ["Viajes", "Envios", "viajes_envios"];

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
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Viajes");
  const [cambiosGuardados, setCambiosGuardados] = useState(true);

  // Función para obtener documentos que están en AMBAS categorías
  const obtenerDocumentosEnComun = (ciudad) => {
    let docsViajes = selectedTemplates[ciudad]?.["Viajes"] || [];
    let docsEnvios = selectedTemplates[ciudad]?.["Envios"] || [];
    
    // Convertir a arrays si son objetos
    if (typeof docsViajes === 'object' && !Array.isArray(docsViajes)) {
      docsViajes = Object.entries(docsViajes).map(([slug, docInfo]) => ({
        slug,
        id: docInfo.id || docInfo,
        nombre: docInfo.nombre || slug.replace(/_/g, ' ')
      }));
    }
    if (typeof docsEnvios === 'object' && !Array.isArray(docsEnvios)) {
      docsEnvios = Object.entries(docsEnvios).map(([slug, docInfo]) => ({
        slug,
        id: docInfo.id || docInfo,
        nombre: docInfo.nombre || slug.replace(/_/g, ' ')
      }));
    }
    
    // Asegurar que son arrays
    docsViajes = Array.isArray(docsViajes) ? docsViajes : [];
    docsEnvios = Array.isArray(docsEnvios) ? docsEnvios : [];
    
    // Encontrar documentos en común (por ID)
    const idsEnvios = new Set(docsEnvios.map(doc => doc.id));
    return docsViajes.filter(doc => idsEnvios.has(doc.id));
  };

  // Función para combinar documentos de múltiples categorías sin duplicados
  const combinarDocumentosSinDuplicados = (ciudad, categorias) => {
    const documentosCombinados = [];
    const idsVisto = new Set();

    categorias.forEach(categoria => {
      let docsEnCategoria = selectedTemplates[ciudad]?.[categoria] || [];
      
      // Si es un objeto (no array), convertir a array
      if (typeof docsEnCategoria === 'object' && !Array.isArray(docsEnCategoria)) {
        docsEnCategoria = Object.entries(docsEnCategoria).map(([slug, docInfo]) => ({
          slug,
          id: docInfo.id || docInfo,
          nombre: docInfo.nombre || slug.replace(/_/g, ' ')
        }));
      }
      
      // Asegurar que es array
      if (!Array.isArray(docsEnCategoria)) {
        docsEnCategoria = [];
      }
      
      docsEnCategoria.forEach(doc => {
        if (!idsVisto.has(doc.id)) {
          idsVisto.add(doc.id);
          documentosCombinados.push(doc);
        }
      });
    });

    return documentosCombinados;
  };

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
      const initialized = JSON.parse(JSON.stringify(flota.documentos));
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
        const ciudadDocs = flota.documentos[ciudad];
        if (typeof ciudadDocs === 'object' && !Array.isArray(ciudadDocs)) {
          for (const categoria in ciudadDocs) {
            if (typeof ciudadDocs[categoria] === 'object' && !Array.isArray(ciudadDocs[categoria])) {
              totalAssigned += Object.keys(ciudadDocs[categoria]).length;
            }
          }
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



  // Handler optimizado para seleccionar/deseleccionar documentos
  const handleToggleDoc = useCallback((ciudad, categoria, docSlug, tpl, isSelected) => {
    setSelectedTemplates(prevState => {
      const updated = JSON.parse(JSON.stringify(prevState));
      
      // Inicializar la ciudad si no existe
      if (!updated[ciudad]) {
        updated[ciudad] = {};
      }
      
      // Inicializar la categoría si no existe (como OBJETO, no array)
      if (!updated[ciudad][categoria]) {
        updated[ciudad][categoria] = {};
      }
      
      // Asegurar que es un objeto
      if (Array.isArray(updated[ciudad][categoria])) {
        updated[ciudad][categoria] = {};
      }
      
      if (isSelected) {
        // Remover del objeto (buscar por slug)
        delete updated[ciudad][categoria][docSlug];
      } else {
        // Agregar como objeto: slug -> {id, nombre}
        updated[ciudad][categoria][docSlug] = {
          slug: docSlug,
          id: tpl.id,
          nombre: tpl.titulo || tpl.screenTitle || tpl.nombre
        };
      }
      
      // Limpiar categoría si está vacía
      if (Object.keys(updated[ciudad][categoria]).length === 0) {
        delete updated[ciudad][categoria];
      }
      
      // Limpiar ciudad si está vacía
      if (Object.keys(updated[ciudad]).length === 0) {
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
              // Usar selectedTemplates como fuente de verdad para mostrar estado actualizado
              const docsEnCiudad = selectedTemplates[ciudad] || flota.documentos[ciudad] || {};
              
              if (typeof docsEnCiudad !== 'object' || !docsEnCiudad || Object.keys(docsEnCiudad).length === 0) return null;
              
              return (
                <Box key={ciudad} sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle2"
                    sx={{
                      fontFamily: "Mulish, sans-serif",
                      fontWeight: 700,
                      color: '#d7171a',
                      mb: 2,
                      fontSize: '0.95rem',
                      borderBottom: '1px solid #ddd',
                      pb: 1
                    }}
                  >
                    📍 {ciudad}
                  </Typography>
                  
                  {/* Iterar sobre categorías */}
                  {CATEGORIAS_SERVICIO.map(categoria => {
                    let docsEnCategoria = {};
                    
                    // Si es la categoría combinada, combinar ambas sin duplicados
                    if (categoria === "viajes_envios") {
                      const docsCombinados = combinarDocumentosSinDuplicados(ciudad, ["Viajes", "Envios", "viajes_envios"]);
                      docsEnCategoria = {};
                      docsCombinados.forEach(doc => {
                        docsEnCategoria[doc.slug] = doc;
                      });
                    } else {
                      docsEnCategoria = docsEnCiudad[categoria] || {};
                    }
                    
                    if (typeof docsEnCategoria !== 'object' || !docsEnCategoria || Object.keys(docsEnCategoria).length === 0) return null;
                    
                    return (
                      <Box key={categoria} sx={{ mb: 2, pl: 2 }}>
                        <Typography 
                          variant="body2"
                          sx={{
                            fontFamily: "Mulish, sans-serif",
                            fontWeight: 600,
                            color: '#555',
                            mb: 1,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          🏷️ {categoria}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pl: 1 }}>
                          {Object.entries(docsEnCategoria).map(([slug, docInfo]) => {
                            const docName = docInfo?.nombre || slug.replace(/_/g, ' ');
                            return (
                              <Chip 
                                key={slug} 
                                label={docName} 
                                color="primary"
                                onDelete={() => {
                                  const updated = JSON.parse(JSON.stringify(selectedTemplates));
                                  
                                  // Validar que existen las propiedades antes de acceder
                                  if (!updated[ciudad] || !updated[ciudad][categoria]) {
                                    return;
                                  }
                                  
                                  const docAEliminar = updated[ciudad][categoria][slug];
                                  const idAEliminar = docAEliminar?.id;
                                  
                                  // Eliminar de la categoría actual
                                  delete updated[ciudad][categoria][slug];
                                  
                                  // Si existe viajes_envios y el documento está allí, eliminarlo también
                                  if (idAEliminar && updated[ciudad]["viajes_envios"]) {
                                    Object.entries(updated[ciudad]["viajes_envios"]).forEach(([slugVE, docVE]) => {
                                      if (docVE?.id === idAEliminar) {
                                        delete updated[ciudad]["viajes_envios"][slugVE];
                                      }
                                    });
                                    if (Object.keys(updated[ciudad]["viajes_envios"]).length === 0) {
                                      delete updated[ciudad]["viajes_envios"];
                                    }
                                  }
                                  
                                  if (updated[ciudad][categoria] && Object.keys(updated[ciudad][categoria]).length === 0) {
                                    delete updated[ciudad][categoria];
                                  }
                                  if (updated[ciudad] && Object.keys(updated[ciudad]).length === 0) {
                                    delete updated[ciudad];
                                  }
                                  
                                  // Actualizar estado local y marcar como cambios sin guardar
                                  setSelectedTemplates(updated);
                                  setCambiosGuardados(false);
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
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
        {!cambiosGuardados && (
          <Button 
            onClick={() => {
              if (onAssignTemplates) onAssignTemplates(selectedTemplates);
              setCambiosGuardados(true);
            }}
            variant="contained"
            sx={{ 
              fontFamily: "Mulish, sans-serif", 
              fontWeight: 600, 
              bgcolor: "#4caf50",
              "&:hover": { bgcolor: "#388e3c" }
            }}
          >
            💾 Guardar Cambios
          </Button>
        )}
      </DialogActions>
    </Dialog>

    {/* Dialogo para asignar plantillas */}
    <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar Documentos a {flota?.nombre}</DialogTitle>
      <DialogContent>
        {CIUDADES.length > 0 && (
          <>
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

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                Seleccionar Categoría de Servicio:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                {CATEGORIAS_SERVICIO.map((categoria) => (
                  <Chip
                    key={categoria}
                    label={categoria}
                    onClick={() => setCategoriaSeleccionada(categoria)}
                    color={categoriaSeleccionada === categoria ? "primary" : "default"}
                    variant={categoriaSeleccionada === categoria ? "filled" : "outlined"}
                    sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Box>
          </>
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
              
              // Agrupar documentos por categoría de documento
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
                  
                  {/* Mostrar solo la categoría de servicio seleccionada */}
                  <Box sx={{ mb: 2 }}>
                    {Object.keys(docsPorCategoria).sort().map((categoriaDoc) => (
                      <Box key={categoriaDoc} sx={{ mb: 2.5 }}>
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
                          {categoriaDoc}
                        </Typography>
                        
                        <Box sx={{ pl: 1 }}>
                          {docsPorCategoria[categoriaDoc].map((tpl) => {
                            const docSlug = generateDocSlug(tpl.titulo || tpl.screenTitle || tpl.nombre || tpl.id);
                            const docsEnCiudad = selectedTemplates[ciudad] || {};
                            
                            // Determinar qué categorías revisar para el estado seleccionado
                            const categoriasARevisar = categoriaSeleccionada === "viajes_envios" 
                              ? ["Viajes", "Envios", "viajes_envios"] 
                              : [categoriaSeleccionada];
                            
                            // Buscar en cualquiera de las categorías si el documento está seleccionado (ahora como objetos)
                            const isSelected = categoriasARevisar.some(cat => {
                              const docsEnCategoria = docsEnCiudad[cat] || {};
                              // Buscar por ID en los valores del objeto
                              return Object.values(docsEnCategoria).some(doc => doc?.id === tpl.id);
                            });
                            
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
                                  onClick={() => handleToggleDoc(ciudad, categoriaSeleccionada, docSlug, tpl, isSelected)}
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
            // selectedTemplates ya está en formato correcto: ciudad -> categoría -> documento (objeto)
            const documentosParaGuardar = JSON.parse(JSON.stringify(selectedTemplates));
            
            // Crear automáticamente "viajes_envios" si existen ambas categorías
            Object.keys(documentosParaGuardar).forEach(ciudad => {
              const tieneViajes = documentosParaGuardar[ciudad]["Viajes"] && Object.keys(documentosParaGuardar[ciudad]["Viajes"]).length > 0;
              const tieneEnvios = documentosParaGuardar[ciudad]["Envios"] && Object.keys(documentosParaGuardar[ciudad]["Envios"]).length > 0;
              
              if (tieneViajes && tieneEnvios) {
                // Combinar TODOS los documentos sin duplicados (por ID)
                const docsViajes = Object.entries(documentosParaGuardar[ciudad]["Viajes"]);
                const docsEnvios = Object.entries(documentosParaGuardar[ciudad]["Envios"]);
                
                // Map de IDs para evitar duplicados
                const idsYaAgregados = new Set();
                const docsCombinados = {};
                
                // Primero agregar todos de Viajes
                docsViajes.forEach(([slug, doc]) => {
                  docsCombinados[slug] = doc;
                  idsYaAgregados.add(doc.id);
                });
                
                // Luego agregar los de Envios que NO estén duplicados
                docsEnvios.forEach(([slug, doc]) => {
                  if (!idsYaAgregados.has(doc.id)) {
                    docsCombinados[slug] = doc;
                    idsYaAgregados.add(doc.id);
                  }
                });
                
                // Crear viajes_envios con todos sin duplicados
                if (Object.keys(docsCombinados).length > 0) {
                  documentosParaGuardar[ciudad]["viajes_envios"] = docsCombinados;
                }
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
