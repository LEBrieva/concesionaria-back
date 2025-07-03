import { BaseEntity } from '../../entities/base.entity';
import { BasePaginationResult } from '../../dtos/pagination.dto';

export interface BaseFilters {
  incluirEliminados?: boolean;
}

export interface IBaseRepository<T extends BaseEntity> {
  findAll(): Promise<T[]>;
  findAllActive(): Promise<T[]>;
  findOneById(id: string): Promise<T | null>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  
  // Métodos genéricos de paginación
  findWithPagination(
    page: number,
    limit: number,
    filters?: BaseFilters,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc'
  ): Promise<BasePaginationResult<T>>;
} 