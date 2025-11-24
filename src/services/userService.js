// src/services/userService.js
import { db } from "../data/firebase/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

/**
 * Crear un nuevo usuario admin en Firestore
 * Nota: La cuenta de Firebase Auth debe crearse manualmente en Firebase Console
 * ya que no tenemos Firebase Admin SDK en el cliente
 */
export async function createAdminUser(userData) {
  try {
    const userRef = await addDoc(collection(db, "users"), {
      email: userData.email,
      role: userData.role || "admin",
      nombre: userData.nombre || "",
      password: userData.password || "", // Temporal - eliminar después de crear en Auth
      status: userData.status || "pending", // pending | active
      createdAt: new Date().toISOString(),
      createdBy: userData.createdBy || null,
      active: false, // Se activa cuando se crea en Auth
    });
    return { success: true, id: userRef.id };
  } catch (error) {
    console.error("Error creando usuario:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los usuarios
 */
export async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return [];
  }
}

/**
 * Obtener usuarios por rol
 */
export async function getUsersByRole(role) {
  try {
    const q = query(collection(db, "users"), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("Error obteniendo usuarios por rol:", error);
    return [];
  }
}

/**
 * Actualizar un usuario
 */
export async function updateUser(userId, userData) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar un usuario (soft delete - marcar como inactivo)
 */
export async function deleteUser(userId) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      active: false,
      deletedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar si un usuario es SuperAdmin
 */
export function isSuperAdmin(userRole) {
  return userRole === "superadmin";
}

/**
 * Verificar si un usuario es Admin o superior
 */
export function isAdmin(userRole) {
  return userRole === "admin" || userRole === "superadmin";
}
