import React, { useState } from "react";
import { Box, Toolbar, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

const drawerWidthExpanded = 220;
const drawerWidthCollapsed = 60;

const Sidebar = ({ logo, menuItems }) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      component="nav"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      sx={{
        width: expanded ? drawerWidthExpanded : drawerWidthCollapsed,
        height: "100vh",
        background: "linear-gradient(180deg, #000000 0%, #484848 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        boxShadow: 3,
        overflowY: "auto",
        overscrollBehavior: "contain",
        transition: "width 0.3s ease-in-out",
      }}
    >
      {/* Header sticky: Toolbar + logo */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: expanded ? 2 : 1,
          transition: "padding 0.3s",
        }}
      >
        <Toolbar />
        {logo && (
          <Box
            sx={{
              width: expanded ? "120px" : "35px",
              transition: "width 0.3s ease-in-out",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              "& img": {
                width: "100%",
                cursor: "pointer",
                transition: "width 0.3s ease-in-out",
              },
            }}
          >
            {logo}
          </Box>
        )}
      </Box>

      {/* Lista del menú */}
      <List sx={{ p: 0 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              button
              key={item.path}
              component={Link}
              to={item.path}
              selected={isActive}
              sx={{
                mb: 1,
                borderRadius: 2,
                color: "#fff",
                backgroundColor: isActive ? "rgba(215, 23, 26, 0.2)" : "transparent",
                "&:hover": {
                  backgroundColor: "rgba(215, 23, 26, 0.15)",
                },
                transition: "background 0.3s",
                justifyContent: expanded ? "flex-start" : "center",
                boxShadow: isActive ? 2 : undefined,
                fontWeight: isActive ? "bold" : undefined,
              }}
            >
              <ListItemIcon
                sx={{
                  justifyContent: "center",
                  color: isActive ? "#d7171a" : "#fff", // <-- color rojo cuando está activo
                  transition: "color 0.3s",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {expanded && <ListItemText primary={item.label} />}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;

/*Ejemplo de uso:
const menuItems = [
  { path: "/admin",          label: "Inicio",     icon: <DashboardIcon /> },
  { path: "/admin/usuarios", label: "Usuarios",   icon: <PeopleIcon /> },
  { path: "/admin/radiotaxis", label: "Radiotaxis", icon: <LocalTaxiIcon /> },
  { path: "/admin/ajustes", label: "Ajustes", icon: <LocalTaxiIcon /> },
];

<Sidebar
  logo={
    <Link to="/admin">
      <img src={LogoImg} alt="Logo" style={{ width: 120, cursor: "pointer" }} />
    </Link>
  }
  menuItems={menuItems}
/>
*/