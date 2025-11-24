// src/auth/RoleProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Box, CircularProgress } from "@mui/material";

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
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
