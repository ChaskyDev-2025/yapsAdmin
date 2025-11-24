import { createTheme } from '@mui/material/styles';

// Paleta de colores corporativa
const theme = createTheme({
  palette: {
    primary: {
      main: '#d7171a',      // Rojo principal
      light: '#ff4a4f',     // Rojo más claro
      dark: '#b01217',      // Rojo más oscuro
      contrastText: '#fff', // Texto sobre rojo
    },
    secondary: {
      main: '#000000',      // Negro
      light: '#484848',     // Gris
      dark: '#000000',      // Negro puro
      contrastText: '#fff', // Texto sobre negro
    },
    background: {
      default: '#f5f5f5',   // Fondo general claro
      paper: '#ffffff',     // Fondo de componentes
    },
    text: {
      primary: '#000000',   // Texto principal
      secondary: '#484848', // Texto secundario
    },
    error: {
      main: '#d7171a',      // Usar rojo corporativo para errores
    },
    success: {
      main: '#4caf50',      // Verde para éxito
    },
    warning: {
      main: '#ff9800',      // Naranja para advertencias
    },
    info: {
      main: '#484848',      // Gris para información
    },
  },
  typography: {
    fontFamily: "'Mulish', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 900,
      color: '#000000',
    },
    h2: {
      fontWeight: 800,
      color: '#000000',
    },
    h3: {
      fontWeight: 700,
      color: '#000000',
    },
    h4: {
      fontWeight: 700,
      color: '#000000',
    },
    h5: {
      fontWeight: 600,
      color: '#000000',
    },
    h6: {
      fontWeight: 600,
      color: '#000000',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none', // Botones sin mayúsculas automáticas
    },
  },
  shape: {
    borderRadius: 8, // Bordes redondeados por defecto
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 4px 12px rgba(215, 23, 26, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(215, 23, 26, 0.4)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

export default theme;
