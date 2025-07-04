import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAutoRepository } from '@autos/domain/auto.repository';
import { GestionarFavoritoDto } from '@autos/application/dtos/favoritos/gestionar-favorito.dto';
import { HistorialService } from '@shared/services/historial.service';
import { TipoEntidad, TipoAccion } from '@shared/entities/historial.entity';

@Injectable()
export class GestionarFavoritoUseCase {
  private readonly MAX_FAVORITOS = 6;

  constructor(
    @Inject('IAutoRepository')
    private readonly autoRepository: IAutoRepository,
    private readonly historialService: HistorialService,
  ) {}

  async execute(autoId: string, dto: GestionarFavoritoDto, usuarioId: string): Promise<void> {
    // Verificar que el auto existe
    const auto = await this.autoRepository.findOneById(autoId);
    if (!auto) {
      throw new NotFoundException('Auto no encontrado');
    }

    // Verificar que el auto esté activo
    if (!auto.isActive()) {
      throw new BadRequestException('No se puede gestionar favoritos de un auto eliminado');
    }

    // Si se quiere marcar como favorito, verificar límite
    if (dto.esFavorito && !auto.esFavorito) {
      const cantidadFavoritos = await this.autoRepository.countFavoritos();
      if (cantidadFavoritos >= this.MAX_FAVORITOS) {
        throw new BadRequestException(`No se pueden tener más de ${this.MAX_FAVORITOS} autos favoritos`);
      }
    }

    // Si el estado ya es el mismo, no hacer nada
    if (auto.esFavorito === dto.esFavorito) {
      return;
    }

    // Actualizar el auto
    const autoActualizado = auto.actualizarCon({
      esFavorito: dto.esFavorito,
      updatedBy: usuarioId,
    });

    await this.autoRepository.update(autoId, autoActualizado);

    // Registrar en historial
    await this.historialService.registrarCambio({
      entidadId: autoId,
      tipoEntidad: TipoEntidad.AUTO,
      tipoAccion: TipoAccion.ACTUALIZAR,
      campoAfectado: 'esFavorito',
      valorAnterior: auto.esFavorito.toString(),
      valorNuevo: dto.esFavorito.toString(),
      observaciones: dto.observaciones || `Auto ${dto.esFavorito ? 'marcado como favorito' : 'removido de favoritos'}: ${auto.nombre} - ${auto.matricula}`,
      usuarioId,
      metadata: {
        autoNombre: auto.nombre,
        autoMatricula: auto.matricula,
        autoMarca: auto.marca,
        autoModelo: auto.modelo,
        autoAno: auto.ano,
        estadoAnterior: auto.esFavorito ? 'favorito' : 'no favorito',
        estadoNuevo: dto.esFavorito ? 'favorito' : 'no favorito',
        accion: dto.esFavorito ? 'MARCAR_FAVORITO' : 'DESMARCAR_FAVORITO',
      }
    });
  }
} 