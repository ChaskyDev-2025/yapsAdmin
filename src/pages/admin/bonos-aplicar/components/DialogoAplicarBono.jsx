import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

export const DialogoAplicarBono = ({
  open,
  onClose,
  onConfirmar,
  conductor,
  reglasDisponibles,
  reglaSeleccionada,
  onReglaChange,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", color: "#000" }}>
        Asignar Bono a Conductor
      </DialogTitle>
      <DialogContent sx={{ paddingTop: 2 }}>
        {conductor && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                Conductor:
              </Typography>
              <Typography variant="body1">{conductor.nombre}</Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Seleccionar Regla de Bono</InputLabel>
              <Select
                value={reglaSeleccionada?.id || ""}
                label="Seleccionar Regla de Bono"
                onChange={(e) => {
                  const regla = reglasDisponibles.find((r) => r.id === e.target.value);
                  onReglaChange(regla);
                }}
              >
                {reglasDisponibles.map((regla) => (
                  <MenuItem key={regla.id} value={regla.id}>
                    {regla.viajes} viajes - ${regla.monto}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {reglaSeleccionada && (
              <Card sx={{ backgroundColor: "#f5f5f5", border: "1px solid #ddd" }}>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", marginBottom: 1 }}
                  >
                    Resumen del Bono:
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        Requisito de Viajes:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", color: "#000" }}
                      >
                        {reglaSeleccionada.viajes}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        Monto a Asignar:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", color: "#d7171a" }}
                      >
                        ${reglaSeleccionada.monto}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Button onClick={onClose} sx={{ color: "#666" }}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirmar}
          variant="contained"
          sx={{
            backgroundColor: "#d7171a",
            color: "white",
            "&:hover": { backgroundColor: "#a80a12" },
          }}
        >
          Confirmar Asignación
        </Button>
      </DialogActions>
    </Dialog>
  );
};
