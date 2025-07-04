import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { BasePaginationDto } from '@shared/dtos/pagination.dto';
import { RolUsuario } from '@prisma/client';

export class UsuarioPaginationDto extends BasePaginationDto {
  // Filtros específicos de usuarios
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEnum(RolUsuario)
  @Transform(({ value }) => (value ? value.toUpperCase() : undefined))
  rol?: RolUsuario;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  incluirEliminados?: boolean = false;
} 