import { useState, useEffect } from "react";
import { Box, Avatar, Typography, Stack, Divider, Chip, Button } from "@mui/material";
import RecargaSaldoModal from "./RecargaSaldoModal";
import { doc, onSnapshot } from "firebase/firestore";
import { actualizarSaldoSeguro } from "./saldoSeguro";
import { db } from "../../../../data/firebase/firebase";
import { agregarHistorialRecarga } from "./save_nube";

const getEstadoColor = (e = "") =>
  ({ aprobado: "success", pendiente: "warning", rechazado: "error" }[e.toLowerCase()] || "default");

export default function ModalIzquierdo({ rowData }) {
  const [openRecarga, setOpenRecarga] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [saldoActual, setSaldoActual] = useState(rowData.saldo);
  
  const categorias = Array.isArray(rowData.categorias) ? rowData.categorias : [];
  const servicios = rowData.servicios || {};
  const flotaNombre = rowData.flotaNombre || "-";
  const departamento = rowData.departamento || "-";

  // Escucha el saldo actualizado en Firestore
  useEffect(() => {
    if (!rowData?.firebaseId) return;
    const ref = doc(db, "trabajadores", rowData.firebaseId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (data && typeof data.saldo !== "undefined") {
        setSaldoActual(`Bs. ${Number(data.saldo).toFixed(2)}`);
      }
    });
    return () => unsubscribe();
  }, [rowData?.firebaseId]);

  if (!rowData) return null;
  return (
    <Box sx={{ width: 350, display: "flex", justifyContent: "center", alignItems: "flex-start", pt: 3, overflow: "auto" }}>
      <Box
        sx={{
          width: 280,
          p: 3,
          borderRadius: 3,
          bgcolor: "#fff",
          border: "1px solid #00000033",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.33)",
          textAlign: "center",
        }}
      >
        <Avatar
          src={rowData.perfil?.fotoUrl || rowData.fotoUrl || rowData.logo}
          alt={rowData.nombreEmpresa}
          sx={{
            width: 110,
            height: 110,
            mx: "auto",
            mb: 2,
            border: "3px solid",
            borderColor: "primary.main",
            boxShadow: 2,
          }}
        >
          {rowData.nombreEmpresa?.[0] || "?"}
        </Avatar>
        <Typography variant="h6" fontWeight={600} mb={1}>
          {rowData.nombreEmpresa}
        </Typography>
        <Stack spacing={0.5} sx={{ mb: 2, "& b": { color: "text.secondary" } }}>
          <Typography>
            <b>Dueño:</b> {rowData.representante || "No proporcionado"}
          </Typography>
          <Typography>
            <b>Teléfono:</b> {rowData.telefono || "No proporcionado"}
          </Typography>
          <Typography>
            <b>Departamento:</b> {departamento}
          </Typography>
          {categorias.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography component="b" sx={{ color: "text.secondary" }}>
                Categorías y Servicios:
              </Typography>
              <Box sx={{ mt: 0.5, pl: 1 }}>
                {categorias.map((cat) => {
                  // Normalizar la categoría: quitar tilde, pasar a minúscula
                  const catNormalizada = cat
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
                  const servicio = servicios[catNormalizada] || servicios[cat.toLowerCase()] || "Sin servicio";
                  
                  return (
                    <Typography key={cat} sx={{ fontSize: "0.9rem" }}>
                      • {cat}: <strong>{servicio}</strong>
                    </Typography>
                  );
                })}
              </Box>
            </Box>
          )}
          <Typography>
            <b>Flota:</b> {flotaNombre}
          </Typography>
          <Typography>
            <b>Estado:</b>{" "}
            <Chip
              label={rowData.estado}
              size="small"
              color={getEstadoColor(rowData.estado)}
              variant="outlined"
            />
          </Typography>
          <Typography>
            <b>Fecha registro:</b> {
              (() => {
                if (!rowData.createdAt) return "No disponible";
                let date;
                if (rowData.createdAt?.toDate && typeof rowData.createdAt.toDate === 'function') {
                  date = rowData.createdAt.toDate();
                } else if (typeof rowData.createdAt === 'string') {
                  date = new Date(rowData.createdAt);
                } else if (rowData.createdAt instanceof Date) {
                  date = rowData.createdAt;
                } else if (rowData.createdAt?.seconds) {
                  date = new Date(rowData.createdAt.seconds * 1000);
                } else {
                  return "No disponible";
                }
                return date.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                });
              })()
            }
          </Typography>
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="subtitle2" fontWeight={600}>
          Saldo de la billetera
        </Typography>
        <Typography variant="h5" color="primary" fontWeight={700} mb={1}>
          {saldoActual || "No proporcionado"}
        </Typography>
        <Button
          variant="contained"
          color="success"
          size="small"
          sx={{ px: 3, textTransform: "none" }}
          onClick={() => setOpenRecarga(true)}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Agregar monto"}
        </Button>
      </Box>

<RecargaSaldoModal
  open={openRecarga}
  onClose={() => setOpenRecarga(false)}
  onGuardar={async (delta) => {
    try {
      setGuardando(true);
      const value = parseFloat(String(delta).replace(",", "."));
      if (!isFinite(value) || value === 0) throw new Error("Monto inválido");
      
    // 1) Actualiza saldo
    await actualizarSaldoSeguro(rowData.firebaseId, value);

    // 2) Estado según signo: negativo => "descuento", positivo => "recarga"
    const estadoMovimiento = value < 0 ? "descuento" : "recarga";

    // 3) Guarda en historial con ese estado y el monto
    await agregarHistorialRecarga(rowData.firebaseId, {
      estado: estadoMovimiento,
      monto: value,
    });
    } catch (e) {
      console.error("Error guardando saldo:", e);
      alert(e?.message || "No se pudo guardar el saldo");
    } finally {
      setGuardando(false);
      setOpenRecarga(false);
    }
  }}
/>

    </Box>
  );
}