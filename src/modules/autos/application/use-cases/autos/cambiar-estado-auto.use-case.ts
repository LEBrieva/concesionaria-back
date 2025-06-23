import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IAutoRepository } from '../../../domain/auto.repository';
import { HistorialService } from '../../../../shared/services/historial.service';
import { TipoEntidad } from '../../../../shared/entities/historial.entity';
import { CambiarEstadoAutoDto, CambiarEstadoAutoResponseDto } from '../../dtos/autos/cambio-estado/cambiar-estado-auto.dto';
import { EstadoAuto } from '../../../domain/auto.enum';

@Injectable()
export class CambiarEstadoAutoUseCase {
  constructor(
    @Inject('IAutoRepository')
    private readonly autoRepository: IAutoRepository,
    private readonly historialService: HistorialService,
  ) {}

  async execute(
    autoId: string,
    dto: CambiarEstadoAutoDto,
    usuarioId: string
  ): Promise<CambiarEstadoAutoResponseDto> {
    // 1. Verificar que el auto existe
    const auto = await this.autoRepository.findOneById(autoId);
    if (!auto) {
      throw new NotFoundException(`Auto con ID ${autoId} no encontrado`);
    }

    // 2. Verificar que el auto esté activo
    if (!auto.isActive()) {
      throw new BadRequestException('No se puede cambiar el estado de un auto eliminado');
    }

    // 3. Verificar que el nuevo estado sea diferente al actual
    if (auto.estado === dto.nuevoEstado) {
      throw new BadRequestException(
        `El auto ya se encuentra en estado ${dto.nuevoEstado}`
      );
    }

    // 4. Validar que solo se permitan ciertos estados como destino
    const estadosPermitidos = [EstadoAuto.DISPONIBLE, EstadoAuto.RESERVADO];
    if (!estadosPermitidos.includes(dto.nuevoEstado)) {
      throw new BadRequestException(
        'Solo se permite cambiar a estados DISPONIBLE o RESERVADO'
      );
    }

    // 5. Validar transiciones de estado
    this.validarTransicionEstado(auto.estado, dto.nuevoEstado);

    const estadoAnterior = auto.estado;

    // 6. Actualizar el estado del auto
    const autoActualizado = auto.actualizarCon({
      estado: dto.nuevoEstado,
      updatedBy: usuarioId,
    });

    await this.autoRepository.update(autoId, autoActualizado);

    // 7. Registrar el cambio en el historial con enriquecimiento automático
    const historial = await this.historialService.registrarCambioEstado({
      entidadId: autoId,
      tipoEntidad: TipoEntidad.AUTO,
      campoAfectado: 'estado',
      valorAnterior: estadoAnterior,
      valorNuevo: dto.nuevoEstado,
      observaciones: dto.observaciones,
      usuarioId,
      metadata: {
        ...dto.metadata,
        autoInfo: {
          nombre: auto.nombre,
          matricula: auto.matricula,
          marca: auto.marca,
          modelo: auto.modelo,
        },
      },
    });

    // 8. Retornar respuesta
    return {
      id: autoId,
      estadoAnterior,
      estadoNuevo: dto.nuevoEstado,
      observaciones: dto.observaciones,
      fechaCambio: historial.createdAt,
      usuarioId,
      historialId: historial.id,
      mensaje: this.generarMensajeExito(estadoAnterior, dto.nuevoEstado),
    };
  }

  private validarTransicionEstado(estadoActual: EstadoAuto, nuevoEstado: EstadoAuto): void {
    // Definir transiciones válidas
    const transicionesValidas: Record<EstadoAuto, EstadoAuto[]> = {
      [EstadoAuto.POR_INGRESAR]: [EstadoAuto.DISPONIBLE, EstadoAuto.RESERVADO], // Desde POR_INGRESAR puede ir a cualquiera
      [EstadoAuto.DISPONIBLE]: [EstadoAuto.RESERVADO], // Desde DISPONIBLE solo a RESERVADO
      [EstadoAuto.RESERVADO]: [EstadoAuto.DISPONIBLE], // Desde RESERVADO solo a DISPONIBLE
      [EstadoAuto.VENDIDO]: [], // No se puede cambiar desde VENDIDO (estado final)
    };

    const estadosPermitidos = transicionesValidas[estadoActual] || [];
    
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de estado ${estadoActual} a ${nuevoEstado}. Transiciones válidas: ${estadosPermitidos.join(', ')}`
      );
    }
  }

  private generarMensajeExito(estadoAnterior: EstadoAuto, estadoNuevo: EstadoAuto): string {
    if (estadoNuevo === EstadoAuto.DISPONIBLE) {
      return 'El vehículo ha sido marcado como disponible para la venta';
    } else if (estadoNuevo === EstadoAuto.RESERVADO) {
      return 'El vehículo ha sido reservado exitosamente';
    }
    
    return `Estado cambiado de ${estadoAnterior} a ${estadoNuevo}`;
  }
} 