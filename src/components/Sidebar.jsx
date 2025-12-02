import React, { useState } from "react";
import { Box, Toolbar, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { CardGiftcard } from "@mui/icons-material/CardGiftcard";

const drawerWidthExpanded = 280;
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
        background: "#1a1a1a",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        boxShadow: 3,
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehavior: "contain",
        transition: "width 0.3s ease-in-out",
        position: "relative",
        zIndex: 1300,
      }}
    >
      {/* Header sticky: Logo con fondo negro */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: expanded ? 1.5 : 1,
          transition: "padding 0.3s",
          minHeight: "80px",
        }}
      >
        {logo && (
          <Box
            sx={{
              width: expanded ? "140px" : "40px",
              height: "auto",
              transition: "width 0.3s ease-in-out",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              "& img": {
                width: "100%",
                height: "auto",
                cursor: "pointer",
                transition: "width 0.3s ease-in-out",
              },
            }}
          >
            {logo}
          </Box>
        )}
      </Box>

      {/* Sección de opciones activas */}

      {/* Lista del menú */}
      <List sx={{ p: 0, flex: 1, bgcolor: "#000000" }}>
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
                mx: 1.2,
                px: 0.5,
                borderRadius: 1.5,
                color: "#fff",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "#d7171a",
                  mx: 0.5,
                  px: 0.8,
                },
                transition: "background 0.3s, margin 0.3s, padding 0.3s",
                justifyContent: expanded ? "flex-start" : "center",
                fontWeight: isActive ? "600" : "400",
                py: 1.5,
                "&.Mui-selected": {
                  backgroundColor: "transparent",
                  mx: 0.5,
                  px: 0.8,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  justifyContent: "center",
                  minWidth: expanded ? 40 : "auto",
                  color: isActive ? "#d7171a" : "#bbb",
                  transition: "color 0.3s",
                  fontSize: "1.3rem",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {expanded && (
                <ListItemText 
                  primary={item.label}
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: "0.95rem",
                      fontWeight: isActive ? "600" : "400",
                    }
                  }}
                />
              )}
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