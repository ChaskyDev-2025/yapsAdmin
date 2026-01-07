// src/services/imageUploadService.js
import { doc, updateDoc, collection } from "firebase/firestore";
import { db } from "../data/firebase/firebase";
import { storage } from "../data/firebase/firebase";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

/**
 * Sube una imagen a la API externa y retorna la URL
 * @param {File} file - Archivo de imagen a subir
 * @param {string} folder - Carpeta donde se guardará (ej: 'Qryaaps')
 * @returns {Promise<string>} URL de la imagen subida
 */
export async function uploadImageToApi(file, folder = "Qryaaps") {
  try {
    const uri = "https://apiplazacomida.chaskydev.com/api/v1/images/save";

    const formData = new FormData();
    formData.append("folder", folder);
    formData.append("file", file);

    const response = await fetch(uri, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al subir imagen: ${response.status} ${errorText}`);
    }

    const body = await response.json();
    const url = body?.url;

    if (!url || url === "") {
      throw new Error(`Respuesta JSON sin URL válida: ${JSON.stringify(body)}`);
    }

    return url;
  } catch (error) {
    console.error("❌ Error en uploadImageToApi:", error);
    throw error;
  }
}

/**
 * Guarda la URL del QR en el documento del usuario superadmin
 * @param {string} userId - UID del usuario
 * @param {string} qrImageUrl - URL de la imagen del QR
 */
export async function saveQrImageUrl(userId, qrImageUrl) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      qrImage: qrImageUrl,
      qrImageUpdatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("❌ Error guardando URL del QR:", error);
    throw error;
  }
}

/**
 * Obtiene la URL del QR del usuario
 * @param {object} userData - Datos del usuario desde Firebase
 * @returns {string|null} URL de la imagen del QR o null
 */
export function getQrImageUrl(userData) {
  return userData?.qrImage || null;
}

/**
 * Sube una imagen QR a Firebase Storage y guarda la URL en Firestore
 * @param {File} file - Archivo de imagen QR a subir
 * @param {string} flotaId - ID de la flota
 * @returns {Promise<{url: string}>} URL de descarga de la imagen
 */
export async function uploadQrFlotaToStorage(file, flotaId) {
  try {
    if (!file) {
      throw new Error("No se proporcionó archivo");
    }

    // Crear referencia en Storage
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const storagePath = `qr/${flotaId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Subir archivo a Firebase Storage
    await uploadBytes(storageRef, file);

    // Obtener URL de descarga desde Firebase Storage
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      url: downloadUrl,
    };
  } catch (error) {
    console.error("❌ Error en uploadQrFlotaToStorage:", error);
    throw error;
  }
}

/**
 * Guarda la URL del QR en el documento de una flota
 * @param {string} flotaId - ID de la flota
 * @param {string} qrImageUrl - URL de la imagen del QR
 */
export async function saveFlotaQrImageUrl(flotaId, qrImageUrl) {
  try {
    const flotaRef = doc(db, "flotas", flotaId);
    await updateDoc(flotaRef, {
      qrImage: qrImageUrl,
      qrImageUpdatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("❌ Error guardando URL del QR de flota:", error);
    throw error;
  }
}

/**
 * Obtiene la URL del QR de una flota
 * @param {object} flotaData - Datos de la flota desde Firebase
 * @returns {string|null} URL de la imagen del QR o null
 */
export function getFlotaQrImageUrl(flotaData) {
  return flotaData?.qrImage || null;
}

/**
 * Sube un QR de SuperAdmin a Firebase Storage
 * @param {File} file - Archivo de imagen QR a subir
 * @param {string} userId - UID del superadmin
 * @returns {Promise<{url: string}>} URL de descarga de la imagen
 */
export async function uploadQrSuperAdminToStorage(file, userId) {
  try {
    if (!file) {
      throw new Error("No se proporcionó archivo");
    }

    if (!userId) {
      throw new Error("No se proporcionó UID del usuario");
    }

    // Crear referencia en Storage
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const storagePath = `qr/superadmin/${userId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Subir archivo a Firebase Storage
    await uploadBytes(storageRef, file);

    // Obtener URL de descarga desde Firebase Storage
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      url: downloadUrl,
    };
  } catch (error) {
    console.error("❌ Error en uploadQrSuperAdminToStorage:", error);
    throw error;
  }
}

/**
 * Sube una foto de perfil a Firebase Storage
 * @param {File} file - Archivo de imagen de perfil a subir
 * @param {string} userId - UID del usuario (superadmin, admin, etc)
 * @returns {Promise<{url: string}>} URL de descarga de la imagen
 */
export async function uploadProfilePhotoToStorage(file, userId) {
  try {
    if (!file) {
      throw new Error("No se proporcionó archivo");
    }

    if (!userId) {
      throw new Error("No se proporcionó UID del usuario");
    }

    // Crear referencia en Storage
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const storagePath = `perfil/${userId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Subir archivo a Firebase Storage
    await uploadBytes(storageRef, file);

    // Obtener URL de descarga desde Firebase Storage
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      url: downloadUrl,
    };
  } catch (error) {
    console.error("❌ Error en uploadProfilePhotoToStorage:", error);
    throw error;
  }
}

/**
 * Sube un comprobante a Firebase Storage y lo registra en Firestore
 * @param {File} file - Archivo del comprobante
 * @param {string} flotaId - ID de la flota
 * @param {string} solicitudId - ID de la solicitud de recarga (opcional)
 * @returns {Promise<{url: string, id: string}>} URL del comprobante e ID del documento
 */
export async function uploadComprobanteFlota(file, flotaId, solicitudId = null) {
  try {
    if (!file) {
      throw new Error("No se proporcionó archivo");
    }

    // Crear referencia en Storage
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const storagePath = `comprobantes_flota/${flotaId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Subir archivo a Firebase Storage
    await uploadBytes(storageRef, file);

    // Obtener URL de descarga desde Firebase Storage
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      url: downloadUrl,
    };
  } catch (error) {
    console.error("❌ Error en uploadComprobanteFlota:", error);
    throw error;
  }
}

/**
 * Lista todas las imágenes de la carpeta vehiculosImagenes en Firebase Storage
 * @returns {Promise<Array>} Array de objetos con {nombre, url}
 */
export async function listVehiculosImagenes() {
  try {
    const folderRef = ref(storage, "vehiculosImagenes");
    const result = await listAll(folderRef);
    
    const imagenes = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          nombre: itemRef.name,
          url: url,
          path: itemRef.fullPath
        };
      })
    );
    
    return imagenes.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch (error) {
    console.error("❌ Error listando imágenes de vehiculosImagenes:", error);
    throw error;
  }
}
