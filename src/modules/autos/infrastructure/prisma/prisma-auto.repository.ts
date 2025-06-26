import { Auto } from '@autos/domain/auto.entity';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { AutoFilters } from '@autos/domain/interfaces/auto-filters.interface';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';
import { AutoPrismaMapper } from '../mappers/auto-to-prisma.mapper';
import { BaseRepository } from 'src/modules/shared/repositories/base.repository';
import { Auto as PrismaAuto, Prisma, Marca, EstadoAuto } from '@prisma/client';
import { BasePaginationResult } from 'src/modules/shared/dtos/pagination.dto';

@Injectable()
export class PrismaAutoRepository extends BaseRepository<Auto, PrismaAuto> implements IAutoRepository {
  constructor(prisma: PrismaService) {
    super(prisma, 'auto');
  }

  // Implementación del método abstracto de BaseRepository
  protected toDomain(prismaAuto: PrismaAuto): Auto {
    return AutoPrismaMapper.toDomain(prismaAuto);
  }

  async save(auto: Auto): Promise<void> {
    await this.prisma.auto.create({
      data: AutoPrismaMapper.toPrisma(auto),
    });
  }

  async update(id: string, auto: Auto): Promise<void> {
    await this.prisma.auto.update({
      where: { id },
      data: AutoPrismaMapper.toPrisma(auto),
    });
  }

  async findByMatricula(matricula: string): Promise<Auto | null> {
    const data = await this.prisma.auto.findUnique({ where: { matricula } });
    return data ? AutoPrismaMapper.toDomain(data) : null;
  }

  async findFavoritos(): Promise<Auto[]> {
    const data = await this.prisma.auto.findMany({
      where: { 
        esFavorito: true,
        active: true
      },
      orderBy: { updatedAt: 'desc' },
    });
    return data.map(AutoPrismaMapper.toDomain);
  }

  async countFavoritos(): Promise<number> {
    return await this.prisma.auto.count({
      where: { 
        esFavorito: true,
        active: true
      },
    });
  }

  async findWithAdvancedFilters(
    page: number,
    limit: number,
    filters: AutoFilters,
    orderBy: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<BasePaginationResult<Auto>> {
    const skip = (page - 1) * limit;
    
    // Construir el where clause dinámicamente
    const where: Prisma.AutoWhereInput = {};

    // Filtro de eliminados (heredado de BaseFilters)
    if (!filters.incluirEliminados) {
      where.active = true;
    }

    // Filtros específicos de autos
    if (filters.nombre) {
      where.nombre = {
        contains: filters.nombre,
        mode: 'insensitive'
      };
    }

    if (filters.marca) {
      where.marca = filters.marca as Marca;
    }

    if (filters.modelo) {
      where.modelo = {
        contains: filters.modelo,
        mode: 'insensitive'
      };
    }

    if (filters.anio) {
      where.ano = filters.anio;
    }

    if (filters.estado) {
      where.estado = filters.estado as EstadoAuto;
    }

    // Filtros de precio
    if (filters.precioMin !== undefined || filters.precioMax !== undefined) {
      where.precio = {};
      if (filters.precioMin !== undefined) {
        where.precio.gte = filters.precioMin;
      }
      if (filters.precioMax !== undefined) {
        where.precio.lte = filters.precioMax;
      }
    }

    // Filtros de fecha
    if (filters.fechaCreacionDesde || filters.fechaCreacionHasta) {
      where.createdAt = {};
      if (filters.fechaCreacionDesde) {
        where.createdAt.gte = filters.fechaCreacionDesde;
      }
      if (filters.fechaCreacionHasta) {
        where.createdAt.lte = filters.fechaCreacionHasta;
      }
    }

    // Filtro de favoritos
    if (filters.soloFavoritos) {
      where.esFavorito = true;
    }

    // Configurar ordenamiento
    const orderByClause: Prisma.AutoOrderByWithRelationInput = {};
    orderByClause[orderBy as keyof Prisma.AutoOrderByWithRelationInput] = orderDirection;

    // Ejecutar consultas en paralelo
    const [data, total] = await Promise.all([
      this.prisma.auto.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
      }),
      this.prisma.auto.count({ where }),
    ]);

    return {
      data: data.map(AutoPrismaMapper.toDomain),
      total,
    };
  }

  async getMarcasDisponibles(): Promise<string[]> {
    const result = await this.prisma.auto.findMany({
      where: { active: true },
      select: { marca: true },
      distinct: ['marca'],
      orderBy: { marca: 'asc' },
    });

    return result
      .map(auto => auto.marca)
      .filter(marca => marca && marca.trim() !== '')
      .sort();
  }
}
