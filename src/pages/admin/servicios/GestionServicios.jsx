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
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  TextField,
  Pagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import { doc, updateDoc, setDoc, deleteField, onSnapshot } from 'firebase/firestore';
import { db } from '../../../data/firebase/firebase';
import { CATEGORIAS_ESPECIALES } from './config/categoriasEspeciales';
import { FormularioEspecial } from './components/FormularioEspecial';
import { SeleccionarImagenModal } from './components/SeleccionarImagenModal';
import { TableToolbar } from '../usuarios/components/TableToolbar';

const DEPARTAMENTOS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

const SERVICE_CATALOG = {
  "Viajes": ["Moto Taxi", "Economico", "Comodidad", "Vagoneta", "Empresarial o VIP", "El primero disponible"],
  "Envios": ["Moto", "Vagoneta", "Carga"],
  "carga_local": ["camioneta", "camioneta pequena", "camioneta mediana"],
  "carga_nacional": ["camioneta mediana", "camion grande", "camion extra grande", "tracto camion"],
  "carga_internacional": ["camion gran tonelaje", "camion refrigerado", "camion toldo", "tracto camion"],
  "construccion": ["volqueta 4 cubos", "volqueta 8 cubos", "volqueta 12 cubos", "camion material"],
  "mudanza": ["camioneta pequena", "camioneta mediana", "camion grande"],
  "maquinaria_y_gruas": ["motoniveladora", "retro excavadora", "excavadora hidraulica", "gruas pluma", "gruas rampa"]
};

// Configuración de campos personalizables por categoría
const CAMPOS_POR_CATEGORIA = {
  "Viajes": ["tarifa_base", "distancia_base", "costo_por_km", "costo_por_min", "tarifa_minima", "recargo_nocturno"],
  "Envios": ["tarifa_base", "costo_por_km", "peso_minimo", "costo_por_kg"],
  "Carga local": ["tarifa_base", "volumen_minimo", "costo_por_m3", "costo_por_hora"],
  "Carga nacional": ["tarifa_base", "precio_por_km", "seguro", "costo_descarga"],
  "Construccion": ["tarifa_base", "hora_minima", "costo_por_hora", "costo_por_viaje"],
  "Mudanza": ["tarifa_base", "m3_incluido", "costo_por_m3_extra", "costo_por_hora"],
  "Maquinaria y gruas": ["costo_por_hora", "hora_minima", "costo_traslado"]
};

// --- Modal Component ---
const ServiceModal = ({ open, onClose, service, department, onSave, modoPrueba }) => {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [selectedZona, setSelectedZona] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [camposDinamicos, setCamposDinamicos] = useState([]);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [modalImagenesOpen, setModalImagenesOpen] = useState(false);
  const [originalServiceId, setOriginalServiceId] = useState(null);
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
    unidad_precio: 'Bs',
    reglas_tarifa: {},
    tarifasAeropuerto: [],
    horasPico: [],
    comisiones: {},
    imagenUrl: null,
    imagenNombre: null
  });

  const isEspecialCategory = Object.keys(CATEGORIAS_ESPECIALES).includes(category);

  // Resetear zona cuando cambia el departamento
  useEffect(() => {
    if (department === 'La Paz') {
      setSelectedZona('La Paz');
    } else {
      setSelectedZona(null);
    }
  }, [department, open]);

  useEffect(() => {
    if (!open) {
      setCategory('');
      setServiceName('');
      setCamposDinamicos([]);
      setImagenSeleccionada(null);
      setOriginalServiceId(null);
      setSelectedZona(null);
      setFormData({
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
        tarifasAeropuerto: [{ desdeKm: "10", precio: "40.00" }, { desdeKm: "20", precio: "60.00" }],
        horasPico: [{ desde: "07:00", hasta: "09:00" }, { desde: "18:00", hasta: "20:00" }],
        imagenUrl: null,
        imagenNombre: null
      });
      return;
    }

    // Si no hay service, es modo "nuevo"
    if (!service) {
      setCategory('');
      setServiceName('');
      setImagenSeleccionada(null);
      setOriginalServiceId(null);
      if (modoPrueba) {
        setCamposDinamicos([]);
        setFormData({
          activo: true,
          nombre_visible: '',
          categoria: 'transporte_pasajeros',
          tipo_calculo: 'distancia_tiempo',
          unidad_precio: 'Bs',
          reglas_tarifa: {},
          tarifasAeropuerto: [{ desdeKm: "10", precio: "40.00" }, { desdeKm: "20", precio: "60.00" }],
          horasPico: [{ desde: "07:00", hasta: "09:00" }, { desde: "18:00", hasta: "20:00" }],
          comisiones: {},
          imagenUrl: null,
          imagenNombre: null
        });
      } else {
        setFormData({
          activo: true,
          tarifa_general: { tarifaBase: '', distanciaBase: '', porKm: '', porMin: '', horaPicoExtra: '', nocturno: '', comision: '' },
          tipo_calculo: 'distancia_tiempo',
          unidad_precio: 'Bs',
          tarifasAeropuerto: [{ desdeKm: "10", precio: "40.00" }, { desdeKm: "20", precio: "60.00" }],
          horasPico: [{ desde: "07:00", hasta: "09:00" }, { desde: "18:00", hasta: "20:00" }],
          comisiones: {},
          imagenUrl: null,
          imagenNombre: null
        });
      }
      return;
    }

    // Si hay service, cargar sus datos y guardar el ID original
    setOriginalServiceId(service.id);
    setCategory(service.categoria || '');
    setServiceName(service.servicio || service.nombre_visible || service.id || '');
    
    // Cargar zona si existe (para La Paz)
    if (service.zona) {
      setSelectedZona(service.zona);
    } else {
      setSelectedZona(null);
    }
    
    // Cargar imagen si existe
    if (service.imagenUrl && service.imagenNombre) {
      setImagenSeleccionada({
        url: service.imagenUrl,
        nombre: service.imagenNombre,
        path: service.imagenNombre
      });
    } else {
      setImagenSeleccionada(null);
    }
    
    const isEspecial = Object.keys(CATEGORIAS_ESPECIALES).includes(service.categoria);
    
    if (isEspecial) {
      const reglasTarifa = {};
      if (CATEGORIAS_ESPECIALES[service.categoria]) {
        const campos = CATEGORIAS_ESPECIALES[service.categoria].campos;
        Object.keys(campos).forEach(campo => {
          reglasTarifa[campo] = String(service.reglas_tarifa?.[campo] ?? '');
        });
      }
      
      setFormData({
        activo: service.activo !== undefined ? service.activo : true,
        nombre_visible: service.nombre_visible || service.servicio || service.id || '',
        categoria: service.categoria || 'transporte_pasajeros',
        tipo_calculo: service.tipo_calculo || 'alquiler_horas',
        reglas_tarifa: reglasTarifa,
        tarifasAeropuerto: service.Tarifas_Aeropuerto?.tramos || [],
        horasPico: service.Horas_pico?.franjas || []
      });
    } else if (modoPrueba) {
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
        tarifasAeropuerto: service.Tarifas_Aeropuerto?.tramos || [],
        horasPico: service.Horas_pico?.franjas || []
      });
    } else {
      // Determinar tipo_calculo basado en la categoría
      let tipoCalculoFinal = 'distancia_tiempo';
      if (service.categoria === 'Viajes' || service.categoria === 'Envios') {
        tipoCalculoFinal = 'distancia_tiempo';
      } else {
        tipoCalculoFinal = service.tipo_calculo || 'distancia_tiempo';
      }
      
      setFormData({
        activo: service.activo !== undefined ? service.activo : true,
        tarifa_general: {
          tarifaBase: String(service.reglas_tarifa?.tarifaBase ?? service.reglas_tarifa?.tarifa_base ?? service.tarifa_general?.tarifaBase ?? ''),
          distanciaBase: String(service.reglas_tarifa?.distanciaBase ?? service.reglas_tarifa?.distancia_base ?? service.tarifa_general?.distanciaBase ?? ''),
          porKm: String(service.reglas_tarifa?.porKm ?? service.reglas_tarifa?.costo_por_km ?? service.tarifa_general?.porKm ?? ''),
          porMin: String(service.reglas_tarifa?.porMin ?? service.reglas_tarifa?.costo_por_min ?? service.tarifa_general?.porMin ?? ''),
          horaPicoExtra: String(service.reglas_tarifa?.horaPicoExtra ?? service.reglas_tarifa?.recargo_nocturno ?? service.tarifa_general?.horaPicoExtra ?? ''),
          nocturno: String(service.reglas_tarifa?.nocturno ?? service.reglas_tarifa?.recargo_nocturno ?? service.tarifa_general?.nocturno ?? ''),
          comision: String(service.reglas_tarifa?.comision ?? service.tarifa_general?.comision ?? '')
        },
        tipo_calculo: tipoCalculoFinal,
        tarifasAeropuerto: service.Tarifas_Aeropuerto?.tramos || [],
        horasPico: service.Horas_pico?.franjas || [],
        comisiones: (typeof service.comisiones === 'object' && !Array.isArray(service.comisiones)) ? service.comisiones : {}
      });
    }
  }, [open, service, modoPrueba]);


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

  // Comisiones handlers (como objeto con propiedades dinámicas)
  const [nuevoNombreComision, setNuevoNombreComision] = useState('');
  const [nuevoValorComision, setNuevoValorComision] = useState('');

  const addComision = () => {
    if (!nuevoNombreComision.trim()) {
      alert('Ingresa un nombre para la comisión');
      return;
    }
    if (!nuevoValorComision || isNaN(nuevoValorComision)) {
      alert('Ingresa un valor válido');
      return;
    }
    setFormData(prev => ({
      ...prev,
      comisiones: {
        ...prev.comisiones,
        [nuevoNombreComision.toLowerCase()]: parseFloat(nuevoValorComision)
      }
    }));
    setNuevoNombreComision('');
    setNuevoValorComision('');
  };

  const removeComision = (key) => {
    setFormData(prev => {
      const newComisiones = { ...prev.comisiones };
      delete newComisiones[key];
      return { ...prev, comisiones: newComisiones };
    });
  };

  const updateComision = (key, value) => {
    setFormData(prev => ({
      ...prev,
      comisiones: {
        ...prev.comisiones,
        [key]: parseFloat(value) || 0
      }
    }));
  };

  const calcularTotalComisiones = () => {
    return Object.entries(formData.comisiones || {})
      .filter(([key]) => key !== 'totalComisiones') // Excluir totalComisiones de la suma
      .reduce((total, [, valor]) => {
        const num = parseFloat(valor) || 0;
        return total + num;
      }, 0).toFixed(2);
  };

  

  const handleSubmit = async () => {
    if (!category || !serviceName) return alert('Debe seleccionar una categoría y un servicio');
    setLoading(true);
    try {
      let dataToSave;
      let key;

      // Verificar si es una categoría especial
      const esEspecial = Object.keys(CATEGORIAS_ESPECIALES).includes(category);

      if (esEspecial) {
        // Estructura para categorías especiales (Carga, Mudanza, Maquinaria)
        const reglas_tarifa_numerica = {};
        Object.keys(formData.reglas_tarifa).forEach((k) => {
          const val = formData.reglas_tarifa[k];
          // Mantener booleanos como booleanos, números como números
          if (typeof val === 'boolean') {
            reglas_tarifa_numerica[k] = val;
          } else if (val === '' || val === null || val === undefined) {
            reglas_tarifa_numerica[k] = 0;
          } else {
            reglas_tarifa_numerica[k] = isNaN(parseFloat(val)) ? val : parseFloat(val);
          }
        });

        // Agregar unidad_precio a reglas_tarifa si existe
        if (formData.unidad_precio) {
          reglas_tarifa_numerica.unidad_precio = formData.unidad_precio;
        }

        dataToSave = {
          activo: formData.activo,
          nombre_visible: serviceName,
          categoria: category,
          tipo_calculo: formData.tipo_calculo,
          reglas_tarifa: reglas_tarifa_numerica
        };
        key = `${category}_${serviceName}`.replace(/[^a-zA-Z0-9]/g, '_');
      } else if (modoPrueba) {
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
        // Estructura original para tarifas normales (Viajes y Envíos)
        const tarifa_general_numerica = {};
        Object.keys(formData.tarifa_general).forEach((k) => {
          const val = formData.tarifa_general[k];
          tarifa_general_numerica[k] = val === '' || val === null || val === undefined ? 0 : parseFloat(val) || 0;
        });

        // Agregar unidad_precio a la estructura
        tarifa_general_numerica.unidad_precio = formData.unidad_precio || 'Bs';

        dataToSave = {
          activo: formData.activo,
          nombre_visible: serviceName,
          categoria: category,
          tipo_calculo: formData.tipo_calculo,
          reglas_tarifa: tarifa_general_numerica
        };
        
        // Generar key base
        let keyBase = `${category}_${serviceName}`.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Si es La Paz, SIEMPRE incluir la zona en la clave
        if (department === 'La Paz' && selectedZona) {
          keyBase = `${keyBase}_${String(selectedZona).replace(/\s+/g, '_')}`;
        }
        
        key = keyBase;
      }

      // Agregar imagen si está seleccionada
      if (imagenSeleccionada) {
        dataToSave.imagenUrl = imagenSeleccionada.url;
        dataToSave.imagenNombre = imagenSeleccionada.nombre;
      }

      // Agregar comisiones si existen (como objeto)
      if (formData.comisiones && Object.keys(formData.comisiones).length > 0) {
        dataToSave.comisiones = {
          ...formData.comisiones,
          totalComisiones: parseFloat(calcularTotalComisiones())
        };
      } else {
        dataToSave.comisiones = {};
      }

      // Si es una edición, usar el ID original
      const finalKey = originalServiceId || key;

      // Pasar zona solo si está en La Paz y una zona está seleccionada
      const zonaAGuardar = department === 'La Paz' ? (selectedZona || 'La Paz') : null;

      await onSave(finalKey, dataToSave, zonaAGuardar);
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
      <DialogContent dividers sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        <Grid container spacing={3}>
          {/* SECTION 1: Category & Service Selection (TOP) */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!!service}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={category}
                label="Categoría"
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setCategory(newCategory);
                  setServiceName(''); // Reset service when category changes
                  
                  // Actualizar tipo_calculo según la categoría
                  if (newCategory === 'Viajes' || newCategory === 'Envios') {
                    setFormData(prev => ({ ...prev, tipo_calculo: 'distancia_tiempo' }));
                  }
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

          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} />}
              label="Activo"
            />
            {!isEspecialCategory && (
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Unidad Precio</InputLabel>
                <Select
                  value={formData.unidad_precio || 'Bs'}
                  label="Unidad Precio"
                  onChange={(e) => setFormData({ ...formData, unidad_precio: e.target.value })}
                >
                  <MenuItem value="Bs">Bs</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                </Select>
              </FormControl>
            )}
            {/* Mantener solo selector de zona junto a Unidad Precio (sin lógica adicional) */}
            {department === 'La Paz' && (
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Zona</InputLabel>
                <Select
                  value={selectedZona || 'La Paz'}
                  label="Zona"
                  onChange={(e) => setSelectedZona(e.target.value)}
                >
                  <MenuItem value="La Paz">La Paz</MenuItem>
                  <MenuItem value="El Alto">El Alto</MenuItem>
                </Select>
              </FormControl>
            )}
          </Grid>

          {/* SECTION 2: Tarifas Base (MIDDLE - Full Width) */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {modoPrueba ? 'Reglas de Tarifa (Modo Prueba)' : 'Tarifas Base'}
            </Typography>
            
            {/* Formulario especial para categorías especiales */}
            {isEspecialCategory && category && (
              <FormularioEspecial
                categoria={category}
                formData={formData}
                onFormDataChange={setFormData}
              />
            )}
            
            {/* Formularios originales para Viajes y Envíos */}
            {!isEspecialCategory && (
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
            )}
          </Grid>

          {/* Tarifas Aeropuerto */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Tarifas Aeropuerto</Typography>
                <IconButton onClick={addAeropuerto} color="primary" size="small"><AddCircleOutlineIcon /></IconButton>
              </Box>
              <Box sx={{ maxHeight: '250px', overflowY: 'auto' }}>
                {formData.tarifasAeropuerto.map((tramo, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField 
                      label="Desde Km" 
                      size="small" 
                      type="number"
                      value={tramo.desdeKm} 
                      onChange={(e) => updateAeropuerto(idx, 'desdeKm', e.target.value)} 
                      sx={{ flex: 1 }}
                    />
                    <TextField 
                      label="Precio (Bs)" 
                      size="small" 
                      type="number" 
                      value={tramo.precio} 
                      onChange={(e) => updateAeropuerto(idx, 'precio', e.target.value)} 
                      sx={{ flex: 1 }}
                    />
                    <IconButton onClick={() => removeAeropuerto(idx)} color="error" size="small"><RemoveCircleOutlineIcon /></IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Horas Pico */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Horas Pico</Typography>
                <IconButton onClick={addHoraPico} color="primary" size="small"><AddCircleOutlineIcon /></IconButton>
              </Box>
              <Box sx={{ maxHeight: '250px', overflowY: 'auto' }}>
                {formData.horasPico.map((franja, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField 
                      label="Desde" 
                      type="time" 
                      size="small" 
                      InputLabelProps={{ shrink: true }} 
                      value={franja.desde} 
                      onChange={(e) => updateHoraPico(idx, 'desde', e.target.value)} 
                      sx={{ flex: 1 }}
                    />
                    <TextField 
                      label="Hasta" 
                      type="time" 
                      size="small" 
                      InputLabelProps={{ shrink: true }} 
                      value={franja.hasta} 
                      onChange={(e) => updateHoraPico(idx, 'hasta', e.target.value)} 
                      sx={{ flex: 1 }}
                    />
                    <IconButton onClick={() => removeHoraPico(idx)} color="error" size="small"><RemoveCircleOutlineIcon /></IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Comisiones - Solo para Viajes y Envios */}
          {(category === 'Viajes' || category === 'Envios') && (
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Comisiones</Typography>
              
              {/* Formulario para agregar nueva comisión */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-end' }}>
                <TextField 
                  label="Nombre (ej: app, flota, seguro)" 
                  size="small"
                  value={nuevoNombreComision}
                  onChange={(e) => setNuevoNombreComision(e.target.value)}
                  sx={{ flex: 2 }}
                />
                <TextField 
                  label="Porcentaje (%)" 
                  size="small" 
                  type="number"
                  inputProps={{ step: "0.1", min: "0" }}
                  value={nuevoValorComision}
                  onChange={(e) => setNuevoValorComision(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button onClick={addComision} variant="contained" color="primary" size="small">Agregar</Button>
              </Box>

              {/* Lista de comisiones existentes */}
              <Box sx={{ maxHeight: '250px', overflowY: 'auto', mb: 2 }}>
                {formData.comisiones && Object.keys(formData.comisiones).length > 0 ? (
                  Object.entries(formData.comisiones).map(([key, valor]) => (
                    <Box key={key} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', p: 1, bgcolor: '#fff', borderRadius: 1 }}>
                      <Typography sx={{ flex: 2, fontWeight: 500 }}>
                        {key}:
                      </Typography>
                      <TextField 
                        size="small" 
                        type="number"
                        inputProps={{ step: "0.1", min: "0" }}
                        value={valor} 
                        onChange={(e) => updateComision(key, e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <Typography sx={{ minWidth: '30px', textAlign: 'center' }}>%</Typography>
                      <IconButton onClick={() => removeComision(key)} color="error" size="small"><RemoveCircleOutlineIcon /></IconButton>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic', p: 1 }}>
                    No hay comisiones. Agrega una arriba.
                  </Typography>
                )}
              </Box>

              {formData.comisiones && Object.keys(formData.comisiones).length > 0 && (
                <Box sx={{ 
                  p: 1.5, 
                  bgcolor: '#fff', 
                  borderTop: '2px solid #ddd',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  alignItems: 'center'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Total Comisiones:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#d7171a', minWidth: '80px' }}>
                    {calcularTotalComisiones()}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
          )}

          {/* Sección Imagen del Vehículo */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Imagen del Vehículo</Typography>
                  <Typography variant="caption" sx={{ color: '#999' }}>Selecciona una imagen representativa del vehículo</Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setModalImagenesOpen(true)}
                  color="primary"
                  sx={{ ml: 2 }}
                >
                  Seleccionar Imagen
                </Button>
              </Box>

              {imagenSeleccionada ? (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'auto 1fr',
                  gap: 2,
                  alignItems: 'center',
                  p: 2,
                  bgcolor: '#ffffff',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  {/* Imagen */}
                  <Box
                    component="img"
                    src={imagenSeleccionada.url}
                    alt={imagenSeleccionada.nombre}
                    sx={{
                      width: 140,
                      height: 140,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '2px solid #d7171a'
                    }}
                  />
                  
                  {/* Info y botones */}
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#999' }}>Archivo seleccionado:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#000', wordBreak: 'break-word' }}>
                        {imagenSeleccionada.nombre}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => setImagenSeleccionada(null)}
                    >
                      Cambiar Imagen
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  p: 3,
                  bgcolor: '#ffffff',
                  borderRadius: 1,
                  border: '2px dashed #ddd',
                  textAlign: 'center'
                }}>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    📷 No hay imagen seleccionada
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#bbb', display: 'block', mt: 1 }}>
                    Haz clic en "Seleccionar Imagen" para elegir una
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
      <SeleccionarImagenModal
        open={modalImagenesOpen}
        onClose={() => setModalImagenesOpen(false)}
        onSelect={(imagen) => setImagenSeleccionada(imagen)}
      />
    </Dialog>
  );
};

// --- Main Component ---
const GestionServicios = () => {
  // Función para formatear nombres de categorías
  const formatearCategoria = (categoria) => {
    if (!categoria) return '-';
    return categoria
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [tabValue, setTabValue] = useState(0);
  const [deptStatus, setDeptStatus] = useState({});
  const [selectedDept, setSelectedDept] = useState('');
  const [services, setServices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  
  // Estados para búsqueda y filtros
  const [searchServices, setSearchServices] = useState("");
  const [sortByServices, setSortByServices] = useState("nombre-asc");
  const [filterCategoryServices, setFilterCategoryServices] = useState("todas");
  
  // Estados para paginación
  const ITEMS_PER_PAGE = 10;
  const [pageServices, setPageServices] = useState(0);
  
  // Resetear página al cambiar búsqueda o filtros
  useEffect(() => {
    setPageServices(0);
  }, [searchServices, filterCategoryServices]);
  
  // Estados para columnas visibles
  const [visibleColumnsServicios, setVisibleColumnsServicios] = useState({
    categoria: true,
    nombre: true,
    estado: true,
    tarifa_base: true,
    acciones: true,
  });

  // Estados para diálogo de eliminación de servicios
  const [openDeleteServiceDialog, setOpenDeleteServiceDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

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
        }
      } else {
        if (isMounted) {
          setServices([]);
        }
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [selectedDept]);

  // Filtrar y ordenar servicios
  const servicesFiltrados = useMemo(() => {
    let filtered = services;

    // Filtro por búsqueda
    if (searchServices) {
      const search = searchServices.toLowerCase();
      filtered = filtered.filter(s =>
        (s.nombre || s.nombre_visible || s.servicio || '').toLowerCase().includes(search) ||
        (s.categoria || '').toLowerCase().includes(search)
      );
    }

    // Filtro por categoría
    if (filterCategoryServices !== 'todas') {
      filtered = filtered.filter(s => s.categoria === filterCategoryServices);
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByServices) {
      case 'nombre-asc':
        sorted.sort((a, b) => ((a.nombre || a.nombre_visible || a.servicio || '').localeCompare(b.nombre || b.nombre_visible || b.servicio || '')));
        break;
      case 'nombre-desc':
        sorted.sort((a, b) => ((b.nombre || b.nombre_visible || b.servicio || '').localeCompare(a.nombre || a.nombre_visible || a.servicio || '')));
        break;
      case 'categoria-asc':
        sorted.sort((a, b) => ((a.categoria || '').localeCompare(b.categoria || '')));
        break;
      case 'categoria-desc':
        sorted.sort((a, b) => ((b.categoria || '').localeCompare(a.categoria || '')));
        break;
      default:
        break;
    }

    return sorted;
  }, [services, searchServices, sortByServices, filterCategoryServices]);

  // Datos paginados para Servicios
  const servicesPaginados = useMemo(() => {
    const start = pageServices * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return servicesFiltrados.slice(start, end);
  }, [servicesFiltrados, pageServices]);

  const totalPagesServices = Math.ceil(servicesFiltrados.length / ITEMS_PER_PAGE);

  const handleToggleDept = async (dept, currentStatus) => {
    try {
      await setDoc(doc(db, 'Tarifas', dept), { enabled: !currentStatus }, { merge: true });
    } catch (err) {
      console.error("Error toggling department:", err);
    }
  };

  const handleSaveService = async (serviceName, serviceData, zona) => {
    if (!selectedDept) return;
    // Solo guardar zona si es La Paz
    const payload = selectedDept === 'La Paz' 
      ? { ...serviceData, zona: zona || null }
      : { ...serviceData };
    
    try {
      await updateDoc(doc(db, 'Tarifas', selectedDept), {
        [serviceName]: payload
      });
    } catch (err) {
      // If doc doesn't exist, create it with the service field
      try {
        await setDoc(doc(db, 'Tarifas', selectedDept), {
          [serviceName]: payload,
          enabled: deptStatus[selectedDept] || false
        }, { merge: true });
      } catch (setDocErr) {
        throw setDocErr;
      }
    }
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

  const handleOpenDeleteServiceDialog = (service) => {
    setServiceToDelete(service);
    setOpenDeleteServiceDialog(true);
  };

  const handleCloseDeleteServiceDialog = () => {
    setOpenDeleteServiceDialog(false);
    setServiceToDelete(null);
  };

  const handleConfirmDeleteService = () => {
    if (!serviceToDelete || !selectedDept) return;
    updateDoc(doc(db, 'Tarifas', selectedDept), {
      [serviceToDelete.id]: deleteField()
    }).catch(err => console.error("Error deleting service:", err));
    handleCloseDeleteServiceDialog();
  };

  const memoizedHandleDeleteService = useCallback((service) => {
    handleOpenDeleteServiceDialog(service);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
          Gestión de Tarifas y Servicios
        </Typography>

        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)} 
          sx={{ 
            mb: 3,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "none",
              color: "#484848",
              "&.Mui-selected": {
                color: "#d7171a",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#d7171a",
            },
          }}
        >
          <Tab label="Departamentos" />
          <Tab label="Tarifas" />
        </Tabs>

        {/* Tab 0: Departamentos */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Estado de Departamentos
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table stickyHeader>
                <TableHead sx={{ backgroundColor: '#000000' }}>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#000000', color: 'white', fontWeight: 700, fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem' }}>Departamento</TableCell>
                    <TableCell sx={{ backgroundColor: '#000000', color: 'white', fontWeight: 700, fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem', textAlign: 'center' }}>Estado</TableCell>
                    <TableCell sx={{ backgroundColor: '#000000', color: 'white', fontWeight: 700, fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem', textAlign: 'center' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DEPARTAMENTOS.map((dept) => (
                    <TableRow key={dept} hover>
                      <TableCell sx={{ fontFamily: 'Mulish, sans-serif', fontWeight: '500' }}>
                        <Typography sx={{ fontWeight: '500' }}>{dept}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: deptStatus[dept] ? '#ffe0e0' : '#ffebee',
                          color: deptStatus[dept] ? '#b01217' : '#c62828'
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: '600' }}>
                            {deptStatus[dept] ? '✓ Habilitado' : '✗ Deshabilitado'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!deptStatus[dept]}
                              onChange={() => handleToggleDept(dept, deptStatus[dept])}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#d7171a',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#d7171a',
                                },
                              }}
                              size="small"
                            />
                          }
                          label=""
                          sx={{ m: 0 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 1: Tarifas */}
        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth>
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
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddService} sx={{ backgroundColor: '#d7171a', whiteSpace: 'nowrap' }}>
                Asignar Tarifa
              </Button>
            </Box>

            {selectedDept && (
              <Box>

                {/* Toolbar para Servicios */}
                <TableToolbar
                  searchValue={searchServices}
                  onSearchChange={setSearchServices}
                  sortOptions={[
                    { label: "↑ Sort by Nombre (ASC)", value: "nombre-asc" },
                    { label: "↓ Sort by Nombre (DESC)", value: "nombre-desc" },
                    { label: "↑ Sort by Categoría (ASC)", value: "categoria-asc" },
                    { label: "↓ Sort by Categoría (DESC)", value: "categoria-desc" },
                  ]}
                  sortValue={sortByServices}
                  onSortChange={setSortByServices}
                  filterOptions={[
                    {
                      name: "categoria",
                      label: "Categoría",
                      defaultValue: "todas",
                      options: [
                        { label: "Todas", value: "todas" },
                        ...Array.from(new Set(services.map(s => s.categoria))).map(cat => ({
                          label: formatearCategoria(cat),
                          value: cat
                        }))
                      ],
                    },
                  ]}
                  filterValue={{ categoria: filterCategoryServices }}
                  onFilterChange={(name, value) => setFilterCategoryServices(value)}
                  visibleColumns={visibleColumnsServicios}
                  onColumnChange={(col, visible) => setVisibleColumnsServicios(prev => ({ ...prev, [col]: visible }))}
                  showClearButton={true}
                />

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ backgroundColor: '#000000' }}>
                      <TableRow>
                        {visibleColumnsServicios.categoria && <TableCell sx={{ backgroundColor: '#000000', color: 'white', fontWeight: 700, fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem' }}>Categoría</TableCell>}
                        {visibleColumnsServicios.nombre && <TableCell sx={{ backgroundColor: '#000000', color: 'white', fontWeight: 700, fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem' }}>Servicio</TableCell>}
                        {selectedDept === 'La Paz' && (
                          <TableCell sx={{ backgroundColor: '#000000', color: 'white', fontWeight: 700, fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem' }}>Zona</TableCell>
                        )}
                        {visibleColumnsServicios.estado && <TableCell sx={{ backgroundColor: '#000000', color: 'white', fontWeight: 700, fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem' }}>Estado</TableCell>}
                        {visibleColumnsServicios.tarifa_base && <TableCell sx={{ backgroundColor: '#000000', color: 'white', fontWeight: 700, fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem' }}>Tarifa Base</TableCell>}
                        {visibleColumnsServicios.acciones && <TableCell align="right" sx={{ backgroundColor: '#000000', color: 'white', fontWeight: 700, fontFamily: 'Mulish, sans-serif', fontSize: '0.95rem' }}>Acciones</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {servicesPaginados.map((srv) => (
                        <TableRow key={srv.id}>
                          {visibleColumnsServicios.categoria && <TableCell>{formatearCategoria(srv.categoria)}</TableCell>}
                          {visibleColumnsServicios.nombre && <TableCell>{srv.servicio || srv.nombre_visible || srv.nombre || '-'}</TableCell>}
                          {selectedDept === 'La Paz' && (
                            <TableCell>{srv.zona || '-'}</TableCell>
                          )}
                          {visibleColumnsServicios.estado && (
                            <TableCell>
                              <Typography color={srv.activo ? 'green' : 'text.secondary'}>
                                {srv.activo ? 'Activo' : 'Inactivo'}
                              </Typography>
                            </TableCell>
                          )}
                          {visibleColumnsServicios.tarifa_base && (
                            <TableCell>
                              {(() => {
                                // Buscar la tarifa base según prioridad
                                // Primero: buscar costo_por_hora (para categorías de tiempo)
                                if (srv.reglas_tarifa?.costo_por_hora) {
                                  return `Bs. ${srv.reglas_tarifa.costo_por_hora}`;
                                }
                                // Segundo: buscar tarifa_base (snake_case) o tarifaBase (camelCase)
                                if (srv.reglas_tarifa?.tarifa_base) {
                                  return `Bs. ${srv.reglas_tarifa.tarifa_base}`;
                                }
                                if (srv.reglas_tarifa?.tarifaBase) {
                                  return `Bs. ${srv.reglas_tarifa.tarifaBase}`;
                                }
                                // Tercero: buscar el primer campo numérico en reglas_tarifa (excepto unidad_precio)
                                if (srv.reglas_tarifa) {
                                  for (const [key, value] of Object.entries(srv.reglas_tarifa)) {
                                    if (key !== 'unidad_precio' && typeof value === 'number' && value > 0) {
                                      return `Bs. ${value}`;
                                    }
                                  }
                                }
                                // Último: buscar en tarifa_general
                                if (srv.tarifa_general?.tarifaBase) {
                                  return `Bs. ${srv.tarifa_general.tarifaBase}`;
                                }
                                return '-';
                              })()}
                            </TableCell>
                          )}
                          {visibleColumnsServicios.acciones && (
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
                                onClick={() => memoizedHandleDeleteService(srv)}
                                sx={{ color: '#d7171a' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {servicesFiltrados.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={selectedDept === 'La Paz' ? 6 : 5} align="center">No hay servicios registrados en este departamento.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {servicesFiltrados.length > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 2 }}>
                    <Typography variant="body2" sx={{ fontFamily: "Mulish, sans-serif" }}>
                      Mostrando {servicesPaginados.length > 0 ? (pageServices * ITEMS_PER_PAGE + 1) : 0} - {Math.min((pageServices + 1) * ITEMS_PER_PAGE, servicesFiltrados.length)} de {servicesFiltrados.length}
                    </Typography>
                    <Pagination 
                      count={totalPagesServices}
                      page={pageServices + 1}
                      onChange={(e, page) => setPageServices(page - 1)}
                      sx={{
                        "& .MuiPaginationItem-root": {
                          fontFamily: "Mulish, sans-serif",
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
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

      {/* Dialog de confirmación para eliminar Servicio */}
      <Dialog
        open={openDeleteServiceDialog}
        onClose={handleCloseDeleteServiceDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 700 }}>
          ⚠️ Eliminar Servicio
        </DialogTitle>
        <DialogContent sx={{ fontFamily: "Mulish, sans-serif", pt: 2 }}>
          <Typography sx={{ mb: 2 }}>
            ¿Deseas eliminar este servicio?
          </Typography>
          {serviceToDelete && (
            <Box sx={{ backgroundColor: "#f5f5f5", p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: "#d7171a" }}>
                {serviceToDelete.nombre_visible}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666" }}>
                Categoría: {serviceToDelete.categoria}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ color: "#666" }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteServiceDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDeleteService} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionServicios;
