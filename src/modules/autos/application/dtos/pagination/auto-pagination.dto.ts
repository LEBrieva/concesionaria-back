import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min, Max, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BasePaginationDto } from '@shared/dtos/pagination.dto';
import { EstadoAuto, Marca } from '@prisma/client';

export class AutoPaginationDto extends BasePaginationDto {
  // Filtros específicos de autos
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(Marca)
  marca?: Marca;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  anio?: number;

  @IsOptional()
  @IsEnum(EstadoAuto)
  estado?: EstadoAuto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMax?: number;

  @IsOptional()
  @IsDateString()
  fechaCreacionDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaCreacionHasta?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  soloFavoritos?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  incluirEliminados?: boolean = false;
}

 