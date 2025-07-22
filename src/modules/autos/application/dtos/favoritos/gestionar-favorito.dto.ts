import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class GestionarFavoritoDto {
  @IsBoolean()
  esFavorito: boolean;

  @IsString()
  @IsOptional()
  observaciones?: string;
} 