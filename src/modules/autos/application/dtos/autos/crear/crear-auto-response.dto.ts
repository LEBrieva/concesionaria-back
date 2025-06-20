import { Marca } from '@autos/domain/auto.enum';

export interface AutoResponseDTO {
  id: string;
  nombre: string;
  marca: Marca;
  modelo: string;
  precio: number;
  estado: string;
}
