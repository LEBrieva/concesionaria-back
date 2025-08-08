import {
  IsEmail,
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

export class RegistrarClienteDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre: string;

  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  apellido: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

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
