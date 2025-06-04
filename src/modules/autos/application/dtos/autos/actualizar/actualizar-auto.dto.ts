// src/modules/autos/application/dtos/autos/actualizar/actualizar-auto.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CrearAutoDTO } from '../crear/crear-auto.dto';

export class ActualizarAutoDTO extends PartialType(CrearAutoDTO) {}
