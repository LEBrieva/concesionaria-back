import { BaseEntity } from '../entities/base.entity';

export interface IBaseRepository<T extends BaseEntity> {
  findAll(): Promise<T[]>;
  findAllActive(): Promise<T[]>;
  findOneById(id: string): Promise<T | null>;
} 