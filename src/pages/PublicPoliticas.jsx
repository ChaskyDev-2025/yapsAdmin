import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Button } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../data/firebase/firebase';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const PublicPoliticas = () => {
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarPoliticas = async () => {
      try {
        const docRef = doc(db, 'configuracion', 'politicas');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().contenido) {
          setContenido(docSnap.data().contenido);
        } else {
          setContenido('Políticas de privacidad no disponibles');
        }
      } catch (err) {
        console.error('Error al cargar políticas:', err);
        setError('Error al cargar las políticas de privacidad');
      } finally {
        setLoading(false);
      }
    };

    cargarPoliticas();
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #d7171a 0%, #000000 100%)',
        padding: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '40px',
        overflowY: 'auto',
      }}
    >
      <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/login')}
          sx={{
            mb: 2,
            color: 'white',
            alignSelf: 'flex-start',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
          }}
        >
          Volver al Login
        </Button>

        <Paper
          sx={{
            padding: { xs: '20px', md: '40px' },
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ color: '#d7171a', fontWeight: 'bold' }}>
            Políticas de Privacidad
          </Typography>

          {loading && (
            <Typography sx={{ mt: 3, color: '#999' }}>
              Cargando políticas...
            </Typography>
          )}

          {error && (
            <Typography sx={{ mt: 3, color: '#d32f2f' }}>
              {error}
            </Typography>
          )}

          {!loading && !error && (
            <Box
              sx={{
                mt: 3,
                color: '#333',
                lineHeight: '1.8',
                '& p': { mb: 2 },
                '& h3': { mt: 3, mb: 1, color: '#d7171a' },
                '& ul': { pl: 3, mb: 2 },
                '& li': { mb: 0.5 },
              }}
              dangerouslySetInnerHTML={{
                __html: contenido.replace(/\n/g, '<br />'),
              }}
            />
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicPoliticas;