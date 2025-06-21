import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CrearUsuarioDto } from '../crear/crear-usuario.dto';
import { IsString, MinLength } from 'class-validator';
import { IsOptionalNotEmpty } from '../../../../../shared/decorators/optional-not-empty.decorator';

// Extender de CrearUsuarioDto pero omitiendo el email que no debe actualizarse
export class ActualizarUsuarioDto extends PartialType(
  OmitType(CrearUsuarioDto, [
    'email' // El email no debe ser actualizable
  ] as const)
) {
  // Override campos críticos que NO pueden estar vacíos si se envían
  @IsOptionalNotEmpty({ message: 'El nombre no puede estar vacío' })
  @IsString()
  nombre?: string;

  @IsOptionalNotEmpty({ message: 'El apellido no puede estar vacío' })
  @IsString()
  apellido?: string;

  @IsOptionalNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @IsString()
  telefono?: string;
} 