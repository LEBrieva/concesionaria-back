import { Injectable, Inject } from '@nestjs/common';
import { Historial, TipoAccion, TipoEntidad } from '../entities/historial.entity';
import { IHistorialRepository } from '../interfaces/historial-repository.interface';

export interface CambioEstadoData {
  entidadId: string;
  tipoEntidad: TipoEntidad;
  campoAfectado: string;
  valorAnterior: string;
  valorNuevo: string;
  observaciones: string;
  usuarioId: string;
  metadata?: Record<string, any>;
}

export interface HistorialGenericoData {
  entidadId: string;
  tipoEntidad: TipoEntidad;
  tipoAccion: TipoAccion;
  campoAfectado?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  observaciones?: string;
  usuarioId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class HistorialService {
  constructor(
    @Inject('IHistorialRepository')
    private readonly historialRepository: IHistorialRepository,
  ) {}

  /**
   * Registra un cambio de estado con enriquecimiento automático
   */
  async registrarCambioEstado(data: CambioEstadoData): Promise<Historial> {
    // Enriquecimiento automático para cambios de estado
    const metadataEnriquecida = this.enriquecerMetadataCambioEstado(data);
    
    const historial = Historial.crear({
      entidadId: data.entidadId,
      tipoEntidad: data.tipoEntidad,
      tipoAccion: TipoAccion.CAMBIO_ESTADO,
      campoAfectado: data.campoAfectado,
      valorAnterior: data.valorAnterior,
      valorNuevo: data.valorNuevo,
      observaciones: data.observaciones,
      createdBy: data.usuarioId,
      metadata: metadataEnriquecida,
    });

    return await this.historialRepository.crear(historial);
  }

  /**
   * Registra cualquier tipo de cambio con enriquecimiento automático
   */
  async registrarCambio(data: HistorialGenericoData): Promise<Historial> {
    // Enriquecimiento automático basado en el tipo de acción
    const metadataEnriquecida = this.enriquecerMetadataGenerico(data);
    
    const historial = Historial.crear({
      entidadId: data.entidadId,
      tipoEntidad: data.tipoEntidad,
      tipoAccion: data.tipoAccion,
      campoAfectado: data.campoAfectado,
      valorAnterior: data.valorAnterior,
      valorNuevo: data.valorNuevo,
      observaciones: data.observaciones,
      createdBy: data.usuarioId,
      metadata: metadataEnriquecida,
    });

    return await this.historialRepository.crear(historial);
  }

  /**
   * Obtiene el historial completo de una entidad
   */
  async obtenerHistorialEntidad(
    entidadId: string,
    tipoEntidad: TipoEntidad,
    limite?: number
  ): Promise<Historial[]> {
    return await this.historialRepository.obtenerHistorialCompleto(
      entidadId,
      tipoEntidad,
      limite
    );
  }

  /**
   * Obtiene solo los cambios de estado de una entidad
   */
  async obtenerCambiosEstado(
    entidadId: string,
    tipoEntidad: TipoEntidad
  ): Promise<Historial[]> {
    return await this.historialRepository.obtenerPorEntidadYTipoAccion(
      entidadId,
      tipoEntidad,
      TipoAccion.CAMBIO_ESTADO
    );
  }

  /**
   * Obtiene el último cambio de estado de una entidad
   */
  async obtenerUltimoCambioEstado(
    entidadId: string,
    tipoEntidad: TipoEntidad
  ): Promise<Historial | null> {
    const cambios = await this.obtenerCambiosEstado(entidadId, tipoEntidad);
    return cambios.length > 0 ? cambios[0] : null;
  }

  /**
   * Registra la creación de una entidad
   */
  async registrarCreacion(
    entidadId: string,
    tipoEntidad: TipoEntidad,
    usuarioId: string,
    metadata?: Record<string, any>
  ): Promise<Historial> {
    return await this.registrarCambio({
      entidadId,
      tipoEntidad,
      tipoAccion: TipoAccion.CREAR,
      usuarioId,
      metadata,
    });
  }

  /**
   * Registra la eliminación de una entidad
   */
  async registrarEliminacion(
    entidadId: string,
    tipoEntidad: TipoEntidad,
    usuarioId: string,
    observaciones?: string,
    metadata?: Record<string, any>
  ): Promise<Historial> {
    return await this.registrarCambio({
      entidadId,
      tipoEntidad,
      tipoAccion: TipoAccion.ELIMINAR,
      observaciones,
      usuarioId,
      metadata,
    });
  }

  /**
   * Registra la restauración de una entidad
   */
  async registrarRestauracion(
    entidadId: string,
    tipoEntidad: TipoEntidad,
    usuarioId: string,
    observaciones?: string,
    metadata?: Record<string, any>
  ): Promise<Historial> {
    return await this.registrarCambio({
      entidadId,
      tipoEntidad,
      tipoAccion: TipoAccion.RESTAURAR,
      observaciones,
      usuarioId,
      metadata,
    });
  }



  // Métodos privados para enriquecimiento
  private enriquecerMetadataCambioEstado(data: CambioEstadoData): Record<string, any> {
    return {
      ...data.metadata,
      tipoOperacion: 'cambio_estado',
      timestamp: new Date().toISOString(),
      transicion: `${data.valorAnterior} -> ${data.valorNuevo}`,
      campo: data.campoAfectado,
    };
  }

  private enriquecerMetadataGenerico(data: HistorialGenericoData): Record<string, any> {
    return {
      ...data.metadata,
      tipoOperacion: 'crud',
      timestamp: new Date().toISOString(),
      accion: data.tipoAccion,
      ...(data.campoAfectado && { campo: data.campoAfectado }),
      ...(data.valorAnterior && data.valorNuevo && { 
        cambio: `${data.valorAnterior} -> ${data.valorNuevo}` 
      }),
    };
  }
} 