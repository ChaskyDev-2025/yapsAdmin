// modalDerecho.jsx
import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Button,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Chip,
} from "@mui/material";
import { collection, onSnapshot, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

function Preview({ src, alt }) {
  const [error, setError] = useState(false);

  const noImage = !src || error;

  if (noImage) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f5f5",
          fontSize: 24,
          fontWeight: "bold",
          color: "text.secondary",
          textTransform: "none",
        }}
      >
        Sin imagen
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt || "Documento"}
      loading="lazy"
      onError={() => setError(true)}
      sx={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
      }}
    />
  );
}

export default function ModalDerecho({ userId, setDocActivo }) {
  const [docs, setDocs] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!userId) {
      setDocs([]);
      setCargando(false);
      return;
    }

    let cancel = false;
    const CIUDADES = ["La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", "Oruro", "Potosí", "Tarija", "Pando", "Beni"];

    const loadDocs = async () => {
      try {
        // 1. Obtener el trabajador para obtener su flotaId
        const trabajadorRef = doc(db, "trabajadores", userId);
        const trabajadorSnap = await getDoc(trabajadorRef);

        if (!trabajadorSnap.exists()) {
          if (!cancel) {
            setDocs([]);
            setCargando(false);
          }
          return;
        }

        const trabajador = trabajadorSnap.data();
        const flotaId = trabajador.flotaId;

        if (!flotaId) {
          if (!cancel) {
            setDocs([]);
            setCargando(false);
          }
          return;
        }

        // Pre-cargar documentos de todas las ciudades EN PARALELO
        const documentosPorCiudadCache = {};
        const promesasCiudades = CIUDADES.map(async (ciudad) => {
          const ciudadDocId = ciudad.toLowerCase().replace(/\s+/g, '') + "_doc";
          const docRef = doc(db, "crear-documentos", ciudadDocId);
          
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().documentosPorCiudad) {
              documentosPorCiudadCache[ciudad] = docSnap.data().documentosPorCiudad;
            }
          } catch (e) {
            console.warn(`Error cargando documentos de ${ciudad}:`, e);
          }
        });

        // Esperar a que todas las peticiones de ciudades se completen en paralelo
        await Promise.all(promesasCiudades);

        // 2. Ahora escuchar cambios en la flota con los documentos ya en caché
        const flotaRef = doc(db, "flotas", flotaId);
        const unsubscribFlota = onSnapshot(flotaRef, (flotaSnap) => {
          if (!flotaSnap.exists()) {
            if (!cancel) {
              setDocs([]);
              setCargando(false);
            }
            return;
          }

          const flota = flotaSnap.data();
          // Soportar ambos sistemas: nuevo (flota.documentos) y antiguo (flota.documentosFlota.documentosAsignados)
          const documentosAsignados = flota.documentos || flota.documentosFlota?.documentosAsignados || [];

          if (!documentosAsignados || documentosAsignados.length === 0) {
            if (!cancel) {
              setDocs([]);
              setCargando(false);
            }
            return;
          }

          try {
            // Combinar todos los documentos del caché (ya cargados)
            const todasLasPlantillas = [];
            Object.values(documentosPorCiudadCache).forEach(docs => {
              todasLasPlantillas.push(...docs);
            });

            if (!cancel) {
              // Filtrar solo los documentos asignados a la flota
              const items = documentosAsignados
                .map((documentoId) => {
                  // Buscar en todas las plantillas del caché
                  const plantilla = todasLasPlantillas.find((p) => 
                    p.id === documentoId || p.firebaseId === documentoId
                  );
                  
                  if (!plantilla) {
                    console.warn(`❌ Plantilla no encontrada para ID: ${documentoId}`);
                    return null;
                  }
                  
                  return {
                    id: plantilla.id || plantilla.firebaseId,
                    nombre: plantilla.titulo || plantilla.screenTitle || plantilla.nombre || plantilla.id,
                    estado: "asignada",
                    url: "#",
                    preview: null,
                    plantilla,
                  };
                })
                .filter(Boolean);

              setDocs(items);
              setCargando(false);
            }
          } catch (error) {
            console.error("Error procesando documentos:", error);
            if (!cancel) {
              setDocs([]);
              setCargando(false);
            }
          }
        });

        return () => unsubscribFlota();
      } catch (error) {
        console.error("Error al cargar documentos:", error);
        if (!cancel) {
          setDocs([]);
          setCargando(false);
        }
      }
    };

    loadDocs();

    return () => {
      cancel = true;
    };
  }, [userId]);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: 3,
        overflowY: "auto",
      }}
    >
      <Stack spacing={2} sx={{ width: 340 }}>
        {cargando ? (
          <Typography variant="body2" color="text.secondary">
            Cargando…
          </Typography>
        ) : docs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {userId
              ? "No hay documentos para este usuario"
              : "Selecciona un radiotaxi para ver sus documentos"}
          </Typography>
        ) : (
          docs.map((doc) => (
            <Card
              key={doc.id}
              variant="outlined"
              sx={{ width: 340, borderRadius: 2 }}
            >
              <CardHeader
                title={
                  <Typography variant="subtitle2" noWrap>
                    {doc.nombre}
                  </Typography>
                }
                action={
                  <Chip
                    label="sin imagen"
                    size="small"
                    color="warning"
                  />
                }
                sx={{
                  borderBottom: "1px solid #00000033",
                  bgcolor: "#f5f5f5",
                  pb: 0.5,
                  "& .MuiCardHeader-action": { m: 0 },
                }}
              />
              <CardContent
                sx={{
                  height: 100,
                  p: 0,
                  overflow: "hidden",
                  bgcolor: "#fff",
                }}
              >
                <Preview src={doc.preview} alt={doc.nombre} />
              </CardContent>
              <Box sx={{ display: "flex", gap: 1, p: 1, justifyContent: "center" }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => setDocActivo(doc)}
                >
                  Abrir
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled
                >
                  Descargar
                </Button>
              </Box>
            </Card>
          ))
        )}
      </Stack>
    </Box>
  );
}
