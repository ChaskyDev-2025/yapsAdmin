import { useState } from "react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export const usePerfilPassword = (user) => {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [mostrarPasswordActual, setMostrarPasswordActual] = useState(false);
  const [mostrarPasswordNueva, setMostrarPasswordNueva] = useState(false);
  const [mostrarPasswordConfirm, setMostrarPasswordConfirm] = useState(false);
  const [errorPassword, setErrorPassword] = useState("");
  const [successPassword, setSuccessPassword] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);

  const cambiarPassword = async () => {
    setErrorPassword("");
    setSuccessPassword("");

    if (!passwordActual || !passwordNueva || !passwordConfirm) {
      setErrorPassword("Por favor completa todos los campos");
      return false;
    }

    if (passwordNueva !== passwordConfirm) {
      setErrorPassword("Las contraseñas nuevas no coinciden");
      return false;
    }

    if (passwordNueva.length < 6) {
      setErrorPassword("La nueva contraseña debe tener al menos 6 caracteres");
      return false;
    }

    if (passwordNueva === passwordActual) {
      setErrorPassword("La nueva contraseña debe ser diferente a la actual");
      return false;
    }

    setGuardandoPassword(true);

    try {
      // Reautenticar usuario
      const credential = EmailAuthProvider.credential(user.email, passwordActual);
      await reauthenticateWithCredential(user, credential);

      // Cambiar contraseña
      await updatePassword(user, passwordNueva);

      setSuccessPassword("✓ Contraseña actualizada correctamente");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirm("");
      setMostrarCambioPassword(false);
      setTimeout(() => setSuccessPassword(""), 3000);
      return true;
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      if (err.code === "auth/wrong-password") {
        setErrorPassword("La contraseña actual es incorrecta");
      } else if (err.code === "auth/weak-password") {
        setErrorPassword("La contraseña es muy débil");
      } else {
        setErrorPassword("Error al cambiar la contraseña. Intenta nuevamente");
      }
      return false;
    } finally {
      setGuardandoPassword(false);
    }
  };

  return {
    passwordActual,
    setPasswordActual,
    passwordNueva,
    setPasswordNueva,
    passwordConfirm,
    setPasswordConfirm,
    mostrarPasswordActual,
    setMostrarPasswordActual,
    mostrarPasswordNueva,
    setMostrarPasswordNueva,
    mostrarPasswordConfirm,
    setMostrarPasswordConfirm,
    errorPassword,
    setErrorPassword,
    successPassword,
    setSuccessPassword,
    guardandoPassword,
    mostrarCambioPassword,
    setMostrarCambioPassword,
    cambiarPassword,
  };
};
