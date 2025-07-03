import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { IAutoRepository } from '../../domain/auto.repository';
import { HistorialService } from '../../../shared/services/historial.service';
import { TipoEntidad } from '../../../shared/entities/historial.entity';

@Injectable()
export class EliminarAutoUseCase {
  private readonly logger = new Logger(EliminarAutoUseCase.name);

  constructor(
    @Inject('IAutoRepository')
    private readonly autoRepository: IAutoRepository,
    private readonly historialService: HistorialService,
  ) {}

  async execute(id: string, usuarioId: string, observaciones?: string): Promise<void> {
    // Verificar que el auto existe
    const auto = await this.autoRepository.findOneById(id);
    if (!auto) {
      throw new NotFoundException('Auto no encontrado');
    }

    // Verificar que el auto no esté ya eliminado
    if (auto.isDeleted()) {
      throw new BadRequestException('El auto ya está eliminado');
    }

    // Realizar eliminación lógica
    await this.autoRepository.softDelete(id);

    // Registrar en historial
    await this.historialService.registrarEliminacion(
      id,
      TipoEntidad.AUTO,
      usuarioId,
      observaciones || `Auto eliminado: ${auto.nombre} - ${auto.matricula}`,
      {
        autoNombre: auto.nombre,
        autoMatricula: auto.matricula,
        autoMarca: auto.marca,
        autoModelo: auto.modelo,
        autoAno: auto.ano,
        autoPrecio: auto.precio,
        autoEstado: auto.estado,
        motivoEliminacion: observaciones || 'Sin motivo especificado',
      }
    );
  }
} 