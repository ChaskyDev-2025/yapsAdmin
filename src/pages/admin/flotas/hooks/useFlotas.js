// src/pages/admin/flotas/hooks/useFlotas.js
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

export const useFlotas = () => {
  const [flotas, setFlotas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFlotas = async () => {
    try {
      setLoading(true);
      const flotasCollection = collection(db, "flotas");
      const flotasSnapshot = await getDocs(flotasCollection);
      const flotasList = flotasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFlotas(flotasList);
    } catch (error) {
      console.error("Error al obtener flotas:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createFlota = async (flotaData) => {
    const nuevaFlotaRef = await addDoc(collection(db, "flotas"), {
      ...flotaData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await fetchFlotas();
    return nuevaFlotaRef.id;
  };

  const updateFlota = async (flotaId, flotaData) => {
    const flotaRef = doc(db, "flotas", flotaId);
    await updateDoc(flotaRef, {
      ...flotaData,
      updatedAt: serverTimestamp(),
    });
    await fetchFlotas();
  };

  const deleteFlota = async (flotaId) => {
    await deleteDoc(doc(db, "flotas", flotaId));
    await fetchFlotas();
  };

  const toggleHabilitado = async (flotaId, currentState) => {
    const flotaRef = doc(db, "flotas", flotaId);
    await updateDoc(flotaRef, {
      habilitado: !currentState,
      updatedAt: serverTimestamp(),
    });
    await fetchFlotas();
  };

  useEffect(() => {
    fetchFlotas();
  }, []);

  return {
    flotas,
    loading,
    fetchFlotas,
    createFlota,
    updateFlota,
    deleteFlota,
    toggleHabilitado,
  };
};
