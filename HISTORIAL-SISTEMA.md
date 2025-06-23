# 📋 Sistema de Historial Genérico

## 🎯 Resumen

He implementado un sistema de historial genérico que permite trackear cambios en cualquier entidad del sistema, con funcionalidad específica para cambios de estado de autos. El sistema está diseñado para ser extensible y reutilizable.

## 🏗️ Arquitectura Implementada

### 1. **Entidad Historial** (`src/modules/shared/entities/historial.entity.ts`)

```typescript
export class Historial extends BaseEntity {
  public readonly entidadId: string;
  public readonly tipoEntidad: TipoEntidad;
  public readonly tipoAccion: TipoAccion;
  public readonly campoAfectado?: string;
  public readonly valorAnterior?: string;
  public readonly valorNuevo?: string;
  public readonly observaciones?: string;
  public readonly metadata?: Record<string, any>;
}
```

**Características:**
- ✅ Genérica para cualquier entidad
- ✅ Soporte para diferentes tipos de acciones
- ✅ Metadata flexible para información adicional
- ✅ Validaciones específicas para cambios de estado
- ✅ Factory methods para crear historiales específicos

### 2. **Enums de Soporte**

```typescript
export enum TipoAccion {
  CREAR = 'CREAR',
  ACTUALIZAR = 'ACTUALIZAR', 
  ELIMINAR = 'ELIMINAR',
  RESTAURAR = 'RESTAURAR',
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
}

export enum TipoEntidad {
  AUTO = 'AUTO',
  USUARIO = 'USUARIO',
  // Extensible para nuevas entidades
}
```

### 3. **Orquestador de Historial** (`src/modules/shared/services/historial-orchestrator.service.ts`)

```typescript
@Injectable()
export class HistorialOrchestrator {
  // Métodos principales
  async procesarCambioEstado(event: CambioEstadoEvent): Promise<Historial>
  async procesarOperacionCrud(event: CrudEvent): Promise<Historial>
  async procesar(tipoEvento: string, event: HistorialEvent): Promise<Historial>
  registrarStrategy(tipo: string, strategy: HistorialStrategy): void
}

// Strategies especializadas
export class CambioEstadoStrategy implements HistorialStrategy {
  async procesar(event: CambioEstadoEvent): Promise<Historial>
  async enriquecerMetadata(event: CambioEstadoEvent): Promise<Record<string, any>>
}

export class CrudStrategy implements HistorialStrategy {
  async procesar(event: CrudEvent): Promise<Historial>
  async enriquecerMetadata(event: CrudEvent): Promise<Record<string, any>>
}
```

### 4. **Servicio Base de Historial** (`src/modules/shared/services/historial.service.ts`)

```typescript
@Injectable()
export class HistorialService {
  // Métodos de persistencia y consulta
  async registrarCambio(data: HistorialGenericoData): Promise<Historial>
  async obtenerHistorialEntidad(entidadId: string, tipoEntidad: TipoEntidad): Promise<Historial[]>
  async obtenerCambiosEstado(entidadId: string, tipoEntidad: TipoEntidad): Promise<Historial[]>
}
```

### 4. **Cambio de Estado de Autos**

#### DTO de Request:
```typescript
export class CambiarEstadoAutoDto {
  @IsEnum(EstadoAuto)
  nuevoEstado: EstadoAuto.DISPONIBLE | EstadoAuto.RESERVADO;
  
  @IsNotEmpty()
  observaciones: string;
  
  @IsOptional()
  metadata?: Record<string, any>;
}
```

#### Use Case: `CambiarEstadoAutoUseCase`
- ✅ Validaciones de negocio
- ✅ Control de transiciones de estado
- ✅ Registro automático en historial
- ✅ Metadata enriquecida con información del auto

## 🏗️ Arquitectura de Controladores

### **Separación de Responsabilidades**

#### **AutoController** (`/autos`)
- ✅ CRUD de autos (crear, actualizar, eliminar, restaurar)
- ✅ Cambio de estado específico (`PATCH /autos/:id/cambiar-estado`)
- ✅ Consultas de autos (listar, buscar por ID)

#### **HistorialController** (`/historial`)
- ✅ Consulta de historial de **cualquier entidad**
- ✅ Filtros y paginación
- ✅ Estadísticas y reportes de auditoría
- ✅ Funcionalidad transversal reutilizable

#### **DashboardController** (`/dashboard`)
- ✅ Resúmenes del sistema
- ✅ Estadísticas generales
- ✅ Métricas de negocio

### **Beneficios de esta Arquitectura:**
- 🎯 **Responsabilidad única** por controlador
- 🔄 **Reutilizable** - Historial funciona para cualquier entidad
- 📈 **Escalable** - Fácil agregar nuevas funcionalidades
- 🧹 **Mantenible** - Código organizado y limpio

## 🎨 **Patrón Strategy + Orchestrator**

### **Arquitectura del Orquestador:**

```typescript
// 1. Eventos tipados para diferentes operaciones
interface CambioEstadoEvent {
  entidadId: string;
  tipoEntidad: TipoEntidad;
  campoAfectado: string;
  valorAnterior: string;
  valorNuevo: string;
  observaciones: string;
  usuarioId: string;
  metadata?: Record<string, any>;
}

// 2. Strategies especializadas para cada tipo
class CambioEstadoStrategy {
  async procesar(event: CambioEstadoEvent): Promise<Historial> {
    // Lógica específica para cambios de estado
    // Enriquecimiento automático de metadata
  }
}

// 3. Orquestador que coordina las strategies
class HistorialOrchestrator {
  async procesarCambioEstado(event: CambioEstadoEvent): Promise<Historial> {
    const strategy = this.strategies.get('cambio_estado');
    return strategy.procesar(event);
  }
}
```

### **Beneficios del Patrón:**

#### ✅ **Extensibilidad**
- Fácil agregar nuevos tipos de eventos
- Strategies independientes y especializadas
- Registro dinámico de nuevas strategies

#### ✅ **Mantenibilidad**
- Lógica específica encapsulada en cada strategy
- Enriquecimiento automático de metadata
- Separación clara de responsabilidades

#### ✅ **Testabilidad**
- Cada strategy es testeable independientemente
- Mocking más fácil y específico
- Tests más focalizados

#### ✅ **Flexibilidad**
- Diferentes tipos de metadata por tipo de evento
- Validaciones específicas por strategy
- Procesamiento personalizado

### **Casos de Uso Avanzados:**

```typescript
// Ejemplo: Strategy para notificaciones
class NotificacionStrategy implements HistorialStrategy {
  async procesar(event: NotificacionEvent) {
    // Lógica específica para notificaciones
    // Envío de emails, SMS, etc.
    // Registro en historial con metadata enriquecida
  }
}

// Ejemplo: Strategy para integraciones
class IntegracionStrategy implements HistorialStrategy {
  async procesar(event: IntegracionEvent) {
    // Sincronización con sistemas externos
    // Logs de integración
    // Manejo de errores específicos
  }
}
```

## 🚀 Endpoints Implementados

### 1. **Cambiar Estado de Auto**
```http
PATCH /autos/:id/cambiar-estado
Authorization: Bearer <token>
Content-Type: application/json

{
  "nuevoEstado": "RESERVADO",
  "observaciones": "Cliente interesado, reserva por 48 horas"
}
```

**Respuesta:**
```json
{
  "id": "auto-123",
  "estadoAnterior": "DISPONIBLE",
  "estadoNuevo": "RESERVADO", 
  "observaciones": "Cliente interesado, reserva por 48 horas",
  "fechaCambio": "2024-01-15T10:30:00Z",
  "usuarioId": "user-456",
  "historialId": "historial-789",
  "mensaje": "El vehículo ha sido reservado exitosamente"
}
```

### 2. **Obtener Historial Completo**
```http
GET /historial/AUTO/:id?limite=20
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "entidadId": "auto-123",
  "tipoEntidad": "AUTO",
  "total": 5,
  "limite": 20,
  "historial": [
    {
      "id": "hist-1",
      "tipoAccion": "CAMBIO_ESTADO",
      "campoAfectado": "estado",
      "valorAnterior": "DISPONIBLE",
      "valorNuevo": "RESERVADO",
      "observaciones": "Cliente interesado",
      "fechaCambio": "2024-01-15T10:30:00Z",
      "usuario": "user-456",
      "resumen": "Estado cambiado de \"DISPONIBLE\" a \"RESERVADO\"",
      "metadata": { ... }
    }
  ]
}
```

### 3. **Obtener Solo Cambios de Estado**
```http
GET /historial/AUTO/:id/cambios-estado
Authorization: Bearer <token>
```

### 4. **Historial de Cualquier Entidad**
```http
GET /historial/USUARIO/:id
GET /historial/AUTO/:id
Authorization: Bearer <token>
```

## 🔒 Reglas de Negocio Implementadas

### Estados Iniciales Permitidos:
- ✅ `POR_INGRESAR` - Cuando el auto aún no está listo para venta
- ✅ `DISPONIBLE` - Cuando el auto está listo para venta inmediatamente

### Estados de Transición:
- ✅ `POR_INGRESAR` → `DISPONIBLE` (auto listo para venta)
- ✅ `POR_INGRESAR` → `RESERVADO` (reserva antes de estar oficialmente disponible)
- ✅ `DISPONIBLE` → `RESERVADO` (reserva de auto disponible)
- ✅ `RESERVADO` → `DISPONIBLE` (cancelación de reserva)
- ❌ `VENDIDO` - Estado final, no permite cambios

### Validaciones:
- ✅ Auto debe existir y estar activo
- ✅ Nuevo estado debe ser diferente al actual
- ✅ Observaciones son obligatorias para cambios de estado
- ✅ Solo usuarios con roles `ADMIN` o `VENDEDOR`
- ✅ Estados iniciales limitados a `POR_INGRESAR` o `DISPONIBLE`

### Transiciones Válidas:
```typescript
const transicionesValidas = {
  [EstadoAuto.POR_INGRESAR]: [EstadoAuto.DISPONIBLE, EstadoAuto.RESERVADO], // Flexible desde POR_INGRESAR
  [EstadoAuto.DISPONIBLE]: [EstadoAuto.RESERVADO], // Solo puede reservarse
  [EstadoAuto.RESERVADO]: [EstadoAuto.DISPONIBLE], // Solo puede liberarse
  [EstadoAuto.VENDIDO]: [], // Estado final
};
```

## 🧪 Tests Implementados

### 1. **Tests de Entidad Historial** (`historial.entity.spec.ts`)
- ✅ Creación válida de historial
- ✅ Validaciones de dominio
- ✅ Factory methods
- ✅ Métodos de utilidad

### 2. **Tests de Use Case** (`cambiar-estado-auto.use-case.spec.ts`)
- ✅ Cambio exitoso de estado
- ✅ Validaciones de auto inexistente
- ✅ Validaciones de auto eliminado
- ✅ Validaciones de estado duplicado
- ✅ Validaciones de transiciones inválidas

## 🎨 Para el Frontend

### Interfaz Sugerida:

```typescript
// Botón en la grilla
<Button 
  onClick={() => openChangeStateModal(auto.id)}
  disabled={!canChangeState(auto.estado)}
>
  Cambiar Estado
</Button>

// Modal/Drawer
interface ChangeStateModalProps {
  autoId: string;
  currentState: EstadoAuto;
  onClose: () => void;
  onSuccess: (result: CambiarEstadoAutoResponseDto) => void;
}
```

### Estados de UI:
- **Por Ingresar → Disponible**: "Auto ingresado al inventario y listo para venta"
- **Por Ingresar → Reservado**: "Cliente interesado antes de que ingrese oficialmente"
- **Disponible → Reservado**: "Cliente interesado, reserva por X horas"
- **Reservado → Disponible**: "Cliente canceló la reserva" / "Reserva expirada"
- **Botón deshabilitado** para estado `VENDIDO` (estado final)

### Casos de Uso del Frontend:
1. **Creación de Auto**: Permitir elegir estado inicial (`POR_INGRESAR` o `DISPONIBLE`)
2. **Gestión de Inventario**: Cambiar autos de `POR_INGRESAR` a `DISPONIBLE`
3. **Reservas Directas**: Cambiar autos de `POR_INGRESAR` a `RESERVADO` (pre-venta)
4. **Gestión de Reservas**: Cambiar entre `DISPONIBLE` y `RESERVADO`

## 🔄 Extensibilidad

### Para Agregar Nueva Entidad:
1. Agregar al enum `TipoEntidad`
2. Crear use cases específicos
3. Implementar repositorio de historial
4. Usar `HistorialService` en los use cases

### Para Nuevos Tipos de Acción:
1. Agregar al enum `TipoAccion`
2. Implementar validaciones específicas en `Historial.validarDominio()`
3. Actualizar `obtenerResumenCambio()` si es necesario

## 📊 Metadata Guardada

Para cambios de estado de autos, se guarda:
```json
{
  "autoInfo": {
    "nombre": "Toyota Corolla 2020",
    "matricula": "ABC-1234", 
    "marca": "TOYOTA",
    "modelo": "Corolla"
  },
  // ... metadata adicional del request
}
```

## 🚧 Próximos Pasos

1. **Implementar repositorio Prisma** para `Historial`
2. **Agregar migración** de base de datos
3. **Configurar módulos** en `SharedModule` y `AutosModule`
4. **Tests E2E** para los endpoints
5. **Implementar en frontend** con React/Angular

## 💡 Beneficios del Sistema

- ✅ **Auditoría completa** de cambios
- ✅ **Trazabilidad** de estados
- ✅ **Extensible** a otras entidades
- ✅ **Metadata rica** para análisis
- ✅ **Validaciones robustas** de negocio
- ✅ **Tests comprehensivos**
- ✅ **Arquitectura limpia** siguiendo DDD 