import React, { useState } from 'react';
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
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Categoría y Servicio */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Categoría"
              value={solicitud?.solicitud?.categoria || ''}
              disabled
              size="small"
            />
            <TextField
              label="Servicio"
              value={solicitud?.solicitud?.servicio || ''}
              disabled
              size="small"
            />
          </Box>

          {/* Costo */}
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
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#d7171a' }}>
          Enviar Oferta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerarOfertaModal;
