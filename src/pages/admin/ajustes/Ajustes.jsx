// src/pages/admin/ajustes/Ajustes.jsx
import { useEffect, useState } from "react";
import { Typography, Paper, Stack, Box, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Tabla2 } from "../../../shared/components/tablas/tabla";
import DetalleModal from "./components/ModalUsuario";
import { getUsuariosColumns } from "./data/usuariosColumns";
import IconActionButton from "../../../shared/components/botones/Botones";
import { useUsuarios } from "./hooks/useUsuarios";
import { useAuth } from "../../../auth/AuthContext";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";


const Ajustes = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [nombreEmpresa, setNombreEmpresa] = useState("Empresa");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [flotaIdActual, setFlotaIdActual] = useState(null);
  
  const { rows, cargando, error, refetch } = useUsuarios(flotaIdActual);
  const { user } = useAuth();

  //Obtener nombre de empresa del usuario actual
useEffect(() =>{
  const fetchEmpresaName = async () => {
    if (user?.uid){
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          //Si tiene flotaId, buscar el nombre en la flota
          if (userData.flotaId) {
            setFlotaIdActual(userData.flotaId);
            const flotaDoc = await getDoc(doc(db, "flotas", userData.flotaId));
            if (flotaDoc.exists()) {
              const flotaData = flotaDoc.data();
              setNombreEmpresa(flotaData.nombre || flotaData.nombreEmpresa || "Empresa");
            }
          } else{
            //Si no tiene FlotaID, usar nombreEmpresa del usuario
            setNombreEmpresa(userData.nombreEmpresa || "Empresa")
          }
        }
      }catch (error) {
        console.error("Error al obtener nombre de empresa:", error)
      }
    }
  };
  fetchEmpresaName();
}, [user]);

  const handleVer = (row) => {
    setSelectedRow(row);
    setOpenModal(true);
  };

  const handleEditar = (row) => {
    // Abrir modal con los datos del usuario para editar
    setSelectedRow(row);
    setOpenModal(true);
  };

  const handleEliminar = (row) => {
    setUserToDelete(row);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    try {
      const collection = userToDelete.tipo === "trabajador" ? "trabajadores" : "users";
      await deleteDoc(doc(db, collection, userToDelete.firebaseId));
      
      setMessage({ type: "success", text: "Usuario eliminado correctamente" });
      setOpenDeleteDialog(false);
      setUserToDelete(null);
      
      // Recargar los datos
      if (refetch) refetch();
      
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setMessage({ type: "error", text: "Error al eliminar usuario: " + error.message });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const columns = getUsuariosColumns((params) => (
    <Stack direction="row" spacing={1}>
      <IconActionButton
        icon={<EditIcon fontSize="small" />}
        color="error"
        onClick={(e) => {
          e.stopPropagation();
          handleEditar(params.row);
        }}
      />
      <IconActionButton
        icon={<DeleteIcon fontSize="small" />}
        color="error"
        onClick={(e) => {
          e.stopPropagation();
          handleEliminar(params.row);
        }}
      />
    </Stack>
  ));

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: "#f9f9f9",
          mx: "auto",
          maxWidth: 1200,
          border: "0.1px solid rgba(146, 144, 144, 1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", mr: 2 }}>
            <BusinessIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {nombreEmpresa}
            </Typography>
            <Typography color="text.secondary">
              Gestión de usuarios del sistema
            </Typography>
          </Box>
        </Box>

        <Tabla2
          rows={rows}
          columns={columns}
          height="51vh"
          pageSize={10}
          loading={cargando}
          onRowClick={(params) => handleVer(params.row)}
        />

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Paper>

      {message.text && (
        <Alert severity={message.type} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      )}

      <DetalleModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        rowData={selectedRow}
      />

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas eliminar a {userToDelete?.nombreUsuario}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Ajustes;