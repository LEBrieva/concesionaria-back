import { ActualizarAutoDTO } from '@autos/application/dtos/autos/actualizar/actualizar-auto.dto';
import { Auto } from '@autos/domain/auto.entity';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ActualizarAutoUseCase {
  constructor(
    @Inject('IAutoRepository') private readonly autoRepo: IAutoRepository,
  ) {}

  async execute(id: string, dto: ActualizarAutoDTO, userId: string): Promise<Auto> {
    const auto = await this.autoRepo.findOneById(id);
    if (!auto) throw new NotFoundException('Auto no encontrado');

    const updatedAuto = auto.actualizarCon({ ...dto, updatedBy: userId }); // si usás un método en la entidad
    await this.autoRepo.update(id, updatedAuto);

    return updatedAuto;
  }
}
