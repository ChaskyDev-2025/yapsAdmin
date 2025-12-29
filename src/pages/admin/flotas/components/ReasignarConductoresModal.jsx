import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  MenuItem,
  Alert,
  Button,
  CircularProgress,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

const ReasignarConductoresModal = ({
  open,
  onClose,
  flota,
  onConfirm,
  loading = false,
}) => {
  const [conductores, setConductores] = useState([]);
  const [flotasDisponibles, setFlotasDisponibles] = useState([]);
  const [reasignaciones, setReasignaciones] = useState({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Cargar conductores de la flota y flotas disponibles
  useEffect(() => {
    if (open && flota) {
      cargarDatos();
    }
  }, [open, flota]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      // Cargar conductores de la flota
      const conductoresQuery = query(
        collection(db, "trabajadores"),
        where("flotaId", "==", flota.id)
      );
      const conductoresSnap = await getDocs(conductoresQuery);
      const conductoresList = conductoresSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConductores(conductoresList);

      // Cargar todas las flotas
      const flotasQuery = collection(db, "flotas");
      const flotasSnap = await getDocs(flotasQuery);
      const todasLasFlotas = flotasSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Filtrar: excluir solo la flota actual
      const flotasList = todasLasFlotas.filter(
        (f) => f.id !== flota.id
      );
      
      setFlotasDisponibles(flotasList);

      // Inicializar reasignaciones vacías
      setReasignaciones({});
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  // Filtrar flotas compatibles según los servicios del conductor
  const filtrarFlotasCompatibles = (conductor) => {
    const conductorServicios = conductor.servicios || {};
    
    // Si el conductor no tiene servicios, es compatible con todas
    if (Object.keys(conductorServicios).length === 0) {
      return flotasDisponibles;
    }

    const flotasCompatibles = [];

    // Evaluar cada flota disponible
    for (const flota of flotasDisponibles) {
      const flotaServicios = flota.servicios || {};
      let esCompatible = false;

      // Buscar en todas las ciudades de la flota
      for (const ciudad of Object.keys(flotaServicios)) {
        const serviciosCiudad = flotaServicios[ciudad];
        
        if (!serviciosCiudad || typeof serviciosCiudad !== 'object') {
          continue;
        }

        let ciudadCompatible = true;

        // Verificar cada servicio del conductor
        for (const [categoriaConductor, servicioConductor] of Object.entries(conductorServicios)) {
          const catNormalizada = categoriaConductor.toLowerCase();
          const servNormalizado = String(servicioConductor).toLowerCase();

          // Buscar en los servicios de la flota en esta ciudad
          let encontrado = false;
          for (const servicioFlota of Object.values(serviciosCiudad)) {
            if (servicioFlota && typeof servicioFlota === 'object') {
              const catFlota = (servicioFlota.categoria || "").toLowerCase();
              const servFlota = (servicioFlota.servicio || "").toLowerCase();

              if (catFlota === catNormalizada && servFlota === servNormalizado) {
                encontrado = true;
                break;
              }
            }
          }

          if (!encontrado) {
            ciudadCompatible = false;
            break;
          }
        }

        if (ciudadCompatible) {
          esCompatible = true;
          break; // Encontró en esta ciudad, no necesita buscar más
        }
      }

      if (esCompatible) {
        flotasCompatibles.push(flota);
      }
    }

    return flotasCompatibles;
  };

  const handleReasignacionChange = (conductorId, nuevaFlotaId) => {
    setReasignaciones((prev) => ({
      ...prev,
      [conductorId]: nuevaFlotaId,
    }));
  };

  const validarReasignaciones = () => {
    // Si no hay conductores, permitir eliminar
    if (conductores.length === 0) {
      return true;
    }

    // Validar que todos los conductores tengan una flota asignada
    const todosTienenFlota = conductores.every(
      (c) => reasignaciones[c.id]
    );

    if (!todosTienenFlota) {
      setError("Debes reasignar a todos los conductores");
      return false;
    }

    return true;
  };

  const handleConfirm = () => {
    if (validarReasignaciones()) {
      onConfirm(reasignaciones);
    }
  };

  const obtenerNombreConductor = (conductor) => {
    return (
      conductor.perfil?.nombre ||
      conductor.perfil?.name ||
      conductor.nombre ||
      conductor.displayName ||
      conductor.email ||
      "Conductor desconocido"
    );
  };

  const obtenerServiciosTexto = (conductor) => {
    const servicios = conductor.servicios || {};
    
    // Si servicios es un objeto simple con categoria: servicio
    // Ej: { envios: "Moto", viajes: "Comodidad" }
    const serviciosList = Object.entries(servicios)
      .map(([categoria, servicio]) => 
        `${categoria.charAt(0).toUpperCase() + categoria.slice(1)}: ${servicio}`
      );
    
    return serviciosList.length > 0 ? serviciosList.join(", ") : "Sin servicios";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
          color: "#fff",
          fontWeight: 700,
          fontFamily: "Mulish, sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <WarningIcon />
        Reasignar Conductores
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {cargando ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {flota && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Se eliminará la flota <strong>{flota.nombre}</strong>.
                {conductores.length > 0 && (
                  <>
                    {" "}
                    Tienes <strong>{conductores.length}</strong> conductor(es)
                    registrado(s) en esta flota que deben ser reasignados.
                  </>
                )}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {conductores.length === 0 ? (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography
                  sx={{ fontFamily: "Mulish, sans-serif", color: "#666" }}
                >
                  ✓ Esta flota no tiene conductores asignados. Puedes proceder
                  a eliminarla.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    fontFamily: "Mulish, sans-serif",
                  }}
                >
                  Reasignaciones Requeridas:
                </Typography>

                {conductores.map((conductor) => {
                  const flotasCompatibles = filtrarFlotasCompatibles(conductor);
                  const tieneFlotasDisponibles = flotasCompatibles.length > 0;

                  return (
                    <Box
                      key={conductor.id}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        bgcolor: tieneFlotasDisponibles ? "#fff" : "#fff3e0",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        👤 {obtenerNombreConductor(conductor)}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: 1.5,
                          color: "#666",
                          fontFamily: "Mulish, sans-serif",
                        }}
                      >
                        Servicios: {obtenerServiciosTexto(conductor)}
                      </Typography>

                      {tieneFlotasDisponibles ? (
                        <TextField
                          select
                          size="small"
                          fullWidth
                          label="Reasignar a flota"
                          value={reasignaciones[conductor.id] || ""}
                          onChange={(e) =>
                            handleReasignacionChange(
                              conductor.id,
                              e.target.value
                            )
                          }
                          disabled={loading}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              fontFamily: "Mulish, sans-serif",
                            },
                          }}
                        >
                          <MenuItem value="">
                            Seleccionar flota...
                          </MenuItem>
                          {flotasCompatibles.map((flotaOpt) => (
                            <MenuItem key={flotaOpt.id} value={flotaOpt.id}>
                              {flotaOpt.nombre}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        <Alert severity="error">
                          ⚠️ No hay flotas disponibles con los servicios
                          requeridos ({obtenerServiciosTexto(conductor)})
                        </Alert>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ fontFamily: "Mulish, sans-serif" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || cargando}
          sx={{
            background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
            color: "#fff",
            fontWeight: 600,
            fontFamily: "Mulish, sans-serif",
            "&:hover": {
              background:
                "linear-gradient(135deg, #b71c1c 0%, #880e4f 100%)",
            },
            "&:disabled": {
              background: "#ccc",
            },
          }}
        >
          {loading ? "Procesando..." : "Eliminar Flota y Reasignar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReasignarConductoresModal;
