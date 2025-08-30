// src/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Box, CircularProgress } from "@mui/material";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
