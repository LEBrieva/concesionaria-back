import { Auto } from '@autos/domain/auto.entity';
import { Auto as PrismaAuto } from '@prisma/client';
import { EstadoAuto, Transmision, Color, Marca } from '@autos/domain/auto.enum';
import { AutoProps } from '@autos/domain/auto.interfaces';

export class AutoPrismaMapper {
  static toPrisma(auto: Auto): PrismaAuto {
    return {
      id: auto.id,
      nombre: auto.nombre,
      descripcion: auto.descripcion,
      observaciones: auto.observaciones,
      matricula: auto.matricula,
      marca: auto.marca,
      modelo: auto.modelo,
      version: auto.version,
      ano: auto.ano,
      kilometraje: auto.kilometraje,
      precio: auto.precio,
      costo: auto.costo,
      transmision: auto.transmision,
      estado: auto.estado,
      color: auto.color,
      imagenes: auto.imagenes,
      equipamientoDestacado: auto.equipamientoDestacado,
      caracteristicasGenerales: auto.caracteristicasGenerales,
      exterior: auto.exterior,
      confort: auto.confort,
      seguridad: auto.seguridad,
      interior: auto.interior,
      entretenimiento: auto.entretenimiento,
      esFavorito: auto.esFavorito,
      createdAt: auto.createdAt ?? new Date(),
      updatedAt: auto.updatedAt ?? new Date(),
      createdBy: auto.createdBy ?? 'admin',
      updatedBy: auto.updatedBy ?? 'admin',
      active: auto.active,
    };
  }

  static toDomain(data: PrismaAuto): Auto {
    const props: AutoProps = {
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      observaciones: data.observaciones,
      matricula: data.matricula,
      marca: data.marca as Marca,
      modelo: data.modelo,
      version: data.version,
      ano: data.ano,
      kilometraje: data.kilometraje,
      precio: data.precio,
      costo: data.costo,
      transmision: data.transmision as Transmision,
      estado: data.estado as EstadoAuto,
      color: data.color as Color,
      imagenes: data.imagenes,
      equipamientoDestacado: data.equipamientoDestacado,
      caracteristicasGenerales: data.caracteristicasGenerales,
      exterior: data.exterior,
      confort: data.confort,
      seguridad: data.seguridad,
      interior: data.interior,
      entretenimiento: data.entretenimiento,
      esFavorito: data.esFavorito,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy,
      active: data.active,
    };

    return new Auto(props);
  }
}
