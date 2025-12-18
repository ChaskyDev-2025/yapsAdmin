// src/services/imageUploadService.js
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../data/firebase/firebase";

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
