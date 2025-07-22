# 📖 Sistema de Paginación Híbrido

## 📋 Índice
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Base (Shared)](#componentes-base-shared)
4. [Extensiones Específicas por Entidad](#extensiones-específicas-por-entidad)
5. [Implementación por Capas](#implementación-por-capas)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Beneficios del Patrón Híbrido](#beneficios-del-patrón-híbrido)
8. [Cómo Extender a Nuevas Entidades](#cómo-extender-a-nuevas-entidades)

---

## 🎯 Introducción

El sistema de paginación implementado sigue un **patrón híbrido** que combina:
- **Base genérica reutilizable** para funcionalidades comunes
- **Extensiones específicas** para filtros complejos por entidad

Esto permite mantener consistencia en toda la aplicación mientras se proporciona flexibilidad para necesidades específicas de cada dominio.

### Características Principales
- ✅ **Offset-based pagination** (page/limit)
- ✅ **Filtros dinámicos** por entidad
- ✅ **Type-safe** con TypeScript
- ✅ **Validaciones automáticas** con class-validator
- ✅ **Reutilizable** y **escalable**
- ✅ **Arquitectura limpia** respetando DDD

---

## 🏗️ Arquitectura del Sistema

```
📦 Sistema de Paginación
├── 🌐 Base Genérica (Shared)
│   ├── DTOs base
│   ├── Interfaces base
│   ├── Repositorio base
│   └── Servicio genérico
└── 🎯 Extensiones Específicas
    ├── Autos (filtros complejos)
    └── Usuarios (filtros simples)
```

### Flujo de Datos
```
Controller → QueryService → Repository → Prisma → Database
    ↓           ↓             ↓
   DTO     Filters      Where Clause
```

---

## 🌐 Componentes Base (Shared)

### 1. DTOs Base (`src/modules/shared/dtos/pagination.dto.ts`)

```typescript
export class BasePaginationDto {
  page?: number = 1;           // Página actual
  limit?: number = 15;         // Elementos por página
  orderBy?: string = 'createdAt';     // Campo de ordenamiento
  orderDirection?: 'asc' | 'desc' = 'desc';  // Dirección
}

export class PaginatedResponseDto<T> {
  data: T[];                   // Datos paginados
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### 2. Interfaces Base (`src/modules/shared/interfaces/base-repository.interface.ts`)

```typescript
export interface BaseFilters {
  incluirEliminados?: boolean;  // Filtro común para soft deletes
}

export interface IBaseRepository<T> {
  // Métodos existentes...
  findWithPagination(
    page: number,
    limit: number,
    filters?: BaseFilters,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc'
  ): Promise<BasePaginationResult<T>>;
}
```

### 3. Repositorio Base (`src/modules/shared/repositories/base.repository.ts`)

Implementa la lógica genérica de paginación que funciona para cualquier entidad:

```typescript
async findWithPagination(
  page: number,
  limit: number,
  filters: BaseFilters = {},
  orderBy: string = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<BasePaginationResult<T>> {
  const skip = (page - 1) * limit;
  const where: any = {};
  
  if (!filters.incluirEliminados) {
    where.active = true;
  }
  
  // Ejecutar consultas en paralelo para optimizar rendimiento
  const [data, total] = await Promise.all([
    prismaTable.findMany({ where, skip, take: limit, orderBy }),
    prismaTable.count({ where })
  ]);
  
  return { data: data.map(this.toDomain), total };
}
```

### 4. Servicio Genérico (`src/modules/shared/services/pagination.service.ts`)

```typescript
@Injectable()
export class PaginationService {
  async paginate<T extends BaseEntity>(
    repository: IBaseRepository<T>,
    paginationDto: BasePaginationDto,
    filters: BaseFilters = {}
  ): Promise<PaginatedResponseDto<T>> {
    const result = await repository.findWithPagination(/*...*/);
    return new PaginatedResponseDto(/*...*/);
  }
}
```

---

## 🎯 Extensiones Específicas por Entidad

### Autos - Filtros Complejos

#### 1. Filtros Específicos (`src/modules/autos/domain/interfaces/auto-filters.interface.ts`)
```typescript
export interface AutoFilters extends BaseFilters {
  nombre?: string;
  marca?: Marca;              // Enum tipado
  modelo?: string;
  anio?: number;
  estado?: EstadoAuto;        // Enum tipado
  precioMin?: number;
  precioMax?: number;
  fechaCreacionDesde?: Date;
  fechaCreacionHasta?: Date;
  soloFavoritos?: boolean;
}
```

#### 2. DTO de Paginación (`src/modules/autos/application/dtos/pagination/auto-pagination.dto.ts`)
```typescript
export class AutoPaginationDto extends BasePaginationDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(Marca)              // Validación automática del enum
  marca?: Marca;

  @IsOptional()
  @IsEnum(EstadoAuto)
  estado?: EstadoAuto;

  // ... más filtros específicos
}
```

### Usuarios - Filtros Simples

#### 1. Filtros Específicos (`src/modules/usuarios/domain/interfaces/usuario-filters.interface.ts`)
```typescript
export interface UsuarioFilters extends BaseFilters {
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: RolUsuario;           // Enum tipado
}
```

---

## 🔄 Implementación por Capas

### Capa de Dominio
```typescript
// Define el contrato específico
export interface IAutoRepository extends IBaseRepository<Auto> {
  // Métodos específicos heredan de la base
  findWithAdvancedFilters(/*...*/): Promise<BasePaginationResult<Auto>>;
}
```

### Capa de Aplicación
```typescript
@Injectable()
export class AutoQueryService {
  constructor(
    private readonly autoRepo: IAutoRepository,
    private readonly paginationService: PaginationService  // Servicio genérico
  ) {}

  // Paginación básica (usa el servicio genérico)
  async findWithBasicPagination(dto: BasePaginationDto) {
    return this.paginationService.paginate(this.autoRepo, dto);
  }

  // Paginación avanzada (usa métodos específicos)
  async findWithAdvancedFilters(filters: AutoPaginationDto) {
    // Lógica específica de conversión y llamada al repositorio
  }
}
```

### Capa de Infraestructura
```typescript
@Injectable()
export class PrismaAutoRepository implements IAutoRepository {
  // Implementa tanto métodos genéricos (heredados) como específicos
  
  async findWithAdvancedFilters(/*...*/) {
    // Construye query específica con filtros complejos
    const where: Prisma.AutoWhereInput = {};
    
    if (filters.marca) where.marca = filters.marca as Marca;
    if (filters.precioMin) where.precio = { gte: filters.precioMin };
    // ... más filtros específicos
  }
}
```

### Capa de Controladores
```typescript
@Controller('autos')
export class AutoController {
  // Endpoint básico
  @Get('paginated/basic')
  async findWithBasicPagination(@Query() dto: BasePaginationDto) {
    return this.autoQueryService.findWithBasicPagination(dto);
  }

  // Endpoint avanzado
  @Get('paginated/advanced')
  async findWithAdvancedFilters(@Query() filters: AutoPaginationDto) {
    return this.autoQueryService.findWithAdvancedFilters(filters);
  }
}
```

---

## 🚀 Ejemplos de Uso

### Paginación Básica
```bash
# Página 1, 10 elementos, ordenado por fecha descendente
GET /autos/paginated/basic?page=1&limit=10&orderBy=createdAt&orderDirection=desc

# Respuesta
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Filtros Avanzados - Autos
```bash
# Buscar autos Toyota disponibles entre $10,000 y $50,000
GET /autos/paginated/advanced?marca=TOYOTA&estado=DISPONIBLE&precioMin=10000&precioMax=50000&page=1&limit=12

# Solo autos favoritos
GET /autos/paginated/advanced?soloFavoritos=true&page=1&limit=6

# Buscar por nombre con rango de fechas
GET /autos/paginated/advanced?nombre=corolla&fechaCreacionDesde=2024-01-01&fechaCreacionHasta=2024-12-31
```

### Filtros Avanzados - Usuarios
```bash
# Buscar administradores por nombre
GET /usuarios/paginated/advanced?nombre=Juan&rol=ADMIN&page=1&limit=15

# Buscar por email
GET /usuarios/paginated/advanced?email=@gmail.com&incluirEliminados=false
```

---

## ✅ Beneficios del Patrón Híbrido

### 1. **Reutilización de Código**
- Base genérica elimina duplicación
- Lógica común centralizada
- Fácil mantenimiento

### 2. **Flexibilidad**
- Filtros específicos por entidad
- Extensible sin afectar la base
- Diferentes niveles de complejidad

### 3. **Type Safety**
```typescript
// ❌ Antes
marca?: string  // Cualquier string
estado?: string // Cualquier string

// ✅ Ahora
marca?: Marca      // Solo valores del enum
estado?: EstadoAuto // Solo valores del enum
```

### 4. **Validaciones Automáticas**
```typescript
@IsEnum(Marca)    // Rechaza valores inválidos automáticamente
marca?: Marca;

@IsNumber()
@Min(0)          // Validación de rango
precioMin?: number;
```

### 5. **Rendimiento Optimizado**
```typescript
// Consultas en paralelo
const [data, total] = await Promise.all([
  findMany(/*...*/),
  count(/*...*/)
]);
```

### 6. **Arquitectura Limpia**
- Separación clara de responsabilidades
- Respeta principios DDD
- Fácil testing y mantenimiento

---

## 🔧 Cómo Extender a Nuevas Entidades

### Paso 1: Crear Filtros Específicos
```typescript
// src/modules/productos/domain/interfaces/producto-filters.interface.ts
export interface ProductoFilters extends BaseFilters {
  nombre?: string;
  categoria?: CategoriaProducto;
  precioMin?: number;
  precioMax?: number;
}
```

### Paso 2: Crear DTO de Paginación
```typescript
// src/modules/productos/application/dtos/productos/pagination/producto-pagination.dto.ts
export class ProductoPaginationDto extends BasePaginationDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(CategoriaProducto)
  categoria?: CategoriaProducto;
}
```

### Paso 3: Extender Repositorio
```typescript
// En el domain repository
export interface IProductoRepository extends IBaseRepository<Producto> {
  findWithAdvancedFilters(/*...*/): Promise<BasePaginationResult<Producto>>;
}

// En la implementación Prisma
async findWithAdvancedFilters(/*...*/) {
  // Implementar filtros específicos
}
```

### Paso 4: Extender Servicio
```typescript
@Injectable()
export class ProductoQueryService {
  constructor(
    private readonly productoRepo: IProductoRepository,
    private readonly paginationService: PaginationService
  ) {}

  // Básico (reutiliza servicio genérico)
  async findWithBasicPagination(dto: BasePaginationDto) {
    return this.paginationService.paginate(this.productoRepo, dto);
  }

  // Avanzado (implementa lógica específica)
  async findWithAdvancedFilters(filters: ProductoPaginationDto) {
    // Implementar conversión y llamada específica
  }
}
```

### Paso 5: Agregar Endpoints
```typescript
@Controller('productos')
export class ProductoController {
  @Get('paginated/basic')
  async findWithBasicPagination(@Query() dto: BasePaginationDto) {
    return this.productoQueryService.findWithBasicPagination(dto);
  }

  @Get('paginated/advanced')
  async findWithAdvancedFilters(@Query() filters: ProductoPaginationDto) {
    return this.productoQueryService.findWithAdvancedFilters(filters);
  }
}
```

---

## 📊 Estructura de Archivos Final

```
src/modules/
├── shared/                                    # 🌐 BASE GENÉRICA
│   ├── dtos/
│   │   └── pagination.dto.ts                 # DTOs base
│   ├── interfaces/
│   │   └── base-repository.interface.ts      # Interfaces base
│   ├── repositories/
│   │   └── base.repository.ts                # Implementación genérica
│   └── services/
│       └── pagination.service.ts             # Servicio genérico
│
├── autos/                                     # 🎯 EXTENSIÓN ESPECÍFICA
│   ├── domain/
│   │   └── interfaces/
│   │       └── auto-filters.interface.ts     # Filtros específicos
│   ├── application/
│   │   ├── dtos/pagination/
│   │   │   └── auto-pagination.dto.ts        # DTO específico
│   │   └── services/
│   │       └── auto-query.service.ts         # Servicio extendido
│   └── infrastructure/
│       ├── controllers/
│       │   └── auto.controller.ts            # Endpoints
│       └── prisma/
│           └── prisma-auto.repository.ts     # Implementación específica
│
└── usuarios/                                  # 🎯 EXTENSIÓN ESPECÍFICA
    ├── domain/
    │   └── interfaces/
    │       └── usuario-filters.interface.ts  # Filtros específicos
    ├── application/
    │   ├── dtos/usuarios/pagination/
    │   │   └── usuario-pagination.dto.ts     # DTO específico
    │   └── services/
    │       └── usuario-query.service.ts      # Servicio extendido
    └── infrastructure/
        ├── controllers/
        │   └── usuario.controller.ts         # Endpoints
        └── prisma/
            └── prisma-usuario.repository.ts  # Implementación específica
```

---

## 🎯 Conclusión

El sistema de paginación híbrido implementado proporciona:

1. **Consistencia** a través de la base genérica
2. **Flexibilidad** mediante extensiones específicas
3. **Escalabilidad** para futuras entidades
4. **Mantenibilidad** con código reutilizable
5. **Type Safety** completo con TypeScript
6. **Performance** optimizado con consultas paralelas

Este patrón permite que el sistema crezca de manera organizada y mantenible, respetando los principios de arquitectura limpia y DDD. 