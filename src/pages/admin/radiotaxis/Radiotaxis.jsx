// src/pages/admin/radiotaxis/Radiotaxis.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Paper,
  Stack,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Switch,
  CircularProgress,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DetalleModal from "./components/modalGenerico";
import TableToolbar from "../usuarios/components/TableToolbar";
import { useAuth } from "../../../auth/AuthContext";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../data/firebase/firebase";
// 👉 Datos desde el hook (Firebase)
import { useTrabajadoresPorFlota } from "./hooks/useTrabajadoresPorFlota";

const Radiotaxis = () => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [flotaId, setFlotaId] = useState(null);
  const [searchRadiotaxis, setSearchRadiotaxis] = useState("");
  const [sortByRadiotaxis, setSortByRadiotaxis] = useState("nombre-asc");
  const [visibleColumnsRadiotaxis, setVisibleColumnsRadiotaxis] = useState({
    nombre: true,
    email: true,
    telefono: true,
    documentos: true,
    estado: true,
    acciones: true,
  });
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

  // Filtrado y ordenamiento
  const radiotaxisFiltrados = useMemo(() => {
    let filtered = rows;
    
    // Filtro por búsqueda
    if (searchRadiotaxis) {
      const search = searchRadiotaxis.toLowerCase();
      filtered = filtered.filter(r =>
        (r.nombreEmpresa || "").toLowerCase().includes(search) ||
        (r.email || "").toLowerCase().includes(search)
      );
    }
    
    // Ordenamiento
    const sorted = [...filtered];
    switch (sortByRadiotaxis) {
      case "nombre-asc":
        sorted.sort((a, b) => (a.nombreEmpresa || "").localeCompare(b.nombreEmpresa || ""));
        break;
      case "nombre-desc":
        sorted.sort((a, b) => (b.nombreEmpresa || "").localeCompare(a.nombreEmpresa || ""));
        break;
      default:
        break;
    }
    
    return sorted;
  }, [rows, searchRadiotaxis, sortByRadiotaxis]);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={6} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9f9f9" }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: "#000000" }}>
          Radiotaxis Registrados
        </Typography>
        <Typography color="text.secondary" gutterBottom sx={{ fontFamily: "Mulish, sans-serif" }}>
          Aquí puedes gestionar los radiotaxis que han enviado sus documentos.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, mt: 3 }}>
          <Box sx={{ flex: 1 }}>
            <TableToolbar
              searchValue={searchRadiotaxis}
              onSearchChange={setSearchRadiotaxis}
              sortValue={sortByRadiotaxis}
              onSortChange={setSortByRadiotaxis}
              sortOptions={[
                { label: "↑ Sort by Nombre (ASC)", value: "nombre-asc" },
                { label: "↓ Sort by Nombre (DESC)", value: "nombre-desc" },
              ]}
              visibleColumns={visibleColumnsRadiotaxis}
              onColumnChange={(col, visible) => setVisibleColumnsRadiotaxis(prev => ({ ...prev, [col]: visible }))}
              showClearButton={searchRadiotaxis !== ""}
              onClear={() => {
                setSearchRadiotaxis("");
                setSortByRadiotaxis("nombre-asc");
              }}
            />
          </Box>
        </Box>

        {cargando ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress sx={{ color: "#d7171a" }} />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#000000" }}>
                <TableRow>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Nombre
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Teléfono
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Documentos Aprobados
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ backgroundColor: "#000000", color: "white", fontWeight: 700, fontFamily: "Mulish, sans-serif", fontSize: "0.95rem" }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {radiotaxisFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography sx={{ py: 3, color: "#484848", fontFamily: "Mulish, sans-serif" }}>
                        No hay radiotaxis registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  radiotaxisFiltrados.map((radio) => (
                    <TableRow key={radio.firebaseId} hover sx={{ borderBottom: "1px solid #d0d0d0" }}>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
                        {radio.nombreEmpresa || "-"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {radio.email || "-"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        {radio.telefono || "-"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        <Typography
                          sx={{
                            color: radio.documentos_aprobados ? "#d7171a" : "#bdbdbd",
                            fontWeight: 600,
                            fontFamily: "Mulish, sans-serif"
                          }}
                        >
                          {radio.documentos_aprobados ? "Sí" : "No"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        <Switch
                          checked={radio.activo === true}
                          onChange={(e) => handleToggleHabilitado(radio.firebaseId, e.target.checked, radio.documentos_aprobados)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#d7171a',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#d7171a',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Mulish, sans-serif" }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleVer(radio)}
                              sx={{ bgcolor: "#ffe0e0", color: "#d7171a", "&:hover": { bgcolor: "#ffebee" } }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2, fontFamily: "Mulish, sans-serif" }}>
            {error}
          </Typography>
        )}
      </Paper>

      <DetalleModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        rowData={selectedRow}
      />
    </Box>
  );
};

export default Radiotaxis;
