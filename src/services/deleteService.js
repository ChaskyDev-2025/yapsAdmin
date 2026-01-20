import { collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "../data/firebase/firebase";

/**
 * Elimina un documento y TODAS sus subcollecciones recursivamente
 * @param {string} collectionName - Nombre de la colección (ej: "trabajadores", "pasajeros")
 * @param {string} docId - ID del documento a eliminar
 * @param {array} subcollectionsToDelete - (Opcional) Lista específica de subcollecciones a eliminar
 */
export async function deleteDocumentWithSubcollections(collectionName, docId, subcollectionsToDelete = null) {
  try {
    const docRef = doc(db, collectionName, docId);
    
    // 1. Obtener subcollecciones a eliminar
    let subcollections = subcollectionsToDelete;
    if (!subcollections) {
      subcollections = await getSubcollections(docRef, collectionName);
    }
    
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
 * Obtiene los nombres de subcollecciones específicas según el tipo de colección
 */
async function getSubcollections(docRef, collectionName) {
  try {
    // Define subcollecciones específicas por tipo de colección
    const subcollectionMap = {
      trabajadores: ["documentos", "billetera", "historial-billetera", "tiempos_online"],
      pasajeros: ["billetera", "historial-billetera"],
      usuarios: ["billetera", "historial-billetera"],
      flotas: ["solicitudes_recarga", "historial"],
    };
    
    // Retornar las subcollecciones específicas o una lista vacía si no se define
    return subcollectionMap[collectionName] || [];
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
    const MAX_BATCH_SIZE = 500; // Firestore límite de 500 operaciones por batch
    
    for (const docSnap of snapshot.docs) {
      // Agregar el documento al batch para eliminación
      batch.delete(docSnap.ref);
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
