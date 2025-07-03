import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Auto } from '../../domain/auto.entity';
import { v4 as uuidv4 } from 'uuid';
import { CrearAutoDTO } from '@autos/application/dtos/crear/crear-auto.dto';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { HistorialService } from '@shared/services/historial.service';
import { TipoEntidad } from '@shared/entities/historial.entity';

@Injectable()
export class CrearAutoUseCase {
  constructor(
    @Inject('IAutoRepository') private readonly autoRepo: IAutoRepository,
    private readonly historialService: HistorialService,
  ) {}

  async execute(dto: CrearAutoDTO, userId: string): Promise<Auto> {
    const auto = new Auto({
      ...dto,
      esFavorito: false,
      id: uuidv4(),
      createdBy: userId,
      updatedBy: userId,
    });
    
    await this.autoRepo.save(auto);

    await this.historialService.registrarCreacion(
      auto.id,
      TipoEntidad.AUTO,
      userId,
      {
        nombre: auto.nombre,
        marca: auto.marca,
        modelo: auto.modelo,
        ano: auto.ano,
        precio: auto.precio,
        estado: auto.estado,
        matricula: auto.matricula,
        observaciones: `Auto creado: ${auto.nombre} - ${auto.matricula}`,
      }
    );

    return auto;
  }
}
