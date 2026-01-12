import { useState, useEffect } from "react";
import { Box, Avatar, Typography, Stack, Divider, Chip, Button } from "@mui/material";
import RecargaSaldoModal from "./RecargaSaldoModal";
import { doc, onSnapshot } from "firebase/firestore";
import { actualizarSaldoSeguro } from "./saldoSeguro";
import { db } from "../../../../data/firebase/firebase";
import { agregarHistorialRecarga } from "./save_nube";

const getEstadoColor = (e = "") =>
  ({ aprobado: "success", pendiente: "warning", rechazado: "error" }[e.toLowerCase()] || "default");

const capitalizarNombre = (nombre) => {
  if (!nombre) return "";
  return nombre
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function ModalIzquierdo({ rowData }) {
  const [openRecarga, setOpenRecarga] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [saldoActual, setSaldoActual] = useState(rowData.saldo);
  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState({});
  
  const flotaNombre = rowData.flotaNombre || "-";
  const departamento = rowData.departamento || "-";

  // Escucha el saldo, categorías y servicios actualizados desde Firebase
  useEffect(() => {
    if (!rowData?.firebaseId) return;
    
    const ref = doc(db, "trabajadores", rowData.firebaseId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (data) {
        // Actualizar saldo desde billetera
        if (typeof data.saldo !== "undefined") {
          setSaldoActual(`Bs. ${Number(data.saldo).toFixed(2)}`);
        }
        // Actualizar categorías y servicios desde el documento del trabajador
        if (Array.isArray(data.categorias)) {
          setCategorias(data.categorias);
        }
        if (typeof data.servicios === 'object') {
          setServicios(data.servicios || {});
        }
      }
    });
    return () => unsubscribe();
  }, [rowData?.firebaseId]);

  if (!rowData) return null;
  return (
    <Box sx={{ width: 350, display: "flex", justifyContent: "flex-start", alignItems: "flex-start", pt: 3, overflow: "auto", pl: 2 }}>
      <Box
        sx={{
          width: 280,
          p: 3,
          borderRadius: 3,
          bgcolor: "#fff",
          border: "1px solid #00000033",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.33)",
          textAlign: "left",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
          <Avatar
            src={rowData.perfil?.fotoUrl || rowData.fotoUrl || rowData.logo}
            alt={rowData.nombreEmpresa}
            sx={{
              width: 110,
              height: 110,
              mb: 2,
              border: "3px solid",
              borderColor: "primary.main",
              boxShadow: 2,
            }}
          >
            {rowData.nombreEmpresa?.[0] || "?"}
          </Avatar>
        </Box>
        <Typography variant="h6" fontWeight={600} mb={1}>
          {capitalizarNombre(rowData.nombreEmpresa)}
        </Typography>
        <Stack spacing={0.5} sx={{ mb: 2, "& b": { color: "text.secondary" } }}>
          <Typography>
            <b>Email:</b> {rowData.representante || "No proporcionado"}
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
                {Object.entries(servicios).map(([categoria, serviciosRaw]) => {
                  // Extraer los valores del servicio si es un objeto o array
                  let serviciosArray = [];
                  if (Array.isArray(serviciosRaw)) {
                    serviciosArray = serviciosRaw.map(s => {
                      if (typeof s === 'object' && s?.valor) {
                        return s.valor;
                      }
                      return s;
                    });
                  } else if (typeof serviciosRaw === 'object' && serviciosRaw?.valor) {
                    serviciosArray = [serviciosRaw.valor];
                  } else if (serviciosRaw && typeof serviciosRaw === 'string') {
                    serviciosArray = [serviciosRaw];
                  }
                  
                  return serviciosArray.length > 0 ? (
                    <Box key={categoria}>
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, mb: 0.5 }}>
                        {categoria}:
                      </Typography>
                      {serviciosArray.map((s, idx) => {
                        // Quitar el prefijo de la categoría del servicio
                        let servicioLimpio = s;
                        
                        // Crear variantes del prefijo para comparación
                        const prefijoGuion = categoria.toLowerCase().replace(/\s+/g, '_') + '_';
                        const prefijoEspacio = categoria.toLowerCase() + ' ';
                        
                        // Quitar el prefijo si existe (con guion bajo o espacio)
                        const servicioMinuscula = servicioLimpio.toLowerCase();
                        if (servicioMinuscula.startsWith(prefijoGuion)) {
                          servicioLimpio = servicioLimpio.substring(prefijoGuion.length);
                        } else if (servicioMinuscula.startsWith(prefijoEspacio)) {
                          servicioLimpio = servicioLimpio.substring(prefijoEspacio.length);
                        }
                        
                        // Reemplazar guiones bajos con espacios
                        servicioLimpio = servicioLimpio.replace(/_/g, ' ');
                        
                        return (
                          <Typography key={idx} sx={{ fontSize: "0.85rem", ml: 1 }}>
                            • {servicioLimpio}
                          </Typography>
                        );
                      })}
                    </Box>
                  ) : null;
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