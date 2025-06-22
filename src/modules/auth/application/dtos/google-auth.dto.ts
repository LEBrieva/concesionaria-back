import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
  @IsString({ message: 'El token de Firebase debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token de Firebase es requerido' })
  firebaseToken: string;
} 