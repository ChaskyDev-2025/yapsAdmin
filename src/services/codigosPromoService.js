import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, getDoc } from "firebase/firestore";
import { db } from "../data/firebase/firebase";

const PROMO_PATH = "promociones/CODIGOS_PROMOCIONALES/codigos_promocionales";

/**
 * Crear o actualizar un código promocional
 * @param {Object} codigo - Datos del código
 * @param {string} id - ID del documento (opcional, se genera si no existe)
 * @returns {Promise<string>} ID del código creado/actualizado
 */
export const guardarCodigoPromo = async (codigo, id = null) => {
  try {
    const docId = id || codigo.codigo.toUpperCase();
    const now = new Date().toISOString();

    const data = {
      codigo: codigo.codigo.toUpperCase(),
      departamento: codigo.departamento || "",
      descripcion: codigo.descripcion || "",
      descuentoPorcentaje: parseInt(codigo.descuentoPorcentaje) || 0,
      descuentoMaximo: parseInt(codigo.descuentoMaximo) || 0,
      usosActuales: codigo.usosActuales || 0,
      usosMaximos: parseInt(codigo.usosMaximos) || 0,
      activo: codigo.activo ?? true,
      tipoCategoria: codigo.tipoCategoria || "viajes",
      fechaExpiracion: codigo.fechaExpiracion || null,
      updatedAt: now,
      ...(id ? {} : { fechaCreacion: now })
    };

    const codigoRef = doc(db, PROMO_PATH, docId);
    
    if (id) {
      await updateDoc(codigoRef, data);
    } else {
      await setDoc(codigoRef, data);
    }

    return docId;
  } catch (error) {
    console.error('Error al guardar código promocional:', error);
    throw error;
  }
};

/**
 * Eliminar un código promocional
 * @param {string} codigoId - ID del código a eliminar
 * @returns {Promise<void>}
 */
export const eliminarCodigoPromo = async (codigoId) => {
  try {
    const codigoRef = doc(db, PROMO_PATH, codigoId);
    await deleteDoc(codigoRef);
  } catch (error) {
    console.error('Error al eliminar código promocional:', error);
    throw error;
  }
};

/**
 * Obtener todos los códigos promocionales
 * @returns {Promise<Array>} Lista de códigos
 */
export const obtenerTodosLosCodeigos = async () => {
  try {
    const codigosRef = collection(db, PROMO_PATH);
    const snapshot = await getDocs(codigosRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener códigos promocionales:', error);
    return [];
  }
};

/**
 * Obtener códigos por departamento
 * @param {string} departamento - Departamento a filtrar
 * @returns {Promise<Array>} Lista de códigos
 */
export const obtenerCodigosPorDepartamento = async (departamento) => {
  try {
    const codigosRef = collection(db, PROMO_PATH);
    const q = query(codigosRef, where("departamento", "==", departamento));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener códigos por departamento:', error);
    return [];
  }
};

/**
 * Obtener códigos activos
 * @returns {Promise<Array>} Lista de códigos activos
 */
export const obtenerCodigosActivos = async () => {
  try {
    const codigosRef = collection(db, PROMO_PATH);
    const q = query(codigosRef, where("activo", "==", true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener códigos activos:', error);
    return [];
  }
};

/**
 * Incrementar usos de un código
 * @param {string} codigoId - ID del código
 * @returns {Promise<void>}
 */
export const incrementarUsos = async (codigoId) => {
  try {
    const codigoRef = doc(db, PROMO_PATH, codigoId);
    const codigoSnap = await getDoc(codigoRef);

    if (!codigoSnap.exists()) {
      throw new Error('Código no encontrado');
    }

    const codigo = codigoSnap.data();
    const usosActuales = (codigo.usosActuales || 0) + 1;

    await updateDoc(codigoRef, {
      usosActuales: usosActuales
    });
  } catch (error) {
    console.error('Error al incrementar usos:', error);
    throw error;
  }
};
