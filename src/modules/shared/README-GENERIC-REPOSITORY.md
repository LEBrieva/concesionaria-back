# Sistema de Repositorios Genéricos

Este sistema permite crear métodos genéricos (`findAll`, `findAllActive`, `findOneById`) que pueden ser utilizados desde cualquier repositorio, aplicando el patrón **Repository Pattern con Generics**.

## 📋 Estructura

```
src/modules/shared/
├── interfaces/
│   └── base-repository.interface.ts    # Interface genérica base
├── repositories/
│   └── base.repository.ts              # Implementación base abstracta
├── services/
│   └── multi-entity.service.ts        # Servicio para múltiples entidades
├── factories/
│   └── repository.factory.ts          # Factory para crear instancias
├── controllers/
│   └── dashboard.controller.ts        # Controlador genérico de dashboard
└── examples/
    └── generic-service-usage.example.ts # Ejemplos de uso
```

## 🚀 Cómo Funciona

### 1. Interface Base Genérica

```typescript
export interface IBaseRepository<T extends BaseEntity> {
  findAll(): Promise<T[]>;
  findAllActive(): Promise<T[]>;
  findOneById(id: string): Promise<T | null>;
}
```

### 2. Clase Base Abstracta

```typescript
export abstract class BaseRepository<T extends BaseEntity, TPrisma = any> 
  implements IBaseRepository<T> {
  
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly tableName: string,
  ) {}

  // Método abstracto que debe implementar cada repositorio
  protected abstract toDomain(prismaEntity: TPrisma): T;

  // Implementaciones genéricas
  async findAll(): Promise<T[]> { /* ... */ }
  async findAllActive(): Promise<T[]> { /* ... */ }
  async findOneById(id: string): Promise<T | null> { /* ... */ }
}
```

### 3. Repositorios Específicos

Los repositorios específicos ahora heredan de `BaseRepository`:

```typescript
@Injectable()
export class PrismaAutoRepository extends BaseRepository<Auto, PrismaAuto> implements IAutoRepository {
  constructor(prisma: PrismaService) {
    super(prisma, 'auto'); // 'auto' es el nombre de la tabla en Prisma
  }

  // Implementación del método abstracto
  protected toDomain(prismaAuto: PrismaAuto): Auto {
    return AutoPrismaMapper.toDomain(prismaAuto);
  }

  // Métodos específicos del repositorio
  async save(auto: Auto): Promise<void> { /* ... */ }
  async findByMatricula(matricula: string): Promise<Auto | null> { /* ... */ }
}
```

## 💡 Formas de Uso

### Opción 1: Uso Directo en Repositorios

```typescript
@Injectable()
export class ListarAutosUseCase {
  constructor(
    @Inject('IAutoRepository') private readonly autoRepo: IAutoRepository,
  ) {}

  async obtenerTodos(): Promise<Auto[]> {
    return this.autoRepo.findAll(); // Método genérico heredado
  }

  async obtenerSoloActivos(): Promise<Auto[]> {
    return this.autoRepo.findAllActive(); // Método genérico heredado
  }

  async obtenerPorId(id: string): Promise<Auto | null> {
    return this.autoRepo.findOneById(id); // Método genérico heredado
  }
}
```

### Opción 2: Usando Factory

```typescript
@Injectable()
export class MiServicio {
  constructor(private readonly repositoryFactory: RepositoryFactory) {}

  async obtenerDatos() {
    // Para Autos
    const autoRepo = this.repositoryFactory.getRepository<Auto>('IAutoRepository');
    const autos = await autoRepo.findAllActive();

    // Para Usuarios
    const usuarioRepo = this.repositoryFactory.getRepository<Usuario>('IUsuarioRepository');
    const usuarios = await usuarioRepo.findAllActive();

    return { autos, usuarios };
  }
}
```

### Opción 3: Use-Cases Específicos (Recomendado)

```typescript
// Use-cases específicos son más claros y mantenibles
@Injectable()
export class ListarAutosUseCase {
  constructor(@Inject('IAutoRepository') private autoRepo: IAutoRepository) {}

  async obtenerTodos(): Promise<Auto[]> {
    return this.autoRepo.findAll(); // Método genérico heredado
  }

  async obtenerSoloActivos(): Promise<Auto[]> {
    return this.autoRepo.findAllActive(); // Método genérico heredado
  }

  async obtenerPorId(id: string): Promise<Auto | null> {
    return this.autoRepo.findOneById(id); // Método genérico heredado
  }
}
```

## 🔧 Configuración

### 1. En tu Repositorio Específico

```typescript
// Asegúrate de que tu interface extienda IBaseRepository
export interface IAutoRepository extends IBaseRepository<Auto> {
  // métodos específicos...
}

// Asegúrate de que tu implementación herede de BaseRepository
export class PrismaAutoRepository extends BaseRepository<Auto, PrismaAuto> implements IAutoRepository {
  constructor(prisma: PrismaService) {
    super(prisma, 'auto'); // nombre de la tabla en Prisma
  }

  protected toDomain(prismaAuto: PrismaAuto): Auto {
    return AutoPrismaMapper.toDomain(prismaAuto);
  }
}
```

### 2. En tu Módulo

```typescript
@Module({
  imports: [SharedModule],
  providers: [
    {
      provide: 'IAutoRepository',
      useClass: PrismaAutoRepository,
    },
    ListarAutosUseCase, // Use-case específico
    CrearAutoUseCase,   // Use-case específico
    // ... otros use-cases específicos
  ],
  exports: ['IAutoRepository'],
})
export class AutoModule {}
```

## ✅ Ventajas

1. **DRY (Don't Repeat Yourself)**: No duplicas código para operaciones comunes
2. **Consistencia**: Todos los repositorios tienen el mismo comportamiento para operaciones básicas
3. **Mantenibilidad**: Cambios en la lógica base se aplican a todos los repositorios
4. **Type Safety**: Mantiene la seguridad de tipos de TypeScript
5. **Flexibilidad**: Puedes usar métodos genéricos o específicos según necesites

## 🎯 Casos de Uso Ideales

- **findAll()**: Obtener todas las entidades (incluidas inactivas)
- **findAllActive()**: Obtener solo entidades activas (active: true)
- **findOneById()**: Obtener una entidad por su ID

Estos métodos son consistentes across todas las entidades que extienden `BaseEntity`.

## 🔍 Ejemplo Completo

Ver `src/modules/shared/examples/generic-service-usage.example.ts` para ejemplos detallados de uso. 