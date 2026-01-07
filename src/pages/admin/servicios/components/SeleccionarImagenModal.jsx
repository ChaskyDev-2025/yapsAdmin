import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { listVehiculosImagenes } from '../../../../services/imageUploadService';

export const SeleccionarImagenModal = ({ open, onClose, onSelect }) => {
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImagen, setSelectedImagen] = useState(null);

  useEffect(() => {
    if (open) {
      cargarImagenes();
    }
  }, [open]);

  const cargarImagenes = async () => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await listVehiculosImagenes();
      setImagenes(resultado);
    } catch (err) {
      setError('Error al cargar las imágenes: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedImagen) {
      onSelect(selectedImagen);
      setSelectedImagen(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Seleccionar Imagen del Vehículo</DialogTitle>
      <DialogContent dividers sx={{ minHeight: '400px' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && imagenes.length === 0 && !error && (
          <Alert severity="info">No hay imágenes disponibles en vehiculosImagenes</Alert>
        )}

        {!loading && imagenes.length > 0 && (
          <Grid container spacing={2}>
            {imagenes.map((imagen) => (
              <Grid item xs={12} sm={6} md={4} key={imagen.path}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedImagen?.path === imagen.path ? '3px solid #d7171a' : '1px solid #ddd',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => setSelectedImagen(imagen)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={imagen.url}
                    alt={imagen.nombre}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        wordBreak: 'break-word',
                        fontSize: '0.75rem',
                        color: '#666',
                      }}
                    >
                      {imagen.nombre}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          color="primary"
          disabled={!selectedImagen}
        >
          Seleccionar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
