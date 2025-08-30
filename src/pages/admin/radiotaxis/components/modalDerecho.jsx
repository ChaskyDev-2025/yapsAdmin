// modalDerecho.jsx
import { useState, useEffect } from "react";
import {
  Box, Stack, Button, Card, CardHeader, CardContent,
  CardActions, Typography, Chip
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const getEstadoColor = (e = "") =>
  ({
    aprobado: "success",
    pendiente: "warning",
    rechazado: "error",
    "sin imagen": "warning",   // color para el nuevo estado
  }[String(e).toLowerCase()] || "default");

const pickFirstFileUrl = (files = {}) =>
  Object.values(files).find((v) => typeof v === "string" && /^https?:\/\//.test(v)) || null;

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
          // opcional: un borde sutil para diferenciar el placeholder
          // border: "1px dashed #ddd",
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
        objectFit: "cover",       // llena el ancho y recorta arriba/abajo
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
    let unsubTpl = null;
    let unsubUser = null;

    // Escuchar plantillas
    const tplRef = collection(db, "crear-documentos");
    unsubTpl = onSnapshot(tplRef, (tplSnap) => {
      const plantillas = tplSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Escuchar docs del usuario
      const userRef = collection(db, "users", userId, "docs");
      unsubUser = onSnapshot(userRef, (userSnap) => {
        const userDocsMap = userSnap.docs.reduce((acc, d) => {
          acc[d.id] = { id: d.id, ...d.data() };
          return acc;
        }, {});

        // Construir tarjetas
        const items = plantillas.map((tpl) => {
          const u = userDocsMap[tpl.id];
          const files = (u?.files) || (u?.data?.files) || {};
          const firstUrl =
            (typeof files.boton1 === "string" && files.boton1) ||
            pickFirstFileUrl(files) ||
            null;

          const estado = firstUrl
            ? (u?.estado || tpl.estado || "pendiente")
            : "sin imagen";

          return {
            id: tpl.id,
            nombre: tpl.titulo || tpl.nombre || tpl.id,
            estado,
            url: firstUrl || "#",
            preview: firstUrl || null,
            data: u?.data || null,
            files,
            plantilla: tpl,
            userDoc: u || null,
          };
        });

        if (!cancel) {
          setDocs(items);
          setCargando(false);
        }

// 👇 Estado de empresa según los docs del usuario
const estados = items.map((d) => {
  const e = String(d.estado || "").trim().toLowerCase();
  return e === "aprovado" ? "aprobado" : e; // normaliza "aprovado"
});

let nuevoEstadoEmpresa = null;

const haySinImagen = estados.includes("sin imagen");
const todosAprobados = items.length > 0 && estados.every((e) => e === "aprobado");
const hayPendienteORechazado = estados.some((e) => e === "pendiente" || e === "rechazado");

// ⚠️ Prioridad: sin imagen > aprobado (todos) > pendiente
if (haySinImagen) {
  nuevoEstadoEmpresa = "sin imagen";
} else if (todosAprobados) {
  nuevoEstadoEmpresa = "aprobado";
} else if (hayPendienteORechazado) {
  nuevoEstadoEmpresa = "pendiente";
}

// 3) Escribe solo si corresponde
if (nuevoEstadoEmpresa) {
  const userDocRef = doc(db, "users", userId);
  updateDoc(userDocRef, {
    "empresa.estado": nuevoEstadoEmpresa,
    "empresa.updatedAt": serverTimestamp(),
  }).catch((err) => console.error("Error actualizando empresa.estado:", err));
}


      });
    });

    return () => {
      cancel = true;
      if (unsubTpl) unsubTpl();
      if (unsubUser) unsubUser();
    };
  }, [userId]);

  return (
    <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
      <Stack spacing={2} sx={{ width: 340 }}>

        {cargando ? (
          <Typography variant="body2" color="text.secondary">Cargando…</Typography>
        ) : docs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {userId ? "No hay documentos para este usuario" : "Selecciona un radiotaxi para ver sus documentos"}
          </Typography>
        ) : (
          docs.map((doc) => (
            <Card key={doc.id} variant="outlined" sx={{ width: 340, borderRadius: 2, boxShadow: 4 }}>
              <CardHeader
                title={<Typography variant="subtitle2" noWrap>{doc.nombre}</Typography>}
                action={<Chip label={doc.estado} size="small" color={getEstadoColor(doc.estado)} />}
                sx={{
                  borderBottom: "1px solid #00000033",
                  bgcolor: "#f5f5f5",
                  pb: 0.5,
                  "& .MuiCardHeader-action": { m: 0 }
                }}
              />
<CardContent
  sx={{
    height: 100,        // ajusta a tu gusto (140/160/180…)
    p: 0,               // 👈 sin padding, la imagen toca los bordes
    overflow: "hidden", // 👈 recorta la parte que sobresale
    bgcolor: "#fff",
  }}
>
  <Preview src={doc.preview} alt={doc.nombre} />
</CardContent>


              <CardActions sx={{ borderTop: "1px solid #00000033", justifyContent: "center", py: 1 }}>
                <Button size="small" variant="outlined" onClick={() => setDocActivo(doc)}>
                  Abrir
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  sx={{ ml: 1 }}
                  href={doc.url}
                  disabled={!doc.url || doc.url === "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar
                </Button>
              </CardActions>
            </Card>
          ))
        )}
      </Stack>
    </Box>
  );
}
