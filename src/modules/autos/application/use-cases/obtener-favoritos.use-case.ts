import { Injectable, Inject } from '@nestjs/common';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { Auto } from '@autos/domain/auto.entity';

@Injectable()
export class ObtenerFavoritosUseCase {
  constructor(
    @Inject('IAutoRepository')
    private readonly autoRepository: IAutoRepository,
  ) {}

  async execute(): Promise<Auto[]> {
    return await this.autoRepository.findFavoritos();
  }
} 