## Análisis: Reestructuración de Documentos por Ciudades

### ESTADO ACTUAL
```
crear-documentos/
├── doc_1 (Licencia - Global)
├── doc_2 (SOAT - Global)
└── doc_3 (Inspección - Global)

flotas/{flotaId}/
└── documentos.{docId}: {...}  (Mapa de documentos asignados)
```

### ESTADO DESEADO
Estructura similar a servicios por departamento:

```
crear-documentos/
├── La Paz/
│   ├── Licencia
│   ├── SOAT
│   └── Inspección
├── Santa Cruz/
│   ├── Licencia
│   ├── Permiso especial
│   └── SOAT
├── Cochabamba/
│   ├── Licencia
│   └── Registro
└── ... (resto de ciudades)

flotas/{flotaId}/
├── documentosAsignados: {
│    "La Paz": [doc_ids],
│    "Santa Cruz": [doc_ids]
│  }
└── documentosFlota: {...}  (mantener para compatibilidad)
```

### CAMBIOS REQUERIDOS

#### 1. **FirebaseRepository** (firebaseRepository.js)
- Modificar `create()` para aceptar parámetro `ciudad`
- Cambiar ruta de guardado: `crear-documentos/{ciudad}/documentosPorCiudad`
- Actualizar `getAll()` para obtener documentos de ciudad específica o todas

#### 2. **Hook useDocuments** (useDocuments.js)
- Agregar parámetro `ciudad` para filtrado
- Modificar `create()` para enviar ciudad
- Agregar función `getDocumentosPorCiudad()`

#### 3. **Componente Documentos** (docs.jsx)
- Agregar selector de ciudad
- Filtrar documentos por ciudad seleccionada
- Mostrar ciudades en tabs o dropdown

#### 4. **GestionFlotas** (GestionFlotas.jsx)
- Modificar lógica de asignación de documentos
- Permitir seleccionar ciudad primero
- Mostrar documentos disponibles por esa ciudad
- Guardar en nueva estructura `documentosAsignados`

#### 5. **DocsManagerModal** (DocsManagerModal.jsx)
- Agregar selector de ciudad
- Filtrar documentos por ciudad
- Actualizar la lógica de asignación

### IMPACTO EN OTRAS ÁREAS
- **DocumentosPendientes**: Seguirá igual (filtra por flotaId)
- **Radiotaxis**: Seguirá igual (obtiene docs de flota)
- **Services**: Ya usa estructura por ciudad (tomar como referencia)

### MIGRACIÓN DE DATOS (si existen)
1. Leer todos los documentos de `crear-documentos`
2. Determinar ciudad por criterios (nuevo campo o manual)
3. Guardar en nueva ruta `crear-documentos/{ciudad}/documentosPorCiudad`
4. Eliminar documentos viejos

### PASOS IMPLEMENTACIÓN
1. Refactorizar FirebaseRepository
2. Actualizar useDocuments hook
3. Modificar componente docs.jsx
4. Actualizar GestionFlotas.jsx
5. Actualizar DocsManagerModal.jsx
6. Pruebas y migración de datos
