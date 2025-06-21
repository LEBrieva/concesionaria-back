import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength, IsEnum } from 'class-validator';
import { RolUsuario } from 'src/modules/usuarios/domain/usuario.enum';

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
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN, VENDEDOR o CLIENTE' })
  @IsOptional()
  rol?: RolUsuario = RolUsuario.CLIENTE;
} 