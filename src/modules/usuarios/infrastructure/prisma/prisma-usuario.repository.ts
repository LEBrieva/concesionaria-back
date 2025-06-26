import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';
import { Usuario } from '../../domain/usuario.entity';
import { IUsuarioRepository } from '../../domain/usuario.repository';
import { UsuarioFilters } from '../../domain/interfaces/usuario-filters.interface';
import { UsuarioToPrismaMapper } from '../mappers/usuario-to-prisma.mapper';
import { BaseRepository } from 'src/modules/shared/repositories/base.repository';
import { Usuario as PrismaUsuario, Prisma, RolUsuario } from '@prisma/client';
import { BasePaginationResult } from 'src/modules/shared/dtos/pagination.dto';

@Injectable()
export class PrismaUsuarioRepository extends BaseRepository<Usuario, PrismaUsuario> implements IUsuarioRepository {
  constructor(prisma: PrismaService) {
    super(prisma, 'usuario');
  }

  // Implementación del método abstracto de BaseRepository
  protected toDomain(prismaUsuario: PrismaUsuario): Usuario {
    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }

  async crear(usuario: Usuario): Promise<Usuario> {
    const prismaUsuario = await this.prisma.usuario.create({
      data: UsuarioToPrismaMapper.toPrisma(usuario),
    });

    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }

  async obtenerPorEmail(email: string): Promise<Usuario | null> {
    const prismaUsuario = await this.prisma.usuario.findUnique({
      where: { email, active: true },
    });

    if (!prismaUsuario) {
      return null;
    }

    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }

  async actualizar(id: string, usuario: Usuario): Promise<Usuario> {
    const prismaUsuario = await this.prisma.usuario.update({
      where: { id },
      data: UsuarioToPrismaMapper.toPrisma(usuario),
    });

    return UsuarioToPrismaMapper.toDomain(prismaUsuario);
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { active: false },
    });
  }

  async findWithAdvancedFilters(
    page: number,
    limit: number,
    filters: UsuarioFilters,
    orderBy: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<BasePaginationResult<Usuario>> {
    const skip = (page - 1) * limit;
    
    // Construir el where clause dinámicamente
    const where: Prisma.UsuarioWhereInput = {};

    // Filtro de eliminados (heredado de BaseFilters)
    if (!filters.incluirEliminados) {
      where.active = true;
    }

    // Filtros específicos de usuarios
    if (filters.nombre) {
      where.nombre = {
        contains: filters.nombre,
        mode: 'insensitive'
      };
    }

    if (filters.apellido) {
      where.apellido = {
        contains: filters.apellido,
        mode: 'insensitive'
      };
    }

    if (filters.email) {
      where.email = {
        contains: filters.email,
        mode: 'insensitive'
      };
    }

    if (filters.rol) {
      where.rol = filters.rol as RolUsuario;
    }

    // Configurar ordenamiento
    const orderByClause: Prisma.UsuarioOrderByWithRelationInput = {};
    orderByClause[orderBy as keyof Prisma.UsuarioOrderByWithRelationInput] = orderDirection;

    // Ejecutar consultas en paralelo
    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      data: data.map(UsuarioToPrismaMapper.toDomain),
      total,
    };
  }
} 