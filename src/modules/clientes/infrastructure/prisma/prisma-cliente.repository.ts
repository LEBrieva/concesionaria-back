import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service';

import { Cliente } from '../../domain/cliente.entity';
import { ClienteRepository } from '../../domain/cliente.repository';
import { ClienteFilters } from '../../domain/interfaces/cliente.interface';
import { ClienteToPrismaMapper } from '../mappers/cliente-to-prisma.mapper';
import { Prisma } from '@prisma/client';
import { BaseFilters } from '../../../shared/interfaces';
import { BasePaginationResult } from '../../../shared/dtos/pagination.dto';

@Injectable()
export class PrismaClienteRepository implements ClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(cliente: Cliente): Promise<Cliente> {
    const data = ClienteToPrismaMapper.toPrisma(cliente);
    const createdCliente = await this.prisma.cliente.create({
      data: {
        ...data,
        id: cliente.id,
      },
    });
    return ClienteToPrismaMapper.toDomain(createdCliente);
  }

  async update(id: string, cliente: Cliente): Promise<Cliente> {
    const data = ClienteToPrismaMapper.toPrisma(cliente);
    const updatedCliente = await this.prisma.cliente.update({
      where: { id },
      data,
    });
    return ClienteToPrismaMapper.toDomain(updatedCliente);
  }

  async findById(id: string): Promise<Cliente | null> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
    });
    return cliente ? ClienteToPrismaMapper.toDomain(cliente) : null;
  }

  async findAll(): Promise<Cliente[]> {
    const clientes = await this.prisma.cliente.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return clientes.map(ClienteToPrismaMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.cliente.update({
      where: { id },
      data: { active: false },
    });
  }

  async restore(id: string): Promise<void> {
    await this.prisma.cliente.update({
      where: { id },
      data: { active: true },
    });
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { email: email.toLowerCase() },
    });
    return cliente ? ClienteToPrismaMapper.toDomain(cliente) : null;
  }

  async findByFilters(filters: ClienteFilters): Promise<Cliente[]> {
    const whereClause: Prisma.ClienteWhereInput = {};

    if (filters.nombre) {
      whereClause.nombre = {
        contains: filters.nombre,
        mode: 'insensitive',
      };
    }

    if (filters.apellido) {
      whereClause.apellido = {
        contains: filters.apellido,
        mode: 'insensitive',
      };
    }

    if (filters.email) {
      whereClause.email = {
        contains: filters.email.toLowerCase(),
        mode: 'insensitive',
      };
    }

    if (filters.emailVerificado !== undefined) {
      whereClause.emailVerificado = filters.emailVerificado;
    }

    if (filters.suscritoNewsletter !== undefined) {
      whereClause.suscritoNewsletter = filters.suscritoNewsletter;
    }

    if (filters.aceptaMarketing !== undefined) {
      whereClause.aceptaMarketing = filters.aceptaMarketing;
    }

    if (filters.marcasInteres && filters.marcasInteres.length > 0) {
      whereClause.marcasInteres = {
        hasSome: filters.marcasInteres,
      };
    }

    if (filters.tipoAutoInteres && filters.tipoAutoInteres.length > 0) {
      whereClause.tipoAutoInteres = {
        hasSome: filters.tipoAutoInteres as any[],
      };
    }

    if (filters.rangoPresupuestoMin !== undefined) {
      whereClause.rangoPresupuestoMin = {
        gte: filters.rangoPresupuestoMin,
      };
    }

    if (filters.rangoPresupuestoMax !== undefined) {
      whereClause.rangoPresupuestoMax = {
        lte: filters.rangoPresupuestoMax,
      };
    }

    if (filters.tokenVerificacion) {
      whereClause.tokenVerificacion = filters.tokenVerificacion;
    }

    if (filters.active !== undefined) {
      whereClause.active = filters.active;
    } else {
      whereClause.active = true;
    }

    const clientes = await this.prisma.cliente.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return clientes.map(ClienteToPrismaMapper.toDomain);
  }

  async verificarEmail(clienteId: string, token: string): Promise<boolean> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente || cliente.tokenVerificacion !== token) {
      return false;
    }

    await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        emailVerificado: true,
        tokenVerificacion: null,
      },
    });

    return true;
  }

  async actualizarUltimaActividad(clienteId: string): Promise<Cliente> {
    const updatedCliente = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        ultimaActividad: new Date(),
      },
    });
    return ClienteToPrismaMapper.toDomain(updatedCliente);
  }

  async incrementarVistas(clienteId: string): Promise<Cliente> {
    const updatedCliente = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        totalVistasAutos: { increment: 1 },
        ultimaActividad: new Date(),
      },
    });
    return ClienteToPrismaMapper.toDomain(updatedCliente);
  }

  async incrementarClicks(clienteId: string): Promise<Cliente> {
    const updatedCliente = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        totalClicksAutos: { increment: 1 },
        ultimaActividad: new Date(),
      },
    });
    return ClienteToPrismaMapper.toDomain(updatedCliente);
  }

  async incrementarConsultas(clienteId: string): Promise<Cliente> {
    const updatedCliente = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        totalConsultas: { increment: 1 },
        ultimaActividad: new Date(),
      },
    });
    return ClienteToPrismaMapper.toDomain(updatedCliente);
  }

  // Métodos de IBaseRepository
  async findAllActive(): Promise<Cliente[]> {
    const clientes = await this.prisma.cliente.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return clientes.map(ClienteToPrismaMapper.toDomain);
  }

  async findOneById(id: string): Promise<Cliente | null> {
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.delete(id);
  }

  async findWithPagination(
    page: number,
    limit: number,
    filters?: BaseFilters,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc',
  ): Promise<BasePaginationResult<Cliente>> {
    const skip = (page - 1) * limit;
    const whereClause: Prisma.ClienteWhereInput = {
      active: filters?.incluirEliminados ? undefined : true,
    };

    const [data, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: orderBy
          ? { [orderBy]: orderDirection || 'desc' }
          : { createdAt: 'desc' },
      }),
      this.prisma.cliente.count({ where: whereClause }),
    ]);

    return {
      data: data.map(ClienteToPrismaMapper.toDomain),
      total,
    };
  }
}
