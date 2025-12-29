import { updateDoc, doc, deleteDoc } from "firebase/firestore";
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

      // Eliminar la flota
      await deleteDoc(doc(db, "flotas", flotaId));

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
