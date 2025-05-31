import { Auto } from '../../domain/auto.entity';
import { AutoResponseDTO } from '../dtos/autos/crear/crear-auto-response.dto';

export class AutoMapper {
  static toHttp(auto: Auto): AutoResponseDTO {
    return {
      id: auto.id,
      marca: auto.marca,
      modelo: auto.modelo,
      precio: auto.precio,
      estado: auto.estado.toLowerCase(),
    };
  }
}
