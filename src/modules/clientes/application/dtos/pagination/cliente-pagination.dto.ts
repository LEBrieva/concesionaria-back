import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { BasePaginationDto } from '../../../../shared/dtos/pagination.dto';
import { Marca } from '@prisma/client';
import { TipoAuto } from '@prisma/client';

export class ClientePaginationDto extends BasePaginationDto {
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
  @IsBoolean()
  emailVerificado?: boolean;

  @IsOptional()
  @IsBoolean()
  suscritoNewsletter?: boolean;

  @IsOptional()
  @IsBoolean()
  aceptaMarketing?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(Marca, { each: true })
  marcasInteres?: Marca[];

  @IsOptional()
  @IsArray()
  @IsEnum(TipoAuto, { each: true })
  tipoAutoInteres?: TipoAuto[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
