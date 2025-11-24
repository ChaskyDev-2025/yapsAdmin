// src/pages/admin/ajustes/components/ModalEmpresaInfo.jsx
import { Box, Typography, Avatar } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export default function ModalEmpresaInfo({ rowData }) {
  if (!rowData) return null;

  const InfoRow = ({ icon, label, value }) => (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <Box sx={{ mr: 2, color: "primary.main" }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {value || "Sin información"}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ flex: 1, p: 3 }}>
      {/* Avatar del usuario */}
      <Box sx={{ display:"flex", justifyContent: "center", mb: 3 }}>
        {rowData.avatar ? (
          <Avatar
            src={rowData.avatar}
            alt={rowData.nombreUsuario}
            sx={{ width: 120, height: 120 }}
          />
        ) : (
          <Avatar sx={{ width: 120, height: 120, bgcolor: "primary.main" }}>
            <PersonIcon sx={{ fontSize: 60 }} />
          </Avatar>
        )}
      </Box>

      {/* Nombre del usuario */}
      <Typography variant="h5" fontWeight="bold" align="center" gutterBottom>
        {rowData.nombreUsuario || "Usuario"}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ mb: 3 }}
      >
        Información del Usuario
      </Typography>

      {/* Información detallada */}
      <InfoRow
        icon={<EmailIcon />}
        label="Email"
        value={rowData.email}
      />

      <InfoRow
        icon={<PhoneIcon />}
        label="Teléfono"
        value={rowData.telefono}
      />

      <InfoRow
        icon={<BadgeIcon />}
        label="Rol"
        value={rowData.rol}
      />

      <InfoRow
        icon={<BadgeIcon />}
        label="Cargo"
        value={rowData.cargo || "Sin cargo asignado"}
      />

      <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary">
            Fecha de Registro
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight="medium">
          {rowData.fechaRegistro}
        </Typography>
      </Box>
    </Box>
  );
}
