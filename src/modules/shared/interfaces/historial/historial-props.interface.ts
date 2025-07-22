import { BaseProps } from '../base/base-props.interface';
import { TipoAccion, TipoEntidad } from '../../entities/historial.entity';

export interface HistorialProps extends BaseProps {
  entidadId: string;
  tipoEntidad: TipoEntidad;
  tipoAccion: TipoAccion;
  campoAfectado?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  observaciones?: string;
  metadata?: Record<string, any>;
} 