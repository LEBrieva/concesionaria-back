import { BaseFilters } from '../../../shared/interfaces/base-repository.interface';
import { Marca, EstadoAuto } from '@prisma/client';

export interface AutoFilters extends BaseFilters {
  nombre?: string;
  marca?: Marca;
  modelo?: string;
  anio?: number;
  estado?: EstadoAuto;
  precioMin?: number;
  precioMax?: number;
  fechaCreacionDesde?: Date;
  fechaCreacionHasta?: Date;
  soloFavoritos?: boolean;
} 