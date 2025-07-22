import { Auto } from '../../domain/auto.entity';
import { AutoResponseDTO } from '../dtos/crear/crear-auto-response.dto';

export class AutoMapper {
  static toHttp(auto: Auto): AutoResponseDTO {
    return {
      id: auto.id,
      nombre: auto.nombre,
      descripcion: auto.descripcion,
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
      observaciones: auto.observaciones,
      createdAt: auto.createdAt,
      updatedAt: auto.updatedAt,
      active: auto.active,
    };
  }
}
