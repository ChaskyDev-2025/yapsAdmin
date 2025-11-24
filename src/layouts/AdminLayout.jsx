// AdminLayout.jsx
import React, { useMemo } from "react";
import { Outlet, Link } from "react-router-dom";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import DashboardIcon   from "@mui/icons-material/Dashboard";
import PeopleIcon      from "@mui/icons-material/People";
import LocalTaxiIcon   from "@mui/icons-material/LocalTaxi";
import SettingsIcon from "@mui/icons-material/Settings";
import WebIcon from "@mui/icons-material/Web";
import SchoolIcon from "@mui/icons-material/School";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import BuildIcon from "@mui/icons-material/Build";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import Navbar          from "../components/Navbar";
import Footer          from "../components/Footer";
import Sidebar         from "../components/Sidebar";
import LogoImg         from "../assets/logo.png";
import ArticleIcon from "@mui/icons-material/Article";
import { useAuth } from "../auth/AuthContext";
import { isSuperAdmin } from "../services/userService";

const AdminLayout = () => {
  const { userRole } = useAuth();

  // Menú dinámico según el rol
  const menuItems = useMemo(() => {
    const baseMenu = [
      { path: "/admin/dashboard", label: "Inicio", icon: <DashboardIcon /> },
      { path: "/admin/usuarios", label: "Usuarios", icon: <PeopleIcon /> },
      { path: "/admin/radiotaxis", label: "Radiotaxis", icon: <LocalTaxiIcon /> },
      { path: "/admin/ajustes", label: "Ajustes", icon: <SettingsIcon /> },
      { path: "/admin/landing", label: "Landing", icon: <WebIcon /> },
      { path: "/admin/onboarding", label: "Onboarding", icon: <SchoolIcon /> },
      { path: "/admin/banners", label: "Banners", icon: <PhotoLibraryIcon /> },
      { path: "/admin/personalizar", label: "Personalizar", icon: <BuildIcon /> },
      { path: "/admin/perfil", label: "Perfil", icon: <AccountCircleIcon /> },
      { path: "/admin/documentos", label: "Documentos", icon: <ArticleIcon /> },
    ];

    // Solo SuperAdmin ve "Gestión de Usuarios"
    if (isSuperAdmin(userRole)) {
      baseMenu.splice(2, 0, { 
        path: "/admin/gestion-usuarios", 
        label: "Gestión Usuarios", 
        icon: <SupervisorAccountIcon /> 
      });
    }

    return baseMenu;
  }, [userRole]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",      // altura total de la ventana
        overflow: "hidden",    // no permitimos scroll aquí
      }}
    >
      <CssBaseline />

      {/* Navbar fijo arriba */}
      <Box sx={{ flexShrink: 0 }}>
        <Navbar />
      </Box>

      {/* Contenedor central: sidebar + contenido */}
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          overflow: "hidden",    // controlamos scroll en hijos
        }}
      >
        {/* Sidebar con scroll propio */}
        <Sidebar
        logo={
          <Link to="/admin">
            <img src={LogoImg} alt="Logo" />
          </Link>
        }
          menuItems={menuItems}
        />

        {/* Main con scroll propio */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Offset para que no quede debajo de la Navbar */}
          <Toolbar />

          {/* Aquí va el scroll de tu página */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              p: 3,
            }}
          >
            <Outlet />
          </Box>

          {/* Footer fijo abajo */}
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
