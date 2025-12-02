// src/services/userService.js
import { db, auth } from "../data/firebase/firebase";
import { collection, getDocs, doc, updateDoc, setDoc, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

/**
 * Crear un nuevo usuario admin en Firebase Auth y Firestore
 * El documento en Firestore usa el mismo UID de Authentication
 */
export async function createAdminUser(userData) {
  let currentUser = auth.currentUser; // Guardar referencia al usuario actual (SuperAdmin)
  
  try {
    console.log("🔧 Creando usuario en Authentication...");
    
    // 1. Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const uid = userCredential.user.uid;
    console.log("✅ Usuario creado en Auth con UID:", uid);
    
    // 2. Crear documento en Firestore usando el UID como ID del documento
    await setDoc(doc(db, "users", uid), {
      email: userData.email,
      role: userData.role || "admin",
      nombre: userData.nombre || "",
      flotaId: userData.flotaId || null,
      password: userData.password,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: userData.createdBy || null,
    });
    
    console.log("✅ Documento creado en Firestore:", `users/${uid}`);
    
    // 3. Cerrar sesión del usuario recién creado
    // Nota: Esto cerrará la sesión actual, por lo que el SuperAdmin debe volver a iniciar sesión
    await auth.signOut();
    
    return {
      success: true,
      id: uid,
      requiresRelogin: true, // Flag para indicar que se necesita re-login
    };

  } catch (error) {
    console.error("❌ Error creando usuario:", error);
    
    // Mensajes de error más amigables
    let errorMessage = error.message;
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Este email ya está registrado";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "La contraseña debe tener al menos 6 caracteres";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Email inválido";
    }
    
    return { success: false, error: errorMessage };
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
      const userData = doc.data();
      // Incluir todos los usuarios (activos e inactivos)
      users.push({ id: doc.id, ...userData });
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
    console.log("🗑️ Eliminando usuario:", userId); // Debug
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      active: false,
      deletedAt: new Date().toISOString(),
    });
    console.log("✅ Usuario marcado como inactivo"); // Debug
    return { success: true };
  } catch (error) {
    console.error("❌ Error eliminando usuario:", error);
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
