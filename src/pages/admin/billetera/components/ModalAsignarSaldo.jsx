import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { asignarSaldo, retirarSaldo } from "../../../../services/bileteraService";

const ModalAsignarSaldo = ({ open, onClose, flota, onSuccess, tipo = "deposito" }) => {
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("recarga");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setMonto("");
    setConcepto("recarga");
    setNotas("");
    setError("");
    onClose();
  };

  const handleSave = async () => {
    try {
      setError("");

      if (!monto || parseFloat(monto) <= 0) {
        setError("Ingresa un monto válido mayor a 0");
        return;
      }

      setLoading(true);

      let resultado;
      const montoNum = parseFloat(monto);

      if (tipo === "deposito") {
        resultado = await asignarSaldo(flota.id, montoNum, concepto, notas);
      } else {
        resultado = await retirarSaldo(flota.id, montoNum, concepto, notas);
      }

      onSuccess && onSuccess(resultado);
      handleClose();
    } catch (err) {
      setError(err.message || "Error al procesar la transacción");
    } finally {
      setLoading(false);
    }
  };

  if (!flota) return null;

  const saldoFormato = flota.saldo?.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) || "0.00";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: tipo === "deposito" ? "#00897b" : "#d32f2f",
          color: "#fff",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {tipo === "deposito" ? "💰 Asignar Saldo" : "🚫 Retirar Saldo"}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Flota: {flota.nombre}
          </Typography>
          <Typography variant="body2" sx={{ color: "#666" }}>
            Saldo Actual: ${saldoFormato}
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Monto"
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0.00"
          inputProps={{ step: "0.01", min: "0" }}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          select
          label="Concepto"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          SelectProps={{
            native: true,
          }}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        >
          <option value="recarga">Recarga de Saldo</option>
          <option value="ajuste">Ajuste Manual</option>
          <option value="bonus">Bonus</option>
          <option value="penalizacion">Penalización</option>
          <option value="otro">Otro</option>
        </TextField>

        <TextField
          fullWidth
          label="Notas (opcional)"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Agregar notas sobre la transacción"
          multiline
          rows={3}
          variant="outlined"
          size="small"
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CloseIcon />}
          sx={{ textTransform: "none" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          variant="contained"
          sx={{
            background: tipo === "deposito" ? "#00897b" : "#d32f2f",
            textTransform: "none",
          }}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? "Procesando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalAsignarSaldo;
