# 🌟 Funcionalidad de Favoritos - Autos Destacados

## Descripción

Se implementó una funcionalidad completa de favoritos que permite a los **administradores** seleccionar hasta **6 autos como favoritos** para mostrar en un banner destacado a los clientes. La gestión se realiza desde el dashboard administrativo mediante una estrella interactiva.

## Características Principales

### ✅ Límite de Favoritos
- **Máximo 6 autos favoritos** simultáneamente
- Validación automática al intentar agregar más favoritos
- Error descriptivo cuando se alcanza el límite

### ✅ Control de Acceso por Roles
- **Gestionar favoritos**: Solo ADMINISTRADOR
- **Ver favoritos**: Público (sin autenticación) para clientes
- **Dashboard admin**: Estrella interactiva para marcar/desmarcar

### ✅ Persistencia y Auditoría
- Campo `esFavorito` agregado a la base de datos
- Migración automática aplicada
- **Historial completo** de cambios de favoritos
- Registro de quién, cuándo y por qué se marcó/desmarcó

### ✅ Separación de Responsabilidades
- **Crear auto**: Siempre `esFavorito: false`
- **Actualizar auto**: No incluye campo `esFavorito`
- **Gestionar favoritos**: Endpoint específico solo para ADMIN

## Endpoints Implementados

### 🔐 Dashboard Administrativo (Solo ADMIN)

#### Gestionar Favorito (Estrella en Dashboard)
```http
PATCH /autos/:id/favorito
Authorization: Bearer <jwt_token> (ADMIN)
Content-Type: application/json

{
  "esFavorito": true,
  "observaciones": "Auto destacado para promoción de verano"
}
```

**Respuesta:**
```json
{
  "message": "Auto marcado como favorito para el banner destacado",
  "esFavorito": true,
  "totalFavoritos": 4
}
```

#### Obtener Favoritos Admin
```http
GET /autos/favoritos
Authorization: Bearer <jwt_token> (ADMIN)
```

**Respuesta:**
```json
{
  "message": "Autos favoritos obtenidos exitosamente",
  "total": 4,
  "maxFavoritos": 6,
  "favoritos": [...]
}
```

### 🌐 Públicos (Sin autenticación)

#### Catálogo de Autos para Clientes
```http
GET /publico/autos
```

**Respuesta:**
```json
{
  "message": "Catálogo de autos obtenido exitosamente",
  "total": 15,
  "autos": [
    {
      "id": "uuid-auto-1",
      "nombre": "Toyota Corolla 2023",
      "precio": 25000,
      "imagenes": ["url1.jpg", "url2.jpg"],
      "esFavorito": false,
      "estado": "DISPONIBLE",
      // ... resto de datos del auto
    },
    {
      "id": "uuid-auto-2", 
      "nombre": "Honda Civic 2024",
      "precio": 28000,
      "imagenes": ["url3.jpg", "url4.jpg"],
      "esFavorito": true,
      "estado": "DISPONIBLE",
      // ... resto de datos del auto
    }
  ]
}
```

#### Banner de Autos Destacados para Clientes
```http
GET /publico/autos/favoritos
```

**Respuesta:**
```json
{
  "message": "Autos destacados obtenidos exitosamente",
  "total": 4,
  "favoritos": [
    {
      "id": "uuid-auto-1",
      "nombre": "Toyota Corolla 2023",
      "precio": 25000,
      "imagenes": ["url1.jpg", "url2.jpg"],
      "esFavorito": true,
      // ... resto de datos del auto
    }
  ]
}
```

## Validaciones Implementadas

### ✅ Validaciones de Negocio
- No se pueden marcar más de 6 autos como favoritos
- No se puede gestionar favoritos de autos eliminados
- Verificación de existencia del auto
- Solo ADMIN puede gestionar favoritos

### ✅ Validaciones Técnicas
- DTOs con validaciones de tipo
- Parámetros requeridos y opcionales
- Manejo de errores descriptivos
- Separación de responsabilidades en DTOs

## Flujo de Uso en Dashboard

### 📋 Flujo Principal
1. **Admin** entra al dashboard de autos
2. Ve una **estrella** al lado de cada auto en la lista
3. **Hace clic en la estrella** para marcar/desmarcar favorito
4. **Frontend** llama a `PATCH /autos/:id/favorito`
5. **Sistema** valida límite y actualiza estado
6. **Estrella** se actualiza visualmente
7. **Clientes** ven el auto en el banner público

### 📋 Estados de la Estrella
- **⭐ Estrella llena**: Auto es favorito
- **☆ Estrella vacía**: Auto no es favorito
- **🚫 Estrella deshabilitada**: Límite de 6 alcanzado (solo para no favoritos)

## Casos de Uso Cubiertos

### 📋 Casos Exitosos
- ✅ Marcar auto como favorito → Estrella se llena
- ✅ Desmarcar favorito → Estrella se vacía
- ✅ Ver total de favoritos en respuesta
- ✅ Cliente ve banner actualizado

### 📋 Casos Edge
- ✅ Intentar marcar más de 6 favoritos → Error 400
- ✅ Marcar favorito de auto eliminado → Error 400
- ✅ Auto no encontrado → Error 404
- ✅ Sin permisos ADMIN → Error 403
- ✅ Marcar el mismo auto dos veces → No hace nada

## Testing

### ✅ Tests Unitarios Completos
- **GestionarFavoritoUseCase**: 6 tests cubriendo todos los casos
- **ObtenerFavoritosUseCase**: Test básico
- Mocks completos de repositorio e historial
- Cobertura de casos exitosos y de error

### ✅ Tests de Integración
- Actualizados todos los tests existentes con campo `esFavorito`
- Nuevos métodos del repositorio incluidos en mocks
- Tests de entidad Auto actualizados
- DTOs actualizados sin `esFavorito` en crear/actualizar

## Arquitectura

### 📁 Estructura Implementada
```
src/modules/autos/
├── application/
│   ├── dtos/autos/
│   │   ├── crear/ (sin esFavorito)
│   │   ├── actualizar/ (sin esFavorito)
│   │   └── favoritos/
│   │       └── gestionar-favorito.dto.ts
│   └── use-cases/autos/
│       ├── gestionar-favorito.use-case.ts (solo ADMIN)
│       ├── gestionar-favorito.use-case.spec.ts
│       └── obtener-favoritos.use-case.ts
├── domain/
│   ├── auto.entity.ts (+ esFavorito)
│   ├── auto.interfaces.ts (+ esFavorito)
│   └── auto.repository.ts (+ métodos favoritos)
└── infrastructure/
    ├── controllers/
    │   ├── auto.controller.ts (endpoints ADMIN)
    │   └── autos-publico.controller.ts (banner clientes)
    ├── mappers/
    │   └── auto-to-prisma.mapper.ts (+ esFavorito)
    └── prisma/
        └── prisma-auto.repository.ts (+ métodos favoritos)
```

### 📊 Base de Datos
```sql
-- Migración aplicada automáticamente
ALTER TABLE "Auto" ADD COLUMN "esFavorito" BOOLEAN NOT NULL DEFAULT false;
```

## Integración Frontend

### 🎨 Dashboard Admin
```javascript
// Ejemplo de implementación de la estrella
const StarButton = ({ auto, onToggleFavorite }) => {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/autos/${auto.id}/favorito`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          esFavorito: !auto.esFavorito,
          observaciones: `Auto ${!auto.esFavorito ? 'marcado' : 'removido'} desde dashboard`
        })
      });
      
      const result = await response.json();
      onToggleFavorite(auto.id, result.esFavorito, result.totalFavoritos);
    } catch (error) {
      console.error('Error al gestionar favorito:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button 
      onClick={handleClick} 
      disabled={loading}
      className={auto.esFavorito ? 'star-filled' : 'star-empty'}
    >
      {auto.esFavorito ? '⭐' : '☆'}
    </button>
  );
};
```

### 🌐 Frontend Público
```javascript
// Ejemplo de catálogo completo para clientes
const CatalogoAutos = () => {
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/publico/autos')
      .then(res => res.json())
      .then(data => {
        setAutos(data.autos);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error al cargar catálogo:', error);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Cargando catálogo...</div>;
  
  return (
    <div className="catalogo-autos">
      <h2>Nuestros Vehículos</h2>
      <p>Total: {autos.length} autos disponibles</p>
      <div className="autos-grid">
        {autos.map(auto => (
          <AutoCard 
            key={auto.id} 
            auto={auto} 
            destacado={auto.esFavorito} 
          />
        ))}
      </div>
    </div>
  );
};

// Ejemplo de banner para clientes
const AutosBanner = () => {
  const [favoritos, setFavoritos] = useState([]);
  
  useEffect(() => {
    fetch('/api/publico/autos/favoritos')
      .then(res => res.json())
      .then(data => setFavoritos(data.favoritos));
  }, []);
  
  return (
    <div className="banner-destacados">
      <h2>Autos Destacados</h2>
      <div className="autos-grid">
        {favoritos.map(auto => (
          <AutoCard key={auto.id} auto={auto} destacado={true} />
        ))}
      </div>
    </div>
  );
};
```

## Historial y Auditoría

### 📝 Registro Completo
Cada cambio de favorito se registra con:
- **Usuario ADMIN** que realizó el cambio
- **Fecha y hora** exacta
- **Estado anterior** y **nuevo**
- **Observaciones** opcionales
- **Metadata** completa del auto

### 📊 Ejemplo de Registro
```json
{
  "entidadId": "auto-123",
  "tipoEntidad": "AUTO",
  "tipoAccion": "ACTUALIZAR",
  "campoAfectado": "esFavorito",
  "valorAnterior": "false",
  "valorNuevo": "true",
  "observaciones": "Auto marcado como favorito: Toyota Corolla - ABC-123",
  "metadata": {
    "autoNombre": "Toyota Corolla",
    "autoMatricula": "ABC-123",
    "accion": "MARCAR_FAVORITO"
  }
}
```

## Próximos Pasos Sugeridos

### 🚀 Mejoras Futuras
1. **Frontend**: Implementar estrella interactiva en dashboard
2. **Cache**: Agregar cache para favoritos (Redis)
3. **Ordenamiento**: Permitir ordenar favoritos por prioridad
4. **Notificaciones**: Alertar cuando se cambian favoritos
5. **Métricas**: Tracking de clics en autos favoritos

### 🔧 Optimizaciones
1. **Índices DB**: Agregar índice en campo `esFavorito`
2. **Paginación**: Para endpoint público si crece
3. **Compresión**: Optimizar imágenes en respuesta
4. **CDN**: Para servir imágenes de favoritos

---

## 🎯 Resumen Ejecutivo

✅ **Funcionalidad completamente implementada y probada**  
✅ **Solo ADMIN puede gestionar favoritos**  
✅ **Estrella interactiva en dashboard**  
✅ **6 autos favoritos máximo con validación**  
✅ **Endpoints separados: admin y público**  
✅ **Catálogo público sin autenticación para clientes**  
✅ **Banner de autos destacados público**  
✅ **Auditoría completa de cambios**  
✅ **Tests unitarios y de integración**  
✅ **Arquitectura escalable y mantenible**

La funcionalidad está lista para ser integrada en el frontend del dashboard administrativo con la estrella interactiva y el catálogo público completo para clientes. 