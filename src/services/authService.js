// src/services/authService.js
import { auth } from "../data/firebase/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export async function loginWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function logout() {
  await signOut(auth);
}

export function mapFirebaseError(code) {
  const map = {
    "auth/invalid-credential": "Email o contraseña incorrectos.",
    "auth/user-disabled": "Usuario deshabilitado. Contacta al administrador.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/network-request-failed": "Problema de conexión. Revisa tu red.",
  };
  return map[code] || "No se pudo iniciar sesión.";
}
