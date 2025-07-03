import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BaseEntity } from '../entities/base.entity';
import { IBaseRepository } from '../interfaces';

export interface RepositoryConfig<T extends BaseEntity> {
  entityName: string;
  repositoryToken: string;
}

@Injectable()
export class RepositoryFactory {
  constructor(private readonly moduleRef: ModuleRef) {}

  getRepository<T extends BaseEntity>(
    repositoryToken: string
  ): IBaseRepository<T> {
    return this.moduleRef.get<IBaseRepository<T>>(repositoryToken);
  }

  async createGenericService<T extends BaseEntity>(
    repositoryToken: string,
    ServiceClass: Type<any>
  ) {
    const repository = this.getRepository<T>(repositoryToken);
    return new ServiceClass(repository);
  }
} 