# Asignar flotaId a Usuario

## Problema
El usuario actual NO tiene `flotaId` asignado en Firebase, por eso los documentos se guardan en la colección global en vez de en `flotas/{flotaId}/documentos`.

## Solución Rápida

### Opción 1: Desde Firebase Console
1. Ve a Firebase Console → Firestore Database
2. Busca la colección `users`
3. Encuentra tu usuario (busca por email: `nkurojas@hotmail.com`)
4. Haz clic en editar
5. Agrega el campo: `flotaId: "4u2xd5RNz0tb2mz7t17w"`
6. Guarda los cambios
7. Recarga la aplicación

### Opción 2: Desde la consola del navegador
1. Abre la consola del navegador (F12)
2. Pega este código:

```javascript
// Importar Firebase
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "./src/data/firebase/firebase";

// Asignar flotaId al usuario actual
const asignarFlotaId = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error("No hay usuario logueado");
    return;
  }
  
  const flotaId = "4u2xd5RNz0tb2mz7t17w"; // ID de Paradise
  
  await updateDoc(doc(db, "users", user.uid), {
    flotaId: flotaId
  });
  
  console.log("✅ flotaId asignado:", flotaId);
  console.log("🔄 Recarga la página");
};

asignarFlotaId();
```

### Opción 3: Desde Gestión de Usuarios (RECOMENDADO)
1. Inicia sesión como SuperAdmin
2. Ve a **Gestión Usuarios** → tab **Administradores**
3. Edita tu usuario
4. En el campo "Flota", selecciona "Paradise"
5. Guarda
6. Vuelve a iniciar sesión con tu usuario

## Verificación
Después de asignar el flotaId:
1. Recarga la aplicación
2. Verás en consola: `🔑 AuthContext - Usuario:` con el flotaId
3. Al crear un documento verás: `💾 FirebaseRepository.create():` con la ruta `flotas/4u2xd5RNz0tb2mz7t17w/documentos`
4. Los documentos aparecerán en la subcollección correcta
