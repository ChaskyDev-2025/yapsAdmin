import React, { useContext, useState, useEffect } from "react";
import { Snackbar, Alert, Box } from "@mui/material";
import { NotificationContext } from "../context/NotificationContext";

const NotificationToaster = () => {
  const { notifications } = useContext(NotificationContext);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);

  useEffect(() => {
    // Mostrar la notificación más reciente que no sea leída
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length > 0) {
      const latestNotification = unreadNotifications[0];
      
      // Verificar si ya la mostramos
      if (
        !displayedNotifications.some((n) => n.id === latestNotification.id)
      ) {
        setDisplayedNotifications((prev) => [latestNotification, ...prev]);

        // Auto-cerrar después de 5 segundos
        const timer = setTimeout(() => {
          setDisplayedNotifications((prev) =>
            prev.filter((n) => n.id !== latestNotification.id)
          );
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications, displayedNotifications]);

  const handleClose = (id) => {
    setDisplayedNotifications((prev) =>
      prev.filter((n) => n.id !== id)
    );
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      {displayedNotifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={5000}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={
              notification.type === "warning" ? "warning" :
              notification.type === "error" ? "error" :
              notification.type === "success" ? "success" :
              "info"
            }
            sx={{
              width: "100%",
              minWidth: 300,
              fontFamily: "Mulish, sans-serif",
              fontWeight: 500,
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

export default NotificationToaster;
