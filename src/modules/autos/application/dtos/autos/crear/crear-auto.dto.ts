import { Color, EstadoAuto, Transmision, Marca } from '@autos/domain/auto.enum';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsArray,
  IsEnum,
  Max,
  Length,
  IsIn,
} from 'class-validator';

export class CrearAutoDTO {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nombre: string;

  @IsString()
  descripcion: string;

  @IsString()
  observaciones: string;

  @IsString()
  @IsNotEmpty()
  matricula: string;

  @IsEnum(Marca)
  marca: Marca;

  @IsString()
  modelo: string;

  @IsString()
  version: string;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  ano: number;

  @IsInt()
  @Min(0)
  kilometraje: number;

  @IsInt()
  @Min(0)
  precio: number;

  @IsInt()
  @Min(0)
  costo: number;

  @IsEnum(Color)
  color: Color;

  @IsEnum(Transmision)
  transmision: Transmision;

  @IsIn([EstadoAuto.POR_INGRESAR, EstadoAuto.DISPONIBLE], {
    message: 'El estado inicial debe ser POR_INGRESAR o DISPONIBLE',
  })
  estado: EstadoAuto.POR_INGRESAR | EstadoAuto.DISPONIBLE;

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
