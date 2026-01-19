import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, IconButton, Avatar, Box, Chip, Menu, MenuItem, Divider, ListItemIcon } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAuth } from "../auth/AuthContext";
import { logout } from "../services/authService";
import { isSuperAdmin } from "../services/userService";
import NotificationBell from "./NotificationBell";

const Navbar = ({ onMenuClick }) => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleProfile = () => {
    handleClose();
    navigate("/admin/perfil");
  };

  const handleSettings = () => {
    handleClose();
    navigate("/admin/ajustes");
  };

  return (
    <AppBar position="relative" sx={{ background: "linear-gradient(90deg, #D7171A 0%, #D7171A 40%, #000000 100%)", boxShadow: 3, borderRadius: 0 }}>
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
      
      {/* Nombre de la marca */}
      
      {/* Spacer para empujar el contenido a la derecha */}
      <Box sx={{ flex: 1 }} />
      
      {/* Usuario o acciones */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <NotificationBell />
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 1,
            transition: 'background-color 0.3s',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
          onClick={handleClick}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar 
            src={user?.fotoUrl || ""} 
            alt="Usuario" 
            sx={{ width: 32, height: 32 }}
          >
            {!user?.fotoUrl && <PersonIcon sx={{ fontSize: 20 }} />}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {user?.email?.split('@')[0] || "Admin"}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1 }}>
              {userRole === "superadmin" ? "SuperAdmin" : userRole === "admin" ? "Administrador" : "Usuario"}
            </Typography>
          </Box>
          <ExpandMoreIcon 
            sx={{ 
              fontSize: 20, 
              transition: 'transform 0.3s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
            }} 
          />
        </Box>

        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 4,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 200,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Mi Perfil
          </MenuItem>
          {!isSuperAdmin(userRole) && (
            <MenuItem onClick={handleSettings}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Ajustes
            </MenuItem>
          )}
          <Divider />
          <MenuItem 
            onClick={handleLogout}
            sx={{
              color: '#d7171a',
              '&:hover': {
                backgroundColor: 'rgba(215, 23, 26, 0.08)',
              }
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: '#d7171a' }} />
            </ListItemIcon>
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>
    </Toolbar>
  </AppBar>
  );
};

export default Navbar;