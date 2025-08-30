import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";  // Asegúrate de importar setDoc
import { db } from "../../../../data/firebase/firebase";

// Función para agregar un historial de recarga con la nueva estructura
export const agregarHistorialRecarga = async (uid, { estado = "recarga", monto } = {}) => {
  try {
    // Obtener la fecha actual
    const fecha = new Date();

    // Obtener el año y mes actuales
    const año = fecha.getFullYear();  // Ejemplo: 2025
    const mes = fecha.getMonth();  // Obtiene el número del mes (0-11)

    // Convertir el número del mes a su nombre (por ejemplo, 0 -> "enero", 1 -> "febrero", ...)
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const mesNombre = meses[mes];  // Ejemplo: "enero"

    // Crear el nombre del documento del año como "2025"
    const documentoAño = `${año}`;  // Ejemplo: "2025"

    // Crear el nombre de la subcolección del mes como "enero"
    const documentoMes = `${mesNombre}`;  // Ejemplo: "enero"

    // Crear la fecha actual en formato dd-mm-yyyy (sin la hora)
    const fechaActual = `${fecha.getDate()}-${fecha.getMonth() + 1}-${fecha.getFullYear()}`;  // Ejemplo: "28-08-2025"

    // Crear la hora actual en formato hh:mm:ss
    const horaActual = `${fecha.getHours()}:${fecha.getMinutes()}:${fecha.getSeconds()}`;  // Ejemplo: "18:38:47"

    // Crear el nombre del documento "fechaActual" como solo la fecha
    const documentoFecha = `${fechaActual}`;  // Ejemplo: "28-08-2025"

    // Crear el nombre dinámico para el mapa usando la fecha y hora actuales
    const fechaHoraActual = `${fechaActual} ${horaActual}`;  // Ejemplo: "28-08-2025 18:38:47"

    // Crear los datos que deseas guardar en el mapa
    const historialData = {
      [fechaHoraActual]: {
        estado,           // antes: "recarga"
        fecha: fechaHoraActual,
        monto,            // antes: 280
      },
    };

    // Referencia al documento dentro de la estructura de subcolecciones
    const historialRef = doc(db, "users", uid, "historial-saldo", documentoAño, documentoMes, documentoFecha);

    // Verificar si el documento existe
    const docSnap = await getDoc(historialRef);
    
    if (docSnap.exists()) {
      // Si el documento ya existe, usamos updateDoc para agregar los nuevos datos sin sobrescribir los existentes
      await updateDoc(historialRef, {
        // Usamos el operador "field" para actualizar el mapa sin reemplazar todo
        ...historialData,
      });
    } else {
      // Si el documento no existe, usamos setDoc para crearlo
      await setDoc(historialRef, historialData);
    }

    console.log("Historial de recarga agregado correctamente");
  } catch (e) {
    console.error("Error al agregar al historial:", e);
  }
};
