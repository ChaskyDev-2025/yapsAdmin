// src/services/authService.js
import { auth, db } from "../data/firebase/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export async function loginWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  
  // Verificar que el usuario esté activo en Firestore
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      // Usuario no existe en Firestore
      const error = new Error("Usuario no encontrado");
      error.code = "auth/user-not-found";
      throw error;
    }
    
    const userData = userDoc.data();
    
    // Verificar si el usuario está activo
    if (userData.active === false) {
      const error = new Error("Tu cuenta está desactivada");
      error.code = "auth/user-inactive";
      throw error;
    }
    
    return user;
  } catch (error) {
    // Relanzar errores que ya tienen code (user-inactive, user-not-found)
    if (error.code) {
      throw error;
    }
    // Relanzar otros errores
    throw error;
  }
}

export async function logout() {
  await signOut(auth);
}

export function mapFirebaseError(code) {
  const map = {
    "auth/invalid-credential": "Email o contraseña incorrectos.",
    "auth/user-disabled": "Usuario deshabilitado. Contacta al administrador.",
    "auth/user-inactive": "Tu cuenta está desactivada. Contacta al administrador.",
    "auth/user-not-found": "Usuario no encontrado. Contacta al administrador.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/network-request-failed": "Problema de conexión. Revisa tu red.",
  };
  return map[code] || "No se pudo iniciar sesión.";
}
