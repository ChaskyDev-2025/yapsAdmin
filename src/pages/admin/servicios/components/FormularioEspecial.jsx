import React from 'react';
import {
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Box
} from '@mui/material';
import { CATEGORIAS_ESPECIALES } from '../config/categoriasEspeciales';

export const FormularioEspecial = ({ 
  categoria, 
  formData, 
  onFormDataChange 
}) => {
  const config = CATEGORIAS_ESPECIALES[categoria];
  
  if (!config) {
    return <Typography color="error">Categoría no soportada</Typography>;
  }

  const campos = config.campos;

  const handleChange = (fieldName, value) => {
    onFormDataChange({
      ...formData,
      reglas_tarifa: {
        ...formData.reglas_tarifa,
        [fieldName]: value
      }
    });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Configuración para {categoria} (Tipo: {config.tipo_calculo})
      </Typography>
      
      <Grid container spacing={2}>
        {Object.entries(campos).map(([fieldName, fieldConfig]) => (
          <Grid item xs={12} sm={6} md={4} key={fieldName}>
            {fieldConfig.type === 'number' && (
              <TextField
                label={fieldConfig.label}
                type="number"
                fullWidth
                step={fieldConfig.step || '1'}
                value={formData.reglas_tarifa?.[fieldName] ?? ''}
                onChange={(e) => handleChange(fieldName, e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            )}
            
            {fieldConfig.type === 'text' && (
              <TextField
                label={fieldConfig.label}
                fullWidth
                value={formData.reglas_tarifa?.[fieldName] ?? ''}
                onChange={(e) => handleChange(fieldName, e.target.value)}
              />
            )}
            
            {fieldConfig.type === 'checkbox' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.reglas_tarifa?.[fieldName] ?? false}
                    onChange={(e) => handleChange(fieldName, e.target.checked)}
                  />
                }
                label={fieldConfig.label}
              />
            )}
            
            {fieldConfig.type === 'select' && (
              <FormControl fullWidth>
                <InputLabel>{fieldConfig.label}</InputLabel>
                <Select
                  value={formData.reglas_tarifa?.[fieldName] ?? 'Bs'}
                  label={fieldConfig.label}
                  onChange={(e) => handleChange(fieldName, e.target.value)}
                >
                  {fieldConfig.options?.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
