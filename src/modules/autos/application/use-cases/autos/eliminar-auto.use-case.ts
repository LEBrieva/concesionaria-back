import { Injectable } from '@nestjs/common';
import { IAutoRepository } from '@autos/domain/auto.repository';

@Injectable()
export class EliminarAutoUseCase {
  constructor(private readonly autoRepository: IAutoRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que el auto existe
    const auto = await this.autoRepository.findOneById(id);
    if (!auto) {
      throw new Error('Auto no encontrado');
    }

    // Verificar que el auto no esté ya eliminado
    if (auto.isDeleted()) {
      throw new Error('El auto ya está eliminado');
    }

    // Realizar eliminación lógica
    await this.autoRepository.softDelete(id);
  }
} 