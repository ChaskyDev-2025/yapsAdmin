import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tab,
  Tabs,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../data/firebase/firebase';

const GestionServicios = () => {
  const [tabValue, setTabValue] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [nuevoItem, setNuevoItem] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError] = useState('');
  const [docId, setDocId] = useState('');

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'servicios_departamentos'));
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        setDocId(querySnapshot.docs[0].id);
        setServicios(docData.Servicios || []);
        setViajes(docData.Viajes || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    }
  };

  const handleOpenDialog = (index = null) => {
    if (index !== null) {
      const item = tabValue === 0 ? servicios[index] : viajes[index];
      setNuevoItem(item);
      setEditingIndex(index);
    } else {
      setNuevoItem('');
      setEditingIndex(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNuevoItem('');
    setEditingIndex(null);
    setError('');
  };

  const handleSave = async () => {
    if (!nuevoItem.trim()) {
      setError('El campo no puede estar vacío');
      return;
    }

    try {
      const docRef = doc(db, 'servicios_departamentos', docId);
      let updatedArray;

      if (tabValue === 0) {
        // Servicios
        updatedArray = [...servicios];
        if (editingIndex !== null) {
          updatedArray[editingIndex] = nuevoItem.trim();
        } else {
          updatedArray.push(nuevoItem.trim());
        }
        await updateDoc(docRef, {
          Servicios: updatedArray,
          updatedAt: serverTimestamp()
        });
        setServicios(updatedArray);
      } else {
        // Viajes
        updatedArray = [...viajes];
        if (editingIndex !== null) {
          updatedArray[editingIndex] = nuevoItem.trim();
        } else {
          updatedArray.push(nuevoItem.trim());
        }
        await updateDoc(docRef, {
          Viajes: updatedArray,
          updatedAt: serverTimestamp()
        });
        setViajes(updatedArray);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar:', error);
      setError('Error al guardar los cambios');
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('¿Estás seguro de eliminar este elemento?')) {
      return;
    }

    try {
      const docRef = doc(db, 'servicios_departamentos', docId);
      let updatedArray;

      if (tabValue === 0) {
        updatedArray = servicios.filter((_, i) => i !== index);
        await updateDoc(docRef, {
          Servicios: updatedArray,
          updatedAt: serverTimestamp()
        });
        setServicios(updatedArray);
      } else {
        updatedArray = viajes.filter((_, i) => i !== index);
        await updateDoc(docRef, {
          Viajes: updatedArray,
          updatedAt: serverTimestamp()
        });
        setViajes(updatedArray);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      setError('Error al eliminar el elemento');
    }
  };

  const currentData = tabValue === 0 ? servicios : viajes;
  const currentLabel = tabValue === 0 ? 'Servicio' : 'Viaje';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000' }}>
            Gestión de Servicios y Viajes
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#d7171a',
              '&:hover': { backgroundColor: '#b01419' }
            }}
          >
            Agregar {currentLabel}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            mb: 3,
            '& .MuiTab-root': { color: '#484848' },
            '& .Mui-selected': { color: '#d7171a' },
            '& .MuiTabs-indicator': { backgroundColor: '#d7171a' }
          }}
        >
          <Tab label="Servicios" />
          <Tab label="Viajes" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentData.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell>{item}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleOpenDialog(index)}
                      sx={{ color: '#000' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(index)}
                      sx={{ color: '#d7171a' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 3, color: '#999' }}>
                    No hay {tabValue === 0 ? 'servicios' : 'viajes'} registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog para agregar/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Editar' : 'Agregar'} {currentLabel}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`Nombre del ${currentLabel}`}
            fullWidth
            value={nuevoItem}
            onChange={(e) => setNuevoItem(e.target.value)}
            error={error !== ''}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: '#484848' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              backgroundColor: '#d7171a',
              '&:hover': { backgroundColor: '#b01419' }
            }}
          >
            {editingIndex !== null ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestionServicios;
