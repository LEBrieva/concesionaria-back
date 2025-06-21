import { RolUsuario } from 'src/modules/usuarios/domain/usuario.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
} 