import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  telefono?: string;
} 