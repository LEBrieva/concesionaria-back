import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { HistorialService } from '@shared/services/historial.service';
import { TipoEntidad, TipoAccion } from '@shared/entities/historial.entity';

@Injectable()
export class RestaurarAutoUseCase {
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

    // Verificar que el auto esté eliminado
    if (auto.isActive()) {
      throw new BadRequestException('El auto ya está activo');
    }

    // Restaurar el auto
    await this.autoRepository.restore(id);

    // Registrar en historial
    await this.historialService.registrarRestauracion(
      id,
      TipoEntidad.AUTO,
      usuarioId,
      observaciones || `Auto restaurado: ${auto.nombre} - ${auto.matricula}`,
      {
        autoNombre: auto.nombre,
        autoMatricula: auto.matricula,
        autoMarca: auto.marca,
        autoModelo: auto.modelo,
        autoAno: auto.ano,
        autoPrecio: auto.precio,
        autoEstado: auto.estado,
        motivoRestauracion: observaciones || 'Restauración solicitada',
        estadoAnterior: 'eliminado',
        estadoNuevo: 'activo',
      }
    );
  }
} 