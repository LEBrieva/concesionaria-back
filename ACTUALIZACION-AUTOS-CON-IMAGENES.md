# 🚀 Actualización Inteligente de Autos con Imágenes

## 📋 Resumen de la Funcionalidad

La funcionalidad de actualización de autos ahora incluye **gestión inteligente de imágenes** que optimiza el uso de almacenamiento y mejora la experiencia del usuario.

### ✨ Características Principales

1. **Comparación Inteligente**: Solo elimina y sube las imágenes que realmente cambiaron
2. **Mantiene Imágenes Existentes**: Las imágenes que no cambian se conservan
3. **Elimina Obsoletas**: Borra automáticamente las imágenes que ya no se necesitan
4. **Sube Nuevas**: Agrega solo las imágenes nuevas proporcionadas
5. **Validación de Límites**: Máximo 10 imágenes por auto
6. **Historial Detallado**: Registra cambios específicos de imágenes

## 🔧 Cómo Funciona

### Endpoint Actualizado
```http
PUT /autos/:id
Content-Type: multipart/form-data
Authorization: Bearer <jwt-token>

# Campos del auto (como JSON string o form fields)
nombre: "Toyota Corolla Actualizado"
precio: 25000
kilometraje: 15000

# Imágenes existentes que quieres MANTENER (array de URLs)
imagenes: ["https://storage.googleapis.com/bucket/autos/ABC-123/imagen1.jpg"]

# Nuevas imágenes a agregar (archivos)
imagenes: [archivo1.jpg, archivo2.png]
```

### Lógica de Procesamiento

1. **Recibe la petición** con datos del auto + imágenes existentes a mantener + archivos nuevos
2. **Identifica cambios**:
   - Imágenes a **eliminar**: Están en el auto pero NO en `imagenes` del DTO
   - Imágenes a **mantener**: Están en el auto Y en `imagenes` del DTO  
   - Imágenes a **agregar**: Archivos nuevos proporcionados
3. **Ejecuta operaciones**:
   - Elimina imágenes obsoletas de Firebase Storage
   - Sube nuevas imágenes a Firebase Storage
   - Combina URLs mantenidas + URLs nuevas
4. **Actualiza el auto** con la lista final de imágenes
5. **Registra en historial** con detalles específicos

## 📊 Ejemplos de Uso

### Caso 1: Mantener algunas imágenes, agregar nuevas

**Estado inicial:**
```json
{
  "imagenes": [
    "https://storage.googleapis.com/bucket/autos/ABC-123/imagen1.jpg",
    "https://storage.googleapis.com/bucket/autos/ABC-123/imagen2.jpg",
    "https://storage.googleapis.com/bucket/autos/ABC-123/imagen3.jpg"
  ]
}
```

**Petición de actualización:**
```javascript
const formData = new FormData();
formData.append('precio', '25000');
formData.append('imagenes', JSON.stringify([
  'https://storage.googleapis.com/bucket/autos/ABC-123/imagen1.jpg',
  'https://storage.googleapis.com/bucket/autos/ABC-123/imagen3.jpg'
])); // Mantener imagen1 e imagen3, eliminar imagen2
formData.append('imagenes', nuevaImagen4.jpg); // Agregar nueva imagen
```

**Resultado:**
- ❌ Elimina: `imagen2.jpg` de Firebase Storage
- ✅ Mantiene: `imagen1.jpg`, `imagen3.jpg` 
- ➕ Agrega: `imagen4.jpg` (nueva)
- 📝 Historial: "Imágenes actualizadas: 1 eliminada(s), 1 agregada(s), 2 mantenida(s). Total: 3 → 3"

### Caso 2: Reemplazar todas las imágenes

**Petición:**
```javascript
const formData = new FormData();
formData.append('imagenes', JSON.stringify([])); // No mantener ninguna imagen existente
formData.append('imagenes', nuevaImagen1.jpg);
formData.append('imagenes', nuevaImagen2.jpg);
```

**Resultado:**
- ❌ Elimina: Todas las imágenes existentes
- ➕ Agrega: `nuevaImagen1.jpg`, `nuevaImagen2.jpg`
- 📝 Historial: "Imágenes actualizadas: 3 eliminada(s), 2 agregada(s). Total: 3 → 2"

### Caso 3: Solo mantener imágenes existentes (sin cambios)

**Petición:**
```javascript
const formData = new FormData();
formData.append('precio', '26000');
formData.append('imagenes', JSON.stringify([
  'https://storage.googleapis.com/bucket/autos/ABC-123/imagen1.jpg',
  'https://storage.googleapis.com/bucket/autos/ABC-123/imagen2.jpg'
])); // Mantener todas las imágenes existentes
// No enviar archivos nuevos
```

**Resultado:**
- ✅ Mantiene: Todas las imágenes existentes
- 📝 Historial: Solo registra el cambio de precio, no de imágenes

## 🛡️ Validaciones

- **Límite de imágenes**: Máximo 10 imágenes totales (mantenidas + nuevas)
- **Tipos permitidos**: JPEG, PNG, WebP
- **Tamaño máximo**: 10MB por imagen
- **Validación de URLs**: Solo permite URLs del bucket de Firebase configurado

## 📈 Beneficios

1. **Eficiencia**: Solo transfiere las imágenes que realmente cambiaron
2. **Economía**: Reduce costos de almacenamiento y transferencia
3. **Velocidad**: Actualizaciones más rápidas al no resubir imágenes existentes
4. **Confiabilidad**: Mantiene integridad de datos con validaciones
5. **Trazabilidad**: Historial detallado de todos los cambios

## 🔍 Registro en Historial

Los cambios de imágenes se registran con información detallada:

```json
{
  "campoAfectado": "imagenes",
  "observaciones": "Imágenes actualizadas: 1 eliminada(s), 2 agregada(s), 3 mantenida(s). Total: 4 → 5",
  "metadata": {
    "tipoActualizacion": "imagenes_inteligente",
    "cantidadImagenesAnterior": 4,
    "cantidadImagenesNueva": 5,
    "imagenesEliminadas": 1,
    "imagenesAgregadas": 2,
    "imagenesMantenidas": 3
  }
}
```

## 🚨 Notas Importantes

- Los endpoints especializados (`POST /autos/:id/imagenes`, `DELETE /autos/:id/imagenes`) siguen funcionando pero se recomienda usar el endpoint de actualización principal
- Si no se envía el campo `imagenes` en el DTO, las imágenes existentes se mantienen sin cambios
- Si se envía `imagenes: []`, se eliminarán TODAS las imágenes existentes
- Los errores en la eliminación de imágenes obsoletas no fallan la actualización completa (se registran como warnings)

## 📝 Ejemplo de Implementación Frontend

```javascript
// Función para actualizar auto con imágenes inteligentes
async function actualizarAutoConImagenes(autoId, datosAuto, imagenesAMantener, nuevasImagenes) {
  const formData = new FormData();
  
  // Agregar datos del auto
  Object.entries(datosAuto).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value.toString());
    }
  });
  
  // Agregar imágenes existentes a mantener
  if (imagenesAMantener.length > 0) {
    formData.append('imagenes', JSON.stringify(imagenesAMantener));
  }
  
  // Agregar nuevas imágenes
  nuevasImagenes.forEach(archivo => {
    formData.append('imagenes', archivo);
  });
  
  const response = await fetch(`/autos/${autoId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      // NO agregar Content-Type, se maneja automáticamente
    },
    body: formData
  });
  
  return response.json();
}
```

## 🎯 Estado de Implementación

✅ **Completado:**
- Endpoint actualizado para recibir FormData
- DTO actualizado con campo `imagenes`
- Use case con lógica inteligente de comparación
- Gestión de Firebase Storage (eliminar/subir)
- Registro detallado en historial
- Validaciones de límites y tipos

⚠️ **Pendiente:**
- Actualización completa de tests unitarios
- Tests de integración E2E
- Documentación de API actualizada 