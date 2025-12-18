// src/services/userService.js
import { db, auth } from "../data/firebase/firebase";
import { collection, getDocs, doc, updateDoc, setDoc, query, where, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";

/**
 * Crear un nuevo usuario admin en Firebase Auth y Firestore
 * El documento en Firestore usa el mismo UID de Authentication
 */
export async function createAdminUser(userData) {
  try {
    // 0. Verificar si el email ya existe en Firebase Auth
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, userData.email);
      if (signInMethods.length > 0) {
        // Email existe en Auth, verificar si existe en Firestore
        const userQuery = query(collection(db, "users"), where("email", "==", userData.email));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          // Email en Auth pero NO en Firestore - usuario huérfano
          return { 
            success: false, 
            error: `El email ${userData.email} ya está registrado en el sistema pero no tiene perfil. Contacta al administrador.`,
            orphaned: true 
          };
        } else {
          // Email en ambos - usuario ya existe
          return { 
            success: false, 
            error: "Este email ya está registrado" 
          };
        }
      }
    } catch (error) {
      // Si hay error verificando, continuar igual (puede ser limitación de rate limit)
      console.warn("⚠️ No se pudo verificar email:", error);
    }
    
    // 1. Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const uid = userCredential.user.uid;
    
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
    
    // 3. Agregar el usuario a la flota si se especificó
    if (userData.flotaId) {
      try {
        const flotaRef = doc(db, "flotas", userData.flotaId);
        await updateDoc(flotaRef, {
          uidPropietarios: arrayUnion(uid),
        });
      } catch (error) {
        console.warn("⚠️ No se pudo agregar usuario a la flota:", error);
        // No lanzar error, continuar aunque falle esta operación
      }
    }
    
    return {
      success: true,
      id: uid,
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
    // Obtener datos anteriores del usuario para comparar flota
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)));
    let previousFlotaId = null;
    
    userSnapshot.forEach((doc) => {
      previousFlotaId = doc.data().flotaId;
    });
    
    // Actualizar usuario
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString(),
    });
    
    // Manejar cambios de flota
    if (userData.flotaId && userData.flotaId !== previousFlotaId) {
      // Remover de flota anterior si existe
      if (previousFlotaId) {
        try {
          const oldFlotaRef = doc(db, "flotas", previousFlotaId);
          await updateDoc(oldFlotaRef, {
            uidPropietarios: arrayRemove(userId),
          });
        } catch (error) {
          console.warn("⚠️ No se pudo remover usuario de flota anterior:", error);
        }
      }
      
      // Agregar a nueva flota
      try {
        const newFlotaRef = doc(db, "flotas", userData.flotaId);
        await updateDoc(newFlotaRef, {
          uidPropietarios: arrayUnion(userId),
        });
      } catch (error) {
        console.warn("⚠️ No se pudo agregar usuario a nueva flota:", error);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar un usuario (hard delete - elimina completamente de Firestore)
 */
export async function deleteUser(userId) {
  try {
    // 1. Obtener datos del usuario para remover de flotas si es necesario
    let userFlotaId = null;
    try {
      const userSnapshot = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)));
      userSnapshot.forEach((doc) => {
        userFlotaId = doc.data().flotaId;
      });
    } catch (error) {
      console.warn("⚠️ No se pudo obtener datos del usuario:", error);
    }

    // 2. Remover de flota si existe
    if (userFlotaId) {
      try {
        const flotaRef = doc(db, "flotas", userFlotaId);
        await updateDoc(flotaRef, {
          uidPropietarios: arrayRemove(userId),
        });
      } catch (error) {
        console.warn("⚠️ No se pudo remover usuario de flota:", error);
      }
    }

    // 3. Eliminar documento del usuario de Firestore
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    
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

/**
 * Sincronizar administrador a flota
 * Agrega o remueve un admin de la lista de propietarios de una flota
 */
export async function syncAdminToFlota(userId, newFlotaId, oldFlotaId = null) {
  try {
    // Remover de flota anterior si existe
    if (oldFlotaId) {
      try {
        const oldFlotaRef = doc(db, "flotas", oldFlotaId);
        await updateDoc(oldFlotaRef, {
          uidPropietarios: arrayRemove(userId),
        });
      } catch (error) {
        console.warn("⚠️ Error removiendo usuario de flota anterior:", error);
      }
    }
    
    // Agregar a nueva flota
    if (newFlotaId) {
      try {
        const newFlotaRef = doc(db, "flotas", newFlotaId);
        await updateDoc(newFlotaRef, {
          uidPropietarios: arrayUnion(userId),
        });
        return { success: true };
      } catch (error) {
        console.error("❌ Error agregando usuario a flota:", error);
        return { success: false, error: error.message };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error sincronizando admin a flota:", error);
    return { success: false, error: error.message };
  }
}
