import { Injectable } from '@nestjs/common';
import { IAutoRepository } from '@autos/domain/auto.repository';

@Injectable()
export class RestaurarAutoUseCase {
  constructor(private readonly autoRepository: IAutoRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que el auto existe
    const auto = await this.autoRepository.findOneById(id);
    if (!auto) {
      throw new Error('Auto no encontrado');
    }

    // Verificar que el auto esté eliminado
    if (auto.isActive()) {
      throw new Error('El auto ya está activo');
    }

    // Restaurar el auto
    await this.autoRepository.restore(id);
  }
} 