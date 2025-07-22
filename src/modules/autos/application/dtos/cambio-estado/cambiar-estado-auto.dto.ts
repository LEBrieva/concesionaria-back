import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EstadoAuto } from '@autos/domain/auto.enum';

export class CambiarEstadoAutoDto {
  @IsEnum(EstadoAuto, {
    message: 'El estado debe ser DISPONIBLE, RESERVADO o VENDIDO',
  })
  @IsNotEmpty({ message: 'El nuevo estado es requerido' })
  nuevoEstado: EstadoAuto.DISPONIBLE | EstadoAuto.RESERVADO | EstadoAuto.VENDIDO;

  @IsString({ message: 'Las observaciones deben ser un texto' })
  @IsNotEmpty({ message: 'Las observaciones son requeridas' })
  observaciones: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CambiarEstadoAutoResponseDto {
  id: string;
  estadoAnterior: EstadoAuto;
  estadoNuevo: EstadoAuto;
  observaciones: string;
  fechaCambio: Date;
  usuarioId: string;
  historialId: string;
  mensaje: string;
  favoritoDesactivado?: boolean;
  mensajeFavorito?: string;
} 