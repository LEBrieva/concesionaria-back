import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { HistorialService } from '../services/historial.service';
import { TipoEntidad } from '../entities/historial.entity';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { RolUsuario } from '../../usuarios/domain/usuario.enum';

@Controller('historial')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  /**
   * Obtiene el historial completo de una entidad
   * GET /historial/AUTO/auto-123?limite=20
   */
  @Get(':tipoEntidad/:entidadId')
  async obtenerHistorialEntidad(
    @Param('tipoEntidad') tipoEntidad: TipoEntidad,
    @Param('entidadId') entidadId: string,
    @Query('limite', new ParseIntPipe({ optional: true })) limite: number = 20
  ) {
    const historial = await this.historialService.obtenerHistorialEntidad(
      entidadId,
      tipoEntidad,
      limite
    );
    
    return {
      entidadId,
      tipoEntidad,
      total: historial.length,
      limite,
      historial: historial.map(h => ({
        id: h.id,
        tipoAccion: h.tipoAccion,
        campoAfectado: h.campoAfectado,
        valorAnterior: h.valorAnterior,
        valorNuevo: h.valorNuevo,
        observaciones: h.observaciones,
        fechaCambio: h.createdAt,
        usuario: h.createdBy,
        resumen: h.obtenerResumenCambio(),
        metadata: h.metadata,
      })),
    };
  }

  /**
   * Obtiene solo los cambios de estado de una entidad
   * GET /historial/AUTO/auto-123/cambios-estado
   */
  @Get(':tipoEntidad/:entidadId/cambios-estado')
  async obtenerCambiosEstado(
    @Param('tipoEntidad') tipoEntidad: TipoEntidad,
    @Param('entidadId') entidadId: string
  ) {
    const cambios = await this.historialService.obtenerCambiosEstado(
      entidadId,
      tipoEntidad
    );
    
    return {
      entidadId,
      tipoEntidad,
      total: cambios.length,
      cambiosEstado: cambios.map(c => ({
        id: c.id,
        estadoAnterior: c.valorAnterior,
        estadoNuevo: c.valorNuevo,
        observaciones: c.observaciones,
        fechaCambio: c.createdAt,
        usuario: c.createdBy,
        metadata: c.metadata,
      })),
    };
  }

  /**
   * Obtiene estadísticas de cambios por tipo de entidad
   * GET /historial/estadisticas/AUTO
   */
  @Get('estadisticas/:tipoEntidad')
  async obtenerEstadisticas(@Param('tipoEntidad') tipoEntidad: TipoEntidad) {
    // Aquí podrías agregar lógica para estadísticas
    // Por ejemplo: cantidad de cambios por día, tipos de acción más frecuentes, etc.
    return {
      tipoEntidad,
      mensaje: 'Estadísticas de historial (por implementar)',
    };
  }

  /**
   * Obtiene el historial de múltiples entidades (para dashboard)
   * GET /historial/resumen?tipoEntidad=AUTO&limite=10
   */
  @Get('resumen')
  async obtenerResumenHistorial(
    @Query('tipoEntidad') tipoEntidad?: TipoEntidad,
    @Query('limite', new ParseIntPipe({ optional: true })) limite: number = 50
  ) {
    // Aquí podrías implementar lógica para obtener un resumen
    // de los últimos cambios en el sistema
    return {
      tipoEntidad: tipoEntidad || 'TODOS',
      limite,
      mensaje: 'Resumen de historial (por implementar)',
    };
  }
} 