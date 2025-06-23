# 🚀 Cómo Agregar una Nueva Entidad al Sistema Genérico

Este documento explica paso a paso cómo agregar una nueva entidad (por ejemplo, `Producto`) al sistema de repositorios genéricos.

## 📋 Pasos para Agregar `Producto`

### 1. **Crear la Entidad de Dominio**

```typescript
// src/modules/productos/domain/producto.entity.ts
import { BaseEntity } from 'src/modules/shared/entities/base.entity';
import { ProductoProps } from './producto.interfaces';

export class Producto extends BaseEntity {
  private readonly props: ProductoProps;

  public readonly nombre: string;
  public readonly descripcion: string;
  public readonly precio: number;
  public readonly categoria: string;

  constructor(props: ProductoProps) {
    super(props);
    this.props = props;
    
    this.nombre = props.nombre;
    this.descripcion = props.descripcion;
    this.precio = props.precio;
    this.categoria = props.categoria;

    this.validarDominio();
  }

  private validarDominio(): void {
    if (this.precio < 0) {
      throw new Error('El precio no puede ser negativo');
    }
  }

  actualizarCon(props: Partial<ProductoProps>): Producto {
    return new Producto({
      ...this.props,
      ...props,
      updatedAt: new Date(),
    });
  }
}
```

### 2. **Crear la Interface del Repositorio**

```typescript
// src/modules/productos/domain/producto.repository.ts
import { Producto } from './producto.entity';
import { IBaseRepository } from '../../shared/interfaces/base-repository.interface';

export interface IProductoRepository extends IBaseRepository<Producto> {
  // Métodos genéricos heredados automáticamente:
  // - findAll(): Promise<Producto[]>
  // - findAllActive(): Promise<Producto[]>
  // - findOneById(id: string): Promise<Producto | null>

  // Métodos específicos de Producto
  save(producto: Producto): Promise<void>;
  update(id: string, producto: Producto): Promise<void>;
  findByCategoria(categoria: string): Promise<Producto[]>;
}
```

### 3. **Implementar el Repositorio Prisma**

```typescript
// src/modules/productos/infrastructure/prisma/prisma-producto.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';
import { BaseRepository } from 'src/modules/shared/repositories/base.repository';
import { Producto } from '../../domain/producto.entity';
import { IProductoRepository } from '../../domain/producto.repository';
import { ProductoToPrismaMapper } from '../mappers/producto-to-prisma.mapper';
import { Producto as PrismaProducto } from '@prisma/client';

@Injectable()
export class PrismaProductoRepository extends BaseRepository<Producto, PrismaProducto> implements IProductoRepository {
  constructor(prisma: PrismaService) {
    super(prisma, 'producto'); // 🎯 Nombre de la tabla en Prisma
  }

  // ✅ Implementación del método abstracto requerido
  protected toDomain(prismaProducto: PrismaProducto): Producto {
    return ProductoToPrismaMapper.toDomain(prismaProducto);
  }

  // ✅ Los métodos genéricos (findAll, findAllActive, findOneById) 
  // ya están implementados en BaseRepository

  // 🔧 Solo implementas métodos específicos
  async save(producto: Producto): Promise<void> {
    await this.prisma.producto.create({
      data: ProductoToPrismaMapper.toPrisma(producto),
    });
  }

  async update(id: string, producto: Producto): Promise<void> {
    await this.prisma.producto.update({
      where: { id },
      data: ProductoToPrismaMapper.toPrisma(producto),
    });
  }

  async findByCategoria(categoria: string): Promise<Producto[]> {
    const data = await this.prisma.producto.findMany({
      where: { categoria, active: true },
    });
    return data.map(this.toDomain.bind(this));
  }
}
```

### 4. **Crear Use-Case de Listado**

```typescript
// src/modules/productos/application/use-cases/productos/listar-productos.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Producto } from '../../../domain/producto.entity';
import { IProductoRepository } from '../../../domain/producto.repository';

@Injectable()
export class ListarProductosUseCase {
  constructor(
    @Inject('IProductoRepository') private readonly productoRepo: IProductoRepository,
  ) {}

  // 🚀 Usando métodos genéricos heredados
  async obtenerTodos(): Promise<Producto[]> {
    return this.productoRepo.findAll();
  }

  async obtenerSoloActivos(): Promise<Producto[]> {
    return this.productoRepo.findAllActive();
  }

  async obtenerPorId(id: string): Promise<Producto | null> {
    return this.productoRepo.findOneById(id);
  }

  // 🔧 Método específico
  async obtenerPorCategoria(categoria: string): Promise<Producto[]> {
    return this.productoRepo.findByCategoria(categoria);
  }
}
```

### 5. **Configurar el Módulo**

```typescript
// src/modules/productos/productos.module.ts
import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { PrismaProductoRepository } from './infrastructure/prisma/prisma-producto.repository';
import { ListarProductosUseCase } from './application/use-cases/productos/listar-productos.use-case';
import { ProductoController } from './infrastructure/controllers/producto.controller';

@Module({
  imports: [SharedModule],
  controllers: [ProductoController],
  providers: [
    ListarProductosUseCase,
    {
      provide: 'IProductoRepository',
      useClass: PrismaProductoRepository,
    },
    // 🎯 Configuración para servicios genéricos
    {
      provide: 'REPOSITORY_TOKEN',
      useExisting: 'IProductoRepository',
    },
  ],
  exports: ['IProductoRepository'],
})
export class ProductosModule {}
```

### 6. **Crear Controlador con Endpoints Genéricos**

```typescript
// src/modules/productos/infrastructure/controllers/producto.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ListarProductosUseCase } from '../../application/use-cases/productos/listar-productos.use-case';

@Controller('productos')
export class ProductoController {
  constructor(private readonly listarProductosUseCase: ListarProductosUseCase) {}

  // 🚀 Endpoints que usan métodos genéricos
  @Get()
  async findAll() {
    return this.listarProductosUseCase.obtenerTodos();
  }

  @Get('activos')
  async findAllActive() {
    return this.listarProductosUseCase.obtenerSoloActivos();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.listarProductosUseCase.obtenerPorId(id);
  }

  // 🔧 Endpoint específico
  @Get('categoria/:categoria')
  async findByCategoria(@Param('categoria') categoria: string) {
    return this.listarProductosUseCase.obtenerPorCategoria(categoria);
  }
}
```

### 7. **Actualizar MultiEntityService (Opcional)**

```typescript
// src/modules/shared/services/multi-entity.service.ts
// Agregar soporte para la nueva entidad

async getSystemSummary(): Promise<EntitySummary[]> {
  const summaries: EntitySummary[] = [];

  // ... código existente para autos y usuarios

  // ✅ Agregar resumen de Productos
  const productoRepo = this.repositoryFactory.getRepository<Producto>('IProductoRepository');
  const todosLosProductos = await productoRepo.findAll();
  const productosActivos = await productoRepo.findAllActive();
  
  summaries.push({
    entityType: 'productos',
    total: todosLosProductos.length,
    active: productosActivos.length,
    inactive: todosLosProductos.length - productosActivos.length,
  });

  return summaries;
}
```

## ✅ **¡Listo!**

Con estos pasos, tu nueva entidad `Producto` tendrá automáticamente:

- ✅ `findAll()` - Obtener todos los productos
- ✅ `findAllActive()` - Obtener solo productos activos
- ✅ `findOneById(id)` - Obtener producto por ID
- ✅ Integración con el sistema de factory
- ✅ Compatibilidad con use-cases genéricos
- ✅ Endpoints RESTful básicos

## 🎯 **Beneficios Obtenidos**

1. **Código mínimo**: Solo implementas lo específico de tu entidad
2. **Consistencia**: Mismos métodos básicos en todas las entidades
3. **Mantenibilidad**: Cambios en BaseRepository afectan a todas las entidades
4. **Escalabilidad**: Agregar entidades es súper rápido
5. **Type Safety**: TypeScript garantiza tipos correctos

## 🔧 **Próximos Pasos**

- Agregar la entidad al esquema de Prisma
- Crear migraciones de base de datos
- Implementar DTOs y mappers específicos
- Agregar validaciones de negocio específicas
- Crear tests específicos para la nueva entidad 