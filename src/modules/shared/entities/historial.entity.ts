import { BaseEntity } from './base.entity';
import { HistorialProps } from '../interfaces';

export enum TipoAccion {
  CREAR = 'CREAR',
  ACTUALIZAR = 'ACTUALIZAR',
  ELIMINAR = 'ELIMINAR',
  RESTAURAR = 'RESTAURAR',
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
}

export enum TipoEntidad {
  AUTO = 'AUTO',
  USUARIO = 'USUARIO',
  // Agregar más tipos según se necesiten
}

export class Historial extends BaseEntity {
  private readonly props: HistorialProps;

  public readonly entidadId: string;
  public readonly tipoEntidad: TipoEntidad;
  public readonly tipoAccion: TipoAccion;
  public readonly campoAfectado?: string;
  public readonly valorAnterior?: string;
  public readonly valorNuevo?: string;
  public readonly observaciones?: string;
  public readonly metadata?: Record<string, any>;

  constructor(props: HistorialProps) {
    const {
      entidadId,
      tipoEntidad,
      tipoAccion,
      campoAfectado,
      valorAnterior,
      valorNuevo,
      observaciones,
      metadata,
    } = props;

    super(props);
    this.props = props;

    this.entidadId = entidadId;
    this.tipoEntidad = tipoEntidad;
    this.tipoAccion = tipoAccion;
    this.campoAfectado = campoAfectado;
    this.valorAnterior = valorAnterior;
    this.valorNuevo = valorNuevo;
    this.observaciones = observaciones;
    this.metadata = metadata;

    this.validarDominio();
  }

  private validarDominio(): void {
    if (!this.entidadId || this.entidadId.trim().length === 0) {
      throw new Error('El ID de la entidad es requerido');
    }

    if (!Object.values(TipoEntidad).includes(this.tipoEntidad)) {
      throw new Error('El tipo de entidad debe ser válido');
    }

    if (!Object.values(TipoAccion).includes(this.tipoAccion)) {
      throw new Error('El tipo de acción debe ser válido');
    }

    // Validaciones específicas para cambio de estado
    if (this.tipoAccion === TipoAccion.CAMBIO_ESTADO) {
      if (!this.campoAfectado) {
        throw new Error('Para cambios de estado, el campo afectado es requerido');
      }
      
      if (!this.observaciones || this.observaciones.trim().length === 0) {
        throw new Error('Para cambios de estado, las observaciones son requeridas');
      }
    }
  }

  /**
   * Verifica si este historial corresponde a un cambio de estado
   */
  public esCambioEstado(): boolean {
    return this.tipoAccion === TipoAccion.CAMBIO_ESTADO;
  }

  /**
   * Obtiene información resumida del cambio
   */
  public obtenerResumenCambio(): string {
    switch (this.tipoAccion) {
      case TipoAccion.CAMBIO_ESTADO:
        return `Estado cambiado de "${this.valorAnterior}" a "${this.valorNuevo}"`;
      case TipoAccion.CREAR:
        return `${this.tipoEntidad} creado`;
      case TipoAccion.ACTUALIZAR:
        return this.campoAfectado 
          ? `Campo "${this.campoAfectado}" actualizado`
          : `${this.tipoEntidad} actualizado`;
      case TipoAccion.ELIMINAR:
        return `${this.tipoEntidad} eliminado`;
      case TipoAccion.RESTAURAR:
        return `${this.tipoEntidad} restaurado`;
      default:
        return 'Acción desconocida';
    }
  }



  /**
   * Crea un nuevo historial genérico
   */
  public static crear(props: {
    entidadId: string;
    tipoEntidad: TipoEntidad;
    tipoAccion: TipoAccion;
    campoAfectado?: string;
    valorAnterior?: string;
    valorNuevo?: string;
    observaciones?: string;
    createdBy: string;
    metadata?: Record<string, any>;
  }): Historial {
    return new Historial({
      id: crypto.randomUUID(),
      ...props,
      updatedBy: props.createdBy,
    });
  }
} 