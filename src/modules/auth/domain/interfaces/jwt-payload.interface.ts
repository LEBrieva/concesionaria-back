import { RolUsuario } from 'src/modules/usuarios/domain/usuario.enum';

export interface JwtPayload {
  sub: string; // ID del usuario
  email: string;
  nombre: string;
  rol: RolUsuario;
  iat?: number; // issued at
  exp?: number; // expiration time
} 