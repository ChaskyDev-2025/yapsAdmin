// src/auth/FlotaProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Box, CircularProgress, Alert } from "@mui/material";

/**
 * Componente para proteger rutas que requieren que el usuario tenga una flota asignada
 * @param {JSX.Element} children - Componente hijo a renderizar si tiene flota
 */
const FlotaProtectedRoute = ({ children }) => {
  const { user, userFlotaId, loading } = useAuth();

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

  if (!userFlotaId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes asociada una flota. Solo los administradores de flota pueden acceder a esta sección.
          Contacta al administrador general.
        </Alert>
      </Box>
    );
  }

  return children;
};

export default FlotaProtectedRoute;
