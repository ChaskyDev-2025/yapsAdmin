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
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import ArticleIcon from "@mui/icons-material/Article";
import DescriptionIcon from "@mui/icons-material/Description";
import MailIcon from "@mui/icons-material/Mail";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Navbar          from "../components/Navbar";
import Footer          from "../components/Footer";
import Sidebar         from "../components/Sidebar";
import LogoImg         from "../assets/YAAPS_LOGO.png";
import { useAuth } from "../auth/AuthContext";
import { isSuperAdmin } from "../services/userService";

const AdminLayout = () => {
  const { userRole } = useAuth();

  // Menú dinámico según el rol
  const menuItems = useMemo(() => {
    if (isSuperAdmin(userRole)) {
      // Menú específico para SuperAdmin
      return [
        { path: "/admin/dashboard", label: "Inicio", icon: <DashboardIcon /> },
        { path: "/admin/gestion-usuarios", label: "Gestión Usuarios", icon: <SupervisorAccountIcon /> },
        { path: "/admin/solicitudes", label: "Solicitudes", icon: <MailIcon /> },
        { path: "/admin/flotas", label: "Flotas", icon: <DirectionsCarIcon /> },
        { path: "/admin/servicios", label: "Servicios", icon: <RoomServiceIcon /> },
        { path: "/admin/documentos", label: "Documentos", icon: <ArticleIcon /> },
        { path: "/admin/banners", label: "Banners", icon: <PhotoLibraryIcon /> },
        { path: "/admin/referidos", label: "Referidos", icon: <CardGiftcardIcon /> },
        { path: "/admin/perfil", label: "Perfil", icon: <AccountCircleIcon /> },
      ];
    }

    // Menú para Admin regular
    return [
      { path: "/admin/dashboard", label: "Inicio", icon: <DashboardIcon /> },
      { path: "/admin/radiotaxis", label: "Radiotaxis", icon: <LocalTaxiIcon /> },
      { path: "/admin/solicitudes-asignadas", label: "Solicitudes", icon: <AssignmentIcon /> },
      { path: "/admin/documentos-pendientes", label: "Docs Pendientes", icon: <DescriptionIcon /> },
      { path: "/admin/ajustes", label: "Ajustes", icon: <SettingsIcon /> },
      { path: "/admin/personalizar", label: "Personalizar", icon: <BuildIcon /> },
      { path: "/admin/perfil", label: "Perfil", icon: <AccountCircleIcon /> },
    ];
  }, [userRole]);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <CssBaseline />

      {/* Sidebar desde arriba */}
      <Sidebar
        logo={
          <Link to="/admin">
            <img src={LogoImg} alt="Logo" />
          </Link>
        }
        menuItems={menuItems}
      />

      {/* Contenedor derecho: navbar + contenido */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Navbar */}
        <Navbar />

        {/* Main con scroll propio */}
        <Box
          component="main"
          sx={{
            flex: 1,
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
              flex: 1,
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
