## Cambios Realizados: Documentos por Ciudad

### IMPLEMENTACIÓN COMPLETADA

#### 1. **docs.jsx** - Refactorización Principal
```jsx
✅ Agregado: Const CIUDADES con 9 departamentos
✅ Agregado: State ciudadSeleccionada (default: "La Paz")
✅ Agregado: Filtrado documentosPorCiudad basado en ciudad seleccionada
✅ Agregado: Tabs para seleccionar ciudad
✅ Modificado: handleSave para incluir campo ciudad
✅ Modificado: Tabla2 para mostrar solo documentos de ciudad seleccionada
```

#### 2. **Props Pasadas a DocumentoModal**
```jsx
✅ Agregado: ciudadSeleccionada prop
   → Permite que el modal sepa en qué ciudad se está creando
```

### ESTRUCTURA EN FIREBASE (Actual)
```
crear-documentos/
├── doc_1 (Sin campo ciudad)
├── doc_2 (Sin campo ciudad)
└── doc_3 (Sin campo ciudad)
```

### PRÓXIMOS PASOS NECESARIOS

#### 1. **Actualizar DocumentoModal** (modalCrearDocs/DocumentoModal.jsx)
```jsx
// Recibir ciudadSeleccionada
const DocumentoModal = ({ open, onClose, onSave, ciudadSeleccionada }) => {
  // Ya no necesita cambios - el handleSave en docs.jsx agrega ciudad
}
```

#### 2. **Agregar Campo Ciudad en BD**
Migración de datos existentes:
```javascript
// Script para ejecutar en Firebase Console o Node
- Leer todos los docs de "crear-documentos"
- Agregarles campo ciudad con valor por defecto (ej: "La Paz")
- Guardar actualización
```

#### 3. **Visualizar Ciudad en Tabla**
Agregar columna en Columns.jsx:
```jsx
{
  field: "ciudad",
  headerName: "Ciudad",
  width: 120,
  sortable: true,
}
```

#### 4. **Validaciones en DocumentoModal**
- Mostrar cual ciudad se está editando
- Permitir cambiar ciudad si es SuperAdmin
- Restricción para admins de flota

### COMPORTAMIENTO ACTUAL

**Crear Documento:**
1. Usuario selecciona pestaña de ciudad
2. Hace clic en "Crear documento"
3. Abre modal
4. Al guardar, se agrega `ciudad: ciudadSeleccionada`
5. Documento se guarda con la ciudad asociada

**Ver Documentos:**
1. Al cambiar pestaña, tabla filtra automáticamente
2. Solo muestra docs donde `doc.ciudad === ciudadSeleccionada`

**Editar/Eliminar:**
- Funciona como antes (sin cambios)

### NOTAS IMPORTANTES

⚠️ **Documentos sin campo ciudad:**
- Los documentos creados antes de este cambio NO tendrán campo "ciudad"
- La tabla mostrará vacío al filtrar
- Necesita migración de datos

✅ **Nuevos documentos:**
- Se crearán con campo ciudad automáticamente

### PROPÓXIMAS MEJORAS RECOMENDADAS

1. Cambiar estructura en Firestore:
   ```
   crear-documentos/{ciudad}/documentosPorCiudad/{id}
   ```
   Similar a servicios/tarifas

2. En flotas, cambiar estructura:
   ```
   flotas/{id}/documentosAsignados {
     "La Paz": [doc_ids],
     "Santa Cruz": [doc_ids]
   }
   ```

3. Crear componente de migración de datos
