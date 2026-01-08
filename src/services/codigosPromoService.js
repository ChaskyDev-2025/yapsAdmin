import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, getDoc } from "firebase/firestore";
import { db } from "../data/firebase/firebase";

const PROMO_PATH = "promociones/CODIGOS_PROMOCIONALES/codigos_promocionales";

/**
 * Convertir una fecha a formato español con zona horaria
 * Ej: "30 de noviembre de 2026 a las 11:59:59 p.m. UTC-4"
 */
const formatearFechaEspanol = (fecha) => {
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", 
                 "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  const año = fecha.getFullYear();
  let horas = fecha.getHours();
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  const segundos = String(fecha.getSeconds()).padStart(2, "0");
  
  const ampm = horas >= 12 ? "p.m." : "a.m.";
  if (horas > 12) horas -= 12;
  if (horas === 0) horas = 12;
  
  const horasFormato = String(horas).padStart(2, "0");
  
  return `${dia} de ${mes} de ${año} a las ${horasFormato}:${minutos}:${segundos} ${ampm} UTC-4`;
};

/**
 * Crear o actualizar un código promocional
 * @param {Object} codigo - Datos del código
 * @param {string} id - ID del documento (opcional, se genera si no existe)
 * @returns {Promise<string>} ID del código creado/actualizado
 */
export const guardarCodigoPromo = async (codigo, id = null) => {
  try {
    const docId = id || codigo.codigo.toUpperCase();
    const now = new Date();

    // Convertir fechaExpiracion al formato español
    let fechaExpiracion = null;
    if (codigo.fechaExpiracion) {
      const fecha = new Date(codigo.fechaExpiracion);
      if (!isNaN(fecha.getTime())) {
        fechaExpiracion = formatearFechaEspanol(fecha);
      }
    }

    // Convertir fechaCreacion al formato español si no existe
    let fechaCreacion = null;
    if (id) {
      // Si es actualización, mantener la fechaCreacion original
      fechaCreacion = codigo.fechaCreacion;
    } else {
      // Si es creación, generar fechaCreacion en formato español
      fechaCreacion = formatearFechaEspanol(now);
    }

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
      fechaExpiracion: fechaExpiracion,
      fechaCreacion: fechaCreacion,
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
