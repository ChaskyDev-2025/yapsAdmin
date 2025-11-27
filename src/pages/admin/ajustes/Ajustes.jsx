// src/pages/admin/ajustes/Ajustes.jsx
import { useEffect, useState } from "react";
import { Typography, Paper, Stack, Box, Avatar } from "@mui/material";
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
import { doc, getDoc} from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";


const Ajustes = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [nombreEmpresa, setNombreEmpresa] = useState("Empresa");
  
  const { rows, cargando, error } = useUsuarios();
  const { user } = useAuth();

  //Obtener nombre de empresa del usuario actual
useEffect(() =>{
  const fetchEmpresaName = async () => {
    if (user?.uid){
      try {
        console.log("User UID:", user.uid); // 👈 Ver el UID del usuario
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("userData completo:", userData); // 👈 Ver todos los datos del usuario

          //Si tiene flotaId, buscar el nombre en la flota
          if (userData.flotaId) {
            console.log("flotaId encontrado:", userData.flotaId); // 👈 Ver el flotaId
            const flotaDoc = await getDoc(doc(db, "flotas", userData.flotaId));
            console.log("flotaDoc existe:", flotaDoc.exists()); // 👈 Ver si encuentra la flota
            if (flotaDoc.exists()) {
              const flotaData = flotaDoc.data();
              console.log("flotaData:", flotaData); // 👈 Ver datos de la flota
              setNombreEmpresa(flotaData.nombre || flotaData.nombreEmpresa || "Empresa");
            }
          } else{
            console.log("No tiene flotaId"); // 👈 Ver si entra aquí
            //Si no tiene FlotaID, usar nombreEmpresa del usuario
            setNombreEmpresa(userData.nombreEmpresa || "Empresa")
          }
        } else {
          console.log("Usuario no existe en Firestore"); // 👈 Ver si el documento existe
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
    console.log("Editar usuario:", row);
    // Aquí puedes agregar la lógica para editar
  };

  const handleEliminar = (row) => {
    console.log("Eliminar usuario:", row);
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

      <DetalleModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        rowData={selectedRow}
      />
    </>
  );
};

export default Ajustes;

