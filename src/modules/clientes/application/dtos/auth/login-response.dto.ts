export class LoginResponseDto {
  access_token: string;
  cliente: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    emailVerificado: boolean;
  };
}
