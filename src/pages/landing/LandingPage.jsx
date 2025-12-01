import { useNavigate } from "react-router-dom";
import { FaTaxi  } from "react-icons/fa";
import { Box, Typography, Button, IconButton, useTheme, Container } from "@mui/material";
import taxiImage from "../../assets/taxi-hero.png";
import { useState, useEffect } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const textos = [
    "Tu solución rápida y segura para moverte por la ciudad.",
    "Unimos conductores y pasajeros para viajes seguros y eficientes.",
    "Llega a donde quieras de forma rápida, segura y sin demoras."
  ];

  const [textoIndex, setTextoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextoIndex((prev) => (prev + 1) % textos.length);
    }, 3000); // Cambia cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        background: "linear-gradient(135deg, #d61319 0%, #000000 100%)", // Gradiente rojo-negro corporativo
        color: "#fff", // Color de texto blanco
        fontFamily: "'Roboto', sans-serif", // Usamos 'Roboto' de MUI por defecto o define una en tu tema
        overflow: "hidden", // Previene barras de desplazamiento si hay elementos fuera de vista
        [theme.breakpoints.down('sm')]: {
          py: 6, // Más padding vertical en móviles
        },
      }}
    >
      {/* Ícono de Acceso para el Dueño - Discreto y accesible */}
      <IconButton
        onClick={handleLoginClick}
        title="Acceso para el Dueño" // Título más conciso
        sx={{
          position: "absolute",
          top: { xs: 16, md: 24 }, // Ajuste de posición para móviles
          right: { xs: 16, md: 24 }, // Ajuste de posición para móviles
          fontSize: { xs: "1.8rem", md: "2.2rem" }, // Tamaño adaptable del ícono
          color: "rgba(255, 255, 255, 0.8)", // Ligero cambio de opacidad para mejor visibilidad
          transition: "transform 0.3s ease-in-out", // Suave animación al pasar el cursor
          "&:hover": {
            transform: "scale(1.1)", // Efecto de escala al pasar el cursor
            color: "rgba(255, 255, 255, 1)", // Se vuelve completamente blanco al pasar el cursor
            backgroundColor: 'transparent', // No queremos un fondo de botón
          },
        }}
      >
      <FaTaxi />
      </IconButton>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        pl: { xs: 6, sm: 8},
        }}>
        {/* Título Principal */}

        {/* Imagen del Taxi */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src={taxiImage}
            alt="Taxi YAAPS"
            sx={{
              width: { xs: '100%', sm: 600, md: 700, lg: 850 },
              height: 'auto',
              maxWidth: '850px',
              mb: 3,
            }}
          />
        </Box>

        <Typography
          variant="h2" // `h2` es adecuado para un título principal de página
          component="h1" // Semánticamente correcto como h1 para el SEO
          sx={{
            fontFamily: "'Mulish', sans-serif",
            fontWeight: 900,
            mb: 2,
            fontSize: { xs: "3rem", sm: "4rem", md: "4.5rem"},
            lineHeight: 1.2,
            color: "#fff",
          }}
        >
          Bienvenido a YAPPS
        </Typography>

        {/* Subtítulo / Descripción */}
        <Box
          sx={{
           height: '60px', // Altura fija para evitar saltos
            overflow: 'hidden',
            mb: 4,
          }}
        >
          <Typography
            key={textoIndex}
            variant="h6"
            sx={{
              fontFamily: "'Mulish', sans-serif",
              fontWeight: 400,
              fontSize: { xs: "2rem", md: "2.5rem"},
              opacity: 0.9,
              lineHeight: 1.6,
              color: "#fff",
              animation: 'slideUp 0.6s ease-out',
              '@keyframes slideUp': {
              '0%': {
                transform: 'translateY(100%)',
                opacity: 0,
              },
              '100%': {
                transform: 'translateY(0)',
                opacity: 0.9,
              },
              },
            }}
          >
            {textos[textoIndex]}
          </Typography>
        </Box>

        {/* Botón de Llamada a la Acción Principal */}
        <Button
          onClick={() => alert("¡Descarga la app de YAAPS para pedir tu taxi ahora!")} // Mensaje más específico
          variant="contained" // Usa el estilo "contained" de MUI
          sx={{
            px: { xs: 4, md: 6 }, // Padding horizontal adaptable
            py: { xs: 1.2, md: 1.8 }, // Padding vertical adaptable
            fontSize: { xs: "1.1rem", md: "1.4rem" }, // Tamaño de fuente adaptable
            fontWeight: "bold",
            borderRadius: "50px", // Bordes más redondeados para un look moderno
            backgroundColor: "#ffffff", // Botón blanco
            color: "#d7171a", // Texto en rojo corporativo
            boxShadow: "0 8px 24px rgba(255, 255, 255, 0.3)", // Sombra blanca prominente
            alignSelf: "center",
            mr: { xs: 6, sm: 8, md: 10},
            transition: "all 0.3s ease-in-out", // Transición para hover y otras propiedades
            "&:hover": {
            backgroundColor: "#f5f5f5", // Ligero gris al pasar el cursor
            transform: "translateY(-4px)", // Efecto de elevación más notable
            boxShadow: "0 12px 32px rgba(255, 255, 255, 0.4)", // Sombra más profunda al pasar el cursor
            color: "#b01217", // Rojo más oscuro en hover
            },
          }}
        >
          ¡Pide tu taxi ahora!
        </Button>
      </Box>
    </Box>
  );
};

export default LandingPage;