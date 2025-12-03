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
          const docs = t.documentos || [];
          return (
            t.role === "driver" &&
            docs.some((d) => d.estado !== "aprobado" && d.estado !== "rechazado")
          );
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
      const docs = trabajadorSnap.data().documentos || [];
      docs[docIndex].estado = "aprobado";
      docs[docIndex].aprobadoEn = new Date().toISOString();

      await updateDoc(trabajadorRef, { documentos: docs });
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
      const docs = trabajadorSnap.data().documentos || [];
      docs[docIndex].estado = "rechazado";
      docs[docIndex].rechazadoEn = new Date().toISOString();

      await updateDoc(trabajadorRef, { documentos: docs });
      return { success: true, message: "Documento rechazado" };
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
