import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tab,
  Tabs,
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
  Alert,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  TextField,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import { collection, getDocs, doc, updateDoc, setDoc, deleteField, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../data/firebase/firebase';

const DEPARTAMENTOS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

const SERVICE_CATALOG = {
  "Viajes": ["Moto Taxi", "Económico", "Comodidad", "Vagoneta", "Empresarial o VIP", "El primero disponible"],
  "Envíos": ["Moto", "Vagoneta", "Carga"],
  "Carga local": ["Vagoneta", "Camioneta pequeña", "Camioneta mediana"],
  "Carga nacional": ["Camioneta mediana", "Camión grande", "Camión extra grande", "Tracto camión"],
  "Volqueta y construcción": ["Volqueta (4,8,12 cubos)", "Camión (ripio, arena y ladrillo)"],
  "Mudanza": ["Camioneta pequeña", "Camioneta mediana", "Camión grande"],
  "Maquinaria y grúas": ["Motoniveladora", "Retro excavadora", "Excavadora hidráulica", "Grúas pluma", "Grúas rampa"]
};

// --- Modal Component ---
const ServiceModal = ({ open, onClose, service, department, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [formData, setFormData] = useState({
    activo: true,
    tarifa_general: {
      tarifaBase: 0,
      distanciaBase: 0,
      porKm: 0,
      porMin: 0,
      horaPicoExtra: 0,
      nocturno: 0,
      comision: 0
    },
    tarifasAeropuerto: [],
    horasPico: []
  });

  useEffect(() => {
    if (service) {
      setCategory(service.categoria || '');
      setServiceName(service.servicio || '');
      setFormData({
        activo: service.activo !== undefined ? service.activo : true,
        tarifa_general: {
          tarifaBase: service.tarifa_general?.tarifaBase || 0,
          distanciaBase: service.tarifa_general?.distanciaBase || 0,
          porKm: service.tarifa_general?.porKm || 0,
          porMin: service.tarifa_general?.porMin || 0,
          horaPicoExtra: service.tarifa_general?.horaPicoExtra || 0,
          nocturno: service.tarifa_general?.nocturno || 0,
          comision: service.tarifa_general?.comision || 0
        },
        tarifasAeropuerto: service.tarifasAeropuerto?.tramos || [],
        horasPico: service.horasPico?.franjas || []
      });
    } else {
      // Reset for new service
      setCategory('');
      setServiceName('');
      setFormData({
        activo: true,
        tarifa_general: { tarifaBase: 0, distanciaBase: 0, porKm: 0, porMin: 0, horaPicoExtra: 0, nocturno: 0, comision: 0 },
        tarifasAeropuerto: [{ desdeKm: "10", precio: "40.00" }, { desdeKm: "20", precio: "60.00" }],
        horasPico: [{ desde: "07:00", hasta: "09:00" }, { desde: "18:00", hasta: "20:00" }]
      });
    }
  }, [service, open]);

  const handleTarifaChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      tarifa_general: { ...prev.tarifa_general, [field]: parseFloat(value) || 0 }
    }));
  };

  // Aeropuerto handlers
  const addAeropuerto = () => {
    setFormData(prev => ({
      ...prev,
      tarifasAeropuerto: [...prev.tarifasAeropuerto, { desdeKm: '', precio: '' }]
    }));
  };
  const removeAeropuerto = (index) => {
    setFormData(prev => ({
      ...prev,
      tarifasAeropuerto: prev.tarifasAeropuerto.filter((_, i) => i !== index)
    }));
  };
  const updateAeropuerto = (index, field, value) => {
    const newArr = [...formData.tarifasAeropuerto];
    newArr[index][field] = value;
    setFormData(prev => ({ ...prev, tarifasAeropuerto: newArr }));
  };

  // Horas Pico handlers
  const addHoraPico = () => {
    setFormData(prev => ({
      ...prev,
      horasPico: [...prev.horasPico, { desde: '', hasta: '' }]
    }));
  };
  const removeHoraPico = (index) => {
    setFormData(prev => ({
      ...prev,
      horasPico: prev.horasPico.filter((_, i) => i !== index)
    }));
  };
  const updateHoraPico = (index, field, value) => {
    const newArr = [...formData.horasPico];
    newArr[index][field] = value;
    setFormData(prev => ({ ...prev, horasPico: newArr }));
  };

  const handleSubmit = async () => {
    if (!category || !serviceName) return alert('Debe seleccionar una categoría y un servicio');
    setLoading(true);
    try {
      const dataToSave = {
        categoria: category,
        servicio: serviceName,
        nombre: `${category} - ${serviceName}`,
        activo: formData.activo,
        tarifa_general: formData.tarifa_general,
        Tarifas_Aeropuerto: {
          tramos: formData.tarifasAeropuerto.map(t => ({ desdeKm: t.desdeKm, precio: parseFloat(t.precio) || 0 }))
        },
        Horas_pico: {
          franjas: formData.horasPico
        }
      };

      // Create a unique key for the map
      const key = `${category}_${serviceName}`.replace(/[^a-zA-Z0-9]/g, '_');
      await onSave(key, dataToSave);
      onClose();
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Error al guardar el servicio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{service ? 'Editar Tarifa' : 'Asignar Tarifa'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Category & Service Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!!service}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={category}
                label="Categoría"
                onChange={(e) => {
                  setCategory(e.target.value);
                  setServiceName(''); // Reset service when category changes
                }}
              >
                {Object.keys(SERVICE_CATALOG).map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!category || !!service}>
              <InputLabel>Servicio</InputLabel>
              <Select
                value={serviceName}
                label="Servicio"
                onChange={(e) => setServiceName(e.target.value)}
              >
                {category && SERVICE_CATALOG[category]?.map((srv) => (
                  <MenuItem key={srv} value={srv}>{srv}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={<Switch checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} />}
              label="Activo"
            />
          </Grid>

          {/* Tarifas Base */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Tarifas Base</Typography>
            <Grid container spacing={2}>
              {Object.keys(formData.tarifa_general).map((key) => (
                <Grid item xs={6} md={3} key={key}>
                  <TextField
                    label={key.replace(/([A-Z])/g, ' $1').trim()} // CamelCase to Space
                    type="number"
                    fullWidth
                    size="small"
                    value={formData.tarifa_general[key]}
                    onChange={(e) => handleTarifaChange(key, e.target.value)}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Tarifas Aeropuerto */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6">Tarifas Aeropuerto</Typography>
              <IconButton onClick={addAeropuerto} color="primary"><AddCircleOutlineIcon /></IconButton>
            </Box>
            {formData.tarifasAeropuerto.map((tramo, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField label="Desde Km" size="small" value={tramo.desdeKm} onChange={(e) => updateAeropuerto(idx, 'desdeKm', e.target.value)} />
                <TextField label="Precio (Bs)" size="small" type="number" value={tramo.precio} onChange={(e) => updateAeropuerto(idx, 'precio', e.target.value)} />
                <IconButton onClick={() => removeAeropuerto(idx)} color="error"><RemoveCircleOutlineIcon /></IconButton>
              </Box>
            ))}
          </Grid>

          {/* Horas Pico */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6">Horas Pico</Typography>
              <IconButton onClick={addHoraPico} color="primary"><AddCircleOutlineIcon /></IconButton>
            </Box>
            {formData.horasPico.map((franja, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField label="Desde" type="time" size="small" InputLabelProps={{ shrink: true }} value={franja.desde} onChange={(e) => updateHoraPico(idx, 'desde', e.target.value)} />
                <TextField label="Hasta" type="time" size="small" InputLabelProps={{ shrink: true }} value={franja.hasta} onChange={(e) => updateHoraPico(idx, 'hasta', e.target.value)} />
                <IconButton onClick={() => removeHoraPico(idx)} color="error"><RemoveCircleOutlineIcon /></IconButton>
              </Box>
            ))}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Main Component ---
const GestionServicios = () => {
  const [tabValue, setTabValue] = useState(0);
  const [deptStatus, setDeptStatus] = useState({});
  const [selectedDept, setSelectedDept] = useState('');
  const [services, setServices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load Department Statuses
  useEffect(() => {
    const unsubscribes = [];
    DEPARTAMENTOS.forEach(dept => {
      const unsub = onSnapshot(doc(db, 'Tarifas', dept), (docSnap) => {
        if (docSnap.exists()) {
          setDeptStatus(prev => ({ ...prev, [dept]: docSnap.data().enabled }));
        } else {
          setDeptStatus(prev => ({ ...prev, [dept]: false }));
        }
      });
      unsubscribes.push(unsub);
    });
    return () => unsubscribes.forEach(u => u());
  }, []);

  // Load Services for Selected Dept
  useEffect(() => {
    if (selectedDept) {
      setLoading(true);
      const unsub = onSnapshot(doc(db, 'Tarifas', selectedDept), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const loadedServices = [];
          Object.keys(data).forEach(key => {
            if (key !== 'enabled' && typeof data[key] === 'object') {
              loadedServices.push({ id: key, ...data[key] });
            }
          });
          setServices(loadedServices);
        } else {
          setServices([]);
        }
        setLoading(false);
      });
      return () => unsub();
    }
  }, [selectedDept]);

  const handleToggleDept = async (dept, currentStatus) => {
    try {
      await setDoc(doc(db, 'Tarifas', dept), { enabled: !currentStatus }, { merge: true });
    } catch (err) {
      console.error("Error toggling department:", err);
    }
  };

  const handleSaveService = async (serviceName, serviceData) => {
    if (!selectedDept) return;
    try {
      await updateDoc(doc(db, 'Tarifas', selectedDept), {
        [serviceName]: serviceData
      });
    } catch (err) {
      // If doc doesn't exist, create it
      await setDoc(doc(db, 'Tarifas', selectedDept), {
        [serviceName]: serviceData,
        enabled: deptStatus[selectedDept] || false
      }, { merge: true });
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    try {
      await updateDoc(doc(db, 'Tarifas', selectedDept), {
        [serviceId]: deleteField()
      });
    } catch (err) {
      console.error("Error deleting service:", err);
    }
  };

  const handleEditService = (service) => {
    setCurrentService(service);
    setModalOpen(true);
  };

  const handleAddService = () => {
    setCurrentService(null);
    setModalOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
          Gestión de Tarifas y Servicios
        </Typography>

        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
          <Tab label="Departamentos" />
          <Tab label="Tarifas" />
        </Tabs>

        {/* Tab 0: Departamentos */}
        {tabValue === 0 && (
          <Grid container spacing={2}>
            {DEPARTAMENTOS.map((dept) => (
              <Grid item xs={12} sm={6} md={4} key={dept}>
                <Card variant="outlined">
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{dept}</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!deptStatus[dept]}
                          onChange={() => handleToggleDept(dept, deptStatus[dept])}
                          color="primary"
                        />
                      }
                      label={deptStatus[dept] ? "Habilitado" : "Deshabilitado"}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Tarifas */}
        {tabValue === 1 && (
          <Box>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Seleccionar Departamento</InputLabel>
              <Select
                value={selectedDept}
                label="Seleccionar Departamento"
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {DEPARTAMENTOS.map(dept => (
                  <MenuItem key={dept} value={dept}>
                    {dept} {deptStatus[dept] ? '(Habilitado)' : '(Deshabilitado)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedDept && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddService} sx={{ backgroundColor: '#d7171a' }}>
                    Asignar Tarifa
                  </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>Categoría</TableCell>
                        <TableCell>Servicio</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Tarifa Base</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {services.map((srv) => (
                        <TableRow key={srv.id}>
                          <TableCell>{srv.categoria || '-'}</TableCell>
                          <TableCell>{srv.servicio || srv.nombre}</TableCell>
                          <TableCell>
                            <Typography color={srv.activo ? 'green' : 'text.secondary'}>
                              {srv.activo ? 'Activo' : 'Inactivo'}
                            </Typography>
                          </TableCell>
                          <TableCell>Bs. {srv.tarifa_general?.tarifaBase}</TableCell>
                          <TableCell align="right">
                            <IconButton onClick={() => handleEditService(srv)} color="primary"><EditIcon /></IconButton>
                            <IconButton onClick={() => handleDeleteService(srv.id)} color="error"><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {services.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">No hay servicios registrados en este departamento.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}
      </Paper>

      <ServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        service={currentService}
        department={selectedDept}
        onSave={handleSaveService}
      />
    </Container>
  );
};

export default GestionServicios;
