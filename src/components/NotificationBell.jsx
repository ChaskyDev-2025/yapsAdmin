// src/components/NotificationBell.jsx
import React, { useState, useContext } from "react";
import {
  IconButton,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ClearIcon from "@mui/icons-material/Clear";
import { NotificationContext } from "../context/NotificationContext";
import { useAuth } from "../auth/AuthContext";

const NotificationBell = () => {
  const { userRole } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    clearNotifications,
  } = useContext(NotificationContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  if (userRole !== "superadmin") {
    return null;
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "solicitud_recarga":
        return "warning";
      case "solicitud_servicio":
        return "info";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "solicitud_recarga":
        return "Recarga";
      case "solicitud_servicio":
        return "Servicio";
      default:
        return "Notificación";
    }
  };

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ mr: 2 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 400,
              maxHeight: 500,
              boxShadow: 3,
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">
            Notificaciones ({notifications.length})
          </Typography>
          {notifications.length > 0 && (
            <Button
              size="small"
              onClick={clearNotifications}
              startIcon={<ClearIcon />}
            >
              Limpiar
            </Button>
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography color="textSecondary" sx={{ py: 2 }}>
              No hay notificaciones
            </Typography>
          </MenuItem>
        ) : (
          <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
            {notifications.map((notification) => (
              <Box key={notification.id} sx={{ p: 1 }}>
                <Card
                  sx={{
                    backgroundColor: notification.read ? "#f5f5f5" : "#fff3e0",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: notification.read ? "#eeeeee" : "#ffe0b2",
                    },
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Box>
                        <Chip
                          label={getTypeLabel(notification.type)}
                          size="small"
                          color={getTypeColor(notification.type)}
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        {!notification.read && (
                          <Chip
                            label="Nuevo"
                            size="small"
                            color="error"
                            sx={{ mr: 1 }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {notification.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}

        {notifications.length > 0 && (
          <>
            <Divider />
            <MenuItem onClick={markAllAsRead} sx={{ justifyContent: "center" }}>
              <Typography variant="body2">Marcar todas como leídas</Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
