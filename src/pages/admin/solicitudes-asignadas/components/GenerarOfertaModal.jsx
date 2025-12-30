import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const GenerarOfertaModal = ({ open, onClose, solicitud, onSave }) => {
  const [costo, setCosto] = useState('');
  const [campos, setCampos] = useState([]);
  const [nuevoCampo, setNuevoField] = useState({ nombre: '', valor: '' });
  const [showSolicitudPreview, setShowSolicitudPreview] = useState(false);

  // Prefill costo from solicitud if available (check top-level and nested places)
  useEffect(() => {
    if (!solicitud) return;
    const top = solicitud || {};
    const nested = solicitud.solicitud || {};
    const est = top.precioEstimado ?? nested.precioEstimado ?? null;
    const base = top.precioBase ?? nested.precioBase ?? null;
    const value = est ?? base;
    if (value != null) setCosto(String(Number(value)));
  }, [solicitud]);

  // Buscar precio de referencia recursivamente en el objeto solicitud (hasta profundidad limitada)
  const buscarPrecioRecursivo = (obj, depth = 0, maxDepth = 3) => {
    if (!obj || typeof obj !== 'object' || depth > maxDepth) return null;
    if (Object.prototype.hasOwnProperty.call(obj, 'precioEstimado') && obj.precioEstimado != null) return { value: Number(obj.precioEstimado), source: 'precioEstimado' };
    if (Object.prototype.hasOwnProperty.call(obj, 'precioBase') && obj.precioBase != null) return { value: Number(obj.precioBase), source: 'precioBase' };
    for (const k of Object.keys(obj)) {
      try {
        const v = obj[k];
        if (v && typeof v === 'object') {
          const found = buscarPrecioRecursivo(v, depth + 1, maxDepth);
          if (found) return found;
        }
      } catch (e) { continue; }
    }
    return null;
  };

  // valor de referencia para mostrar en UI
  const referenciaPrecio = (() => {
    if (!solicitud) return { value: null, source: null };
    const found = buscarPrecioRecursivo(solicitud, 0, 3);
    return found ?? { value: null, source: null };
  })();

  const handleAddCampo = () => {
    if (nuevoCampo.nombre.trim() && nuevoCampo.valor.trim()) {
      setCampos([...campos, { ...nuevoCampo, id: Date.now(), valor: parseFloat(nuevoCampo.valor) || 0 }]);
      setNuevoField({ nombre: '', valor: '' });
    }
  };

  const handleRemoveCampo = (id) => {
    setCampos(campos.filter(c => c.id !== id));
  };

  // Calcular el total: costo base + suma de todos los campos
  const calcularTotal = () => {
    const costoBase = parseFloat(costo) || 0;
    const sumaCampos = campos.reduce((sum, campo) => sum + (parseFloat(campo.valor) || 0), 0);
    return costoBase + sumaCampos;
  };

  const handleSave = async () => {
    if (!costo.trim()) {
      alert('Por favor ingresa el costo de la oferta');
      return;
    }

    const oferta = {
      costo: calcularTotal(), // Total a cobrar (costo base + suma de campos)
      costoServicio: parseFloat(costo) || 0, // Costo base del servicio (sin campos adicionales)
      campos: campos.reduce((acc, c) => {
        acc[c.nombre] = c.valor;
        return acc;
      }, {}),
      fechaOferta: new Date()
    };

    onSave(oferta);
    resetForm();
  };

  const resetForm = () => {
    setCosto('');
    setCampos([]);
    setNuevoField({ nombre: '', valor: '' });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#d7171a', color: 'white', fontWeight: 'bold' }}>
        💰 Generar Oferta
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Categoría y Servicio */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Categoría"
              value={solicitud?.solicitud?.categoria || solicitud?.categoria || ''}
              disabled
              size="small"
            />
            <TextField
              label="Servicio"
              value={solicitud?.solicitud?.servicio || solicitud?.servicio || ''}
              disabled
              size="small"
            />
          </Box>

          

          {/* Costo */}
          {/* Referencia de precio (solo lectura, informativa) */}
          {referenciaPrecio.value != null && (
            <Box sx={{ mb: 1, p: 1, borderRadius: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Referencia ({referenciaPrecio.source}):
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>
                Bs. {referenciaPrecio.value.toFixed(2)}
              </Typography>
            </Box>
          )}
          <TextField
            label="Costo del Servicio (Bs)"
            type="number"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            fullWidth
            size="small"
            inputProps={{ step: '0.01' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderColor: '#d7171a'
              }
            }}
          />

          {/* Campos dinámicos */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#d7171a' }}>
              📋 Campos Adicionales
            </Typography>

            {/* Agregar nuevos campos */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 1, mb: 2 }}>
              <TextField
                label="Nombre del campo"
                value={nuevoCampo.nombre}
                onChange={(e) => setNuevoField({ ...nuevoCampo, nombre: e.target.value })}
                size="small"
                placeholder="Ej: Transporte"
              />
              <TextField
                label="Valor (Bs)"
                type="number"
                value={nuevoCampo.valor}
                onChange={(e) => setNuevoField({ ...nuevoCampo, valor: e.target.value })}
                size="small"
                placeholder="Ej: 100"
                inputProps={{ step: '0.01' }}
              />
              <Button
                variant="contained"
                onClick={handleAddCampo}
                sx={{ bgcolor: '#d7171a' }}
              >
                <AddIcon />
              </Button>
            </Box>

            {/* Campos agregados */}
            {campos.map((campo) => (
              <Box
                key={campo.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: 1,
                  mb: 1,
                  p: 1,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                <Typography variant="body2" sx={{ pt: 0.5 }}>
                  {campo.nombre}
                </Typography>
                <Typography variant="body2" sx={{ pt: 0.5 }}>
                  Bs. {campo.valor.toFixed(2)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveCampo(campo.id)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            {/* Total */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#fff3cd', borderRadius: 1, border: '2px solid #d7171a' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Costo del Servicio:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                    Bs. {(parseFloat(costo) || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Suma Campos Adicionales:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                    Bs. {campos.reduce((sum, c) => sum + c.valor, 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ pt: 1, borderTop: '2px solid #d7171a' }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  TOTAL A COBRAR:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d7171a' }}>
                  Bs. {calcularTotal().toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={() => setShowSolicitudPreview(true)}>Ver Solicitud</Button>
        <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#d7171a' }}>
          Enviar Oferta
        </Button>
      </DialogActions>
      
      {/* Diálogo de vista previa de la solicitud (no cierra el modal de oferta) */}
      <Dialog open={showSolicitudPreview} onClose={() => setShowSolicitudPreview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Vista previa de la solicitud</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Categoría" value={solicitud?.solicitud?.categoria || solicitud?.categoria || ''} disabled fullWidth size="small" />
            <TextField label="Servicio" value={solicitud?.solicitud?.servicio || solicitud?.servicio || ''} disabled fullWidth size="small" />
            <TextField
              label="Dirección"
              value={solicitud?.solicitud?.ubicacion?.direccion || solicitud?.ubicacion?.direccion || ''}
              disabled
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
            <TextField
              label="Descripción"
              value={solicitud?.solicitud?.descripcion || solicitud?.descripcion || ''}
              disabled
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
            <TextField
              label="Precio estimado (referencia)"
              value={referenciaPrecio.value != null ? `Bs. ${referenciaPrecio.value.toFixed(2)} (${referenciaPrecio.source})` : 'No disponible'}
              disabled
              fullWidth
              size="small"
            />

            {/* Datos Específicos: renderizado flexible para objects/arrays/primitivos */}
            {(() => {
              const datos = solicitud?.solicitud?.datosEspecificos ?? solicitud?.datosEspecificos;
              if (!datos) return null;

              // Si es un array, iterar por elementos
              if (Array.isArray(datos)) {
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d7171a' }}>🔎 Datos Específicos</Typography>
                    {datos.map((item, idx) => (
                      <Box key={idx} sx={{ p: 1, backgroundColor: '#fafafa', borderRadius: 1 }}>
                        {item && typeof item === 'object' ? (
                          Object.entries(item).map(([k, v]) => (
                            <TextField key={k} label={k} value={v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v))} disabled fullWidth size="small" sx={{ mb: 1 }} />
                          ))
                        ) : (
                          <TextField label={`item ${idx + 1}`} value={item == null ? '' : String(item)} disabled fullWidth size="small" />
                        )}
                      </Box>
                    ))}
                  </Box>
                );
              }

              // Si es un objeto, iterar keys
              if (typeof datos === 'object') {
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d7171a' }}>🔎 Datos Específicos</Typography>
                    {Object.entries(datos).map(([k, v]) => (
                      <TextField key={k} label={k} value={v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v))} disabled fullWidth size="small" sx={{ mb: 1 }} />
                    ))}
                  </Box>
                );
              }

              // Primitivo
              return (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d7171a' }}>🔎 Datos Específicos</Typography>
                  <TextField value={String(datos)} disabled fullWidth size="small" />
                </Box>
              );
            })()}

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSolicitudPreview(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default GenerarOfertaModal;
