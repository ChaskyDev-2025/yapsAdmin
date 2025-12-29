import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";

const AsignarFlotaDialog = ({
  open,
  onClose,
  selectedSolicitud,
  asignadaFlota,
  onFlotaChange,
  onAsignar,
  flotasDisponibles,
}) => {
  const noHayFlotas = !flotasDisponibles || flotasDisponibles.length === 0;
  const sinSeleccionar = !asignadaFlota;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar Flota a Solicitud</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {selectedSolicitud && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Categoría"
              value={selectedSolicitud.solicitud?.categoria || ""}
              disabled
              fullWidth
              size="small"
            />
            <TextField
              label="Servicio Solicitado"
              value={selectedSolicitud.solicitud?.servicio || ""}
              disabled
              fullWidth
              size="small"
            />
            
            {noHayFlotas ? (
              <Alert severity="error">
                No hay flotas disponibles con el servicio "{selectedSolicitud.solicitud?.servicio || ''}"
              </Alert>
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>Seleccionar Flota</InputLabel>
                <Select
                  value={asignadaFlota}
                  label="Seleccionar Flota"
                  onChange={(e) => onFlotaChange(e.target.value)}
                >
                  {flotasDisponibles.map((flota) => (
                    <MenuItem key={flota.id} value={flota.id}>
                      {flota.nombre || flota.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={onAsignar}
          variant="contained"
          disabled={noHayFlotas || sinSeleccionar}
          sx={{ 
            backgroundColor: "#d7171a",
            "&:disabled": {
              backgroundColor: "#ccc",
              color: "#999"
            }
          }}
        >
          Asignar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AsignarFlotaDialog;
