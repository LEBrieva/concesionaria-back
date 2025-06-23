import { Injectable, Inject } from '@nestjs/common';
import { Auto } from '@autos/domain/auto.entity';
import { IAutoRepository } from '@autos/domain/auto.repository';

@Injectable()
export class AutoQueryService {
  constructor(
    @Inject('IAutoRepository') private readonly autoRepo: IAutoRepository,
  ) {}

  async findAll(): Promise<Auto[]> {
    return this.autoRepo.findAll();
  }

  async findAllActive(): Promise<Auto[]> {
    return this.autoRepo.findAllActive();
  }

  async findById(id: string): Promise<Auto | null> {
    return this.autoRepo.findOneById(id);
  }
} 