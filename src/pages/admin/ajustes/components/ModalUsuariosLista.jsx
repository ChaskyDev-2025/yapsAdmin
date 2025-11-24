// src/pages/admin/ajustes/components/ModalUsuariosLista.jsx
import { Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, IconButton, Divider } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export default function ModalUsuariosLista({ userId }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setCargando(true);
        
        // Obtener la subcolección de usuarios de esta empresa
        const usuariosRef = collection(db, "users", userId, "usuarios");
        const snapshot = await getDocs(usuariosRef);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsuarios(data);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setUsuarios([]);
      } finally {
        setCargando(false);
      }
    };

    if (userId) {
      fetchUsuarios();
    }
  }, [userId]);

  const handleEditar = (usuario) => {
    console.log("Editar usuario:", usuario);
    // Aquí puedes agregar la lógica para editar
  };

  const handleEliminar = (usuario) => {
    console.log("Eliminar usuario:", usuario);
    // Aquí puedes agregar la lógica para eliminar
  };

  return (
    <Box sx={{ flex: 1, p: 3, maxHeight: "70vh", overflowY: "auto" }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Usuarios de la Empresa
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Lista de usuarios asociados a esta empresa
      </Typography>

      {cargando ? (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
          Cargando usuarios...
        </Typography>
      ) : usuarios.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <PersonIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            No hay usuarios en esta empresa
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: "100%" }}>
          {usuarios.map((usuario, index) => (
            <Box key={usuario.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  bgcolor: "#f9f9f9",
                  borderRadius: 2,
                  mb: 1,
                  "&:hover": {
                    bgcolor: "#f0f0f0",
                  },
                }}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditar(usuario)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleEliminar(usuario)}
                    >
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {usuario.nombre || "Sin nombre"}
                      </Typography>
                      <Chip
                        label={usuario.rol || "Usuario"}
                        size="small"
                        color={usuario.rol === "Admin" ? "primary" : "default"}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          {usuario.email || "Sin email"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          {usuario.telefono || "Sin teléfono"}
                        </Typography>
                      </Box>
                      {usuario.cargo && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Cargo: {usuario.cargo}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < usuarios.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}
