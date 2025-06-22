import { Auto } from '../../domain/auto.entity';
import { AutoResponseDTO } from '../dtos/autos/crear/crear-auto-response.dto';

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
    };
  }
}
