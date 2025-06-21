import { applyDecorators } from '@nestjs/common';
import { IsOptional, IsNotEmpty, ValidationOptions } from 'class-validator';

/**
 * Decorador que combina @IsOptional con @IsNotEmpty
 * - El campo puede estar ausente (no se valida)
 * - Si está presente, NO puede estar vacío
 */
export function IsOptionalNotEmpty(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsOptional(),
    IsNotEmpty(validationOptions)
  );
} 