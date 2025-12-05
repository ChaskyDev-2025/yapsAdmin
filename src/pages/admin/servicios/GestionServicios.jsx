import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  "Viajes": ["Moto Taxi", "Economico", "Comodidad", "Vagoneta", "Empresarial o VIP", "El primero disponible"],
  "Envios": ["Moto", "Vagoneta", "Carga"],
  "Carga local": ["Vagoneta", "Camioneta pequena", "Camioneta mediana"],
  "Carga nacional": ["Camioneta mediana", "Camion grande", "Camion extra grande", "Tracto camion"],
  "Volqueta y construccion": ["Volqueta (4,8,12 cubos)", "Camion (ripio, arena y ladrillo)"],
  "Mudanza": ["Camioneta pequena", "Camioneta mediana", "Camion grande"],
  "Maquinaria y gruas": ["Motoniveladora", "Retro excavadora", "Excavadora hidraulica", "Gruas pluma", "Gruas rampa"]
};

// Configuración de campos personalizables por categoría
const CAMPOS_POR_CATEGORIA = {
  "Viajes": ["tarifa_base", "distancia_base", "costo_por_km", "costo_por_min", "tarifa_minima", "recargo_nocturno"],
  "Envios": ["tarifa_base", "costo_por_km", "peso_minimo", "costo_por_kg"],
  "Carga local": ["tarifa_base", "volumen_minimo", "costo_por_m3", "costo_por_hora"],
  "Carga nacional": ["tarifa_base", "precio_por_km", "seguro", "costo_descarga"],
  "Volqueta y construccion": ["tarifa_base", "hora_minima", "costo_por_hora", "costo_por_viaje"],
  "Mudanza": ["tarifa_base", "m3_incluido", "costo_por_m3_extra", "costo_por_hora"],
  "Maquinaria y gruas": ["tarifa_base", "hora_minima", "costo_por_hora", "costo_traslado"]
};

// --- Modal Component ---
const ServiceModal = ({ open, onClose, service, department, onSave, modoPrueba }) => {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [camposDinamicos, setCamposDinamicos] = useState([]);
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
    nombre_visible: '',
    categoria: 'transporte_pasajeros',
    tipo_calculo: 'distancia_tiempo',
    reglas_tarifa: {},
    tarifasAeropuerto: [],
    horasPico: []
  });

  useEffect(() => {
    // Actualizar campos dinámicos cuando la categoría cambia EN MODO PRUEBA
    if (category && modoPrueba && CAMPOS_POR_CATEGORIA[category]) {
      const campos = CAMPOS_POR_CATEGORIA[category];
      setCamposDinamicos(campos);
      
      // Inicializar reglas_tarifa con los campos de la categoría
      const nuevasReglas = {};
      campos.forEach(campo => {
        nuevasReglas[campo] = '';
      });
      setFormData(prev => ({
        ...prev,
        reglas_tarifa: nuevasReglas
      }));
    }
  }, [category, modoPrueba]);

  useEffect(() => {
    if (service) {
      setCategory(service.categoria || '');
      setServiceName(service.servicio || '');
      
      if (modoPrueba) {
        const campos = CAMPOS_POR_CATEGORIA[service.categoria] || [];
        setCamposDinamicos(campos);
        
        const reglasTarifa = {};
        campos.forEach(campo => {
          reglasTarifa[campo] = String(service.reglas_tarifa?.[campo] ?? '');
        });
        
        setFormData({
          activo: service.activo !== undefined ? service.activo : true,
          nombre_visible: service.nombre_visible || service.servicio || '',
          categoria: service.categoria || 'transporte_pasajeros',
          tipo_calculo: service.tipo_calculo || 'distancia_tiempo',
          reglas_tarifa: reglasTarifa,
          tarifasAeropuerto: service.tarifasAeropuerto?.tramos || [],
          horasPico: service.horasPico?.franjas || []
        });
      } else {
        setFormData({
          activo: service.activo !== undefined ? service.activo : true,
          tarifa_general: {
            tarifaBase: String(service.tarifa_general?.tarifaBase ?? ''),
            distanciaBase: String(service.tarifa_general?.distanciaBase ?? ''),
            porKm: String(service.tarifa_general?.porKm ?? ''),
            porMin: String(service.tarifa_general?.porMin ?? ''),
            horaPicoExtra: String(service.tarifa_general?.horaPicoExtra ?? ''),
            nocturno: String(service.tarifa_general?.nocturno ?? ''),
            comision: String(service.tarifa_general?.comision ?? '')
          },
          tarifasAeropuerto: service.tarifasAeropuerto?.tramos || [],
          horasPico: service.horasPico?.franjas || []
        });
      }
    } else {
      // Reset for new service
      setCategory('');
      setServiceName('');
      
      if (modoPrueba) {
        const campos = [];
        setCamposDinamicos(campos);
        
        const reglasTarifa = {};
        campos.forEach(campo => {
          reglasTarifa[campo] = '';
        });
        
        setFormData({
          activo: true,
          nombre_visible: '',
          categoria: 'transporte_pasajeros',
          tipo_calculo: 'distancia_tiempo',
          reglas_tarifa: reglasTarifa,
          tarifasAeropuerto: [{ desdeKm: "10", precio: "40.00" }, { desdeKm: "20", precio: "60.00" }],
          horasPico: [{ desde: "07:00", hasta: "09:00" }, { desde: "18:00", hasta: "20:00" }]
        });
      } else {
        setFormData({
          activo: true,
          tarifa_general: { tarifaBase: '', distanciaBase: '', porKm: '', porMin: '', horaPicoExtra: '', nocturno: '', comision: '' },
          tarifasAeropuerto: [{ desdeKm: "10", precio: "40.00" }, { desdeKm: "20", precio: "60.00" }],
          horasPico: [{ desde: "07:00", hasta: "09:00" }, { desde: "18:00", hasta: "20:00" }]
        });
      }
    }
  }, [service, open, modoPrueba]);


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
      let dataToSave;
      let key;

      if (modoPrueba) {
        // Estructura simplificada para tarifas prueba
        const reglas_tarifa_numerica = {};
        Object.keys(formData.reglas_tarifa).forEach((k) => {
          const val = formData.reglas_tarifa[k];
          reglas_tarifa_numerica[k] = val === '' || val === null || val === undefined ? 0 : parseFloat(val) || 0;
        });

        dataToSave = {
          activo: formData.activo,
          nombre_visible: serviceName,
          categoria: category,
          tipo_calculo: formData.tipo_calculo,
          reglas_tarifa: reglas_tarifa_numerica,
          tarifasAeropuerto: {
            tramos: formData.tarifasAeropuerto.map(t => ({ desdeKm: t.desdeKm, precio: parseFloat(t.precio) || 0 }))
          },
          horasPico: {
            franjas: formData.horasPico
          }
        };
        key = `${category}_${serviceName}`.replace(/[^a-zA-Z0-9]/g, '_') + '_prueba';
      } else {
        // Estructura original para tarifas normales
        const tarifa_general_numerica = {};
        Object.keys(formData.tarifa_general).forEach((k) => {
          const val = formData.tarifa_general[k];
          tarifa_general_numerica[k] = val === '' || val === null || val === undefined ? 0 : parseFloat(val) || 0;
        });

        dataToSave = {
          categoria: category,
          servicio: serviceName,
          nombre: `${category} - ${serviceName}`,
          activo: formData.activo,
          tarifa_general: tarifa_general_numerica,
          Tarifas_Aeropuerto: {
            tramos: formData.tarifasAeropuerto.map(t => ({ desdeKm: t.desdeKm, precio: parseFloat(t.precio) || 0 }))
          },
          Horas_pico: {
            franjas: formData.horasPico
          }
        };
        key = `${category}_${serviceName}`.replace(/[^a-zA-Z0-9]/g, '_');
      }

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
      <DialogTitle>{service ? `Editar Tarifa${modoPrueba ? ' Prueba' : ''}` : `Asignar Tarifa${modoPrueba ? ' Prueba' : ''}`}</DialogTitle>
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
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              {modoPrueba ? 'Reglas de Tarifa (Modo Prueba)' : 'Tarifas Base'}
            </Typography>
            <Grid container spacing={2}>
              {modoPrueba ? (
                camposDinamicos && camposDinamicos.length > 0 ? (
                  camposDinamicos.map((key) => (
                    <Grid item xs={6} md={3} key={key}>
                      <TextField
                        label={key.replace(/_/g, ' ').toUpperCase()}
                        type="number"
                        fullWidth
                        size="small"
                        value={formData.reglas_tarifa?.[key] ?? ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reglas_tarifa: { ...prev.reglas_tarifa, [key]: e.target.value }
                        }))}
                        step="0.01"
                      />
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Selecciona una categoría para ver los campos disponibles
                    </Typography>
                  </Grid>
                )
              ) : (
                formData.tarifa_general && Object.keys(formData.tarifa_general).map((key) => (
                  <Grid item xs={6} md={3} key={key}>
                    <TextField
                      label={key.replace(/([A-Z])/g, ' $1').trim()}
                      type="number"
                      fullWidth
                      size="small"
                      value={formData.tarifa_general[key]}
                      onChange={(e) => {
                        const tarifa_general_numerica = {};
                        Object.keys(formData.tarifa_general).forEach((k) => {
                          tarifa_general_numerica[k] = k === key ? e.target.value : formData.tarifa_general[k];
                        });
                        setFormData(prev => ({ ...prev, tarifa_general: tarifa_general_numerica }));
                      }}
                    />
                  </Grid>
                ))
              )}
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

  // Load Department Statuses - Solo cargar cuando sea necesario
  useEffect(() => {
    if (tabValue === 0) {
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
    }
  }, [tabValue]);

  // Load Services for Selected Dept - Con filtrado optimizado
  useEffect(() => {
    if (!selectedDept) {
      setServices([]);
      return;
    }

    setLoading(true);
    let isMounted = true;

    const unsub = onSnapshot(doc(db, 'Tarifas', selectedDept), (docSnap) => {
      if (!isMounted) return;

      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedServices = [];
        
        // Cargar solo servicios normales, sin tarifas de prueba
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'enabled' && typeof value === 'object' && value !== null && !key.endsWith('_prueba')) {
            loadedServices.push({ id: key, ...value });
          }
        });
        
        if (isMounted) {
          setServices(loadedServices);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setServices([]);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
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

  // Memoizar opciones de departamentos para evitar re-renders innecesarios
  const deptOptions = useMemo(() => 
    DEPARTAMENTOS.map(dept => ({
      value: dept,
      label: `${dept} ${deptStatus[dept] ? '(Habilitado)' : '(Deshabilitado)'}`,
      enabled: !!deptStatus[dept]
    })),
    [deptStatus]
  );

  // Memoizar manejadores con callbacks
  const memoizedHandleEditService = useCallback((service) => {
    setCurrentService(service);
    setModalOpen(true);
  }, []);

  const memoizedHandleDeleteService = useCallback((serviceId) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    if (selectedDept) {
      updateDoc(doc(db, 'Tarifas', selectedDept), {
        [serviceId]: deleteField()
      }).catch(err => console.error("Error deleting service:", err));
    }
  }, [selectedDept]);

  // Memoizar renderizado de tabla
  const tableRows = useMemo(() => 
    services.map((srv) => (
      <TableRow key={srv.id}>
        <TableCell>{srv.categoria || '-'}</TableCell>
        <TableCell>{srv.servicio || srv.nombre_visible || srv.nombre || '-'}</TableCell>
        <TableCell>
          <Typography color={srv.activo ? 'green' : 'text.secondary'}>
            {srv.activo ? 'Activo' : 'Inactivo'}
          </Typography>
        </TableCell>
        <TableCell>
          {srv.reglas_tarifa?.tarifa_base ? `Bs. ${srv.reglas_tarifa.tarifa_base}` : 
           srv.tarifa_general?.tarifaBase ? `Bs. ${srv.tarifa_general.tarifaBase}` :
           '-'}
        </TableCell>
        <TableCell align="right">
          <IconButton
            size="small"
            onClick={() => memoizedHandleEditService(srv)}
            sx={{ color: '#d7171a' }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => memoizedHandleDeleteService(srv.id)}
            sx={{ color: '#d7171a' }}
          >
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    )),
    [services, memoizedHandleEditService, memoizedHandleDeleteService]
  );

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
                {deptOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
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
                      {tableRows}
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
        modoPrueba={false}
      />
    </Container>
  );
};

export default GestionServicios;
