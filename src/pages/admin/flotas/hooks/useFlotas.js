// src/pages/admin/flotas/hooks/useFlotas.js
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, deleteField, setDoc, getDoc } from "firebase/firestore";
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
    
    // Crear billetera con saldo y transacciones
    try {
      const saldoRef = doc(db, "flotas", nuevaFlotaRef.id, "billetera", "saldo");
      await setDoc(saldoRef, {
        monto: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const transaccionesRef = doc(db, "flotas", nuevaFlotaRef.id, "billetera", "transacciones");
      await setDoc(transaccionesRef, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error al crear billetera:", error);
    }
    
    await fetchFlotas();
    return nuevaFlotaRef.id;
  };

  const updateFlota = async (flotaId, flotaData) => {
    const flotaRef = doc(db, "flotas", flotaId);
    
    // Eliminar solo el campo 'nombre' redundante de documentosFlota
    const dataToUpdate = { ...flotaData };
    if (dataToUpdate.documentosFlota) {
      const { nombre, ...documentosSinNombre } = dataToUpdate.documentosFlota;
      dataToUpdate.documentosFlota = documentosSinNombre;
    }
    
    await updateDoc(flotaRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp(),
    });
    
    // Crear billetera con saldo y transacciones si no existe (SIN RESETEAR SALDO)
    try {
      const saldoRef = doc(db, "flotas", flotaId, "billetera", "saldo");
      
      // Obtener el saldo actual para NO perderlo
      const saldoSnapshot = await getDoc(saldoRef);
      const saldoActual = saldoSnapshot.exists() ? saldoSnapshot.data().monto : 0;
      
      await setDoc(saldoRef, {
        monto: saldoActual,  // Mantener saldo actual, NO resetear a 0
        createdAt: saldoSnapshot.exists() ? saldoSnapshot.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      const transaccionesRef = doc(db, "flotas", flotaId, "billetera", "transacciones");
      await setDoc(transaccionesRef, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error("Error al crear billetera:", error);
    }
    
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
