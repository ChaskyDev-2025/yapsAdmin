// src/pages/admin/banner/Banners.jsx
import React from "react";
import { Tabla3 } from "../../../shared/components/tablas/tabla3";
import Icons from "../../../shared/constants/Icons";
import { Typography, Paper, Box, CircularProgress, Alert } from "@mui/material";
import useBannerColumns from "./data/Columnas";
import ModalAgregar from "./components/ModalAgregar";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "../../../data/firebase/firebase";
import { collection, getDocs, addDoc, orderBy, query, serverTimestamp, updateDoc, doc } from "firebase/firestore";

const Banners = () => {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const agregarApiRef = React.useRef({ datos: null }); // ModalAgregar te llena esto

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRows(banners);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchBanners(); }, []);

  // Cambiar estado en UI + persistir en Firestore
  const handleEstadoChange = React.useCallback(async (row, newEstado) => {
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, estado: newEstado } : r)));
    try {
      await updateDoc(doc(db, "banners", row.id), { estado: newEstado });
    } catch (e) {
      // revertir si falla
      setRows(prev => prev.map(r => (r.id === row.id ? { ...r, estado: !newEstado } : r)));
      console.error(e);
    }
  }, []);

  const columns = useBannerColumns(handleEstadoChange);

  if (loading) return <CircularProgress />;
  if (error)   return <Alert severity="error">{error.message}</Alert>;

  return (
    <Paper elevation={6} sx={{ p: 3, borderRadius: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Banners
      </Typography>

      <Tabla3
        rows={rows}
        columns={columns}
        pageSize={3}
        buttons={[
          {
            label: "Agregar",
            icon: <Icons.Add />,
            title: "Agregar nuevo banner",
            renderModal: () => (
              <ModalAgregar onReady={(api) => { agregarApiRef.current = api; }} />
            ),
            footerButtons: (close) => [
              { label: "Cerrar", position: "left", onClick: close },
              {
                label: "Guardar",
                icon: <Icons.Save />,
                position: "right",
onClick: async () => {
  const { save } = agregarApiRef.current || {};
  if (typeof save !== "function") return; // el modal no montó aún
  try {
    const nuevo = await save();           // { id, imagen, estado }
    setRows(prev => [nuevo, ...prev]);    // agrega sin reconsultar
    close();
} catch (e) {
  console.error("UPLOAD ERROR:", e?.code || e?.message, e);
  alert(e?.code || e?.message || "Error al subir la imagen");
}

}



              },
            ],
          },
        ]}
      />
    </Paper>
  );
};

export default Banners;
