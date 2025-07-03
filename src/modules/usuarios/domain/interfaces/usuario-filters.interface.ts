import { BaseFilters } from '../../../shared/interfaces';
import { RolUsuario } from '@prisma/client';

export interface UsuarioFilters extends BaseFilters {
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: RolUsuario;
} 