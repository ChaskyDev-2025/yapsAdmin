import { Box, Avatar, Typography, Stack, Divider, Chip } from "@mui/material";

export default function ModalIzquierdoConductor({ rowData }) {
  if (!rowData) return null;

  const nombre = rowData.perfil?.name || rowData.name || "-";
  const email = rowData.perfil?.email || rowData.email || "-";
  const telefono = rowData.telefono || "Sin teléfono";
  const fotoUrl = rowData.perfil?.photoUrl || rowData.photoURL || "";
  const estado = rowData.activo !== false ? "Activo" : "Inactivo";
  const departamento = rowData.departamento || "-";
  const ciudad = rowData.ciudad || "-";
  const servicio = rowData.servicio || "-";

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
            <b>Ciudad:</b> {ciudad}
          </Typography>
          <Typography variant="body2">
            <b>Servicio:</b> {servicio}
          </Typography>
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
