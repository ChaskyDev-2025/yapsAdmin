import { Box, Avatar, Typography, Stack, Divider, Chip } from "@mui/material";

export default function ModalIzquierdoPasajero({ rowData }) {
  if (!rowData) return null;

  const nombre = rowData.perfil?.name || rowData.name || "-";
  const email = rowData.perfil?.email || rowData.email || "-";
  const fotoUrl = rowData.perfil?.photoUrl || rowData.photoURL || "";
  const departamento = rowData.departamentoActual || "-";

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
            <b>Departamento:</b> {departamento}
          </Typography>
          <Typography variant="body2">
            <b>Provider:</b> {rowData.perfil?.provider || "N/A"}
          </Typography>
          <Typography variant="body2">
            <b>Carreras:</b> {rowData.carrerasCompletadas || 0}
          </Typography>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Estadísticas */}
        <Typography variant="caption" sx={{ color: "#484848", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem" }}>
          Donaciones
        </Typography>
        <Typography variant="h6" fontWeight={700} mb={1} sx={{ color: "#d7171a" }}>
          ${parseFloat(rowData.donacionesAcumuladas || 0).toFixed(2)}
        </Typography>

        {/* Métodos de Pago */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center", mt: 2 }}>
          <Chip
            label={`Efectivo: ${rowData.metodos_pago?.efectivo ? "✓" : "✗"}`}
            size="small"
            sx={{
              bgcolor: rowData.metodos_pago?.efectivo ? "#000000" : "#e0e0e0",
              color: rowData.metodos_pago?.efectivo ? "#FFFFFF" : "#484848",
              fontWeight: 700
            }}
          />
          <Chip
            label={`QR: ${rowData.metodos_pago?.qr ? "✓" : "✗"}`}
            size="small"
            sx={{
              bgcolor: rowData.metodos_pago?.qr ? "#000000" : "#e0e0e0",
              color: rowData.metodos_pago?.qr ? "#FFFFFF" : "#484848",
              fontWeight: 700
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
