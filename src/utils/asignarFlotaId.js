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
  
  if (!userDoc.exists()) {
    console.error("❌ No se encontró el documento del usuario");
  }
};
