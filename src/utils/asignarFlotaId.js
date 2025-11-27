// Utilidad para asignar flotaId a un usuario
// Ejecutar desde consola del navegador cuando estés logueado

import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../data/firebase/firebase";

export const asignarFlotaIdAlUsuarioActual = async (flotaId) => {
  const user = auth.currentUser;
  
  if (!user) {
    console.error("❌ No hay usuario logueado");
    return false;
  }
  
  try {
    // Actualizar el documento del usuario
    await updateDoc(doc(db, "users", user.uid), {
      flotaId: flotaId
    });
    
    console.log("✅ flotaId asignado exitosamente");
    console.log("📧 Usuario:", user.email);
    console.log("🆔 UID:", user.uid);
    console.log("🏢 FlotaId:", flotaId);
    console.log("🔄 Recarga la página para ver los cambios");
    
    return true;
  } catch (error) {
    console.error("❌ Error al asignar flotaId:", error);
    return false;
  }
};

// Para ejecutar desde consola:
// import { asignarFlotaIdAlUsuarioActual } from './src/utils/asignarFlotaId';
// asignarFlotaIdAlUsuarioActual("4u2xd5RNz0tb2mz7t17w");

export const verificarFlotaIdDelUsuario = async () => {
  const user = auth.currentUser;
  
  if (!user) {
    console.error("❌ No hay usuario logueado");
    return;
  }
  
  const userDoc = await getDoc(doc(db, "users", user.uid));
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    console.log("👤 Información del usuario:");
    console.log("  📧 Email:", user.email);
    console.log("  🆔 UID:", user.uid);
    console.log("  👔 Rol:", userData.role);
    console.log("  🏢 FlotaId:", userData.flotaId || "❌ NO ASIGNADO");
  } else {
    console.error("❌ No se encontró el documento del usuario");
  }
};
