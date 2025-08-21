import { IsEmail, IsString } from 'class-validator';

export class LoginClienteDto {
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @IsString()
  password: string;
}
