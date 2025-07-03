# 🚗 Crear Auto con Imágenes - Guía de Uso

## Resumen de la Funcionalidad

La funcionalidad de **crear autos con imágenes** permite subir imágenes directamente durante la creación del auto, integrando la subida a Firebase Storage en un solo paso.

### ✅ Características Implementadas

- **Subida automática**: Las imágenes se suben a Firebase Storage automáticamente
- **Organización inteligente**: Se crean carpetas por matrícula (`autos/{matricula}/`)
- **Validación completa**: Tipos de archivo, tamaño y firmas de imagen
- **Manejo de errores**: Si falla la subida, no se crea el auto
- **Historial detallado**: Se registra la cantidad de imágenes subidas
- **Tests completos**: Unitarios y E2E cubriendo todos los casos

## 🔧 Uso desde el Frontend

### Ejemplo con JavaScript/TypeScript

```javascript
// Crear FormData con los datos del auto e imágenes
const formData = new FormData();

// Datos del auto
formData.append('nombre', 'Toyota Corolla 2023');
formData.append('descripcion', 'Sedán compacto en excelente estado');
formData.append('matricula', 'ABC-123');
formData.append('marca', 'TOYOTA');
formData.append('modelo', 'Corolla');
formData.append('version', 'XLI');
formData.append('ano', '2023');
formData.append('kilometraje', '15000');
formData.append('precio', '25000');
formData.append('costo', '20000');
formData.append('color', 'BLANCO');
formData.append('transmision', 'AUTOMATICA');
formData.append('estado', 'DISPONIBLE');

// Arrays como JSON strings
formData.append('equipamientoDestacado', JSON.stringify(['GPS', 'Bluetooth', 'Cámara']));
formData.append('caracteristicasGenerales', JSON.stringify(['4 puertas', 'Sedán']));
formData.append('exterior', JSON.stringify(['Espejos eléctricos', 'Luces LED']));
formData.append('confort', JSON.stringify(['Aire acondicionado', 'Asientos de cuero']));
formData.append('seguridad', JSON.stringify(['ABS', 'Airbags', 'Control de estabilidad']));
formData.append('interior', JSON.stringify(['Tapizado premium', 'Volante multifunción']));
formData.append('entretenimiento', JSON.stringify(['Radio AM/FM', 'USB', 'Bluetooth']));

// Imágenes (hasta 10 archivos)
const imageFiles = document.getElementById('imagenes').files;
for (let i = 0; i < imageFiles.length; i++) {
  formData.append('imagenes', imageFiles[i]);
}

// Realizar la petición
try {
  const response = await fetch('/autos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      // NO agregar Content-Type, el navegador lo maneja automáticamente
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  const autoCreado = await response.json();
  console.log('Auto creado exitosamente:', autoCreado);
  
  // El auto ya incluye las URLs de las imágenes subidas
  console.log('Imágenes subidas:', autoCreado.imagenes);
  
} catch (error) {
  console.error('Error creando auto:', error);
}
```

### Ejemplo con React + Hook

```tsx
import { useState } from 'react';

interface CrearAutoData {
  nombre: string;
  descripcion: string;
  matricula: string;
  marca: string;
  modelo: string;
  // ... otros campos
  imagenes: FileList | null;
}

export const useCrearAuto = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearAuto = async (data: CrearAutoData) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Agregar datos del auto
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'imagenes') return; // Las imágenes se manejan por separado
        
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      });

      // Agregar imágenes
      if (data.imagenes) {
        for (let i = 0; i < data.imagenes.length; i++) {
          formData.append('imagenes', data.imagenes[i]);
        }
      }

      const response = await fetch('/autos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando auto');
      }

      return await response.json();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { crearAuto, loading, error };
};
```

## 🧪 Ejemplo con cURL

```bash
# Crear auto con imágenes usando cURL
curl -X POST http://localhost:3000/autos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "nombre=Toyota Corolla 2023" \
  -F "descripcion=Sedán compacto en excelente estado" \
  -F "matricula=ABC-123" \
  -F "marca=TOYOTA" \
  -F "modelo=Corolla" \
  -F "version=XLI" \
  -F "ano=2023" \
  -F "kilometraje=15000" \
  -F "precio=25000" \
  -F "costo=20000" \
  -F "color=BLANCO" \
  -F "transmision=AUTOMATICA" \
  -F "estado=DISPONIBLE" \
  -F 'equipamientoDestacado=["GPS","Bluetooth","Cámara"]' \
  -F 'caracteristicasGenerales=["4 puertas","Sedán"]' \
  -F 'exterior=["Espejos eléctricos","Luces LED"]' \
  -F 'confort=["Aire acondicionado","Asientos de cuero"]' \
  -F 'seguridad=["ABS","Airbags","Control de estabilidad"]' \
  -F 'interior=["Tapizado premium","Volante multifunción"]' \
  -F 'entretenimiento=["Radio AM/FM","USB","Bluetooth"]' \
  -F "imagenes=@imagen1.jpg" \
  -F "imagenes=@imagen2.jpg" \
  -F "imagenes=@imagen3.jpg"
```

## 📋 Validaciones y Límites

### Imágenes
- **Tipos permitidos**: JPEG, PNG, WebP
- **Tamaño máximo**: 10MB por imagen (configurable por servidor)
- **Cantidad máxima**: 10 imágenes por auto
- **Validación de firma**: Se verifica que sean imágenes reales

### Datos del Auto
- **Campos obligatorios**: nombre, matricula, marca, modelo, ano, precio, costo, color, transmision, estado
- **Validaciones**: Año no puede ser futuro, precios no negativos, etc.

## 🎯 Respuesta del Servidor

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Toyota Corolla 2023",
  "descripcion": "Sedán compacto en excelente estado",
  "matricula": "ABC-123",
  "marca": "TOYOTA",
  "modelo": "Corolla",
  "version": "XLI",
  "ano": 2023,
  "kilometraje": 15000,
  "precio": 25000,
  "costo": 20000,
  "color": "BLANCO",
  "transmision": "AUTOMATICA",
  "estado": "DISPONIBLE",
  "imagenes": [
    "https://storage.googleapis.com/tu-proyecto.appspot.com/autos/ABC-123/toyota-corolla-2023-1704123456-abc12345.jpg",
    "https://storage.googleapis.com/tu-proyecto.appspot.com/autos/ABC-123/toyota-corolla-2023-1704123457-def67890.jpg",
    "https://storage.googleapis.com/tu-proyecto.appspot.com/autos/ABC-123/toyota-corolla-2023-1704123458-ghi12345.jpg"
  ],
  "equipamientoDestacado": ["GPS", "Bluetooth", "Cámara"],
  "caracteristicasGenerales": ["4 puertas", "Sedán"],
  "exterior": ["Espejos eléctricos", "Luces LED"],
  "confort": ["Aire acondicionado", "Asientos de cuero"],
  "seguridad": ["ABS", "Airbags", "Control de estabilidad"],
  "interior": ["Tapizado premium", "Volante multifunción"],
  "entretenimiento": ["Radio AM/FM", "USB", "Bluetooth"],
  "esFavorito": false,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "createdBy": "user-id-123",
  "updatedBy": "user-id-123"
}
```

## 🔍 Casos de Uso

### 1. Crear Auto Sin Imágenes
```javascript
// Simplemente no incluir archivos de imagen
const formData = new FormData();
formData.append('nombre', 'Auto sin fotos');
// ... otros datos
// No agregar imagenes

const response = await fetch('/autos', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### 2. Crear Auto con Una Imagen
```javascript
const formData = new FormData();
// ... datos del auto
formData.append('imagenes', singleImageFile);
```

### 3. Crear Auto con Múltiples Imágenes
```javascript
const formData = new FormData();
// ... datos del auto
imageFiles.forEach(file => {
  formData.append('imagenes', file);
});
```

## ⚠️ Manejo de Errores

### Errores Comunes

1. **Tipo de archivo no permitido**
```json
{
  "statusCode": 400,
  "message": "Solo se permiten archivos de imagen (JPEG, PNG, WebP)",
  "error": "Bad Request"
}
```

2. **Archivo muy grande**
```json
{
  "statusCode": 400,
  "message": "El archivo es demasiado grande. Tamaño máximo: 10MB",
  "error": "Bad Request"
}
```

3. **Error de Firebase Storage**
```json
{
  "statusCode": 400,
  "message": "Error al subir las imágenes: Firebase Storage error",
  "error": "Bad Request"
}
```

4. **Datos de auto inválidos**
```json
{
  "statusCode": 400,
  "message": "El precio y costo no pueden ser negativos",
  "error": "Bad Request"
}
```

## 📈 Beneficios de la Implementación

1. **Experiencia de Usuario Mejorada**: Un solo paso para crear auto con imágenes
2. **Consistencia de Datos**: Si falla la subida, no se crea el auto (atomicidad)
3. **Organización Automática**: Carpetas por matrícula en Firebase Storage
4. **Trazabilidad**: Historial detallado de la creación con información de imágenes
5. **Rendimiento**: Subida paralela de múltiples imágenes
6. **Seguridad**: Validaciones completas de tipo y tamaño de archivo

## 🚀 Próximos Pasos Sugeridos

1. **Actualización de Auto**: Implementar la misma funcionalidad para actualizar autos
2. **Optimización**: Generar thumbnails automáticamente
3. **Compresión**: Comprimir imágenes antes de subir
4. **Validación Avanzada**: Detectar contenido inapropiado
5. **Backup**: Estrategia de respaldo de imágenes 