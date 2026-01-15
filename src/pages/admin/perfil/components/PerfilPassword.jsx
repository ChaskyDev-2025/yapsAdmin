import React from "react";
import {
  Stack,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";

const PerfilPassword = ({
  mostrarCambioPassword,
  onToggleCambioPassword,
  passwordActual,
  onPasswordActualChange,
  mostrarPasswordActual,
  onToggleMostrarPasswordActual,
  passwordNueva,
  onPasswordNuevaChange,
  mostrarPasswordNueva,
  onToggleMostrarPasswordNueva,
  passwordConfirm,
  onPasswordConfirmChange,
  mostrarPasswordConfirm,
  onToggleMostrarPasswordConfirm,
  errorPassword,
  successPassword,
  guardandoPassword,
  onCambiarPassword,
}) => {
  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<LockIcon />}
        onClick={onToggleCambioPassword}
        fullWidth
        sx={{ mb: 2, textTransform: "none", fontSize: "1rem" }}
      >
        {mostrarCambioPassword ? "Cancelar cambio de contraseña" : "Cambiar contraseña"}
      </Button>

      {mostrarCambioPassword && (
        <Stack spacing={2}>
          {successPassword && (
            <Alert severity="success">
              {successPassword}
            </Alert>
          )}

          {errorPassword && (
            <Alert severity="error">
              {errorPassword}
            </Alert>
          )}

          <TextField
            label="Contraseña actual"
            name="password-actual"
            type={mostrarPasswordActual ? "text" : "password"}
            fullWidth
            value={passwordActual}
            onChange={(e) => onPasswordActualChange(e.target.value)}
            placeholder="Ingresa tu contraseña actual"
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={onToggleMostrarPasswordActual}
                    edge="end"
                  >
                    {mostrarPasswordActual ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            label="Nueva contraseña"
            name="password-nueva"
            type={mostrarPasswordNueva ? "text" : "password"}
            fullWidth
            value={passwordNueva}
            onChange={(e) => onPasswordNuevaChange(e.target.value)}
            placeholder="Ingresa tu nueva contraseña"
            helperText="Mínimo 6 caracteres"
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={onToggleMostrarPasswordNueva}
                    edge="end"
                  >
                    {mostrarPasswordNueva ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            label="Confirmar nueva contraseña"
            name="password-confirm"
            type={mostrarPasswordConfirm ? "text" : "password"}
            fullWidth
            value={passwordConfirm}
            onChange={(e) => onPasswordConfirmChange(e.target.value)}
            placeholder="Confirma tu nueva contraseña"
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={onToggleMostrarPasswordConfirm}
                    edge="end"
                  >
                    {mostrarPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button
            variant="contained"
            color="error"
            onClick={onCambiarPassword}
            disabled={!passwordActual || !passwordNueva || !passwordConfirm || guardandoPassword}
          >
            {guardandoPassword ? <CircularProgress size={24} /> : "Actualizar contraseña"}
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default PerfilPassword;
