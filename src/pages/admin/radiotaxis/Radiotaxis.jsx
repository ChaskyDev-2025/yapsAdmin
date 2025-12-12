// src/pages/admin/radiotaxis/Radiotaxis.jsx
import { useState, useEffect } from "react";
import { Typography, Paper, Stack } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Tabla2 } from "../../../shared/components/tablas/tabla";
import DetalleModal from "./components/modalGenerico";
import { getRadiotaxisColumns } from "./data/radiotaxisColumns";
import IconActionButton from "../../../shared/components/botones/Botones";
import { useAuth } from "../../../auth/AuthContext";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
// 👉 Datos desde el hook (Firebase)
import { useTrabajadoresPorFlota } from "./hooks/useTrabajadoresPorFlota";

const Radiotaxis = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [flotaId, setFlotaId] = useState(null);
  const { user } = useAuth();
  
  // 👉 Datos desde el hook (Firebase) - filtra por flota del usuario
  const { rows, cargando, error, refetch } = useTrabajadoresPorFlota(flotaId);

  // Obtener flotaId del usuario actual
  useEffect(() => {
    const fetchFlotaId = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().flotaId) {
            setFlotaId(userDoc.data().flotaId);
          }
        } catch (error) {
          console.error("Error al obtener flotaId:", error);
        }
      }
    };
    fetchFlotaId();
  }, [user]);

  const handleVer = (row) => {
    setSelectedRow(row);
    setOpenModal(true);
  };

  const handleToggleHabilitado = async (firebaseId, nuevoEstado, documentosAprobados) => {
    // Si intenta activar y documentos_aprobados es false, no permitir
    if (nuevoEstado && !documentosAprobados) {
      alert("No puede activar este radiotaxi. Los documentos aún no han sido aprobados.");
      return;
    }

    try {
      const ref = doc(db, "trabajadores", firebaseId);
      await updateDoc(ref, {
        activo: nuevoEstado,
      });
      // Refrescar la tabla
      refetch();
    } catch (e) {
      console.error("Error al actualizar estado:", e);
    }
  };

  // Función para verificar si documentos están aprobados
  const verificarDocumentosAprobados = (documentosObj) => {
    return documentosObj?.documentos_aprobados === true;
  };

  const columns = getRadiotaxisColumns((params) => (
    <Stack direction="row" spacing={1}>
      <IconActionButton
        icon={<VisibilityIcon fontSize="small" />}
        color="primary"
        onClick={(e) => {
          e.stopPropagation();
          handleVer(params.row);
        }}
      />
    </Stack>
  ), handleToggleHabilitado, verificarDocumentosAprobados);

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
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Radiotaxis Registrados
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Aquí puedes gestionar los radiotaxis que han enviado sus documentos.
        </Typography>

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
        rowData={selectedRow} // aquí tienes rowData.firebaseId si lo necesitas
      />
    </>
  );
};

export default Radiotaxis;
