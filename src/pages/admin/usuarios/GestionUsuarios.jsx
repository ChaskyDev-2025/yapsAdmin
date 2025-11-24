// src/pages/admin/usuarios/GestionUsuarios.jsx
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useAuth } from "../../../auth/AuthContext";
import { getAllUsers, createAdminUser, updateUser, deleteUser, isSuperAdmin } from "../../../services/userService";

const GestionUsuarios = () => {
  const { userRole, user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    role: "admin",
    password: "",
  });

  // Cargar usuarios
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const users = await getAllUsers();
    setUsuarios(users);
    setLoading(false);
  };

  const handleOpenDialog = (usuario = null) => {
    if (usuario) {
      setEditingUser(usuario);
      setFormData({
        email: usuario.email,
        nombre: usuario.nombre || "",
        role: usuario.role,
        password: "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: "",
        nombre: "",
        role: "admin",
        password: "",
      });
    }
    setOpenDialog(true);
    setError("");
    setSuccess("");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({ email: "", nombre: "", role: "admin", password: "" });
  };

  const handleSaveUser = async () => {
    setError("");
    setSuccess("");

    if (!formData.email || !formData.nombre) {
      setError("Email y nombre son obligatorios");
      return;
    }

    if (editingUser) {
      // Actualizar usuario existente
      const result = await updateUser(editingUser.id, {
        email: formData.email,
        nombre: formData.nombre,
        role: formData.role,
      });

      if (result.success) {
        setSuccess("Usuario actualizado correctamente");
        loadUsers();
        setTimeout(() => handleCloseDialog(), 1500);
      } else {
        setError(result.error || "Error al actualizar usuario");
      }
    } else {
      // Crear nuevo usuario - SIN crear cuenta en Auth
      if (!formData.password) {
        setError("La contraseña es obligatoria para nuevos usuarios");
        return;
      }

      // Guardar usuario pendiente en Firestore
      const result = await createAdminUser({
        email: formData.email,
        nombre: formData.nombre,
        role: formData.role,
        password: formData.password, // Se guarda temporalmente
        createdBy: user.uid,
        status: "pending", // Usuario pendiente de activación
      });

      if (result.success) {
        setSuccess(
          `✅ Usuario guardado. 
          
          📋 PASOS PARA ACTIVAR:
          1. Ve a Firebase Console → Authentication
          2. Haz clic en "Add user"
          3. Email: ${formData.email}
          4. Password: ${formData.password}
          5. Copia el UID generado
          6. Ve a Firestore → users → ${result.id}
          7. Agrega el campo "uid" con el valor copiado
          8. Cambia "status" de "pending" a "active"
          
          💡 El usuario podrá iniciar sesión después de esto.`
        );
        loadUsers();
        // No cerramos el dialog para que vea las instrucciones
      } else {
        setError(result.error || "Error al crear usuario");
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      const result = await deleteUser(userId);
      if (result.success) {
        setSuccess("Usuario eliminado correctamente");
        loadUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Error al eliminar usuario");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  // Solo SuperAdmin puede acceder
  if (!isSuperAdmin(userRole)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta sección. Solo SuperAdmin puede gestionar usuarios.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: "#d7171a", "&:hover": { bgcolor: "#b01217" } }}
        >
          Crear Usuario
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f0f0f0" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Contraseña Temp</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Creado</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="right">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id} hover>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.nombre}</TableCell>
                  <TableCell>
                    <Chip
                      label={usuario.role === "superadmin" ? "SuperAdmin" : "Admin"}
                      color={usuario.role === "superadmin" ? "error" : "primary"}
                      size="small"
                      sx={{
                        bgcolor: usuario.role === "superadmin" ? "#d7171a" : "#484848",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        usuario.status === "pending" 
                          ? "Pendiente" 
                          : usuario.active !== false 
                          ? "Activo" 
                          : "Inactivo"
                      }
                      color={
                        usuario.status === "pending"
                          ? "warning"
                          : usuario.active !== false
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {usuario.password ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: "monospace", 
                          bgcolor: "#f5f5f5", 
                          p: 0.5, 
                          borderRadius: 1,
                          fontSize: "0.75rem"
                        }}
                      >
                        {usuario.password}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{new Date(usuario.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    {usuario.status === "pending" && (
                      <Tooltip title="Copiar instrucciones de activación">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const instrucciones = `
📋 ACTIVAR USUARIO: ${usuario.email}

1. Firebase Console → Authentication → Add user
2. Email: ${usuario.email}
3. Password: ${usuario.password || "contraseña_asignada"}
4. Copiar el UID generado
5. Firestore → users → ${usuario.id}
6. Agregar campo "uid": "UID_COPIADO"
7. Cambiar "status": "active"
8. Cambiar "active": true
9. OPCIONAL: Eliminar campo "password"
                            `.trim();
                            
                            navigator.clipboard.writeText(instrucciones);
                            setSuccess("Instrucciones copiadas al portapapeles");
                            setTimeout(() => setSuccess(""), 3000);
                          }}
                          sx={{ color: "#d7171a" }}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(usuario)}
                      sx={{ color: "#484848" }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(usuario.id)}
                      sx={{ color: "#d7171a" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={editingUser !== null}
          />

          <TextField
            label="Nombre Completo"
            fullWidth
            margin="normal"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />

          <TextField
            label="Rol"
            select
            fullWidth
            margin="normal"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superadmin">SuperAdmin</MenuItem>
          </TextField>

          {!editingUser && (
            <TextField
              label="Contraseña Temporal"
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Nota: Debes crear la cuenta en Firebase Authentication manualmente con este email."
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: "#484848" }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            sx={{ bgcolor: "#d7171a", "&:hover": { bgcolor: "#b01217" } }}
          >
            {editingUser ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionUsuarios;
