// src/pages/admin/perfil/VerificarRol.jsx
import { Box, Typography, Paper, Chip, Alert } from "@mui/material";
import { useAuth } from "../../../auth/AuthContext";

const VerificarRol = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Verificación de Rol
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Información del Usuario Actual
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Email:
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            {user?.email || "No disponible"}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            UID:
          </Typography>
          <Typography variant="body2" sx={{ ml: 2, fontFamily: "monospace", fontSize: "0.85rem" }}>
            {user?.uid || "No disponible"}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Rol Actual:
          </Typography>
          <Box sx={{ ml: 2, mt: 1 }}>
            {userRole ? (
              <Chip
                label={userRole === "superadmin" ? "SuperAdmin" : "Admin"}
                color={userRole === "superadmin" ? "error" : "primary"}
                sx={{
                  bgcolor: userRole === "superadmin" ? "#d7171a" : "#484848",
                  fontWeight: 600,
                }}
              />
            ) : (
              <Chip label="Sin Rol Asignado" color="warning" />
            )}
          </Box>
        </Box>
      </Paper>

      {userRole !== "superadmin" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            No tienes rol de SuperAdmin
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Para ver la opción "Gestión de Usuarios", necesitas tener el rol <strong>superadmin</strong> asignado.
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Pasos para asignar el rol:
          </Typography>
          <ol style={{ marginLeft: 20 }}>
            <li>
              Ve a Firebase Console → Firestore Database
            </li>
            <li>
              Busca la colección <code>users</code>
            </li>
            <li>
              Encuentra el documento con ID: <code>{user?.uid}</code>
            </li>
            <li>
              Si no existe, créalo con los siguientes campos:
              <ul style={{ marginTop: 8 }}>
                <li><code>email</code>: {user?.email}</li>
                <li><code>role</code>: <strong>superadmin</strong></li>
                <li><code>active</code>: true</li>
                <li><code>nombre</code>: Tu Nombre</li>
                <li><code>createdAt</code>: {new Date().toISOString()}</li>
              </ul>
            </li>
            <li>
              Si existe, edita el campo <code>role</code> y cámbialo a <strong>superadmin</strong>
            </li>
            <li>
              Recarga la aplicación (F5)
            </li>
          </ol>
        </Alert>
      )}

      {userRole === "superadmin" && (
        <Alert severity="success">
          <Typography variant="h6" sx={{ mb: 1 }}>
            ✅ Tienes acceso de SuperAdmin
          </Typography>
          <Typography variant="body2">
            Deberías ver la opción "Gestión Usuarios" en el menú lateral.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default VerificarRol;
