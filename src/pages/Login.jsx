import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, TextField, Button, Alert } from "@mui/material";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useState } from "react";
import { loginWithEmail, mapFirebaseError } from "../services/authService"; // 👈 importa el servicio

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");       // 👈 controlados
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password); // 👈 Firebase real
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(mapFirebaseError(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
               background: "linear-gradient(135deg, #d7171a 0%, #000000 100%)", p: 2 }}>
      <Paper elevation={10} sx={{ p:{ xs:3, sm:4 }, borderRadius:3, width:{ xs:'90%', sm:380 }, maxWidth:400,
                                   textAlign:"center", backgroundColor:'rgba(255,255,255,0.98)',
                                   backdropFilter:'blur(10px)', boxShadow:'0 8px 32px rgba(215,23,26,.4)' }}>
        <LockOutlinedIcon sx={{ fontSize: 60, color: "#d7171a", mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Acceso Administrador
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Ingresa tus credenciales para acceder al panel.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin} noValidate>
          <TextField
            label="Email" type="email" fullWidth required margin="normal"
            value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username"
          />
          <TextField
            label="Contraseña" type="password" fullWidth required margin="normal"
            value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
          />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={submitting} 
                  sx={{ mt: 3, bgcolor: "#d7171a", '&:hover': { bgcolor: "#b01217" }, fontWeight: 600 }}>
            {submitting ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
