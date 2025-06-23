import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Historial, TipoEntidad, TipoAccion } from '../../entities/historial.entity';
import { IHistorialRepository } from '../../interfaces/historial-repository.interface';
import { BaseRepository } from '../../repositories/base.repository';
import { Historial as PrismaHistorial } from '@prisma/client';


@Injectable()
export class PrismaHistorialRepository extends BaseRepository<Historial, PrismaHistorial> implements IHistorialRepository {
  constructor(prisma: PrismaService) {
    super(prisma, 'historial');
  }

  // Implementación del método abstracto de BaseRepository
  protected toDomain(prismaHistorial: PrismaHistorial): Historial {
    return new Historial({
      id: prismaHistorial.id,
      entidadId: prismaHistorial.entidadId,
      tipoEntidad: prismaHistorial.tipoEntidad as TipoEntidad,
      tipoAccion: prismaHistorial.tipoAccion as TipoAccion,
      campoAfectado: prismaHistorial.campoAfectado || undefined,
      valorAnterior: prismaHistorial.valorAnterior || undefined,
      valorNuevo: prismaHistorial.valorNuevo || undefined,
      observaciones: prismaHistorial.observaciones || undefined,
      metadata: prismaHistorial.metadata as Record<string, any> || undefined,
      createdAt: prismaHistorial.createdAt,
      updatedAt: prismaHistorial.updatedAt,
      createdBy: prismaHistorial.createdBy,
      updatedBy: prismaHistorial.updatedBy,
      active: prismaHistorial.active,
    });
  }

  private toPrisma(historial: Historial): any {
    return {
      id: historial.id,
      entidadId: historial.entidadId,
      tipoEntidad: historial.tipoEntidad,
      tipoAccion: historial.tipoAccion,
      campoAfectado: historial.campoAfectado,
      valorAnterior: historial.valorAnterior,
      valorNuevo: historial.valorNuevo,
      observaciones: historial.observaciones,
      metadata: historial.metadata,
      createdAt: historial.createdAt,
      updatedAt: historial.updatedAt,
      createdBy: historial.createdBy,
      updatedBy: historial.updatedBy,
      active: historial.active,
    };
  }

  async crear(historial: Historial): Promise<Historial> {
    const prismaHistorial = await this.prisma.historial.create({
      data: this.toPrisma(historial),
    });

    console.log(`📝 Historial registrado en BD: ${historial.obtenerResumenCambio()}`);
    return this.toDomain(prismaHistorial);
  }

  async obtenerPorEntidad(entidadId: string, tipoEntidad: TipoEntidad): Promise<Historial[]> {
    const prismaHistoriales = await this.prisma.historial.findMany({
      where: { 
        entidadId, 
        tipoEntidad,
        active: true 
      },
      orderBy: { createdAt: 'desc' },
    });

    return prismaHistoriales.map(h => this.toDomain(h));
  }

  async obtenerPorEntidadYTipoAccion(
    entidadId: string, 
    tipoEntidad: TipoEntidad, 
    tipoAccion: TipoAccion
  ): Promise<Historial[]> {
    const prismaHistoriales = await this.prisma.historial.findMany({
      where: { 
        entidadId, 
        tipoEntidad, 
        tipoAccion,
        active: true 
      },
      orderBy: { createdAt: 'desc' },
    });

    return prismaHistoriales.map(h => this.toDomain(h));
  }

  async obtenerHistorialCompleto(
    entidadId: string, 
    tipoEntidad: TipoEntidad,
    limite?: number
  ): Promise<Historial[]> {
    const prismaHistoriales = await this.prisma.historial.findMany({
      where: { 
        entidadId, 
        tipoEntidad,
        active: true 
      },
      orderBy: { createdAt: 'desc' },
      take: limite,
    });

    return prismaHistoriales.map(h => this.toDomain(h));
  }
} 