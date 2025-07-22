import { Usuario } from './usuario.entity';
import { IBaseRepository } from '../../shared/interfaces';
import { BasePaginationResult } from '../../shared/dtos/pagination.dto';
import { UsuarioFilters } from './interfaces/usuario-filters.interface';

export interface IUsuarioRepository extends IBaseRepository<Usuario> {
  crear(usuario: Usuario): Promise<Usuario>;
  obtenerPorEmail(email: string): Promise<Usuario | null>;
  actualizar(id: string, usuario: Usuario): Promise<Usuario>;
  eliminar(id: string): Promise<void>;
  
  // Métodos específicos de usuarios para paginación y filtros
  findWithAdvancedFilters(
    page: number,
    limit: number,
    filters: UsuarioFilters,
    orderBy: string,
    orderDirection: 'asc' | 'desc'
  ): Promise<BasePaginationResult<Usuario>>;
} 