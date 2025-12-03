import React, { useState } from "react";
import { Box, Toolbar, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { CardGiftcard } from "@mui/icons-material/CardGiftcard";

const drawerWidthExpanded = 280;
const drawerWidthCollapsed = 70;

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
          p: expanded ? 1 : 0.8,
          transition: "padding 0.3s",
          minHeight: "60px",
        }}
      >
        {logo && (
          <Box
            sx={{
              width: expanded ? "140px" : "35px",
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
      <List sx={{ p: 0, flex: 1, bgcolor: "#000000", overflow: "hidden", px: 1 }}>
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
                mb: 0.8,
                mx: 0,
                px: 1,
                borderRadius: 1,
                color: "#fff",
                backgroundColor: "transparent",
                "&:hover": {
                  background: "linear-gradient(90deg, #D61319 0%, #A30E13 50%, #700A09 100%)",
                  mx: 0.1,
                  px: 0.1,
                },
                transition: "background 0.3s, margin 0.3s, padding 0.3s",
                justifyContent: expanded ? "flex-start" : "center",
                fontWeight: isActive ? "600" : "400",
                py: 1.2,
                "&.Mui-selected": {
                  backgroundColor: "transparent",
                  mx: 0.5,
                  px: 0.5,
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