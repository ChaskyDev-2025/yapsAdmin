import { useCallback, useState } from "react";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const POLITICAS_COLLECTION = "configuracion";
const POLITICAS_DOC = "politicas";

export const usePoliticas = () => {
  const [contenido, setContenido] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const db = getFirestore();

  const cargarPoliticas = useCallback(async () => {
    try {
      setLoading(true);
      const docRef = doc(db, POLITICAS_COLLECTION, POLITICAS_DOC);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setContenido(docSnap.data().contenido || "");
      } else {
        // Primera carga: crear documento vacío
        await setDoc(docRef, {
          contenido: "",
          actualizadoEn: new Date(),
          creadoEn: new Date(),
        });
        setContenido("");
      }
    } catch (error) {
      console.error("Error al cargar políticas:", error);
      setMessage({
        type: "error",
        text: "Error al cargar las políticas de privacidad",
      });
    } finally {
      setLoading(false);
    }
  }, [db]);

  const guardarPoliticas = useCallback(
    async (nuevoContenido) => {
      if (!nuevoContenido.trim()) {
        setMessage({ type: "warning", text: "Por favor ingresa contenido" });
        return false;
      }

      try {
        setSaving(true);
        const docRef = doc(db, POLITICAS_COLLECTION, POLITICAS_DOC);
        await setDoc(docRef, {
          contenido: nuevoContenido,
          actualizadoEn: new Date(),
        });

        setContenido(nuevoContenido);
        setMessage({
          type: "success",
          text: "Políticas de privacidad guardadas correctamente",
        });
        return true;
      } catch (error) {
        console.error("Error al guardar políticas:", error);
        setMessage({ type: "error", text: "Error al guardar las políticas" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [db]
  );

  const limpiarMensaje = useCallback(() => {
    setMessage({ type: "", text: "" });
  }, []);

  return {
    contenido,
    setContenido,
    loading,
    saving,
    message,
    cargarPoliticas,
    guardarPoliticas,
    limpiarMensaje,
  };
};
