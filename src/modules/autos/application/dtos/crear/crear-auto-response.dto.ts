import { Marca, Color, EstadoAuto, Transmision } from '@autos/domain/auto.enum';

export interface AutoResponseDTO {
  id: string;
  nombre: string;
  descripcion: string;
  observaciones: string;
  matricula: string;
  marca: Marca;
  modelo: string;
  version: string;
  ano: number;
  kilometraje: number;
  precio: number;
  costo: number;
  transmision: Transmision;
  estado: EstadoAuto;
  color: Color;
  imagenes: string[];
  equipamientoDestacado: string[];
  caracteristicasGenerales: string[];
  exterior: string[];
  confort: string[];
  seguridad: string[];
  interior: string[];
  entretenimiento: string[];
  esFavorito: boolean;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}
