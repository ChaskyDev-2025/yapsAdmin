# Integración de Tickets en el Sistema de Referidos

## Descripción
Cuando un pasajero o conductor completa un viaje, debe recibir automáticamente un ticket que lo hace elegible para sorteos en el sistema de referidos.

## Estructura de Datos

### Ordenes (Viajes Completados)
En Firestore, la colección `ordenes` contiene:
```
id: "orden123"
uidTaxista: "uid_del_conductor"      // UID del trabajador (conductor)
uidUser: "uid_del_pasajero"           // UID del pasajero
estado: "completado"                   // Estado del viaje
precio: 45.50
...otros datos de la orden
```

### Tickets en Usuarios
Los tickets se almacenan en el documento del usuario (trabajador o pasajero):
```
tickets: {
  General: 2,           // Número de tickets para viajes generales
  Especial: 1,          // Número de tickets para viajes especiales
  updatedAt: "2025-12-12T..."  // Timestamp de última actualización
}
```

## Cómo Integrar

### En la App Cliente (Donde se Completan Viajes)

Cuando se marca una orden como completada, importar y llamar:

```javascript
import { procesarOrdenCompletada } from '../services/referidosService';

// Después de completar el viaje
const orden = { 
  id: "orden123",
  uidTaxista: "uid_conductor",
  uidUser: "uid_pasajero",
  estado: "completado"
};

await procesarOrdenCompletada(orden);
```

### Ejemplo Completo

En la función que marca una orden como completada:

```javascript
import { procesarOrdenCompletada } from '../services/referidosService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../data/firebase/firebase';

const completarOrden = async (ordenId) => {
  try {
    const ordenRef = doc(db, 'ordenes', ordenId);
    
    // 1. Obtener la orden antes de actualizar
    const ordenSnap = await getDoc(ordenRef);
    const orden = { id: ordenId, ...ordenSnap.data() };
    
    // 2. Actualizar estado a completado
    await updateDoc(ordenRef, {
      estado: 'completado',
      fechaCompletado: new Date()
    });
    
    // 3. Agregar tickets a ambos usuarios
    await procesarOrdenCompletada(orden);
    
    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error };
  }
};
```

## Funciones Disponibles

### `procesarOrdenCompletada(orden)`
- **Descripción**: Agrega automáticamente tickets al conductor y pasajero
- **Parámetros**: 
  - `orden` (Object): Objeto con `uidTaxista`, `uidUser`, `id`
- **Retorna**: Promise<boolean>

### `agregarTicketPorViaje(userId, userType, viajeTipo)`
- **Descripción**: Agrega un ticket a un usuario específico
- **Parámetros**:
  - `userId` (string): ID del usuario
  - `userType` (string): 'trabajador' o 'pasajero'
  - `viajeTipo` (string): Tipo de viaje ('General', 'Especial', etc.)
- **Retorna**: Promise<boolean>

### `obtenerTotalTickets(userId, userType)`
- **Descripción**: Obtiene el total de tickets de un usuario
- **Parámetros**:
  - `userId` (string): ID del usuario
  - `userType` (string): 'trabajador' o 'pasajero'
- **Retorna**: Promise<number>

## Ubicaciones Donde Implementar

1. **Firebase Cloud Functions** (Recomendado):
   - Crear un trigger `onUpdate` en la colección `ordenes`
   - Cuando `estado` cambie a 'completado', ejecutar `procesarOrdenCompletada()`

2. **Frontend de la App Cliente**:
   - En el componente que maneja la finalización de viajes
   - Después de actualizar el estado a 'completado' en Firestore

3. **Backend API** (Si existe):
   - En el endpoint que marca órdenes como completadas

## Notas
- Los tickets se incrementan automáticamente por cada viaje completado
- Se agreggan tickets tanto al conductor como al pasajero
- El campo `updatedAt` se actualiza cada vez que se agrega un ticket
- El panel de referidos muestra los tickets correctamente agrupados por tipo

