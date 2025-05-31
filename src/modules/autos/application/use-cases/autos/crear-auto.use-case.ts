import { Inject, Injectable } from '@nestjs/common';
import { Auto } from '../../../domain/auto.entity';
import { v4 as uuidv4 } from 'uuid';
import { CrearAutoDTO } from '@autos/application/dtos/autos/crear/crear-auto.dto';
import { IAutoRepository } from '@autos/domain/auto.repository';

@Injectable()
export class CrearAutoUseCase {
  constructor(
    @Inject('IAutoRepository') private readonly autoRepo: IAutoRepository,
  ) {}

  async execute(dto: CrearAutoDTO): Promise<Auto> {
    //TODO: Cambiar por id de usuario autenticado
    const auto = new Auto({
      ...dto,
      id: uuidv4(),
      createdBy: 'admin',
      updatedBy: 'admin',
    });

    await this.autoRepo.save(auto);

    return auto;
  }
}
