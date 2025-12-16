import { doc, getDoc } from "firebase/firestore";
import { db } from "../data/firebase/firebase";

/**
 * Obtiene los tickets de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} userType - Tipo de usuario: 'trabajador' o 'pasajero'
 * @returns {Promise<number>} Total de tickets
 */
export const obtenerTotalTickets = async (userId, userType) => {
  try {
    const userRef = doc(db, userType === 'trabajador' ? 'trabajadores' : 'pasajeros', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return 0;
    }

    const ticketsData = userSnap.data().tickets || {};
    let total = 0;

    Object.keys(ticketsData).forEach(key => {
      if (key !== 'updatedAt' && typeof ticketsData[key] === 'number') {
        total += ticketsData[key];
      }
    });

    return total;
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    return 0;
  }
};
