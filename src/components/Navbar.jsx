import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Avatar, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const Navbar = ({ onMenuClick }) => (
  <AppBar position="fixed" sx={{ background: "linear-gradient(90deg, #d7171a 0%, #000000 100%)", boxShadow: 3 }}>
    <Toolbar>
      {/* Botón de menú para sidebar desplegable */}
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={onMenuClick}
        sx={{ mr: 2, display: { sm: "none" } }}
      >
        <MenuIcon />
      </IconButton>
      {/* Logo de marca */}
      <Avatar src="/imagen1.jpg" alt="Logo" sx={{ mr: 2 }} />
      {/* Nombre de la marca */}
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 900, letterSpacing: 2, fontFamily: "'Mulish', sans-serif" }}>
        YAAPS
      </Typography>
      {/* Usuario o acciones (ejemplo) */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Avatar src="/usuario.jpg" alt="Usuario" sx={{ width: 32, height: 32 }} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          Admin
        </Typography>
      </Box>
    </Toolbar>
  </AppBar>
);

export default Navbar;

/* Ejemplo de uso:
<Box sx={{ flexShrink: 0 }}>
  <Navbar />
</Box>
*/