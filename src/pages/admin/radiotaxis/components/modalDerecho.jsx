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

    const loadDocs = async () => {
      try {
        // Obtener el trabajador para obtener sus documentos
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
        
        // Obtener los documentos del trabajador (array de strings con IDs o nombres)
        const documentosDelTrabajador = trabajador.documentos || [];

        if (!documentosDelTrabajador || documentosDelTrabajador.length === 0) {
          if (!cancel) {
            setDocs([]);
            setCargando(false);
          }
          return;
        }

        try {
          if (!cancel) {
            // Convertir los documentos a items para mostrar
            // Los documentos pueden ser strings o objetos (después de ser procesados)
            const items = documentosDelTrabajador.map((docName, index) => {
              const nombreDoc = typeof docName === 'string' ? docName : (docName?.nombre || 'Documento');
              const estadoDoc = typeof docName === 'string' ? "asignada" : (docName?.estado || "asignada");
              
              return {
                id: index,
                nombre: nombreDoc,
                estado: estadoDoc,
                url: "#",
                preview: null,
              };
            });

            setDocs(items);
            setCargando(false);
          }
        } catch (error) {
          if (!cancel) {
            setDocs([]);
            setCargando(false);
          }
        }
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
