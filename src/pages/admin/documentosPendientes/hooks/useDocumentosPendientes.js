import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, query, where, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useDocumentosPendientes = (userFlotaId) => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userFlotaId) {
      setTrabajadores([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "trabajadores"),
      where("flotaId", "==", userFlotaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc, index) => ({
          nro: index + 1,
          id: doc.id,
          firebaseId: doc.id,
          ...doc.data(),
        }))
        .filter((t) => {
          const docs = t.documentos || {};
          
          // Extraer documentos reales (excluyendo documentos_aprobados, updatedAt, etc)
          const docsReales = Object.keys(docs)
            .filter(key => {
              const isExcluded = ['documentos_aprobados', 'updatedAt', 'documentosActualizadoEn'].includes(key);
              const value = docs[key];
              const isObject = typeof value === 'object' && value !== null;
              return !isExcluded && isObject;
            });
          
          // Mostrar todos los que tengan documentos (pendientes O completados)
          return docsReales.length > 0;
        });
      setTrabajadores(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userFlotaId]);

  const handleApproveDocument = async (trabajadorId, docIndex) => {
    try {
      const trabajadorRef = doc(db, "trabajadores", trabajadorId);
      const trabajadorSnap = await getDoc(trabajadorRef);
      const docsObj = trabajadorSnap.data().documentos || {};
      
      // Actualizar el documento
      docsObj[docIndex].estado = "aprobado";
      docsObj[docIndex].aprobadoEn = new Date().toISOString();

      // Verificar si TODOS los documentos están aprobados
      const todosAprobados = Object.keys(docsObj)
        .filter(key => isNaN(Number(key))) // excluir documentos_aprobados
        .every(key => docsObj[key] && docsObj[key].estado === "aprobado");

      docsObj.documentos_aprobados = todosAprobados;

      const updateData = { documentos: docsObj };
      // Si todos están aprobados, se puede activar automáticamente (opcional)
      
      await updateDoc(trabajadorRef, updateData);
      return { success: true, message: "Documento aprobado correctamente" };
    } catch (error) {
      console.error("Error al aprobar documento:", error);
      return { success: false, message: "Error al aprobar documento" };
    }
  };

  const handleRejectDocument = async (trabajadorId, docIndex) => {
    try {
      const trabajadorRef = doc(db, "trabajadores", trabajadorId);
      const trabajadorSnap = await getDoc(trabajadorRef);
      const docsObj = trabajadorSnap.data().documentos || {};
      
      docsObj[docIndex].estado = "rechazado";
      docsObj[docIndex].rechazadoEn = new Date().toISOString();

      // Si se rechaza un documento, documentos_aprobados = false
      docsObj.documentos_aprobados = false;

      await updateDoc(trabajadorRef, { 
        documentos: docsObj,
        activo: false // Desactivar automáticamente
      });
      return { success: true, message: "Documento rechazado y trabajador desactivado" };
    } catch (error) {
      console.error("Error al rechazar documento:", error);
      return { success: false, message: "Error al rechazar documento" };
    }
  };

  return { trabajadores, loading, handleApproveDocument, handleRejectDocument };
};

export const useUserFlota = (userId) => {
  const [userFlotaId, setUserFlotaId] = useState(null);
  const [nombreFlota, setNombreFlota] = useState("Flota");

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, "users", userId), async (snapshot) => {
      if (snapshot.exists()) {
        const flotaId = snapshot.data().flotaId;
        setUserFlotaId(flotaId);

        if (flotaId) {
          const flotaSnap = await getDoc(doc(db, "flotas", flotaId));
          if (flotaSnap.exists()) {
            setNombreFlota(flotaSnap.data().nombre || "Flota");
          }
        }
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return { userFlotaId, nombreFlota };
};
