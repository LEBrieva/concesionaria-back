import {
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsPhoneNumber,
  IsInt,
  Min,
} from 'class-validator';
import { Marca } from '@prisma/client';
import { TipoAuto, PreferenciaContacto } from '@prisma/client';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  apellido?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('AR', {
    message: 'El número de teléfono debe ser válido para Argentina',
  })
  telefono?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  rangoPresupuestoMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rangoPresupuestoMax?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(Marca, { each: true })
  marcasInteres?: Marca[];

  @IsOptional()
  @IsArray()
  @IsEnum(TipoAuto, { each: true })
  tipoAutoInteres?: TipoAuto[];

  @IsOptional()
  @IsBoolean()
  suscritoNewsletter?: boolean;

  @IsOptional()
  @IsBoolean()
  aceptaMarketing?: boolean;

  @IsOptional()
  @IsEnum(PreferenciaContacto)
  preferenciaContacto?: PreferenciaContacto;
}
