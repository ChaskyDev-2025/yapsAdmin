// src/auth/RoleProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Box, CircularProgress, Container, Paper, Typography, Button } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

/**
 * Componente para proteger rutas según el rol del usuario
 * @param {string[]} allowedRoles - Array de roles permitidos (ej: ['superadmin', 'admin'])
 * @param {JSX.Element} children - Componente hijo a renderizar si tiene permisos
 */
const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            gap: 2,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              backgroundColor: "#fafafa",
            }}
          >
            <LockIcon
              sx={{
                fontSize: 80,
                color: "#d7171a",
                mb: 2,
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#000",
                mb: 1,
                fontFamily: "Mulish, sans-serif",
              }}
            >
              Acceso Denegado
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#666",
                mb: 3,
                fontFamily: "Mulish, sans-serif",
              }}
            >
              No tienes los permisos necesarios para acceder a esta sección.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#999",
                mb: 3,
                fontFamily: "Mulish, sans-serif",
              }}
            >
              Solo los administradores SuperAdmin pueden acceder a esta área.
            </Typography>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#d7171a",
                color: "white",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                padding: "10px 30px",
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "#b81315",
                },
              }}
              onClick={() => (window.location.href = "/admin/dashboard")}
            >
              Volver al Dashboard
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return children;
};

export default RoleProtectedRoute;
