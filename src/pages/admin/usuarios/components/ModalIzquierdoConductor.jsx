import { Box, Avatar, Typography, Stack, Divider, Chip } from "@mui/material";

export default function ModalIzquierdoConductor({ rowData }) {
  if (!rowData) return null;

  const nombre = rowData.nombre || rowData.perfil?.name || rowData.name || "-";
  const email = rowData.email || rowData.perfil?.email || "-";
  const telefono = rowData.telefono || rowData.phoneNumber || "Sin teléfono";
  const fotoUrl = rowData.perfil?.fotoUrl || rowData.perfil?.foto || rowData.perfil?.photoURL || rowData.fotoUrl || rowData.photoURL || rowData.perfil?.photoUrl || "";
  const estado = rowData.activo !== false ? "Activo" : "Inactivo";
  const departamento = rowData.departamento || "-";
  const categorias = Array.isArray(rowData.categorias) ? rowData.categorias : [];
  const servicios = rowData.servicios || {};
  const flotaNombre = rowData.flotaNombre || "-";

  return (
    <Box sx={{ width: 350, display: "flex", justifyContent: "center", alignItems: "flex-start", pt: 3, overflow: "auto", flexShrink: 0 }}>
      <Box
        sx={{
          width: 280,
          p: 3,
          borderRadius: 3,
          bgcolor: "#fff",
          border: "1px solid #00000033",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.33)",
          textAlign: "center",
        }}
      >
        {/* Avatar */}
        <Avatar
          src={fotoUrl}
          alt={nombre}
          sx={{
            width: 110,
            height: 110,
            mx: "auto",
            mb: 2,
            border: "3px solid #d7171a",
            boxShadow: 2,
            bgcolor: "#d7171a"
          }}
        >
          {nombre?.[0] || "?"}
        </Avatar>

        {/* Nombre */}
        <Typography variant="h6" fontWeight={700} mb={0.5} sx={{ color: "#000000" }}>
          {nombre}
        </Typography>

        {/* Email */}
        <Typography variant="body2" sx={{ color: "#d7171a", mb: 2, wordBreak: "break-all", fontWeight: 600 }}>
          {email}
        </Typography>

        {/* Información Personal */}
        <Stack spacing={0.8} sx={{ mb: 2, "& b": { color: "#484848" } }}>
          <Typography variant="body2">
            <b>Teléfono:</b> {telefono}
          </Typography>
          <Typography variant="body2">
            <b>Departamento:</b> {departamento}
          </Typography>
          <Typography variant="body2">
            <b>Flota:</b> {flotaNombre}
          </Typography>
          {categorias.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography component="b" sx={{ color: "#484848", display: "block", mb: 0.5 }}>
                Categorías y Servicios:
              </Typography>
              <Box sx={{ pl: 1 }}>
                {categorias.map((cat) => {
                  // Normalizar la categoría: quitar tilde, pasar a minúscula para lookup en servicios
                  const catNormalizada = cat
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
                  const servicio = servicios[catNormalizada] || servicios[cat.toLowerCase()] || "Sin servicio";
                  
                  return (
                    <Typography key={cat} sx={{ fontSize: "0.9rem" }}>
                      • {cat}: <strong>{servicio}</strong>
                    </Typography>
                  );
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
