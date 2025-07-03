import { Auto } from './auto.entity';
import { IBaseRepository } from '../../shared/interfaces';
import { BasePaginationResult } from '../../shared/dtos/pagination.dto';
import { AutoFilters } from './interfaces/auto-filters.interface';

export interface IAutoRepository extends IBaseRepository<Auto> {
  save(auto: Auto): Promise<void>;
  update(id: string, auto: Auto): Promise<void>;
  findByMatricula(matricula: string): Promise<Auto | null>;
  findFavoritos(): Promise<Auto[]>;
  countFavoritos(): Promise<number>;
  
  // Métodos específicos de autos
  findWithAdvancedFilters(
    page: number,
    limit: number,
    filters: AutoFilters,
    orderBy: string,
    orderDirection: 'asc' | 'desc'
  ): Promise<BasePaginationResult<Auto>>;
  
  getMarcasDisponibles(): Promise<string[]>;
}
