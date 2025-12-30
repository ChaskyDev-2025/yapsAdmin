// src/pages/admin/ajustes/components/ModalUsuariosLista.jsx
import { Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

// Función para capitalizar texto
const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function ModalUsuariosLista({ userId }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setCargando(true);
        
        // 1. Obtener el admin para conseguir su flotaId
        const adminRef = doc(db, "users", userId);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          setUsuarios([]);
          setCargando(false);
          return;
        }

        const admin = adminSnap.data();
        const flotaId = admin.flotaId;

        if (!flotaId) {
          setUsuarios([]);
          setCargando(false);
          return;
        }

        // 2. Obtener trabajadores de esa flota
        const trabajadoresRef = collection(db, "trabajadores");
        const q = query(trabajadoresRef, where("flotaId", "==", flotaId));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => {
          const trabajador = doc.data();
          return {
            id: doc.id,
            nombre: trabajador.perfil?.name || trabajador.perfil?.nombre || trabajador.nombre || "Sin nombre",
            email: trabajador.perfil?.email || trabajador.email || "Sin email",
            telefono: trabajador.perfil?.phone || trabajador.perfil?.telefono || trabajador.telefono || "Sin teléfono",
            rol: "Trabajador",
            cargo: "Conductor",
            ...trabajador,
          };
        });

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
    setUsuarioEditando(usuario);
    setFormData({
      nombre: usuario.nombre || "",
      email: usuario.email || "",
      telefono: usuario.telefono || "",
    });
    setOpenEditDialog(true);
  };

  const handleEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setOpenDeleteDialog(true);
  };

  const confirmGuardar = async () => {
    if (!usuarioEditando) return;
    
    try {
      setGuardando(true);
      await updateDoc(doc(db, "trabajadores", usuarioEditando.id), formData);
      
      // Actualizar la lista
      setUsuarios(usuarios.map(u => 
        u.id === usuarioEditando.id 
          ? { ...u, ...formData }
          : u
      ));
      setOpenEditDialog(false);
      setUsuarioEditando(null);
    } catch (error) {
      console.error("Error al actualizar trabajador:", error);
      alert("Error al actualizar trabajador");
    } finally {
      setGuardando(false);
    }
  };

  const confirmEliminar = async () => {
    if (!usuarioAEliminar) return;
    
    try {
      setEliminando(true);
      await deleteDoc(doc(db, "trabajadores", usuarioAEliminar.id));
      
      // Actualizar la lista
      setUsuarios(usuarios.filter(u => u.id !== usuarioAEliminar.id));
      setOpenDeleteDialog(false);
      setUsuarioAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar trabajador:", error);
      alert("Error al eliminar trabajador");
    } finally {
      setEliminando(false);
    }
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
                        {capitalize(usuario.nombre) || "Sin nombre"}
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

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Trabajador</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nombre"
            value={formData.nombre || ""}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Teléfono"
            value={formData.telefono || ""}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button onClick={confirmGuardar} variant="contained" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas eliminar a {usuarioAEliminar?.nombre}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={confirmEliminar} color="error" variant="contained" disabled={eliminando}>
            {eliminando ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
