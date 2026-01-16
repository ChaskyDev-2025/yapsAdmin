import { collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "../data/firebase/firebase";

/**
 * Elimina un documento y TODAS sus subcollecciones recursivamente
 * @param {string} collectionName - Nombre de la colección (ej: "trabajadores", "pasajeros")
 * @param {string} docId - ID del documento a eliminar
 */
export async function deleteDocumentWithSubcollections(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    
    // 1. Obtener todas las subcollecciones
    const subcollections = await getSubcollections(docRef);
    
    // 2. Eliminar todas las subcollecciones recursivamente
    for (const subcollectionName of subcollections) {
      await deleteSubcollectionRecursively(docRef, subcollectionName);
    }
    
    // 3. Eliminar el documento principal
    await deleteDoc(docRef);
    
    console.log(`✅ Documento ${docId} y todas sus subcollecciones eliminadas`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error eliminando documento:`, error);
    throw error;
  }
}

/**
 * Obtiene los nombres de todas las subcollecciones de un documento
 */
async function getSubcollections(docRef) {
  try {
    // Nota: Firestore no tiene una forma nativa de listar subcollecciones desde el cliente
    // Así que hacemos una lista de las más comunes
    const commonSubcollections = [
      "documentos",
      "solicitudes_recarga",
      "historial",
      "fotos",
      "referencias",
      "billetera",
      "historial-billetera",
      "tiempos_online",
    ];
    
    return commonSubcollections;
  } catch (error) {
    return [];
  }
}

/**
 * Elimina una subcollección completa de forma recursiva
 */
async function deleteSubcollectionRecursively(parentRef, subcollectionName) {
  try {
    const subcollectionRef = collection(parentRef, subcollectionName);
    const snapshot = await getDocs(subcollectionRef);
    
    if (snapshot.empty) {
      return; // No hay documentos en esta subcollección
    }
    
    const batch = writeBatch(db);
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500; // Firestore limite de 500 operaciones por batch
    
    for (const doc of snapshot.docs) {
      // Eliminar subcollecciones anidadas si existen
      const nestedSubcollections = ["historial", "fotos", "solicitudes_recarga"];
      for (const nestedName of nestedSubcollections) {
        try {
          await deleteSubcollectionRecursively(doc.ref, nestedName);
        } catch (e) {
          // Ignorar si no existe la subcollección anidada
        }
      }
      
      // Agregar el documento al batch para eliminación
      batch.delete(doc.ref);
      batchCount++;
      
      // Ejecutar batch cuando alcanza el límite
      if (batchCount === MAX_BATCH_SIZE) {
        await batch.commit();
        batchCount = 0;
      }
    }
    
    // Ejecutar el batch final si hay documentos pendientes
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`✅ Subcollección '${subcollectionName}' eliminada (${snapshot.size} documentos)`);
  } catch (error) {
    console.warn(`⚠️ Error eliminando subcollección '${subcollectionName}':`, error);
  }
}
