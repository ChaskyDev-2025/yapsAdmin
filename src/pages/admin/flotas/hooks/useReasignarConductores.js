import { updateDoc, doc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useReasignarConductores = () => {
  const reasignarConductoresYEliminarFlota = async (
    flotaId,
    reasignaciones
  ) => {
    try {
      // Reasignar conductores
      for (const [conductorId, nuevaFlotaId] of Object.entries(
        reasignaciones
      )) {
        if (nuevaFlotaId) {
          await updateDoc(doc(db, "trabajadores", conductorId), {
            flotaId: nuevaFlotaId,
          });
        }
      }

      // Obtener la flota para conocer los admins asignados
      const flotaRef = doc(db, "flotas", flotaId);
      const flotaSnapshot = await getDoc(flotaRef);
      
      if (flotaSnapshot.exists()) {
        const uidPropietarios = flotaSnapshot.data().uidPropietarios || [];
        
        // Limpiar flotaId de todos los admins asignados
        for (const uid of uidPropietarios) {
          try {
            await updateDoc(doc(db, "users", uid), { 
              flotaId: null,
              updatedAt: serverTimestamp()
            });
          } catch (error) {
            console.warn(`⚠️ No se pudo limpiar flotaId del admin ${uid}:`, error);
          }
        }
      }

      // Eliminar la flota
      await deleteDoc(flotaRef);

      return {
        success: true,
        message: "Flota eliminada y conductores reasignados correctamente",
      };
    } catch (error) {
      console.error("Error en reasignación:", error);
      throw error;
    }
  };

  return {
    reasignarConductoresYEliminarFlota,
  };
};
