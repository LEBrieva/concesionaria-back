import { BaseProps } from 'src/modules/shared/interfaces';
import { RolUsuario } from './usuario.enum';

export interface UsuarioProps extends BaseProps {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  rol: RolUsuario;
} 