import { Box, Avatar, Typography, Stack, Divider, Chip } from "@mui/material";

export default function ModalIzquierdoConductor({ rowData }) {
  if (!rowData) return null;

  const capitalizarNombre = (texto) => {
    if (!texto) return "";
    return texto
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const nombre = capitalizarNombre(rowData.nombre || rowData.perfil?.nombre || rowData.perfil?.name || rowData.name || rowData.email || "-");
  const email = rowData.email || rowData.perfil?.email || "-";
  const telefono = rowData.telefono || rowData.phoneNumber || "Sin teléfono";
  const fotoUrl = rowData.perfil?.foto || rowData.perfil?.fotoUrl || rowData.perfil?.photoUrl || rowData.perfil?.photoURL || rowData.fotoUrl || rowData.photoURL || rowData.fotoUrl || "";
  const estado = rowData.activo !== false ? "Activo" : "Inactivo";
  const departamento = rowData.departamento || "-";
  const categorias = Array.isArray(rowData.categorias) ? rowData.categorias : [];
  const servicios = rowData.servicios || {};
  const flotaNombre = rowData.flotaNombre || "-";

  return (
    <Box sx={{ width: 350, display: "flex", justifyContent: "flex-start", alignItems: "flex-start", pt: 3, overflow: "auto", pl: 2, pb: 3, height: "100%", maxHeight: "600px" }}>
      <Box
        sx={{
          width: 280,
          p: 3,
          borderRadius: 3,
          bgcolor: "#fff",
          border: "1px solid #00000033",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.33)",
          textAlign: "left",
          flexShrink: 0,
          wordBreak: "break-word",
        }}
      >
        {/* Avatar */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
          <Avatar
            src={fotoUrl}
            alt={nombre}
            sx={{
              width: 110,
              height: 110,
              mb: 2,
              border: "3px solid",
              borderColor: "primary.main",
              boxShadow: 2,
            }}
          >
            {nombre?.[0] || "?"}
          </Avatar>
        </Box>

        {/* Nombre */}
        <Typography variant="h6" fontWeight={600} mb={1}>
          {nombre}
        </Typography>

        {/* Información Personal */}
        <Stack spacing={0.5} sx={{ mb: 2, "& b": { color: "text.secondary" }, "& p": { wordBreak: "break-word", overflowWrap: "break-word" } }}>
          <Typography sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
            <b>Email:</b> {email}
          </Typography>
          <Typography sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
            <b>Teléfono:</b> {telefono}
          </Typography>
          <Typography sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
            <b>Departamento:</b> {departamento}
          </Typography>
          <Typography sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
            <b>Flota:</b> {flotaNombre}
          </Typography>
          {categorias.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography component="b" sx={{ color: "text.secondary" }}>
                Categorías y Servicios:
              </Typography>
              <Box sx={{ mt: 0.5, pl: 1 }}>
                {categorias.map((cat) => {
                  // Normalizar la categoría: quitar tilde, pasar a minúscula
                  const catNormalizada = cat
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
                  const servicioRaw = servicios[catNormalizada] || servicios[cat.toLowerCase()] || null;
                  
                  // Extraer los valores del servicio si es un objeto o array
                  let serviciosArray = [];
                  if (Array.isArray(servicioRaw)) {
                    serviciosArray = servicioRaw.map(s => {
                      if (typeof s === 'object' && s?.valor) {
                        return s.valor;
                      }
                      return s;
                    });
                  } else if (typeof servicioRaw === 'object' && servicioRaw?.valor) {
                    serviciosArray = [servicioRaw.valor];
                  } else if (servicioRaw && typeof servicioRaw === 'string') {
                    serviciosArray = [servicioRaw];
                  }
                  
                  return serviciosArray.length > 0 ? (
                    <Box key={cat}>
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, mb: 0.5 }}>
                        {cat}:
                      </Typography>
                      {serviciosArray.map((s, idx) => {
                        // Quitar el prefijo de la categoría del servicio
                        let servicioLimpio = s;
                        
                        // Crear variantes del prefijo para comparación
                        const prefijoGuion = cat.toLowerCase().replace(/\s+/g, '_') + '_';
                        const prefijoEspacio = cat.toLowerCase() + ' ';
                        
                        // Quitar el prefijo si existe (con guion bajo o espacio)
                        const servicioMinuscula = servicioLimpio.toLowerCase();
                        if (servicioMinuscula.startsWith(prefijoGuion)) {
                          servicioLimpio = servicioLimpio.substring(prefijoGuion.length);
                        } else if (servicioMinuscula.startsWith(prefijoEspacio)) {
                          servicioLimpio = servicioLimpio.substring(prefijoEspacio.length);
                        }
                        
                        // Reemplazar guiones bajos con espacios
                        servicioLimpio = servicioLimpio.replace(/_/g, ' ');
                        
                        return (
                          <Typography key={idx} sx={{ fontSize: "0.85rem", ml: 1, wordBreak: "break-word", overflowWrap: "break-word" }}>
                            • {servicioLimpio}
                          </Typography>
                        );
                      })}
                    </Box>
                  ) : null;
                })}
              </Box>
            </Box>
          )}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Estado */}
        <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>
          Estado
        </Typography>
        <Typography variant="h6" fontWeight={700} mb={1} sx={{ color: estado === "Activo" ? "#000000" : "#d7171a" }}>
          {estado}
        </Typography>
        <Chip
          label={rowData.documentos_aprobados ? "✓ Documentos Aprobados" : "✗ Documentos Pendientes"}
          size="small"
          sx={{
            bgcolor: rowData.documentos_aprobados ? "#000000" : "#d7171a",
            color: "#FFFFFF",
            fontWeight: 700
          }}
        />
      </Box>
    </Box>
  );
}
