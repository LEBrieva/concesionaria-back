import { RolUsuario } from 'src/modules/usuarios/domain/usuario.enum';

export class CrearUsuarioResponseDto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: RolUsuario;
  active: boolean;
} 