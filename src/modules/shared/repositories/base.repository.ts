import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BaseEntity } from '../entities/base.entity';
import { IBaseRepository, BaseFilters } from '../interfaces/base-repository.interface';
import { BasePaginationResult } from '../dtos/pagination.dto';

@Injectable()
export abstract class BaseRepository<T extends BaseEntity, TPrisma = any> 
  implements IBaseRepository<T> {
  
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly tableName: string,
  ) {}

  // Método abstracto que debe implementar cada repositorio específico
  protected abstract toDomain(prismaEntity: TPrisma): T;

  async findAll(): Promise<T[]> {
    const prismaTable = this.getPrismaTable();
    const data = await prismaTable.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item: TPrisma) => this.toDomain(item));
  }

  async findAllActive(): Promise<T[]> {
    const prismaTable = this.getPrismaTable();
    const data = await prismaTable.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item: TPrisma) => this.toDomain(item));
  }

  async findOneById(id: string): Promise<T | null> {
    const prismaTable = this.getPrismaTable();
    const data = await prismaTable.findUnique({
      where: { id },
    });
    return data ? this.toDomain(data) : null;
  }

  async softDelete(id: string): Promise<void> {
    const prismaTable = this.getPrismaTable();
    await prismaTable.update({
      where: { id },
      data: { 
        active: false,
        updatedAt: new Date()
      },
    });
  }

  async restore(id: string): Promise<void> {
    const prismaTable = this.getPrismaTable();
    await prismaTable.update({
      where: { id },
      data: { 
        active: true,
        updatedAt: new Date()
      },
    });
  }

  async findWithPagination(
    page: number,
    limit: number,
    filters: BaseFilters = {},
    orderBy: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<BasePaginationResult<T>> {
    const skip = (page - 1) * limit;
    const prismaTable = this.getPrismaTable();
    
    // Construir where clause básico
    const where: any = {};
    
    if (!filters.incluirEliminados) {
      where.active = true;
    }

    // Configurar ordenamiento
    const orderByClause: any = {};
    orderByClause[orderBy] = orderDirection;

    // Ejecutar consultas en paralelo
    const [data, total] = await Promise.all([
      prismaTable.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
      }),
      prismaTable.count({ where }),
    ]);

    return {
      data: data.map((item: any) => this.toDomain(item)),
      total,
    };
  }

  // Método helper para obtener la tabla de Prisma dinámicamente
  private getPrismaTable() {
    return (this.prisma as any)[this.tableName];
  }
} 