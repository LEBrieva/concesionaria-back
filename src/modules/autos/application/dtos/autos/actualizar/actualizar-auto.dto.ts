import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CrearAutoDTO } from '../crear/crear-auto.dto';
import { IsString, Length } from 'class-validator';
import { IsOptionalNotEmpty } from '../../../../../shared/decorators/optional-not-empty.decorator';

// Extender de CrearAutoDTO pero omitiendo campos que no deben actualizarse
export class ActualizarAutoDTO extends PartialType(
  OmitType(CrearAutoDTO, [
    // Omitir campos que no deben actualizarse después de la creación
    // Por ejemplo, si no quieres que se actualice la matrícula:
    // 'matricula'
  ] as const)
) {
  // Override campos críticos que NO pueden estar vacíos si se envían
  @IsOptionalNotEmpty({ message: 'El nombre no puede estar vacío' })
  @IsString()
  @Length(1, 100)
  nombre?: string;

  @IsOptionalNotEmpty({ message: 'La matrícula no puede estar vacía' })
  @IsString()
  matricula?: string;

  @IsOptionalNotEmpty({ message: 'El modelo no puede estar vacío' })
  @IsString()
  modelo?: string;

  @IsOptionalNotEmpty({ message: 'La versión no puede estar vacía' })
  @IsString()
  version?: string;
}
