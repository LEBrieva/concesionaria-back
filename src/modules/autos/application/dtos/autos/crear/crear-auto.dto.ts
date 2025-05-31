import { Color, EstadoAuto, Transmision } from '@autos/domain/auto.enum';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsArray,
  ArrayNotEmpty,
  IsEnum,
} from 'class-validator';

export class CrearAutoDTO {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  descripcion: string;

  @IsString()
  observaciones: string;

  @IsString()
  @IsNotEmpty()
  matricula: string;

  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsString()
  version: string;

  @IsInt()
  @Min(1900)
  ano: number;

  @IsInt()
  kilometraje: number;

  @IsInt()
  precio: number;

  @IsInt()
  costo: number;

  @IsEnum(Color)
  color: Color;

  @IsEnum(Transmision)
  transmision: Transmision;

  @IsEnum(EstadoAuto)
  estado: EstadoAuto;

  @IsArray()
  @ArrayNotEmpty()
  imagenes: string[];

  @IsArray()
  equipamientoDestacado: string[];

  @IsArray()
  caracteristicasGenerales: string[];

  @IsArray()
  exterior: string[];

  @IsArray()
  confort: string[];

  @IsArray()
  seguridad: string[];

  @IsArray()
  interior: string[];

  @IsArray()
  entretenimiento: string[];
}
